#!/usr/bin/env node
/**
 * sync-google-places.mjs
 *
 * Google Places API (New) からホテルの写真・評価・口コミ数を取得してDBに保存。
 * 楽天画像がないホテルの補完 + 全ホテルにGoogle評価を付与。
 *
 * Usage: node scripts/sync-google-places.mjs
 *
 * Env: GOOGLE_PLACES_API_KEY in .env.local
 */

import { readFileSync } from 'node:fs';
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
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* ignore */
  }
}
loadEnv();

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!GOOGLE_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars:');
  console.error('  GOOGLE_PLACES_API_KEY:', GOOGLE_KEY ? 'SET' : 'MISSING');
  console.error('  SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('  SUPABASE_KEY:', SUPABASE_KEY ? 'SET' : 'MISSING');
  process.exit(1);
}

const PLACES_BASE = 'https://places.googleapis.com/v1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchHotel(hotelName, prefecture) {
  const query = `${hotelName} ${prefecture}`.trim();
  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.rating,places.userRatingCount,places.photos',
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'ja',
      maxResultCount: 1,
    }),
  });

  if (!res.ok) {
    if (res.status === 429) await sleep(5000);
    return null;
  }

  const data = await res.json();
  return data.places?.[0] ?? null;
}

function _getPhotoUrl(photoName, maxWidth = 800) {
  return `${PLACES_BASE}/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_KEY}`;
}

async function getPhotoCdnUrl(photoName, maxWidth = 800) {
  const res = await fetch(
    `${PLACES_BASE}/${photoName}/media?maxWidthPx=${maxWidth}&skipHttpRedirect=true&key=${GOOGLE_KEY}`,
  );
  if (!res.ok) return '';
  const data = await res.json();
  return data.photoUri ?? '';
}

async function main() {
  console.log('=== Google Places 同期 ===\n');

  const dbRes = await fetch(
    `${SUPABASE_URL}/rest/v1/hotels?select=id,rakuten_hotel_id,name,prefecture,image_url,google_place_id&limit=1000`,
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
  let skipped = 0;
  let notFound = 0;

  for (let i = 0; i < hotels.length; i++) {
    const h = hotels[i];

    // Skip if already has Google data
    if (h.google_place_id) {
      skipped++;
      continue;
    }

    const place = await searchHotel(h.name, h.prefecture);
    if (!place) {
      notFound++;
      await sleep(200);
      continue;
    }

    const patch = {
      google_place_id: place.id,
      google_rating: place.rating ?? 0,
      google_review_count: place.userRatingCount ?? 0,
    };

    // Get photo CDN URL (for hotels without Rakuten image, or always as supplement)
    if (place.photos?.length > 0) {
      const cdnUrl = await getPhotoCdnUrl(place.photos[0].name);
      if (cdnUrl) {
        patch.google_photo_url = cdnUrl;
      }
    }

    await fetch(`${SUPABASE_URL}/rest/v1/hotels?id=eq.${h.id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    });
    updated++;

    if ((i + 1) % 50 === 0) {
      console.log(
        `[${i + 1}/${hotels.length}] 更新:${updated} スキップ:${skipped} 未検出:${notFound}`,
      );
    }
    await sleep(300);
  }

  console.log(`\n=== 完了 ===`);
  console.log(`更新: ${updated} / スキップ: ${skipped} / 未検出: ${notFound}`);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
