import { NextResponse } from 'next/server';

import { fallbackAreaOptions } from '@/constants/areas';
import { getClientIp } from '@/lib/client-ip';
import { searchDefaults } from '@/lib/defaults';
import { searchHotels } from '@/lib/hotels';
import { rateLimit } from '@/lib/rate-limit';
import { validateApiSearchQuery } from '@/lib/validation';

const VALID_TAGS = new Set([
  'separate-bath',
  'shower-only',
  'public-bath',
  'sauna',
]);
const VALID_AREA_CODES = new Set(fallbackAreaOptions.map((a) => a.id));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawTags = searchParams.get('tags');
  const tags = rawTags
    ? rawTags.split(',').filter((tag) => VALID_TAGS.has(tag))
    : [];
  const rawAreas = searchParams.get('areas') ?? searchParams.get('area') ?? '';
  const areaCodes = Array.from(
    new Set(
      rawAreas
        .split(',')
        .map((value) => value.trim())
        .filter((code) => code !== '' && VALID_AREA_CODES.has(code)),
    ),
  );
  const checkinDate = searchParams.get('checkin') || null;
  const checkoutDate = searchParams.get('checkout') || null;
  const guestsParam = searchParams.get('guests') || searchDefaults.guests;
  const minPriceParam = searchParams.get('min_price');
  const maxPriceParam = searchParams.get('max_price');
  const hasPrivateBath = searchParams.get('has_private_bath') === 'true';

  const validationError = validateApiSearchQuery({
    rawQuery: searchParams.toString(),
    tagCount: tags.length,
    areaCount: areaCodes.length,
    checkin: checkinDate,
    checkout: checkoutDate,
    guests: guestsParam,
    minPrice: minPriceParam ?? '',
    maxPrice: maxPriceParam ?? '',
  });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const hasDates = Boolean(checkinDate && checkoutDate);
  const ip = getClientIp(request);
  const { allowed, remaining, retryAfter } = await rateLimit(ip, {
    scope: 'hotels',
    cost: hasDates ? 3 : 1,
  });
  if (!allowed) {
    return NextResponse.json(
      {
        error:
          'リクエスト数が上限を超えました。しばらくしてからお試しください。',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Remaining': String(remaining),
        },
      },
    );
  }

  const guestsValue = Number(guestsParam) || Number(searchDefaults.guests);
  const minPriceValue = minPriceParam ? Number(minPriceParam) : null;
  const maxPriceValue = maxPriceParam ? Number(maxPriceParam) : null;

  try {
    const hotels = await searchHotels({
      tags,
      areaCodes,
      checkinDate,
      checkoutDate,
      guests: guestsValue,
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
    });

    const filtered = hasPrivateBath
      ? hotels.filter((h) => h.hasPrivateBath)
      : hotels;

    return NextResponse.json(
      { hotels: filtered },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=300',
          'X-RateLimit-Remaining': String(remaining),
        },
      },
    );
  } catch (error) {
    console.error(
      'Search API failed:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'ホテル検索に失敗しました。しばらくしてからお試しください。' },
      { status: 500 },
    );
  }
}
