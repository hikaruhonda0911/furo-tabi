import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RakutenHotelBasicInfo {
  hotelNo: number;
  hotelName: string;
  hotelImageUrl: string;
  reviewAverage: number | null;
}

interface RakutenRoomBasicInfo {
  roomName: string;
  roomMinCharge: number;
}

interface RakutenRoomInfoNode {
  roomBasicInfo?: RakutenRoomBasicInfo;
}

interface RakutenHotelItem {
  hotel: [
    { hotelBasicInfo: RakutenHotelBasicInfo },
    { roomInfo: RakutenRoomInfoNode[] },
  ];
}

interface RakutenApiResponse {
  error?: string;
  error_description?: string;
  hotels?: RakutenHotelItem[];
}

interface DbHotelRow {
  rakuten_hotel_id: number;
  recommended_rank?: number | null;
  favorite_rank?: number | null;
}

type HotelResponse = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  reviewAverage: number | null;
  roomName: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawTags = searchParams.get('tags');
  const tags = rawTags ? rawTags.split(',') : [];
  const rawAreas = searchParams.get('areas');
  const areaCodes = Array.from(
    new Set(
      (rawAreas ?? searchParams.get('area') ?? 'tokyo')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
  const checkinDate = searchParams.get('checkin');
  const checkoutDate = searchParams.get('checkout');
  const guestsParam = searchParams.get('guests');
  const minPriceParam = searchParams.get('min_price');
  const maxPriceParam = searchParams.get('max_price');

  if (!checkinDate || !checkoutDate) {
    return NextResponse.json(
      { error: 'Check-in and Check-out dates are required.' },
      { status: 400 },
    );
  }
  const parsedCheckinDate = new Date(`${checkinDate}T00:00:00`);
  const parsedCheckoutDate = new Date(`${checkoutDate}T00:00:00`);
  if (
    Number.isNaN(parsedCheckinDate.getTime()) ||
    Number.isNaN(parsedCheckoutDate.getTime())
  ) {
    return NextResponse.json(
      { error: '日付の形式が不正です。' },
      { status: 400 },
    );
  }
  if (parsedCheckinDate >= parsedCheckoutDate) {
    return NextResponse.json(
      {
        error:
          'チェックアウト日はチェックイン日より後の日付を指定してください。',
      },
      { status: 400 },
    );
  }

  const guestsValue = Number(guestsParam);
  if (!Number.isInteger(guestsValue) || guestsValue < 1) {
    return NextResponse.json(
      { error: '人数は1以上の整数で指定してください。' },
      { status: 400 },
    );
  }

  const minPriceValue = minPriceParam === null ? null : Number(minPriceParam);
  const maxPriceValue = maxPriceParam === null ? null : Number(maxPriceParam);
  if (
    minPriceValue !== null &&
    (!Number.isFinite(minPriceValue) || minPriceValue < 0)
  ) {
    return NextResponse.json(
      { error: '下限料金は0以上の数値で指定してください。' },
      { status: 400 },
    );
  }
  if (
    maxPriceValue !== null &&
    (!Number.isFinite(maxPriceValue) || maxPriceValue < 0)
  ) {
    return NextResponse.json(
      { error: '上限料金は0以上の数値で指定してください。' },
      { status: 400 },
    );
  }
  if (
    minPriceValue !== null &&
    maxPriceValue !== null &&
    minPriceValue > maxPriceValue
  ) {
    return NextResponse.json(
      { error: '下限料金は上限料金以下で指定してください。' },
      { status: 400 },
    );
  }
  if (areaCodes.length === 0) {
    return NextResponse.json(
      { error: '場所を1つ以上指定してください。' },
      { status: 400 },
    );
  }

  const rakutenAppId = process.env.RAKUTEN_APP_ID;
  if (!rakutenAppId) {
    return NextResponse.json(
      { error: '楽天APIキーが未設定です。' },
      { status: 500 },
    );
  }

  try {
    const { data: dbHotels, error: dbError } = await supabase.rpc(
      'get_hotels_by_tags',
      { tag_slugs: tags },
    );

    if (dbError) throw new Error(`DB Error: ${dbError.message}`);

    const dbHotelRows = (dbHotels as DbHotelRow[] | null) ?? [];
    const validHotelIds = new Set(dbHotelRows.map((h) => h.rakuten_hotel_id));
    const recommendationRankByHotelId = new Map<number, number>();
    dbHotelRows.forEach((h, index) => {
      const rank = h.recommended_rank ?? h.favorite_rank ?? index + 1;
      recommendationRankByHotelId.set(h.rakuten_hotel_id, rank);
    });

    if (validHotelIds.size === 0) {
      return NextResponse.json({ hotels: [] });
    }

    const fetchHotelsByArea = async (areaCode: string) => {
      const rakutenApiUrl = new URL(
        'https://app.rakuten.co.jp/services/api/Travel/VacantHotelSearch/20170426',
      );
      rakutenApiUrl.searchParams.append('applicationId', rakutenAppId);
      rakutenApiUrl.searchParams.append('format', 'json');
      rakutenApiUrl.searchParams.append('largeClassCode', 'japan');
      rakutenApiUrl.searchParams.append('middleClassCode', areaCode);
      rakutenApiUrl.searchParams.append('checkinDate', checkinDate);
      rakutenApiUrl.searchParams.append('checkoutDate', checkoutDate);
      rakutenApiUrl.searchParams.append('adultNum', String(guestsValue));
      if (minPriceValue !== null) {
        rakutenApiUrl.searchParams.append('minCharge', String(minPriceValue));
      }
      if (maxPriceValue !== null) {
        rakutenApiUrl.searchParams.append('maxCharge', String(maxPriceValue));
      }

      const response = await fetch(rakutenApiUrl.toString());
      if (!response.ok) {
        console.error('Rakuten API HTTP Error:', response.status, areaCode);
        return { ok: false as const, hotels: [] as RakutenHotelItem[] };
      }

      const rakutenData = (await response.json()) as RakutenApiResponse;
      if (rakutenData.error || !rakutenData.hotels) {
        return { ok: true as const, hotels: [] as RakutenHotelItem[] };
      }

      return { ok: true as const, hotels: rakutenData.hotels };
    };

    const areaResults = await Promise.all(areaCodes.map(fetchHotelsByArea));
    if (!areaResults.some((result) => result.ok)) {
      return NextResponse.json(
        { error: '楽天APIの取得に失敗しました。' },
        { status: 502 },
      );
    }

    const allRakutenHotels = areaResults.flatMap((result) => result.hotels);
    const resultHotels = allRakutenHotels
      .filter((h) => {
        const hotelInfo = h.hotel[0].hotelBasicInfo;
        return validHotelIds.has(hotelInfo.hotelNo);
      })
      .map((h) => {
        const basicInfo = h.hotel[0].hotelBasicInfo;
        const roomInfoNode = h.hotel[1].roomInfo.find(
          (info) => info.roomBasicInfo,
        );
        const roomInfo = roomInfoNode?.roomBasicInfo;

        return {
          id: basicInfo.hotelNo,
          name: basicInfo.hotelName,
          price: roomInfo?.roomMinCharge || 0,
          imageUrl: basicInfo.hotelImageUrl,
          reviewAverage: basicInfo.reviewAverage,
          roomName: roomInfo?.roomName || '部屋タイプ指定なし',
        };
      })
      .reduce((acc, hotel) => {
        const current = acc.get(hotel.id);
        if (!current || hotel.price < current.price) {
          acc.set(hotel.id, hotel);
        }
        return acc;
      }, new Map<number, HotelResponse>());

    const dedupedHotels = Array.from(resultHotels.values()).sort((a, b) => {
      const rankA =
        recommendationRankByHotelId.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const rankB =
        recommendationRankByHotelId.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });

    return NextResponse.json({ hotels: dedupedHotels });
  } catch (error) {
    console.error(
      'Search API failed:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
