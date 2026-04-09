import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SearchHotelsParams } from '../hotels';

// Mock supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    rpc: vi.fn(),
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

describe('searchHotels', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      RAKUTEN_APP_ID: 'test-app-id',
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

  it('楽天API失敗で全結果が失敗ならエラーをスローする', async () => {
    const dbRows = [
      {
        rakuten_hotel_id: 12345,
        hotel_tag_slugs: ['separate-bath'],
        separate_bath_rooms: ['デラックスツイン'],
        shower_only_rooms: [],
      },
    ];
    const mockRpc = vi.fn().mockResolvedValue({ data: dbRows, error: null });
    vi.doMock('@/lib/supabase/server', () => ({
      createServerClient: () => ({ rpc: mockRpc }),
    }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    const { searchHotels } = await import('../hotels');

    await expect(searchHotels(baseParams)).rejects.toThrow(
      '楽天APIの取得に失敗しました。',
    );
  });

  it('正常なレスポンスでホテルを返す', async () => {
    const dbRows = [
      {
        rakuten_hotel_id: 12345,
        hotel_tag_slugs: ['separate-bath', 'public-bath'],
        separate_bath_rooms: ['デラックスツイン'],
        shower_only_rooms: [],
      },
    ];
    const mockRpc = vi.fn().mockResolvedValue({ data: dbRows, error: null });
    vi.doMock('@/lib/supabase/server', () => ({
      createServerClient: () => ({ rpc: mockRpc }),
    }));

    const rakutenResponse = {
      hotels: [
        {
          hotel: [
            {
              hotelBasicInfo: {
                hotelNo: 12345,
                hotelName: 'テストホテル東京',
                hotelImageUrl: 'https://img.rakuten.co.jp/test.jpg',
                reviewAverage: 4.2,
              },
            },
            {
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
    expect(result[0]).toEqual({
      id: 12345,
      name: 'テストホテル東京',
      price: 15000,
      imageUrl: 'https://img.rakuten.co.jp/test.jpg',
      reviewAverage: 4.2,
      roomName: 'デラックスツイン',
      tags: ['separate-bath', 'public-bath'],
      separateBathRooms: ['デラックスツイン'],
      showerOnlyRooms: [],
      hotelInformationUrl: null,
    });
  });

  it('重複ホテルは最安値を採用する', async () => {
    const dbRows = [
      {
        rakuten_hotel_id: 12345,
        hotel_tag_slugs: ['separate-bath'],
        separate_bath_rooms: ['ツイン'],
        shower_only_rooms: [],
      },
    ];
    const mockRpc = vi.fn().mockResolvedValue({ data: dbRows, error: null });
    vi.doMock('@/lib/supabase/server', () => ({
      createServerClient: () => ({ rpc: mockRpc }),
    }));

    const rakutenResponse = {
      hotels: [
        {
          hotel: [
            {
              hotelBasicInfo: {
                hotelNo: 12345,
                hotelName: 'テストホテル',
                hotelImageUrl: 'https://img.rakuten.co.jp/test.jpg',
                reviewAverage: null,
              },
            },
            {
              roomInfo: [
                {
                  roomBasicInfo: {
                    roomName: 'ツインA',
                    roomMinCharge: 20000,
                  },
                },
              ],
            },
          ],
        },
        {
          hotel: [
            {
              hotelBasicInfo: {
                hotelNo: 12345,
                hotelName: 'テストホテル',
                hotelImageUrl: 'https://img.rakuten.co.jp/test.jpg',
                reviewAverage: null,
              },
            },
            {
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
    const dbRows = [
      {
        rakuten_hotel_id: 11111,
        hotel_tag_slugs: ['separate-bath'],
        separate_bath_rooms: ['ツイン'],
        shower_only_rooms: [],
      },
    ];
    const mockRpc = vi.fn().mockResolvedValue({ data: dbRows, error: null });
    vi.doMock('@/lib/supabase/server', () => ({
      createServerClient: () => ({ rpc: mockRpc }),
    }));

    const rakutenResponse = {
      hotels: [
        {
          hotel: [
            {
              hotelBasicInfo: {
                hotelNo: 99999,
                hotelName: '未登録ホテル',
                hotelImageUrl: 'https://img.rakuten.co.jp/test.jpg',
                reviewAverage: null,
              },
            },
            {
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
    const dbRows = [
      {
        rakuten_hotel_id: 12345,
        hotel_tag_slugs: ['separate-bath'],
        separate_bath_rooms: [],
        shower_only_rooms: [],
      },
    ];
    const mockRpc = vi.fn().mockResolvedValue({ data: dbRows, error: null });
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

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('minCharge=5000');
    expect(calledUrl).toContain('maxCharge=30000');
  });
});
