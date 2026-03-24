import { rakutenRateLimit } from '@/lib/rate-limit';
import { createServerClient } from '@/lib/supabase/server';
import type { Hotel } from '@/types/hotel';

function buildHotelUrl(hotelId: number): string {
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
  hotelImageUrl: string;
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
}

interface RakutenRoomInfoNode {
  roomBasicInfo?: RakutenRoomBasicInfo;
  dailyCharge?: RakutenDailyCharge;
}

interface RakutenHotelItem {
  hotel: Array<
    | { hotelBasicInfo: RakutenHotelBasicInfo }
    | { roomInfo: RakutenRoomInfoNode[] }
    | Record<string, unknown>
  >;
}

interface RakutenApiResponse {
  error?: string;
  error_description?: string;
  hotels?: RakutenHotelItem[];
}

function getBasicInfo(
  item: RakutenHotelItem,
): RakutenHotelBasicInfo | undefined {
  for (const node of item.hotel) {
    if ('hotelBasicInfo' in node) {
      return node.hotelBasicInfo as RakutenHotelBasicInfo;
    }
  }
  return undefined;
}

function getRoomInfo(item: RakutenHotelItem): RakutenRoomInfoNode[] {
  for (const node of item.hotel) {
    if ('roomInfo' in node && Array.isArray(node.roomInfo)) {
      return node.roomInfo as RakutenRoomInfoNode[];
    }
  }
  return [];
}

function isRakutenHotelItem(item: unknown): item is RakutenHotelItem {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  if (!Array.isArray(obj.hotel) || obj.hotel.length < 1) return false;

  const basic = obj.hotel[0] as Record<string, unknown> | undefined;
  if (!basic?.hotelBasicInfo || typeof basic.hotelBasicInfo !== 'object')
    return false;

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

export async function searchHotels(
  params: SearchHotelsParams,
): Promise<Hotel[]> {
  const {
    tags,
    areaCodes,
    checkinDate,
    checkoutDate,
    guests,
    minPrice,
    maxPrice,
  } = params;

  const rakutenAppId = process.env.RAKUTEN_APP_ID;
  const rakutenAccessKey = process.env.RAKUTEN_ACCESS_KEY;
  if (!rakutenAppId || !rakutenAccessKey) {
    throw new Error('楽天APIキーが未設定です。');
  }

  const supabase = createServerClient();
  const { data: dbHotels, error: dbError } = await supabase.rpc(
    'get_hotels_by_tags',
    { tag_slugs: tags },
  );

  if (dbError) throw new Error(`DB Error: ${dbError.message}`);

  const dbHotelRows = dbHotels ?? [];
  const validHotelIds = new Set(dbHotelRows.map((h) => h.rakuten_hotel_id));
  const tagsByHotelId = new Map<number, string[]>();
  const roomsByHotelId = new Map<
    number,
    { separateBathRooms: string[]; showerOnlyRooms: string[] }
  >();
  for (const h of dbHotelRows) {
    tagsByHotelId.set(h.rakuten_hotel_id, h.hotel_tag_slugs ?? []);
    roomsByHotelId.set(h.rakuten_hotel_id, {
      separateBathRooms: h.separate_bath_rooms ?? [],
      showerOnlyRooms: h.shower_only_rooms ?? [],
    });
  }

  if (validHotelIds.size === 0) {
    return [];
  }

  const hasDates = checkinDate && checkoutDate;

  // 日付なし: DBデータだけで返却（楽天APIを叩かない）
  if (!hasDates) {
    type DbRow = (typeof dbHotelRows)[number];
    let dbResults = dbHotelRows.map((h: DbRow) => ({
      id: h.rakuten_hotel_id,
      name: (h as Record<string, unknown>).hotel_name as string || `ホテル (ID: ${h.rakuten_hotel_id})`,
      price: ((h as Record<string, unknown>).hotel_min_charge as number) || 0,
      priceType: (((h as Record<string, unknown>).hotel_min_charge as number) > 0 ? 'minimum' : 'none') as Hotel['priceType'],
      imageUrl: (h as Record<string, unknown>).hotel_image_url as string || '',
      reviewAverage: null,
      roomName: '',
      tags: h.hotel_tag_slugs ?? [],
      separateBathRooms: h.separate_bath_rooms ?? [],
      showerOnlyRooms: h.shower_only_rooms ?? [],
      hotelInformationUrl: buildHotelUrl(h.rakuten_hotel_id),
      area: (h as Record<string, unknown>).hotel_prefecture as string || '',
      hasPublicBath: ((h as Record<string, unknown>).hotel_has_public_bath as boolean) ?? false,
      hasSauna: ((h as Record<string, unknown>).hotel_has_sauna as boolean) ?? false,
      hasPrivateBath: ((h as Record<string, unknown>).hotel_has_private_bath as boolean) ?? false,
      googleRating: ((h as Record<string, unknown>).hotel_google_rating as number) ?? 0,
      googleReviewCount: ((h as Record<string, unknown>).hotel_google_review_count as number) ?? 0,
      googlePhotoUrl: ((h as Record<string, unknown>).hotel_google_photo_url as string) ?? '',
      latitude: ((h as Record<string, unknown>).hotel_latitude as number) ?? 0,
      longitude: ((h as Record<string, unknown>).hotel_longitude as number) ?? 0,
    }));

    if (areaCodes.length > 0) {
      const areaCodeSet = new Set(areaCodes);
      dbResults = dbResults.filter((hotel) => {
        if (!hotel.area) return false;
        const code = PREFECTURE_TO_AREA[hotel.area];
        return code ? areaCodeSet.has(code) : false;
      });
    }

    return dbResults;
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
    url.searchParams.append('format', 'json');
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

  const fetchRakuten = async (url: URL) => {
    const { allowed } = rakutenRateLimit();
    if (!allowed) {
      console.error('Rakuten API system-wide rate limit exceeded');
      return { ok: false as const, hotels: [] as RakutenHotelItem[] };
    }

    const response = await fetch(url.toString(), {
      headers: { Origin: 'https://furo-tabi.mui-co.workers.dev' },
    });
    // 404 = 空室なし（エラーではない）。それ以外のHTTPエラーは失敗とみなす
    if (response.status === 404) {
      return { ok: true as const, hotels: [] as RakutenHotelItem[] };
    }
    if (!response.ok) {
      console.error('Rakuten API HTTP Error:', response.status);
      return { ok: false as const, hotels: [] as RakutenHotelItem[] };
    }
    const data = parseRakutenResponse(await response.json());
    if (data.error || !data.hotels) {
      return { ok: true as const, hotels: [] as RakutenHotelItem[] };
    }
    return { ok: true as const, hotels: data.hotels };
  };

  // Always search by hotelNo (new Rakuten API requires detailClassCode for area search)
  const hotelIds = [...validHotelIds];
  const chunks: number[][] = [];
  for (let i = 0; i < hotelIds.length; i += 15) {
    chunks.push(hotelIds.slice(i, i + 15));
  }

  const CONCURRENCY = 5;
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

  // 全チャンク失敗時も空配列で返しUIに判断を委ねる（500エラーにしない）
  const hasAnySuccess = areaResults.some((result) => result.ok);
  if (!hasAnySuccess && areaResults.length > 0) {
    console.error('All Rakuten API chunks failed. Returning empty results.');
    return [];
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

      // VacantHotelSearch: price is in dailyCharge.rakutenCharge
      // SimpleHotelSearch: price is in hotelBasicInfo.hotelMinCharge
      const hotelMinCharge = (basicInfo as unknown as Record<string, unknown>).hotelMinCharge;
      const vacancyPrice = dailyCharge?.rakutenCharge ?? roomBasic?.roomMinCharge;
      const minCharge = typeof hotelMinCharge === 'number' ? hotelMinCharge : 0;

      const price = hasDates ? (vacancyPrice ?? 0) : minCharge;
      const priceType: 'vacancy' | 'minimum' | 'none' = hasDates
        ? vacancyPrice ? 'vacancy' : 'none'
        : minCharge > 0 ? 'minimum' : 'none';

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
        hotelInformationUrl: buildHotelUrl(basicInfo.hotelNo),
        area: prefecture,
        hasPublicBath: false,
        hasSauna: false,
        hasPrivateBath: false,
        googleRating: 0,
        googleReviewCount: 0,
        googlePhotoUrl: '',
        latitude: 0,
        longitude: 0,
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

  // Filter by area if specified
  if (areaCodes.length > 0) {
    const areaCodeSet = new Set(areaCodes);
    hotels = hotels.filter((hotel) => {
      if (!hotel.area) return false;
      const code = PREFECTURE_TO_AREA[hotel.area];
      return code ? areaCodeSet.has(code) : false;
    });
  }

  return hotels;
}
