import { createHash } from 'node:crypto';

import { rakutenRateLimit } from '@/lib/rate-limit';
import { getSearchCacheNamespace } from '@/lib/runtime-env';
import { createServerClient } from '@/lib/supabase/server';
import type { Hotel } from '@/types/hotel';

const DATED_SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const DATED_SEARCH_CACHE_STALE_MS = 30 * 60 * 1000;
const RAKUTEN_CHUNK_CACHE_TTL_MS = 10 * 60 * 1000;
const RAKUTEN_CHUNK_CACHE_STALE_MS = 60 * 60 * 1000;
const KV_CACHE_TTL_SECONDS = 60 * 60;
const RAKUTEN_RESPONSE_ELEMENTS = [
  'hotelNo',
  'hotelName',
  'hotelInformationUrl',
  'planListUrl',
  'hotelImageUrl',
  'hotelMinCharge',
  'reviewAverage',
  'address1',
  'roomInfo',
  'roomBasicInfo',
  'roomName',
  'roomMinCharge',
  'dailyCharge',
  'total',
  'chargeFlag',
].join(',');

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  staleUntil: number;
};

type CachedSearchPayload = {
  fetchedAt: number;
  hotels: Hotel[];
};

const searchResultCache = new Map<string, CacheEntry<Hotel[]>>();
const searchResultInflight = new Map<string, Promise<Hotel[]>>();
const rakutenChunkCache = new Map<string, CacheEntry<RakutenHotelItem[]>>();
const rakutenChunkInflight = new Map<string, Promise<RakutenFetchResult>>();

function buildFallbackHotelUrl(hotelId: number): string {
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
  const hotelUrl = `https://hotel.travel.rakuten.co.jp/hotelinfo/plan/${hotelId}`;
  if (affiliateId) {
    return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(hotelUrl)}`;
  }
  return hotelUrl;
}

interface RakutenHotelBasicInfo {
  hotelNo: number;
  hotelName: string;
  hotelInformationUrl?: string;
  planListUrl?: string;
  hotelImageUrl: string;
  hotelMinCharge?: number;
  reviewAverage: number | null;
  address1: string;
}

interface RakutenRoomBasicInfo {
  roomName: string;
  roomMinCharge?: number;
}

interface RakutenDailyCharge {
  rakutenCharge: number;
  total: number;
  chargeFlag: number;
}

interface RakutenRoomInfoNode {
  roomBasicInfo?: RakutenRoomBasicInfo;
  dailyCharge?: RakutenDailyCharge;
}

interface RakutenHotelItemLegacy {
  hotel: Array<
    | { hotelBasicInfo: RakutenHotelBasicInfo }
    | { roomInfo: RakutenRoomInfoNode[] }
    | Record<string, unknown>
  >;
}

interface RakutenHotelItemV2 {
  hotelBasicInfo: RakutenHotelBasicInfo;
  roomInfo?: RakutenRoomInfoNode[];
}

type RakutenHotelItem = RakutenHotelItemLegacy | RakutenHotelItemV2;

interface RakutenApiResponse {
  error?: string;
  error_description?: string;
  hotels?: RakutenHotelItem[];
}

type RakutenFetchResult = {
  ok: boolean;
  hotels: RakutenHotelItem[];
};

function getBasicInfo(
  item: RakutenHotelItem,
): RakutenHotelBasicInfo | undefined {
  if ('hotelBasicInfo' in item) {
    return item.hotelBasicInfo;
  }
  if (!('hotel' in item)) {
    return undefined;
  }
  for (const node of item.hotel) {
    if ('hotelBasicInfo' in node) {
      return node.hotelBasicInfo as RakutenHotelBasicInfo;
    }
  }
  return undefined;
}

function getRoomInfo(item: RakutenHotelItem): RakutenRoomInfoNode[] {
  if ('roomInfo' in item && Array.isArray(item.roomInfo)) {
    return item.roomInfo;
  }
  if (!('hotel' in item)) {
    return [];
  }
  for (const node of item.hotel) {
    if ('roomInfo' in node && Array.isArray(node.roomInfo)) {
      return node.roomInfo as RakutenRoomInfoNode[];
    }
  }
  return [];
}

function getStayNights(checkinDate: string, checkoutDate: string): string {
  const checkin = new Date(`${checkinDate}T00:00:00`);
  const checkout = new Date(`${checkoutDate}T00:00:00`);
  const diffMs = checkout.getTime() - checkin.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);
  return String(diffDays > 0 ? diffDays : 1);
}

function buildDatedPlanListUrl(
  sourceUrl: string,
  hotelId: number,
  checkinDate: string,
  checkoutDate: string,
  guests: number,
): string {
  const [checkinYear, checkinMonth, checkinDay] = checkinDate.split('-');
  const [checkoutYear, checkoutMonth, checkoutDay] = checkoutDate.split('-');

  const finalPlanUrl = new URL(
    'https://hotel.travel.rakuten.co.jp/hotelinfo/plan/',
  );
  finalPlanUrl.searchParams.set('f_no', String(hotelId));
  finalPlanUrl.searchParams.set('f_flg', 'PLAN');
  finalPlanUrl.searchParams.set(
    'f_hak',
    getStayNights(checkinDate, checkoutDate),
  );
  finalPlanUrl.searchParams.set('f_heya_su', '1');
  finalPlanUrl.searchParams.set('f_otona_su', String(guests));
  finalPlanUrl.searchParams.set('f_s1', '0');
  finalPlanUrl.searchParams.set('f_s2', '0');
  finalPlanUrl.searchParams.set('f_y1', '0');
  finalPlanUrl.searchParams.set('f_y2', '0');
  finalPlanUrl.searchParams.set('f_y3', '0');
  finalPlanUrl.searchParams.set('f_y4', '0');
  finalPlanUrl.searchParams.set('f_nen1', checkinYear ?? '');
  finalPlanUrl.searchParams.set('f_tuki1', checkinMonth ?? '');
  finalPlanUrl.searchParams.set('f_hi1', checkinDay ?? '');
  finalPlanUrl.searchParams.set('f_nen2', checkoutYear ?? '');
  finalPlanUrl.searchParams.set('f_tuki2', checkoutMonth ?? '');
  finalPlanUrl.searchParams.set('f_hi2', checkoutDay ?? '');

  const outerUrl = new URL(sourceUrl);
  const affiliateTarget = outerUrl.searchParams.get('pc');
  if (!affiliateTarget) {
    return finalPlanUrl.toString();
  }

  outerUrl.searchParams.set('pc', finalPlanUrl.toString());
  return outerUrl.toString();
}

function getHotelDetailUrl(
  hotelId: number,
  basicInfo: RakutenHotelBasicInfo,
  checkinDate?: string | null,
  checkoutDate?: string | null,
  guests?: number,
): string {
  if (checkinDate && checkoutDate && guests && basicInfo.planListUrl) {
    return buildDatedPlanListUrl(
      basicInfo.planListUrl,
      hotelId,
      checkinDate,
      checkoutDate,
      guests,
    );
  }

  if (basicInfo.planListUrl) return basicInfo.planListUrl;

  return buildFallbackHotelUrl(hotelId);
}

function isRakutenHotelItem(item: unknown): item is RakutenHotelItem {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  const v2Info =
    obj.hotelBasicInfo && typeof obj.hotelBasicInfo === 'object'
      ? (obj.hotelBasicInfo as Record<string, unknown>)
      : null;
  if (v2Info) {
    return (
      typeof v2Info.hotelNo === 'number' && typeof v2Info.hotelName === 'string'
    );
  }

  if (!Array.isArray(obj.hotel) || obj.hotel.length < 1) return false;

  const basic = obj.hotel[0] as Record<string, unknown> | undefined;
  if (!basic?.hotelBasicInfo || typeof basic.hotelBasicInfo !== 'object') {
    return false;
  }

  const info = basic.hotelBasicInfo as Record<string, unknown>;
  if (typeof info.hotelNo !== 'number' || typeof info.hotelName !== 'string')
    return false;

  return true;
}

function parseRakutenResponse(json: unknown): RakutenApiResponse {
  if (!json || typeof json !== 'object') {
    return { error: 'Invalid response' };
  }
  const obj = json as Record<string, unknown>;

  if (typeof obj.error === 'string') {
    return {
      error: obj.error,
      error_description:
        typeof obj.error_description === 'string'
          ? obj.error_description
          : undefined,
    };
  }

  if (!Array.isArray(obj.hotels)) {
    return { hotels: [] };
  }

  return { hotels: obj.hotels.filter(isRakutenHotelItem) };
}

function getCacheValue<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  mode: 'fresh' | 'stale',
): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (mode === 'fresh') {
    return now <= entry.expiresAt ? entry.value : null;
  }

  if (now <= entry.staleUntil) return entry.value;
  cache.delete(key);
  return null;
}

function setCacheValue<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
  staleMs: number,
) {
  const now = Date.now();
  cache.set(key, {
    value,
    expiresAt: now + ttlMs,
    staleUntil: now + staleMs,
  });
}

function buildSearchCacheKey(params: SearchHotelsParams): string {
  return JSON.stringify({
    tags: [...params.tags].sort(),
    areaCodes: [...params.areaCodes].sort(),
    checkinDate: params.checkinDate,
    checkoutDate: params.checkoutDate,
    guests: params.guests,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
  });
}

function buildKvSearchCacheKey(searchCacheKey: string): string {
  return `search:${createHash('sha1').update(searchCacheKey).digest('hex')}`;
}

async function getKvCachedSearchResult(
  searchCacheKey: string,
  mode: 'fresh' | 'stale',
): Promise<Hotel[] | null> {
  const namespace = getSearchCacheNamespace();
  if (!namespace) return null;

  try {
    const raw = await namespace.get(buildKvSearchCacheKey(searchCacheKey));
    if (!raw) return null;

    const payload = JSON.parse(raw) as CachedSearchPayload;
    const ageMs = Date.now() - payload.fetchedAt;

    if (mode === 'fresh' && ageMs <= DATED_SEARCH_CACHE_TTL_MS) {
      return payload.hotels;
    }
    if (mode === 'stale' && ageMs <= DATED_SEARCH_CACHE_STALE_MS) {
      return payload.hotels;
    }
  } catch (error) {
    console.error(
      'Failed to read search cache from KV:',
      error instanceof Error ? error.message : error,
    );
  }

  return null;
}

async function setKvCachedSearchResult(
  searchCacheKey: string,
  hotels: Hotel[],
): Promise<void> {
  const namespace = getSearchCacheNamespace();
  if (!namespace) return;

  try {
    await namespace.put(
      buildKvSearchCacheKey(searchCacheKey),
      JSON.stringify({
        fetchedAt: Date.now(),
        hotels,
      } satisfies CachedSearchPayload),
      { expirationTtl: KV_CACHE_TTL_SECONDS },
    );
  } catch (error) {
    console.error(
      'Failed to write search cache to KV:',
      error instanceof Error ? error.message : error,
    );
  }
}

// 楽天APIの address1（都道府県名）→ middleClassCode マッピング
const PREFECTURE_TO_AREA: Record<string, string> = {
  北海道: 'hokkaido',
  青森県: 'aomori',
  岩手県: 'iwate',
  宮城県: 'miyagi',
  秋田県: 'akita',
  山形県: 'yamagata',
  福島県: 'fukushima',
  茨城県: 'ibaraki',
  栃木県: 'tochigi',
  群馬県: 'gunma',
  埼玉県: 'saitama',
  千葉県: 'chiba',
  東京都: 'tokyo',
  神奈川県: 'kanagawa',
  新潟県: 'niigata',
  富山県: 'toyama',
  石川県: 'ishikawa',
  福井県: 'fukui',
  山梨県: 'yamanashi',
  長野県: 'nagano',
  岐阜県: 'gifu',
  静岡県: 'shizuoka',
  愛知県: 'aichi',
  三重県: 'mie',
  滋賀県: 'shiga',
  京都府: 'kyoto',
  大阪府: 'osaka',
  兵庫県: 'hyogo',
  奈良県: 'nara',
  和歌山県: 'wakayama',
  鳥取県: 'tottori',
  島根県: 'shimane',
  岡山県: 'okayama',
  広島県: 'hiroshima',
  山口県: 'yamaguchi',
  徳島県: 'tokushima',
  香川県: 'kagawa',
  愛媛県: 'ehime',
  高知県: 'kochi',
  福岡県: 'fukuoka',
  佐賀県: 'saga',
  長崎県: 'nagasaki',
  熊本県: 'kumamoto',
  大分県: 'oita',
  宮崎県: 'miyazaki',
  鹿児島県: 'kagoshima',
  沖縄県: 'okinawa',
};

export type SearchHotelsParams = {
  tags: string[];
  areaCodes: string[];
  checkinDate: string | null;
  checkoutDate: string | null;
  guests: number;
  minPrice: number | null;
  maxPrice: number | null;
};

type HotelDbMetadata = Pick<
  Hotel,
  | 'area'
  | 'hasPublicBath'
  | 'hasSauna'
  | 'hasPrivateBath'
  | 'googleRating'
  | 'googleReviewCount'
  | 'googlePhotoUrl'
  | 'latitude'
  | 'longitude'
>;

export async function searchHotels(
  params: SearchHotelsParams,
): Promise<Hotel[]> {
  const searchCacheKey = buildSearchCacheKey(params);
  const cachedSearchResult = getCacheValue(
    searchResultCache,
    searchCacheKey,
    'fresh',
  );
  if (cachedSearchResult) {
    return cachedSearchResult;
  }

  const inflightSearch = searchResultInflight.get(searchCacheKey);
  if (inflightSearch) {
    return inflightSearch;
  }

  const requestPromise = (async (): Promise<Hotel[]> => {
    const {
      tags,
      areaCodes,
      checkinDate,
      checkoutDate,
      guests,
      minPrice,
      maxPrice,
    } = params;
    const kvCachedSearchResult = await getKvCachedSearchResult(
      searchCacheKey,
      'fresh',
    );
    if (kvCachedSearchResult) {
      setCacheValue(
        searchResultCache,
        searchCacheKey,
        kvCachedSearchResult,
        DATED_SEARCH_CACHE_TTL_MS,
        DATED_SEARCH_CACHE_STALE_MS,
      );
      return kvCachedSearchResult;
    }

    const supabase = createServerClient();
    const { data: dbHotels, error: dbError } = await supabase.rpc(
      'get_hotels_by_tags',
      { tag_slugs: tags },
    );

    if (dbError) throw new Error(`DB Error: ${dbError.message}`);

    const dbHotelRows = dbHotels ?? [];
    const areaCodeSet = areaCodes.length > 0 ? new Set(areaCodes) : null;
    const filteredDbHotelRows = areaCodeSet
      ? dbHotelRows.filter((hotel) => {
          if (!hotel.hotel_prefecture) return false;
          const code = PREFECTURE_TO_AREA[hotel.hotel_prefecture];
          return code ? areaCodeSet.has(code) : false;
        })
      : dbHotelRows;
    const validHotelIds = new Set(
      filteredDbHotelRows.map((h) => h.rakuten_hotel_id),
    );
    const tagsByHotelId = new Map<number, string[]>();
    const roomsByHotelId = new Map<
      number,
      { separateBathRooms: string[]; showerOnlyRooms: string[] }
    >();
    const metadataByHotelId = new Map<number, HotelDbMetadata>();
    for (const h of filteredDbHotelRows) {
      tagsByHotelId.set(h.rakuten_hotel_id, h.hotel_tag_slugs ?? []);
      roomsByHotelId.set(h.rakuten_hotel_id, {
        separateBathRooms: h.separate_bath_rooms ?? [],
        showerOnlyRooms: h.shower_only_rooms ?? [],
      });
      metadataByHotelId.set(h.rakuten_hotel_id, {
        area: h.hotel_prefecture,
        hasPublicBath: h.hotel_has_public_bath,
        hasSauna: h.hotel_has_sauna,
        hasPrivateBath: h.hotel_has_private_bath,
        googleRating: h.hotel_google_rating,
        googleReviewCount: h.hotel_google_review_count,
        googlePhotoUrl: h.hotel_google_photo_url,
        latitude: h.hotel_latitude,
        longitude: h.hotel_longitude,
      });
    }

    if (validHotelIds.size === 0) {
      return [];
    }

    const buildDbFallbackHotels = (): Hotel[] => {
      const hotels = filteredDbHotelRows.map((hotel) => ({
        id: hotel.rakuten_hotel_id,
        name: hotel.hotel_name || `ホテル (ID: ${hotel.rakuten_hotel_id})`,
        price: hotel.hotel_min_charge ?? 0,
        priceType:
          (hotel.hotel_min_charge ?? 0) > 0
            ? ('minimum' as const)
            : ('none' as const),
        imageUrl: hotel.hotel_image_url,
        reviewAverage: null,
        roomName: '',
        tags: hotel.hotel_tag_slugs ?? [],
        separateBathRooms: hotel.separate_bath_rooms ?? [],
        showerOnlyRooms: hotel.shower_only_rooms ?? [],
        hotelInformationUrl: buildFallbackHotelUrl(hotel.rakuten_hotel_id),
        area: hotel.hotel_prefecture,
        hasPublicBath: hotel.hotel_has_public_bath,
        hasSauna: hotel.hotel_has_sauna,
        hasPrivateBath: hotel.hotel_has_private_bath,
        googleRating: hotel.hotel_google_rating,
        googleReviewCount: hotel.hotel_google_review_count,
        googlePhotoUrl: hotel.hotel_google_photo_url,
        latitude: hotel.hotel_latitude,
        longitude: hotel.hotel_longitude,
      }));

      return hotels.filter((hotel) => {
        if (minPrice !== null && hotel.price < minPrice) return false;
        if (
          maxPrice !== null &&
          hotel.priceType !== 'none' &&
          hotel.price > maxPrice
        ) {
          return false;
        }
        return true;
      });
    };

    const hasDates = checkinDate && checkoutDate;

    // 日付なし: DBデータだけで返却（楽天APIを叩かない）
    if (!hasDates) {
      const dbResults = buildDbFallbackHotels();

      setCacheValue(
        searchResultCache,
        searchCacheKey,
        dbResults,
        DATED_SEARCH_CACHE_TTL_MS,
        DATED_SEARCH_CACHE_STALE_MS,
      );
      await setKvCachedSearchResult(searchCacheKey, dbResults);
      return dbResults;
    }

    const rakutenAppId = process.env.RAKUTEN_APP_ID;
    const rakutenAccessKey = process.env.RAKUTEN_ACCESS_KEY;
    if (!rakutenAppId || !rakutenAccessKey) {
      throw new Error('楽天APIキーが未設定です。');
    }

    const buildRakutenUrl = () => {
      const endpoint = hasDates
        ? 'VacantHotelSearch/20170426'
        : 'SimpleHotelSearch/20170426';
      const url = new URL(
        `https://openapi.rakuten.co.jp/engine/api/Travel/${endpoint}`,
      );
      url.searchParams.append('applicationId', rakutenAppId);
      url.searchParams.append('accessKey', rakutenAccessKey);
      if (process.env.RAKUTEN_AFFILIATE_ID) {
        url.searchParams.append(
          'affiliateId',
          process.env.RAKUTEN_AFFILIATE_ID,
        );
      }
      url.searchParams.append('format', 'json');
      url.searchParams.append('formatVersion', '2');
      url.searchParams.append('elements', RAKUTEN_RESPONSE_ELEMENTS);
      if (hasDates) {
        url.searchParams.append('checkinDate', checkinDate);
        url.searchParams.append('checkoutDate', checkoutDate);
        url.searchParams.append('adultNum', String(guests));
      }
      if (minPrice !== null) {
        url.searchParams.append('minCharge', String(minPrice));
      }
      if (maxPrice !== null) {
        url.searchParams.append('maxCharge', String(maxPrice));
      }
      return url;
    };

    const fetchRakuten = async (
      url: URL,
    ): Promise<{ ok: boolean; hotels: RakutenHotelItem[] }> => {
      const cacheKey = url.toString();
      const freshCached = getCacheValue(rakutenChunkCache, cacheKey, 'fresh');
      if (freshCached) {
        return { ok: true, hotels: freshCached };
      }

      const inflight = rakutenChunkInflight.get(cacheKey);
      if (inflight) {
        return inflight;
      }

      const requestPromise = (async (): Promise<RakutenFetchResult> => {
        const staleCached = getCacheValue(rakutenChunkCache, cacheKey, 'stale');

        const { allowed } = rakutenRateLimit();
        if (!allowed) {
          console.error('Rakuten API system-wide rate limit exceeded');
          if (staleCached) {
            return { ok: true, hotels: staleCached };
          }
          return { ok: false, hotels: [] };
        }

        try {
          for (let attempt = 0; attempt <= 2; attempt += 1) {
            try {
              const response = await fetch(url.toString(), {
                headers: { Origin: 'https://furo-tabi.mui-co.workers.dev' },
                signal: AbortSignal.timeout(5000),
              });
              // 404 = 空室なし（エラーではない）
              if (response.status === 404) {
                setCacheValue(
                  rakutenChunkCache,
                  cacheKey,
                  [],
                  RAKUTEN_CHUNK_CACHE_TTL_MS,
                  RAKUTEN_CHUNK_CACHE_STALE_MS,
                );
                return { ok: true, hotels: [] };
              }
              if (!response.ok) {
                throw new Error(`Rakuten API HTTP Error: ${response.status}`);
              }

              const data = parseRakutenResponse(await response.json());
              if (data.error || !data.hotels) {
                throw new Error(
                  data.error_description ||
                    data.error ||
                    'Invalid Rakuten response',
                );
              }

              setCacheValue(
                rakutenChunkCache,
                cacheKey,
                data.hotels,
                RAKUTEN_CHUNK_CACHE_TTL_MS,
                RAKUTEN_CHUNK_CACHE_STALE_MS,
              );
              return { ok: true, hotels: data.hotels };
            } catch (error) {
              console.error(
                'Rakuten chunk fetch failed:',
                error instanceof Error ? error.message : error,
              );
              if (attempt < 2) {
                await new Promise((resolve) =>
                  setTimeout(resolve, 250 * (attempt + 1)),
                );
              }
            }
          }

          const staleCached = getCacheValue(
            rakutenChunkCache,
            cacheKey,
            'stale',
          );
          if (staleCached) {
            return { ok: true, hotels: staleCached };
          }

          return { ok: false, hotels: [] };
        } finally {
          rakutenChunkInflight.delete(cacheKey);
        }
      })();

      rakutenChunkInflight.set(cacheKey, requestPromise);
      return requestPromise;
    };

    // Always search by hotelNo (new Rakuten API requires detailClassCode for area search)
    const hotelIds = [...validHotelIds];
    const chunks: number[][] = [];
    for (let i = 0; i < hotelIds.length; i += 15) {
      chunks.push(hotelIds.slice(i, i + 15));
    }

    const CONCURRENCY = 3;
    const areaResults: Awaited<ReturnType<typeof fetchRakuten>>[] = [];
    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
      const batch = chunks.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((chunk) => {
          const url = buildRakutenUrl();
          url.searchParams.append('hotelNo', chunk.join(','));
          return fetchRakuten(url);
        }),
      );
      areaResults.push(...batchResults);
      // バッチ間ディレイ（レート制限対策）
      if (i + CONCURRENCY < chunks.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const failedChunkCount = areaResults.filter((result) => !result.ok).length;
    if (failedChunkCount > 0) {
      const staleSearchResult = getCacheValue(
        searchResultCache,
        searchCacheKey,
        'stale',
      );
      if (staleSearchResult) {
        return staleSearchResult;
      }
      const staleKvSearchResult = await getKvCachedSearchResult(
        searchCacheKey,
        'stale',
      );
      if (staleKvSearchResult) {
        setCacheValue(
          searchResultCache,
          searchCacheKey,
          staleKvSearchResult,
          DATED_SEARCH_CACHE_TTL_MS,
          DATED_SEARCH_CACHE_STALE_MS,
        );
        return staleKvSearchResult;
      }

      console.error(
        `Rakuten search partially failed. Falling back to facilities only (${failedChunkCount}/${areaResults.length} chunk failed).`,
      );
    }

    const allRakutenHotels = areaResults.flatMap((result) => result.hotels);
    const resultHotels = allRakutenHotels
      .filter((h) => {
        const info = getBasicInfo(h);
        return info ? validHotelIds.has(info.hotelNo) : false;
      })
      .map((h) => {
        const basicInfo = getBasicInfo(h) as RakutenHotelBasicInfo;
        const roomNodes = getRoomInfo(h);
        const roomBasic = roomNodes.find((n) => n.roomBasicInfo)?.roomBasicInfo;
        const dailyCharge = roomNodes.find((n) => n.dailyCharge)?.dailyCharge;
        const metadata = metadataByHotelId.get(basicInfo.hotelNo);

        // VacantHotelSearch: display total nightly price to match Rakuten's booking page.
        // SimpleHotelSearch: use hotel's minimum nightly price.
        const hotelMinCharge = basicInfo.hotelMinCharge;
        const vacancyPrice = dailyCharge?.total ?? roomBasic?.roomMinCharge;
        const minCharge =
          typeof hotelMinCharge === 'number' ? hotelMinCharge : 0;

        const price = hasDates ? (vacancyPrice ?? 0) : minCharge;
        const priceType: 'vacancy' | 'minimum' | 'none' = hasDates
          ? vacancyPrice
            ? 'vacancy'
            : 'none'
          : minCharge > 0
            ? 'minimum'
            : 'none';

        const rooms = roomsByHotelId.get(basicInfo.hotelNo);
        const prefecture =
          typeof basicInfo.address1 === 'string' ? basicInfo.address1 : '';
        return {
          id: basicInfo.hotelNo,
          name: basicInfo.hotelName,
          price,
          priceType,
          imageUrl: basicInfo.hotelImageUrl,
          reviewAverage: basicInfo.reviewAverage,
          roomName: roomBasic?.roomName || '部屋タイプ指定なし',
          tags: tagsByHotelId.get(basicInfo.hotelNo) ?? [],
          separateBathRooms: rooms?.separateBathRooms ?? [],
          showerOnlyRooms: rooms?.showerOnlyRooms ?? [],
          hotelInformationUrl: getHotelDetailUrl(
            basicInfo.hotelNo,
            basicInfo,
            checkinDate,
            checkoutDate,
            guests,
          ),
          area: prefecture || metadata?.area || '',
          hasPublicBath: metadata?.hasPublicBath ?? false,
          hasSauna: metadata?.hasSauna ?? false,
          hasPrivateBath: metadata?.hasPrivateBath ?? false,
          googleRating: metadata?.googleRating ?? 0,
          googleReviewCount: metadata?.googleReviewCount ?? 0,
          googlePhotoUrl: metadata?.googlePhotoUrl ?? '',
          latitude: metadata?.latitude ?? 0,
          longitude: metadata?.longitude ?? 0,
        };
      })
      .reduce((acc, hotel) => {
        const current = acc.get(hotel.id);
        if (!current || hotel.price < current.price) {
          acc.set(hotel.id, hotel);
        }
        return acc;
      }, new Map<number, Hotel>());

    let hotels = Array.from(resultHotels.values());

    if (failedChunkCount > 0) {
      const fallbackHotels = buildDbFallbackHotels();
      const pricedHotelIds = new Set(hotels.map((hotel) => hotel.id));
      const unavailableHotels = fallbackHotels.filter(
        (hotel) => !pricedHotelIds.has(hotel.id),
      );
      hotels = [...hotels, ...unavailableHotels];
    }

    // Filter by area if specified
    if (areaCodeSet) {
      hotels = hotels.filter((hotel) => {
        if (!hotel.area) return false;
        const code = PREFECTURE_TO_AREA[hotel.area];
        return code ? areaCodeSet.has(code) : false;
      });
    }

    setCacheValue(
      searchResultCache,
      searchCacheKey,
      hotels,
      DATED_SEARCH_CACHE_TTL_MS,
      DATED_SEARCH_CACHE_STALE_MS,
    );
    await setKvCachedSearchResult(searchCacheKey, hotels);

    return hotels;
  })();

  searchResultInflight.set(searchCacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    searchResultInflight.delete(searchCacheKey);
  }
}
