#!/usr/bin/env node
/**
 * seed-hotels.mjs
 *
 * 楽天 GetAreaClass → SimpleHotelSearch で全国ホテルを取得し、
 * CSVのホテル名とマッチングして rakuten_hotel_id を特定。
 *
 * Pass 1: 正規化完全一致 + 包含マッチ（スキャン中にリアルタイム）
 * Pass 2: ファジーマッチ（全APIホテルキャッシュ vs 未マッチCSV）
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const content = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim(),
        v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {}
}
loadEnv();

const APP_ID = process.env.RAKUTEN_APP_ID;
const ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;
if (!APP_ID || !ACCESS_KEY) {
  console.error('API keys missing');
  process.exit(1);
}

const CSV_PATH =
  process.argv[2] ||
  resolve(__dirname, '../../furo_tabi/hotel_rakuten_tags.csv');
const SQL_PATH = resolve(__dirname, '../supabase/seed-hotels.sql');
const CACHE_PATH = resolve(__dirname, '../.rakuten-hotel-cache.json');
const API_BASE = 'https://openapi.rakuten.co.jp/engine/api/Travel';
const ORIGIN = 'https://furo-tabi.mui-co.workers.dev';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── CSV ────────────────────────────────────────────────────────
function parseCSV(content) {
  const lines = content.split('\n').filter((l) => l.trim());
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = [];
    let cur = '';
    let inQ = false;
    for (const c of line) {
      if (c === '"') inQ = !inQ;
      else if (c === ',' && !inQ) {
        values.push(cur.trim());
        cur = '';
      } else cur += c;
    }
    values.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

function toCSV(rows, headers) {
  return (
    `${[
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const v = r[h] || '';
            return v.includes(',') ? `"${v}"` : v;
          })
          .join(','),
      ),
    ].join('\n')}\n`
  );
}

// ─── Normalize ──────────────────────────────────────────────────
function normalize(str) {
  return str
    .toLowerCase()
    .replace(
      /[\s\u3000\-\u30FC_（）()【】「」『』〈〉・＆&／/．.,:：;@＠〜~]+/g,
      '',
    )
    .replace(/[Ａ-Ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[ａ-ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

// Extract significant tokens (3+ chars) from a string
function tokenize(str) {
  const norm = normalize(str);
  // Split on transitions between scripts (Latin/Katakana/Kanji/etc)
  const tokens =
    norm.match(
      /[a-z0-9]{2,}|[\u3040-\u309f]{2,}|[\u30a0-\u30ff]{2,}|[\u4e00-\u9fff]{2,}/g,
    ) || [];
  return tokens;
}

// Compute similarity between two hotel names (0-1)
function similarity(csvName, apiName) {
  const csvNorm = normalize(csvName);
  const apiNorm = normalize(apiName);

  // Exact
  if (csvNorm === apiNorm) return 1.0;

  // Full containment
  if (apiNorm.includes(csvNorm)) return 0.95;
  if (csvNorm.includes(apiNorm)) return 0.9;

  // Substring match: check if a long substring (8+ chars) of CSV exists in API
  for (let len = Math.min(csvNorm.length, 12); len >= 6; len--) {
    for (let start = 0; start <= csvNorm.length - len; start++) {
      const sub = csvNorm.slice(start, start + len);
      if (apiNorm.includes(sub)) {
        return 0.7 + (len / csvNorm.length) * 0.2;
      }
    }
  }

  // Token-based Jaccard
  const csvTokens = tokenize(csvName);
  const apiTokens = tokenize(apiName);
  if (csvTokens.length === 0 || apiTokens.length === 0) return 0;

  let matchedTokens = 0;
  for (const ct of csvTokens) {
    if (apiTokens.some((at) => at.includes(ct) || ct.includes(at))) {
      matchedTokens++;
    }
  }
  return (matchedTokens / Math.max(csvTokens.length, apiTokens.length)) * 0.7;
}

// ─── Rakuten API ────────────────────────────────────────────────
async function rakutenFetch(endpoint, params) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  url.searchParams.set('applicationId', APP_ID);
  url.searchParams.set('accessKey', ACCESS_KEY);
  url.searchParams.set('format', 'json');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: { Origin: ORIGIN } });
  if (!res.ok) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function getAreaHierarchy() {
  const data = await rakutenFetch('GetAreaClass/20131024', {});
  if (!data?.areaClasses) return [];
  const areas = [];
  const middles = data.areaClasses.largeClasses[0].largeClass[1].middleClasses;
  for (const m of middles) {
    const mc = m.middleClass;
    const mcode = mc[0].middleClassCode;
    const smalls = mc[1].smallClasses;
    for (const s of smalls) {
      const sc = s.smallClass;
      const scode = sc[0].smallClassCode;
      if (sc.length > 1 && sc[1].detailClasses) {
        for (const d of sc[1].detailClasses) {
          areas.push({
            middle: mcode,
            small: scode,
            detail: d.detailClass.detailClassCode,
          });
        }
      } else {
        areas.push({ middle: mcode, small: scode, detail: null });
      }
    }
  }
  return areas;
}

// ─── SQL ────────────────────────────────────────────────────────
function generateSQL(rows) {
  const matched = rows.filter((r) => r.rakuten_hotel_id);
  if (matched.length === 0) return '-- No hotels to insert.\n';
  const now = new Date().toISOString().slice(0, 10);
  const lines = [
    `-- Generated by seed-hotels.mjs on ${now}`,
    `-- Hotels matched: ${matched.length} / ${rows.length} total`,
    '',
    'BEGIN;',
    '',
    '-- Upsert hotels',
    'INSERT INTO public.hotels (rakuten_hotel_id) VALUES',
    ...matched.map(
      (r, i) => `  (${r.rakuten_hotel_id})${i < matched.length - 1 ? ',' : ''}`,
    ),
    'ON CONFLICT (rakuten_hotel_id) DO NOTHING;',
    '',
  ];
  const pairs = [];
  for (const row of matched) {
    for (const t of row.tags
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      pairs.push({ id: row.rakuten_hotel_id, tag: t });
    }
  }
  if (pairs.length > 0) {
    lines.push(
      '-- Link hotel-tags',
      'INSERT INTO public.hotel_tags (hotel_id, tag_id)',
      'SELECT h.id, t.id',
      'FROM public.hotels h',
      'CROSS JOIN public.tags t',
      'WHERE (h.rakuten_hotel_id, t.slug) IN (',
      ...pairs.map(
        (p, i) => `  (${p.id}, '${p.tag}')${i < pairs.length - 1 ? ',' : ''}`,
      ),
      ')',
      'ON CONFLICT (hotel_id, tag_id) DO NOTHING;',
    );
  }
  lines.push('', 'COMMIT;', '');
  return lines.join('\n');
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('=== 風呂旅 ホテルデータ投入スクリプト ===\n');

  const rows = parseCSV(readFileSync(CSV_PATH, 'utf-8'));
  const headers = [
    'hotel_name',
    'rakuten_hotel_id',
    'tags',
    'separate_bath_rooms',
    'shower_only_rooms',
    'hotel_information_url',
  ];
  const needsFetch = rows.filter((r) => !r.rakuten_hotel_id);
  console.log(`全${rows.length}件 / 未取得${needsFetch.length}件\n`);

  if (needsFetch.length === 0) {
    writeFileSync(SQL_PATH, generateSQL(rows));
    console.log('全件取得済み。SQL生成完了。');
    return;
  }

  // Build lookup
  const lookup = new Map();
  for (const row of needsFetch) lookup.set(normalize(row.hotel_name), row);

  // Try loading cache first
  let allApiHotels = [];
  let fromCache = false;
  try {
    allApiHotels = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    fromCache = true;
    console.log(
      `キャッシュから ${allApiHotels.length} 件のAPIホテルを読み込み\n`,
    );
  } catch {
    /* no cache */
  }

  if (!fromCache) {
    // Fetch from API
    console.log('エリア階層取得中...');
    const areas = await getAreaHierarchy();
    console.log(`  ${areas.length} エリア検出\n`);
    await sleep(300);

    let pass1Matched = 0;

    for (let ai = 0; ai < areas.length; ai++) {
      if (lookup.size === 0) break;
      const { middle, small, detail } = areas[ai];
      const label = `${middle}/${small}${detail ? `/${detail}` : ''}`;
      process.stdout.write(
        `  [${ai + 1}/${areas.length}] ${label.padEnd(30)} `,
      );

      let page = 1;
      let areaMatched = 0;

      while (true) {
        const params = {
          largeClassCode: 'japan',
          middleClassCode: middle,
          smallClassCode: small,
          hits: '30',
          page: String(page),
        };
        if (detail) params.detailClassCode = detail;

        const data = await rakutenFetch('SimpleHotelSearch/20170426', params);
        if (!data?.hotels || data.hotels.length === 0) break;

        for (const item of data.hotels) {
          const info = item.hotel?.[0]?.hotelBasicInfo;
          if (!info?.hotelNo || !info?.hotelName) continue;

          // Save to cache
          allApiHotels.push({
            hotelNo: info.hotelNo,
            hotelName: info.hotelName,
          });

          // Pass 1: exact + containment
          const norm = normalize(info.hotelName);
          if (lookup.has(norm)) {
            lookup.get(norm).rakuten_hotel_id = String(info.hotelNo);
            lookup.delete(norm);
            pass1Matched++;
            areaMatched++;
            continue;
          }
          for (const [csvNorm, row] of lookup) {
            if (norm.includes(csvNorm) || csvNorm.includes(norm)) {
              row.rakuten_hotel_id = String(info.hotelNo);
              lookup.delete(csvNorm);
              pass1Matched++;
              areaMatched++;
              break;
            }
          }
        }

        const pi = data.pagingInfo;
        if (!pi || page >= pi.pageCount) break;
        page++;
        await sleep(200);
      }

      console.log(
        `${areaMatched > 0 ? `${areaMatched}件` : '-'} (残${lookup.size})`,
      );
      await sleep(200);
    }

    // Save cache
    writeFileSync(CACHE_PATH, JSON.stringify(allApiHotels));
    console.log(
      `\nPass 1完了: ${pass1Matched}件マッチ / APIキャッシュ ${allApiHotels.length}件保存`,
    );
  }

  // ─── Pass 2: Fuzzy matching ─────────────────────────────────
  const stillUnmatched = rows.filter((r) => !r.rakuten_hotel_id);
  if (stillUnmatched.length > 0 && allApiHotels.length > 0) {
    console.log(
      `\nPass 2: ファジーマッチ (${stillUnmatched.length}件 vs ${allApiHotels.length}件)...`,
    );

    // Deduplicate API hotels by hotelNo
    const apiMap = new Map();
    for (const h of allApiHotels) {
      if (!apiMap.has(h.hotelNo)) apiMap.set(h.hotelNo, h.hotelName);
    }
    const apiEntries = [...apiMap.entries()]; // [hotelNo, hotelName]

    let pass2Matched = 0;
    const usedIds = new Set(
      rows.filter((r) => r.rakuten_hotel_id).map((r) => r.rakuten_hotel_id),
    );

    for (const row of stillUnmatched) {
      let bestScore = 0;
      let bestNo = null;
      let bestName = '';

      for (const [hotelNo, hotelName] of apiEntries) {
        if (usedIds.has(String(hotelNo))) continue;
        const score = similarity(row.hotel_name, hotelName);
        if (score > bestScore) {
          bestScore = score;
          bestNo = hotelNo;
          bestName = hotelName;
        }
      }

      if (bestScore >= 0.65) {
        row.rakuten_hotel_id = String(bestNo);
        usedIds.add(String(bestNo));
        pass2Matched++;
        console.log(`  ✅ ${row.hotel_name}`);
        console.log(
          `     → ${bestName} [${bestNo}] (${(bestScore * 100).toFixed(0)}%)`,
        );
      } else if (bestScore >= 0.4) {
        console.log(`  ⚠️  ${row.hotel_name}`);
        console.log(
          `     → ${bestName} [${bestNo}] (${(bestScore * 100).toFixed(0)}%) ← スキップ`,
        );
      }
    }

    console.log(`\nPass 2完了: ${pass2Matched}件追加マッチ`);
  }

  // Save
  writeFileSync(CSV_PATH, toCSV(rows, headers));
  console.log(`\nCSV更新: ${CSV_PATH}`);
  writeFileSync(SQL_PATH, generateSQL(rows));
  console.log(`SQL生成: ${SQL_PATH}`);

  const totalMatched = rows.filter((r) => r.rakuten_hotel_id).length;
  const finalUnmatched = rows.filter((r) => !r.rakuten_hotel_id);
  console.log(`\n=== 最終結果 ===`);
  console.log(
    `マッチ: ${totalMatched}/${rows.length} / 未マッチ: ${finalUnmatched.length}`,
  );

  if (finalUnmatched.length > 0) {
    console.log('\n--- 未マッチ ---');
    for (const row of finalUnmatched) console.log(`  - ${row.hotel_name}`);
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
