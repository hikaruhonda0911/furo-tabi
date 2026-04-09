import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Supabase before importing route
const mockRpc = vi.fn().mockResolvedValue({
  data: [
    {
      rakuten_hotel_id: 12345,
      hotel_tag_slugs: ['separate-bath'],
    },
    {
      rakuten_hotel_id: 67890,
      hotel_tag_slugs: ['shower-only', 'sauna'],
    },
  ],
  error: null,
});

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({ rpc: mockRpc }),
}));

import { GET } from '../route';

const baseParams = {
  areas: 'tokyo',
  checkin: '2026-04-01',
  checkout: '2026-04-02',
  guests: '2',
};

function buildRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/hotels');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url);
}

describe('GET /api/hotels', () => {
  beforeEach(() => {
    vi.stubEnv('RAKUTEN_APP_ID', 'test-app-id');
  });

  // --------------------------------------------------
  // Validation: dates
  // --------------------------------------------------
  it('returns 400 when checkin is missing', async () => {
    const res = await GET(
      buildRequest({ checkout: '2026-04-02', guests: '2', areas: 'tokyo' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when checkout is missing', async () => {
    const res = await GET(
      buildRequest({ checkin: '2026-04-01', guests: '2', areas: 'tokyo' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid date format', async () => {
    const res = await GET(
      buildRequest({ ...baseParams, checkin: 'not-a-date' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when checkout is before checkin', async () => {
    const res = await GET(
      buildRequest({
        ...baseParams,
        checkin: '2026-04-02',
        checkout: '2026-04-01',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when checkin equals checkout', async () => {
    const res = await GET(
      buildRequest({
        ...baseParams,
        checkin: '2026-04-01',
        checkout: '2026-04-01',
      }),
    );
    expect(res.status).toBe(400);
  });

  // --------------------------------------------------
  // Validation: guests
  // --------------------------------------------------
  it('returns 400 when guests is 0', async () => {
    const res = await GET(buildRequest({ ...baseParams, guests: '0' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when guests is negative', async () => {
    const res = await GET(buildRequest({ ...baseParams, guests: '-1' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when guests is not an integer', async () => {
    const res = await GET(buildRequest({ ...baseParams, guests: '1.5' }));
    expect(res.status).toBe(400);
  });

  // --------------------------------------------------
  // Validation: prices
  // --------------------------------------------------
  it('returns 400 when min_price is negative', async () => {
    const res = await GET(buildRequest({ ...baseParams, min_price: '-100' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when max_price is negative', async () => {
    const res = await GET(buildRequest({ ...baseParams, max_price: '-100' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when min_price > max_price', async () => {
    const res = await GET(
      buildRequest({ ...baseParams, min_price: '20000', max_price: '10000' }),
    );
    expect(res.status).toBe(400);
  });

  it('accepts valid min/max price range', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ hotels: [] }), { status: 200 }),
      );

    const res = await GET(
      buildRequest({ ...baseParams, min_price: '5000', max_price: '20000' }),
    );
    // Should not be a 400 (validation passes)
    expect(res.status).not.toBe(400);
    fetchSpy.mockRestore();
  });

  // --------------------------------------------------
  // Areas: empty is allowed (searches all registered areas)
  // --------------------------------------------------
  it('accepts empty areas and returns 200', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ hotels: [] }), { status: 200 }),
      );

    const res = await GET(buildRequest({ ...baseParams, areas: '' }));
    expect(res.status).not.toBe(400);
    fetchSpy.mockRestore();
  });

  // --------------------------------------------------
  // Environment
  // --------------------------------------------------
  it('returns 500 when RAKUTEN_APP_ID is missing', async () => {
    vi.stubEnv('RAKUTEN_APP_ID', '');
    const res = await GET(buildRequest(baseParams));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('楽天APIキー');
  });

  // --------------------------------------------------
  // Successful flow (mocked external APIs)
  // --------------------------------------------------
  it('returns hotels when Rakuten API returns matching results', async () => {
    const rakutenResponse = {
      hotels: [
        {
          hotel: [
            {
              hotelBasicInfo: {
                hotelNo: 12345,
                hotelName: 'テストホテル',
                hotelImageUrl: 'https://example.com/img.jpg',
                reviewAverage: 4.5,
              },
            },
            {
              roomInfo: [
                {
                  roomBasicInfo: {
                    roomName: 'デラックスルーム',
                    roomMinCharge: 15000,
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
                hotelNo: 99999, // not in DB
                hotelName: '未登録ホテル',
                hotelImageUrl: 'https://example.com/img2.jpg',
                reviewAverage: 3.0,
              },
            },
            {
              roomInfo: [
                {
                  roomBasicInfo: {
                    roomName: 'スタンダード',
                    roomMinCharge: 8000,
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(rakutenResponse), { status: 200 }),
      );

    const res = await GET(buildRequest(baseParams));
    expect(res.status).toBe(200);

    const body = await res.json();
    // Only hotel 12345 should be returned (67890 not in Rakuten response, 99999 not in DB)
    expect(body.hotels).toHaveLength(1);
    expect(body.hotels[0].id).toBe(12345);
    expect(body.hotels[0].name).toBe('テストホテル');
    expect(body.hotels[0].tags).toEqual(['separate-bath']);

    fetchSpy.mockRestore();
  });

  it('returns empty hotels when DB has no matching hotels', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    const res = await GET(buildRequest(baseParams));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hotels).toEqual([]);
  });
});
