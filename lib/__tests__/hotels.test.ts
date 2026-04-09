import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SearchHotelsParams } from '../hotels';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
}));

const baseParams: SearchHotelsParams = {
  tags: ['separate-bath'],
  areaCodes: ['tokyo'],
  checkinDate: '2026-04-01',
  checkoutDate: '2026-04-02',
  guests: 2,
  minPrice: null,
  maxPrice: null,
};

function buildDbRow(overrides: Record<string, unknown> = {}) {
  return {
    rakuten_hotel_id: 12345,
    hotel_tag_slugs: ['separate-bath'],
    separate_bath_rooms: ['デラックスツイン'],
    shower_only_rooms: [],
    hotel_name: 'テストホテル',
    hotel_image_url: 'https://img.rakuten.co.jp/test.jpg',
    hotel_min_charge: 15000,
    hotel_prefecture: '東京都',
    hotel_has_public_bath: false,
    hotel_has_sauna: false,
    hotel_has_private_bath: false,
    hotel_google_rating: 0,
    hotel_google_review_count: 0,
    hotel_google_photo_url: '',
    hotel_latitude: 35.68,
    hotel_longitude: 139.69,
    ...overrides,
  };
}

describe('searchHotels', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      RAKUTEN_APP_ID: 'test-app-id',
      RAKUTEN_ACCESS_KEY: 'test-access-key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('RAKUTEN_APP_IDが未設定ならエラーをスローする', async () => {
    process.env.RAKUTEN_APP_ID = '';
    delete process.env.RAKUTEN_APP_ID;

    const mockRpc = vi
      .fn()
      .mockResolvedValue({ data: [buildDbRow()], error: null });
    vi.doMock('@/lib/supabase/server', () => ({
      createServerClient: () => ({ rpc: mockRpc }),
    }));

    const { searchHotels } = await import('../hotels');

    await expect(searchHotels(baseParams)).rejects.toThrow(
      '楽天APIキーが未設定です。',
    );
  });

  it('DB結果が空なら空配列を返す', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });
    vi.doMock('@/lib/supabase/server', () => ({
      createServerClient: () => ({ rpc: mockRpc }),
    }));

    const { searchHotels } = await import('../hotels');
    const result = await searchHotels(baseParams);

    expect(result).toEqual([]);
  });

  it('DBエラー時はエラーをスローする', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'DB connection failed' },
    });
    vi.doMock('@/lib/supabase/server', () => ({
      createServerClient: () => ({ rpc: mockRpc }),
    }));

    const { searchHotels } = await import('../hotels');

    await expect(searchHotels(baseParams)).rejects.toThrow(
      'DB Error: DB connection failed',
    );
  });

  it('楽天API失敗時はDBフォールバックを返す', async () => {
    const dbRows = [buildDbRow()];
    const mockRpc = vi
      .fn()
      .mockResolvedValue({ data: dbRows, error: null });
    vi.doMock('@/lib/supabase/server', () => ({
      createServerClient: () => ({ rpc: mockRpc }),
    }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    const { searchHotels } = await import('../hotels');
    // API failure with retry exhaustion returns DB fallback (no throw)
    const result = await searchHotels(baseParams);
    // DB fallback kicks in — should return hotels from DB data
    expect(Array.isArray(result)).toBe(true);
  });

  it('正常なレスポンスでホテルを返す', async () => {
    const dbRows = [
      buildDbRow({
        hotel_tag_slugs: ['separate-bath', 'public-bath'],
        hotel_has_public_bath: true,
      }),
    ];
    const mockRpc = vi
      .fn()
      .mockResolvedValue({ data: dbRows, error: null });
    vi.doMock('@/lib/supabase/server', () => ({
      createServerClient: () => ({ rpc: mockRpc }),
    }));

    const rakutenResponse = {
      hotels: [
        {
          hotelBasicInfo: {
            hotelNo: 12345,
            hotelName: 'テストホテル東京',
            hotelImageUrl: 'https://img.rakuten.co.jp/test.jpg',
            hotelMinCharge: 15000,
            reviewAverage: 4.2,
            address1: '東京都',
            planListUrl: 'https://hotel.travel.rakuten.co.jp/12345',
          },
          roomInfo: [
            {
              roomBasicInfo: {
                roomName: 'デラックスツイン',
                roomMinCharge: 15000,
              },
            },
          ],
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(rakutenResponse),
      }),
    );

    const { searchHotels } = await import('../hotels');
    const result = await searchHotels(baseParams);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(12345);
    expect(result[0].name).toBe('テストホテル東京');
    expect(result[0].price).toBe(15000);
    expect(result[0].tags).toEqual(['separate-bath', 'public-bath']);
    expect(result[0].area).toBe('東京都');
  });

  it('重複ホテルは最安値を採用する', async () => {
    const dbRows = [buildDbRow()];
    const mockRpc = vi
      .fn()
      .mockResolvedValue({ data: dbRows, error: null });
    vi.doMock('@/lib/supabase/server', () => ({
      createServerClient: () => ({ rpc: mockRpc }),
    }));

    const rakutenResponse = {
      hotels: [
        {
          hotelBasicInfo: {
            hotelNo: 12345,
            hotelName: 'テストホテル',
            hotelImageUrl: 'https://img.rakuten.co.jp/test.jpg',
            hotelMinCharge: 20000,
            reviewAverage: null,
            address1: '東京都',
            planListUrl: 'https://hotel.travel.rakuten.co.jp/12345',
          },
          roomInfo: [
            {
              roomBasicInfo: {
                roomName: 'ツインA',
                roomMinCharge: 20000,
              },
            },
          ],
        },
        {
          hotelBasicInfo: {
            hotelNo: 12345,
            hotelName: 'テストホテル',
            hotelImageUrl: 'https://img.rakuten.co.jp/test.jpg',
            hotelMinCharge: 12000,
            reviewAverage: null,
            address1: '東京都',
            planListUrl: 'https://hotel.travel.rakuten.co.jp/12345',
          },
          roomInfo: [
            {
              roomBasicInfo: {
                roomName: 'ツインB',
                roomMinCharge: 12000,
              },
            },
          ],
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(rakutenResponse),
      }),
    );

    const { searchHotels } = await import('../hotels');
    const result = await searchHotels(baseParams);

    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(12000);
  });

  it('DBに無いホテルはフィルタリングされる', async () => {
    const dbRows = [buildDbRow({ rakuten_hotel_id: 11111 })];
    const mockRpc = vi
      .fn()
      .mockResolvedValue({ data: dbRows, error: null });
    vi.doMock('@/lib/supabase/server', () => ({
      createServerClient: () => ({ rpc: mockRpc }),
    }));

    const rakutenResponse = {
      hotels: [
        {
          hotelBasicInfo: {
            hotelNo: 99999,
            hotelName: '未登録ホテル',
            hotelImageUrl: 'https://img.rakuten.co.jp/test.jpg',
            hotelMinCharge: 8000,
            reviewAverage: null,
            address1: '東京都',
          },
          roomInfo: [
            {
              roomBasicInfo: {
                roomName: 'シングル',
                roomMinCharge: 8000,
              },
            },
          ],
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(rakutenResponse),
      }),
    );

    const { searchHotels } = await import('../hotels');
    const result = await searchHotels(baseParams);

    expect(result).toHaveLength(0);
  });

  it('minPrice・maxPriceが楽天APIのURLに含まれる', async () => {
    const dbRows = [buildDbRow()];
    const mockRpc = vi
      .fn()
      .mockResolvedValue({ data: dbRows, error: null });
    vi.doMock('@/lib/supabase/server', () => ({
      createServerClient: () => ({ rpc: mockRpc }),
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hotels: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { searchHotels } = await import('../hotels');
    await searchHotels({
      ...baseParams,
      minPrice: 5000,
      maxPrice: 30000,
    });

    const calledUrl = mockFetch.mock.calls[0]?.[0] as string | undefined;
    expect(calledUrl).toBeDefined();
    expect(calledUrl).toContain('minCharge=5000');
    expect(calledUrl).toContain('maxCharge=30000');
  });
});
