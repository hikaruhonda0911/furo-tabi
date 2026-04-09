import { getSearchCacheNamespace } from '@/lib/runtime-env';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitScope = 'hotels' | 'areas';

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

const RATE_LIMIT_CONFIG: Record<
  RateLimitScope,
  { maxRequests: number; windowMs: number }
> = {
  hotels: {
    maxRequests: 24,
    windowMs: 60_000,
  },
  areas: {
    maxRequests: 12,
    windowMs: 60_000,
  },
};

const stores: Record<RateLimitScope, Map<string, RateLimitEntry>> = {
  hotels: new Map(),
  areas: new Map(),
};

// System-wide Rakuten API rate limiting
// 月間33万PV / 720時間 ≒ 458PV/h ≒ 7.6 req/min（検索ごと最大5チャンク）
// → 余裕をもって200 req/minに設定
const rakutenStore: RateLimitEntry = { count: 0, resetAt: 0 };
const RAKUTEN_WINDOW_MS = 60_000;
const RAKUTEN_MAX_REQUESTS = 200;

const lastCleanupByScope: Record<RateLimitScope, number> = {
  hotels: 0,
  areas: 0,
};

function cleanup(scope: RateLimitScope, now: number) {
  const { windowMs } = RATE_LIMIT_CONFIG[scope];
  if (now - lastCleanupByScope[scope] < windowMs) return;

  lastCleanupByScope[scope] = now;
  const store = stores[scope];
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

async function rateLimitWithMemoryStore(
  ip: string,
  options: {
    scope?: RateLimitScope;
    cost?: number;
  } = {},
): Promise<RateLimitResult> {
  const scope = options.scope ?? 'hotels';
  const cost = Math.max(1, Math.trunc(options.cost ?? 1));
  const { maxRequests, windowMs } = RATE_LIMIT_CONFIG[scope];
  const now = Date.now();
  cleanup(scope, now);

  const store = stores[scope];
  const entry = store.get(ip);

  if (!entry || now >= entry.resetAt) {
    store.set(ip, { count: cost, resetAt: now + windowMs });
    return {
      allowed: cost <= maxRequests,
      remaining: Math.max(0, maxRequests - cost),
      retryAfter: Math.ceil(windowMs / 1000),
    };
  }

  entry.count += cost;

  return {
    allowed: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export async function rateLimit(
  ip: string,
  options: {
    scope?: RateLimitScope;
    cost?: number;
  } = {},
): Promise<RateLimitResult> {
  if (process.env.NODE_ENV === 'test') {
    const scope = options.scope ?? 'hotels';
    const cost = Math.max(1, Math.trunc(options.cost ?? 1));
    const { maxRequests, windowMs } = RATE_LIMIT_CONFIG[scope];
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - cost),
      retryAfter: Math.ceil(windowMs / 1000),
    };
  }

  const scope = options.scope ?? 'hotels';
  const cost = Math.max(1, Math.trunc(options.cost ?? 1));
  const { maxRequests, windowMs } = RATE_LIMIT_CONFIG[scope];
  const namespace = getSearchCacheNamespace();

  if (!namespace) {
    return rateLimitWithMemoryStore(ip, options);
  }

  const now = Date.now();
  const key = `rate-limit:${scope}:${ip}`;

  try {
    const raw = await namespace.get(key);
    const entry = raw ? (JSON.parse(raw) as RateLimitEntry) : null;

    if (!entry || now >= entry.resetAt) {
      const nextEntry = {
        count: cost,
        resetAt: now + windowMs,
      } satisfies RateLimitEntry;
      await namespace.put(key, JSON.stringify(nextEntry), {
        expirationTtl: Math.ceil(windowMs / 1000),
      });

      return {
        allowed: cost <= maxRequests,
        remaining: Math.max(0, maxRequests - cost),
        retryAfter: Math.ceil(windowMs / 1000),
      };
    }

    entry.count += cost;
    await namespace.put(key, JSON.stringify(entry), {
      expirationTtl: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    });

    return {
      allowed: entry.count <= maxRequests,
      remaining: Math.max(0, maxRequests - entry.count),
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  } catch (error) {
    console.error(
      'Rate limit KV fallback to memory store:',
      error instanceof Error ? error.message : error,
    );
    return rateLimitWithMemoryStore(ip, options);
  }
}

export function rakutenRateLimit(): { allowed: boolean; remaining: number } {
  if (process.env.NODE_ENV === 'test') {
    return { allowed: true, remaining: RAKUTEN_MAX_REQUESTS };
  }

  const now = Date.now();

  if (now >= rakutenStore.resetAt) {
    rakutenStore.count = 1;
    rakutenStore.resetAt = now + RAKUTEN_WINDOW_MS;
    return { allowed: true, remaining: RAKUTEN_MAX_REQUESTS - 1 };
  }

  rakutenStore.count++;

  if (rakutenStore.count > RAKUTEN_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  return {
    allowed: true,
    remaining: RAKUTEN_MAX_REQUESTS - rakutenStore.count,
  };
}
