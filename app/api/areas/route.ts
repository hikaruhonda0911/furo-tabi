import { NextResponse } from 'next/server';

import { getClientIp } from '@/lib/client-ip';
import { rateLimit } from '@/lib/rate-limit';

type AreaOption = {
  id: string;
  label: string;
};

type CachedAreasPayload = {
  areas: AreaOption[];
  fetchedAt: number;
};

const AREA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let cachedAreas: CachedAreasPayload | null = null;
let inflightAreasRequest: Promise<AreaOption[]> | null = null;

const collectMiddleClasses = (value: unknown, collector: AreaOption[]) => {
  if (Array.isArray(value)) {
    value.forEach((item) => {
      collectMiddleClasses(item, collector);
    });
    return;
  }

  if (!value || typeof value !== 'object') return;

  const node = value as Record<string, unknown>;
  const maybeCode = node.middleClassCode;
  const maybeName = node.middleClassName;

  if (typeof maybeCode === 'string' && typeof maybeName === 'string') {
    collector.push({ id: maybeCode, label: maybeName });
  }

  Object.values(node).forEach((child) => {
    collectMiddleClasses(child, collector);
  });
};

function getCachedAreas(): AreaOption[] | null {
  if (process.env.NODE_ENV === 'test') return null;
  if (!cachedAreas) return null;
  if (Date.now() - cachedAreas.fetchedAt > AREA_CACHE_TTL_MS) {
    cachedAreas = null;
    return null;
  }
  return cachedAreas.areas;
}

function buildAreasResponse(areas: AreaOption[], remaining?: number) {
  return NextResponse.json(
    { areas },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
        ...(remaining !== undefined
          ? { 'X-RateLimit-Remaining': String(remaining) }
          : {}),
      },
    },
  );
}

export async function GET(request: Request) {
  const cached = getCachedAreas();
  if (cached) {
    return buildAreasResponse(cached);
  }

  const rakutenAppId = process.env.RAKUTEN_APP_ID;
  const rakutenAccessKey = process.env.RAKUTEN_ACCESS_KEY;
  if (!rakutenAppId || !rakutenAccessKey) {
    return NextResponse.json(
      { error: '楽天APIキーが未設定です。' },
      { status: 500 },
    );
  }

  const ip = getClientIp(request);
  const { allowed, remaining, retryAfter } = await rateLimit(ip, {
    scope: 'areas',
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

  try {
    if (!inflightAreasRequest) {
      inflightAreasRequest = (async () => {
        const url = new URL(
          'https://openapi.rakuten.co.jp/engine/api/Travel/GetAreaClass/20131024',
        );
        url.searchParams.append('applicationId', rakutenAppId);
        url.searchParams.append('accessKey', rakutenAccessKey);
        url.searchParams.append('format', 'json');

        const response = await fetch(url.toString(), {
          headers: { Origin: 'https://furo-tabi.mui-co.workers.dev' },
        });
        if (!response.ok) {
          throw new Error('RAKUTEN_AREA_FETCH_FAILED');
        }

        const payload = (await response.json()) as unknown;
        const extracted: AreaOption[] = [];
        collectMiddleClasses(payload, extracted);

        const deduped = Array.from(
          new Map(extracted.map((area) => [area.id, area])).values(),
        );
        if (deduped.length === 0) {
          throw new Error('RAKUTEN_AREA_EMPTY');
        }

        if (process.env.NODE_ENV !== 'test') {
          cachedAreas = {
            areas: deduped,
            fetchedAt: Date.now(),
          };
        }

        return deduped;
      })().finally(() => {
        inflightAreasRequest = null;
      });
    }

    const areas = await inflightAreasRequest;
    return buildAreasResponse(areas, remaining);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'RAKUTEN_AREA_FETCH_FAILED' ||
        error.message === 'RAKUTEN_AREA_EMPTY')
    ) {
      return NextResponse.json(
        {
          error:
            error.message === 'RAKUTEN_AREA_EMPTY'
              ? 'エリア候補が取得できませんでした。'
              : 'エリア候補の取得に失敗しました。',
        },
        { status: 502 },
      );
    }

    console.error(
      'Area API failed:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
