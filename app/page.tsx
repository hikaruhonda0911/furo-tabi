import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';

import { fallbackAreaOptions } from '@/constants/areas';
import {
  getDefaultCheckin,
  getDefaultCheckout,
  searchDefaults,
} from '@/lib/defaults';
import { type SearchHotelsParams, searchHotels } from '@/lib/hotels';
import type { Hotel } from '@/types/hotel';

import { SearchPage } from './_components/search-page';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getString(
  value: string | string[] | undefined,
  defaultValue: string,
): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? defaultValue;
  return defaultValue;
}

const getCachedInitialHotels = unstable_cache(
  async (searchParams: SearchHotelsParams, hasPrivateBath: boolean) => {
    const hotels = await searchHotels(searchParams);
    return hasPrivateBath
      ? hotels.filter((hotel) => hotel.hasPrivateBath)
      : hotels;
  },
  ['home-search-results'],
  { revalidate: 1800 },
);

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;

  const areasStr = getString(params.areas, searchDefaults.areas);
  const areaCodes = areasStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const bathroomType = getString(
    params.bathroomType,
    searchDefaults.bathroomType,
  );

  const areaLabelMap = new Map(fallbackAreaOptions.map((a) => [a.id, a.label]));
  const areaLabels = areaCodes.map((code) => areaLabelMap.get(code) ?? code);
  const areaText = areaLabels.length > 0 ? areaLabels.join('・') : '全国';

  const bathroomLabel =
    bathroomType === 'shower-only' ? 'シャワーブース' : 'バストイレ別';

  const title = `${areaText}の${bathroomLabel}ホテル | 風呂旅`;
  const description = `${areaText}エリアの${bathroomLabel}ホテルを検索。シャワーブース、バストイレ別のモダンホテルだけを厳選。`;

  const excludeKeys = new Set(['page', 'sort']);
  const canonicalEntries: [string, string][] = [];
  for (const [key, val] of Object.entries(params)) {
    if (excludeKeys.has(key) || val === undefined) continue;
    canonicalEntries.push([key, Array.isArray(val) ? (val[0] ?? '') : val]);
  }
  canonicalEntries.sort(([a], [b]) => a.localeCompare(b));
  const canonicalSearch = new URLSearchParams(canonicalEntries).toString();
  const canonical = canonicalSearch ? `/?${canonicalSearch}` : '/';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    alternates: {
      canonical,
    },
  };
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;

  const areasStr = getString(params.areas, searchDefaults.areas);
  const areaCodes = [
    ...new Set(
      areasStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  const bathroomType = getString(
    params.bathroomType,
    searchDefaults.bathroomType,
  );
  const guests =
    Number(getString(params.guests, searchDefaults.guests)) ||
    Number(searchDefaults.guests);
  const checkinRaw = getString(params.checkin, '');
  const checkoutRaw = getString(params.checkout, '');
  const checkin = checkinRaw || null;
  const checkout = checkoutRaw || null;
  const minPriceStr = getString(params.min_price, searchDefaults.min_price);
  const maxPriceStr = getString(params.max_price, searchDefaults.max_price);
  const hasLargeBath =
    getString(params.has_large_bath, String(searchDefaults.has_large_bath)) ===
    'true';
  const hasSauna =
    getString(params.has_sauna, String(searchDefaults.has_sauna)) === 'true';
  const hasPrivateBath = getString(params.has_private_bath, 'false') === 'true';

  const tags: string[] = [];
  if (bathroomType === 'separate') tags.push('separate-bath');
  if (bathroomType === 'shower-only') tags.push('shower-only');
  if (hasLargeBath) tags.push('public-bath');
  if (hasSauna) tags.push('sauna');

  const minPrice = minPriceStr ? Number(minPriceStr) : null;
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : null;

  let initialHotels: Hotel[] = [];
  try {
    initialHotels = await getCachedInitialHotels(
      {
        tags,
        areaCodes,
        checkinDate: checkin,
        checkoutDate: checkout,
        guests,
        minPrice:
          minPrice !== null && Number.isFinite(minPrice) && minPrice >= 0
            ? minPrice
            : null,
        maxPrice:
          maxPrice !== null && Number.isFinite(maxPrice) && maxPrice >= 0
            ? maxPrice
            : null,
      },
      hasPrivateBath,
    );
  } catch (error) {
    console.error(
      'SSR search failed:',
      error instanceof Error ? error.message : error,
    );
  }

  return <SearchPage initialHotels={initialHotels} />;
}
