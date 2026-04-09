#!/usr/bin/env node

/**
 * sync-hotel-info.mjs
 *
 * DBの全ホテルについて楽天APIからホテル名・画像・最低料金・都道府県を取得・更新する。
 * Cloudflare Workers Cron Trigger または手動で週1実行。
 *
 * Usage:
 *   node scripts/sync-hotel-info.mjs
 *
 * Env: .env.local から自動読み込み
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load .env.local ────────────────────────────────────────────
function loadEnv() {
  try {
    const content = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* ignore */
  }
}
loadEnv();

const APP_ID = process.env.RAKUTEN_APP_ID;
const ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!APP_ID || !ACCESS_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Required env vars missing.');
  console.error('  RAKUTEN_APP_ID:', APP_ID ? 'SET' : 'MISSING');
  console.error('  RAKUTEN_ACCESS_KEY:', ACCESS_KEY ? 'SET' : 'MISSING');
  console.error('  SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('  SUPABASE_KEY:', SUPABASE_KEY ? 'SET' : 'MISSING');
  process.exit(1);
}

const API_BASE =
  'https://openapi.rakuten.co.jp/engine/api/Travel/SimpleHotelSearch/20170426';
const ORIGIN = 'https://furo-tabi.mui-co.workers.dev';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchHotelInfo(hotelNo) {
  const url = `${API_BASE}?applicationId=${APP_ID}&accessKey=${ACCESS_KEY}&format=json&hotelNo=${hotelNo}`;
  const res = await fetch(url, { headers: { Origin: ORIGIN } });
  if (res.status === 429) {
    // Rate limited — wait and retry once
    await sleep(5000);
    const retry = await fetch(url, { headers: { Origin: ORIGIN } });
    if (!retry.ok) return null;
    const data = await retry.json();
    return data.hotels?.[0]?.hotel?.[0]?.hotelBasicInfo ?? null;
  }
  if (!res.ok) return null;
  const data = await res.json();
  return data.hotels?.[0]?.hotel?.[0]?.hotelBasicInfo ?? null;
}

async function main() {
  console.log('=== ホテル情報同期 ===\n');

  // Get all hotels from DB
  const dbRes = await fetch(
    `${SUPABASE_URL}/rest/v1/hotels?select=id,rakuten_hotel_id,name&limit=1000`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    },
  );
  const hotels = await dbRes.json();
  console.log(`DB: ${hotels.length}件\n`);

  let updated = 0;
  const skipped = 0;
  let notFound = 0;

  for (let i = 0; i < hotels.length; i++) {
    const h = hotels[i];
    const info = await fetchHotelInfo(h.rakuten_hotel_id);

    if (!info) {
      notFound++;
      await sleep(300);
      continue;
    }

    // 画像・料金・都道府県のみ更新（nameはCSV優先のため同期しない）
    const newImage = info.hotelImageUrl || '';
    const newMinCharge = info.hotelMinCharge || 0;
    const newPrefecture = info.address1 || '';

    // nameが空の場合のみ楽天APIの名前で埋める（新規追加ホテル用）
    const patch = {
      image_url: newImage,
      min_charge: newMinCharge,
      prefecture: newPrefecture,
    };
    if (!h.name) {
      patch.name = info.hotelName || '';
    }

    // Update DB
    const upRes = await fetch(`${SUPABASE_URL}/rest/v1/hotels?id=eq.${h.id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    });

    if (upRes.ok || upRes.status === 204) updated++;

    if ((i + 1) % 50 === 0) {
      console.log(
        `[${i + 1}/${hotels.length}] 更新:${updated} スキップ:${skipped} 未検出:${notFound}`,
      );
    }

    await sleep(300);
  }

  console.log(`\n=== 完了 ===`);
  console.log(`更新: ${updated} / 変更なし: ${skipped} / 未検出: ${notFound}`);
  console.log(`合計: ${hotels.length}件`);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
