import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';

function buildRequest() {
  return new Request('http://localhost:3000/api/areas');
}

describe('GET /api/areas', () => {
  beforeEach(() => {
    vi.stubEnv('RAKUTEN_APP_ID', 'test-app-id');
    vi.stubEnv('RAKUTEN_ACCESS_KEY', 'test-access-key');
  });

  it('returns 500 when RAKUTEN_APP_ID is missing', async () => {
    vi.stubEnv('RAKUTEN_APP_ID', '');
    const res = await GET(buildRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('楽天APIキー');
  });

  it('returns 502 when Rakuten API returns non-ok status', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('Server Error', { status: 500 }));

    const res = await GET(buildRequest());
    expect(res.status).toBe(502);

    fetchSpy.mockRestore();
  });

  it('returns areas extracted from Rakuten API response', async () => {
    const rakutenPayload = {
      areaClasses: {
        largeClasses: [
          {
            largeClass: [
              { largeClassCode: 'japan' },
              {
                middleClasses: [
                  {
                    middleClass: [
                      { middleClassCode: 'tokyo', middleClassName: '東京' },
                    ],
                  },
                  {
                    middleClass: [
                      { middleClassCode: 'osaka', middleClassName: '大阪' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(rakutenPayload), { status: 200 }),
      );

    const res = await GET(buildRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.areas).toEqual(
      expect.arrayContaining([
        { id: 'tokyo', label: '東京' },
        { id: 'osaka', label: '大阪' },
      ]),
    );
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=86400, stale-while-revalidate=86400',
    );

    fetchSpy.mockRestore();
  });

  it('deduplicates areas with same id', async () => {
    const payload = {
      areaClasses: {
        largeClasses: [
          {
            largeClass: [
              { largeClassCode: 'japan' },
              {
                middleClasses: [
                  {
                    middleClass: [
                      { middleClassCode: 'tokyo', middleClassName: '東京' },
                    ],
                  },
                  {
                    middleClass: [
                      { middleClassCode: 'tokyo', middleClassName: '東京' },
                    ],
                  },
                  {
                    middleClass: [
                      { middleClassCode: 'osaka', middleClassName: '大阪' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(payload), { status: 200 }),
      );

    const res = await GET(buildRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    const tokyoEntries = body.areas.filter(
      (a: { id: string }) => a.id === 'tokyo',
    );
    expect(tokyoEntries).toHaveLength(1);

    fetchSpy.mockRestore();
  });
});
