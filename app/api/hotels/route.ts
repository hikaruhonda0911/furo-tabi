import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
interface RakutenHotelBasicInfo {
  hotelNo: number;
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawTags = searchParams.get("tags");
  const tags = rawTags ? rawTags.split(",") : [];
  const areaCode = searchParams.get("area") || "tokyo";
  const checkinDate = searchParams.get("checkin");
  const checkoutDate = searchParams.get("checkout");
  const maxPrice = searchParams.get("max_price");

  try {
    const { data: dbHotels, error: dbError } = await supabase.rpc(
      "get_hotels_by_tags",
      { tag_slugs: tags },
    );

    if (dbError) throw new Error(`DB Error: ${dbError.message}`);

    const validHotelIds = new Set(
      (dbHotels as { rakuten_hotel_id: number }[] | null)?.map(
        (h) => h.rakuten_hotel_id,
      ) || [],
    );

    if (validHotelIds.size === 0) {
      return NextResponse.json({ hotels: [] });
    }

    if (!checkinDate || !checkoutDate) {
      return NextResponse.json(
        { error: "Check-in and Check-out dates are required." },
        { status: 400 },
      );
    }

    const rakutenApiUrl = new URL(
      "https://app.rakuten.co.jp/services/api/Travel/VacantHotelSearch/20170426",
    );
    rakutenApiUrl.searchParams.append(
      "applicationId",
      process.env.RAKUTEN_APP_ID!,
    );
    rakutenApiUrl.searchParams.append("format", "json");
    rakutenApiUrl.searchParams.append("largeClassCode", "japan");
    rakutenApiUrl.searchParams.append("middleClassCode", areaCode);
    rakutenApiUrl.searchParams.append("checkinDate", checkinDate);
    rakutenApiUrl.searchParams.append("checkoutDate", checkoutDate);
    if (maxPrice) rakutenApiUrl.searchParams.append("maxCharge", maxPrice);

    const response = await fetch(rakutenApiUrl.toString());
    const rakutenData = (await response.json()) as RakutenApiResponse;

    if (rakutenData.error || !rakutenData.hotels) {
      return NextResponse.json({ hotels: [] });
    }

    const resultHotels = rakutenData.hotels
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
          price: roomInfo?.roomMinCharge || 0,
          imageUrl: basicInfo.hotelImageUrl,
          reviewAverage: basicInfo.reviewAverage,
          roomName: roomInfo?.roomName || "部屋タイプ指定なし",
        };
      });

    return NextResponse.json({ hotels: resultHotels });
  } catch (error) {
    console.error(
      "Search API failed:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
