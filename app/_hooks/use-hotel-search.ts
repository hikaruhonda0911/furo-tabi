'use client';

import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  areaRegionById,
  fallbackAreaOptions,
  regionConfigs,
} from '@/constants/areas';
import { trackFilterUsed, trackSearchExecuted } from '@/lib/analytics';
import { searchDefaults } from '@/lib/defaults';
import { validateSearchParams } from '@/lib/validation';
import type { AreaOption, Hotel } from '@/types/hotel';

const ITEMS_PER_PAGE = 24;

export function useHotelSearch(options?: { initialHotels?: Hotel[] }) {
  const [query, setQuery] = useQueryStates({
    areas: parseAsString.withDefault(searchDefaults.areas),
    bathroomType: parseAsString.withDefault(searchDefaults.bathroomType),
    guests: parseAsString.withDefault(searchDefaults.guests),
    checkin: parseAsString.withDefault(''),
    checkout: parseAsString.withDefault(''),
    min_price: parseAsString.withDefault(searchDefaults.min_price),
    max_price: parseAsString.withDefault(searchDefaults.max_price),
    has_large_bath: parseAsBoolean.withDefault(searchDefaults.has_large_bath),
    has_sauna: parseAsBoolean.withDefault(searchDefaults.has_sauna),
    has_private_bath: parseAsBoolean.withDefault(false),
    sort: parseAsString.withDefault(searchDefaults.sort),
    page: parseAsInteger.withDefault(searchDefaults.page),
  });

  const {
    areas,
    bathroomType,
    guests,
    checkin,
    checkout,
    min_price: minPrice,
    max_price: maxPrice,
    has_large_bath: hasLargeBath,
    has_sauna: hasSauna,
    has_private_bath: hasPrivateBath,
    sort: sortBy,
    page: currentPage,
  } = query;

  const [showMore, setShowMore] = useState(false);
  const [showAreaDialog, setShowAreaDialog] = useState(false);
  const [areaOptions, setAreaOptions] =
    useState<AreaOption[]>(fallbackAreaOptions);
  const [hotels, setHotels] = useState<Hotel[]>(options?.initialHotels ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(
    () => options?.initialHotels !== undefined || areas !== '',
  );

  // リアルタイムバリデーションエラー
  const validationErrors = (() => {
    const errors: { checkin?: string; checkout?: string; guests?: string } = {};

    if (checkin && checkout) {
      const checkinDate = new Date(`${checkin}T00:00:00`);
      const checkoutDate = new Date(`${checkout}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!Number.isNaN(checkinDate.getTime()) && checkinDate < today) {
        errors.checkin = 'チェックイン日は今日以降の日付を指定してください。';
      }
      if (
        !Number.isNaN(checkinDate.getTime()) &&
        !Number.isNaN(checkoutDate.getTime()) &&
        checkinDate >= checkoutDate
      ) {
        errors.checkout =
          'チェックアウト日はチェックイン日より後の日付を指定してください。';
      }
    }

    if (guests === '' || guests === '0') {
      errors.guests = '人数を選択してください。';
    }

    return errors;
  })();

  const hasValidationError = Object.keys(validationErrors).length > 0;

  const selectedAreas = Array.from(
    new Set(
      areas
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

  const selectedAreaLabel = (() => {
    if (selectedAreas.length === 0) return '';
    const labelMap = new Map(areaOptions.map((o) => [o.id, o.label]));
    return selectedAreas.map((id) => labelMap.get(id) ?? id).join('、');
  })();

  const areasByRegion = (() => {
    const regionOrder = regionConfigs.map((region) => region.name);
    const grouped = new Map<string, AreaOption[]>(
      regionOrder.map((name) => [name, []]),
    );

    for (const option of areaOptions) {
      const region = areaRegionById[option.id];
      if (!region) continue;
      const list = grouped.get(region);
      if (list) list.push(option);
    }

    return regionOrder
      .map((region) => ({
        region,
        areas: grouped.get(region) ?? [],
      }))
      .filter((entry) => entry.areas.length > 0);
  })();

  const selectedTags = useMemo(() => {
    const tags: string[] = [];
    if (bathroomType === 'separate') tags.push('separate-bath');
    if (bathroomType === 'shower-only') tags.push('shower-only');
    if (hasLargeBath) tags.push('public-bath');
    if (hasSauna) tags.push('sauna');
    return tags;
  }, [bathroomType, hasLargeBath, hasSauna]);

  const handleSearch = useCallback(
    async (resetPage = true) => {
      setError('');
      // 日付が入っている場合のみバリデーション
      if (checkin && checkout) {
        const validationError = validateSearchParams({
          checkin,
          checkout,
          guests: guests || searchDefaults.guests,
          minPrice,
          maxPrice,
        });
        if (validationError) {
          setError(validationError);
          return;
        }
      }
      setLoading(true);

      try {
        const params = new URLSearchParams({
          tags: selectedTags.join(','),
        });
        if (checkin) params.set('checkin', checkin);
        if (checkout) params.set('checkout', checkout);
        if (guests) params.set('guests', guests);
        params.set('areas', selectedAreas.join(','));
        if (minPrice) params.set('min_price', minPrice);
        if (maxPrice) params.set('max_price', maxPrice);
        if (hasPrivateBath) params.set('has_private_bath', 'true');

        const response = await fetch(`/api/hotels?${params.toString()}`);
        const data = (await response.json()) as {
          hotels?: Hotel[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? '検索に失敗しました。');
        }

        const fetchedHotels = data.hotels ?? [];
        setHotels(fetchedHotels);
        setHasSearched(true);

        // search_executed イベント送信
        trackSearchExecuted({
          area: selectedAreaLabel,
          filter_bath_separate: bathroomType === 'separate',
          results_count: fetchedHotels.length,
        });

        if (resetPage) {
          await setQuery({ page: 1 });
        }
      } catch (err) {
        setHotels([]);
        setHasSearched(true);
        setError(
          err instanceof Error
            ? err.message
            : '予期しないエラーが発生しました。',
        );
      } finally {
        setLoading(false);
      }
    },
    [
      bathroomType,
      checkin,
      checkout,
      guests,
      hasPrivateBath,
      maxPrice,
      minPrice,
      selectedAreaLabel,
      selectedAreas,
      selectedTags,
      setQuery,
    ],
  );

  const sortedHotels = (() => {
    const copied = [...hotels];
    if (sortBy === 'recommended') return copied;
    if (sortBy === 'price-low') {
      copied.sort((a, b) => {
        const left =
          a.priceType === 'none' ? Number.POSITIVE_INFINITY : a.price;
        const right =
          b.priceType === 'none' ? Number.POSITIVE_INFINITY : b.price;
        return left - right;
      });
    }
    if (sortBy === 'price-high') {
      copied.sort((a, b) => {
        const left =
          a.priceType === 'none' ? Number.NEGATIVE_INFINITY : a.price;
        const right =
          b.priceType === 'none' ? Number.NEGATIVE_INFINITY : b.price;
        return right - left;
      });
    }
    return copied;
  })();

  const totalPages = Math.ceil(sortedHotels.length / ITEMS_PER_PAGE);
  const paginatedHotels = sortedHotels.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const hasAutoSearched = useRef(options?.initialHotels !== undefined);
  useEffect(() => {
    if (hasAutoSearched.current) return;
    hasAutoSearched.current = true;
    void handleSearch(false);
  }, [handleSearch]);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await fetch('/api/areas');
        const data = (await response.json()) as {
          areas?: AreaOption[];
          error?: string;
        };
        if (!response.ok || !data.areas || data.areas.length === 0) return;
        setAreaOptions(data.areas);
      } catch {
        // Fallback to built-in options when areas API is unavailable.
      }
    };

    void fetchAreas();
  }, []);

  return {
    query,
    setQuery,
    selectedAreas,
    selectedAreaLabel,
    areasByRegion,
    showMore,
    setShowMore,
    showAreaDialog,
    setShowAreaDialog,
    paginatedHotels,
    allHotels: sortedHotels,
    totalCount: sortedHotels.length,
    loading,
    error,
    hasSearched,
    currentPage,
    totalPages,
    handleSearch,
    validationErrors,
    hasValidationError,
    trackFilterUsed,
  };
}
