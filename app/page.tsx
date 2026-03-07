'use client';

import { Dialog } from 'baseui/dialog';
import { Select } from 'baseui/select';
import { addDays, format } from 'date-fns';
import Image from 'next/image';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Hotel = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  reviewAverage: number | null;
  roomName: string;
};

type AreaOption = {
  id: string;
  label: string;
};

type RegionConfig = {
  name: string;
  ids: string[];
};

const colors = {
  background: '#FBFDFE',
  foreground: '#020617',
  muted: '#64748B',
  accent: '#7DD3FC',
  border: '#E2E8F0',
  hoverAccent: '#0EA5E9',
};

const fallbackAreaOptions: AreaOption[] = [
  { id: 'hokkaido', label: '北海道' },
  { id: 'aomori', label: '青森' },
  { id: 'iwate', label: '岩手' },
  { id: 'miyagi', label: '宮城' },
  { id: 'akita', label: '秋田' },
  { id: 'yamagata', label: '山形' },
  { id: 'fukushima', label: '福島' },
  { id: 'ibaraki', label: '茨城' },
  { id: 'tochigi', label: '栃木' },
  { id: 'gunma', label: '群馬' },
  { id: 'saitama', label: '埼玉' },
  { id: 'chiba', label: '千葉' },
  { id: 'tokyo', label: '東京' },
  { id: 'kanagawa', label: '神奈川' },
  { id: 'niigata', label: '新潟' },
  { id: 'toyama', label: '富山' },
  { id: 'ishikawa', label: '石川' },
  { id: 'fukui', label: '福井' },
  { id: 'yamanashi', label: '山梨' },
  { id: 'nagano', label: '長野' },
  { id: 'gifu', label: '岐阜' },
  { id: 'shizuoka', label: '静岡' },
  { id: 'aichi', label: '愛知' },
  { id: 'mie', label: '三重' },
  { id: 'shiga', label: '滋賀' },
  { id: 'kyoto', label: '京都' },
  { id: 'osaka', label: '大阪' },
  { id: 'hyogo', label: '兵庫' },
  { id: 'nara', label: '奈良' },
  { id: 'wakayama', label: '和歌山' },
  { id: 'tottori', label: '鳥取' },
  { id: 'shimane', label: '島根' },
  { id: 'okayama', label: '岡山' },
  { id: 'hiroshima', label: '広島' },
  { id: 'yamaguchi', label: '山口' },
  { id: 'tokushima', label: '徳島' },
  { id: 'kagawa', label: '香川' },
  { id: 'ehime', label: '愛媛' },
  { id: 'kochi', label: '高知' },
  { id: 'fukuoka', label: '福岡' },
  { id: 'saga', label: '佐賀' },
  { id: 'nagasaki', label: '長崎' },
  { id: 'kumamoto', label: '熊本' },
  { id: 'oita', label: '大分' },
  { id: 'miyazaki', label: '宮崎' },
  { id: 'kagoshima', label: '鹿児島' },
  { id: 'okinawa', label: '沖縄' },
];

const regionConfigs: RegionConfig[] = [
  { name: '北海道', ids: ['hokkaido'] },
  {
    name: '東北',
    ids: ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'],
  },
  {
    name: '関東',
    ids: [
      'ibaraki',
      'tochigi',
      'gunma',
      'saitama',
      'chiba',
      'tokyo',
      'kanagawa',
    ],
  },
  {
    name: '中部',
    ids: [
      'niigata',
      'toyama',
      'ishikawa',
      'fukui',
      'yamanashi',
      'nagano',
      'gifu',
      'shizuoka',
      'aichi',
    ],
  },
  {
    name: '近畿',
    ids: ['mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama'],
  },
  {
    name: '中国',
    ids: ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi'],
  },
  { name: '四国', ids: ['tokushima', 'kagawa', 'ehime', 'kochi'] },
  {
    name: '九州・沖縄',
    ids: [
      'fukuoka',
      'saga',
      'nagasaki',
      'kumamoto',
      'oita',
      'miyazaki',
      'kagoshima',
      'okinawa',
    ],
  },
];

const areaRegionById = Object.fromEntries(
  regionConfigs.flatMap((region) => region.ids.map((id) => [id, region.name])),
) as Record<string, string>;

const sortOptions = [
  { id: 'recommended', label: 'おすすめ順' },
  { id: 'price-low', label: '料金が安い順' },
  { id: 'price-high', label: '料金が高い順' },
];

const bathroomTypeOptions = [
  { id: 'separate', label: 'バストイレ別' },
  { id: 'shower-only', label: 'シャワーブースオンリー' },
];

export default function Home() {
  const defaultCheckin = format(addDays(new Date(), 14), 'yyyy-MM-dd');
  const defaultCheckout = format(addDays(new Date(), 15), 'yyyy-MM-dd');
  const [query, setQuery] = useQueryStates({
    areas: parseAsString.withDefault('tokyo'),
    bathroomType: parseAsString.withDefault('separate'),
    guests: parseAsString.withDefault('2'),
    checkin: parseAsString.withDefault(defaultCheckin),
    checkout: parseAsString.withDefault(defaultCheckout),
    min_price: parseAsString.withDefault(''),
    max_price: parseAsString.withDefault('30000'),
    has_large_bath: parseAsBoolean.withDefault(true),
    has_sauna: parseAsBoolean.withDefault(false),
    sort: parseAsString.withDefault('recommended'),
    page: parseAsInteger.withDefault(1),
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
    sort: sortBy,
    page: currentPage,
  } = query;
  const [showMore, setShowMore] = useState(false);
  const [showAreaDialog, setShowAreaDialog] = useState(false);
  const [areaOptions, setAreaOptions] =
    useState<AreaOption[]>(fallbackAreaOptions);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedAreas = useMemo(() => {
    return Array.from(
      new Set(
        areas
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    );
  }, [areas]);

  const selectedAreaLabel = useMemo(() => {
    if (selectedAreas.length === 0) return '未選択';
    const areaLabelById = new Map(
      areaOptions.map((option) => [option.id, option.label]),
    );
    const firstLabel = areaLabelById.get(selectedAreas[0]) ?? selectedAreas[0];
    if (selectedAreas.length === 1) return firstLabel;
    return `${firstLabel} ほか${selectedAreas.length - 1}件`;
  }, [areaOptions, selectedAreas]);

  const areasByRegion = useMemo(() => {
    const regionOrder = [
      ...regionConfigs.map((region) => region.name),
      'その他',
    ];
    const grouped = new Map<string, AreaOption[]>(
      regionOrder.map((name) => [name, []]),
    );

    areaOptions.forEach((option) => {
      const region = areaRegionById[option.id] ?? 'その他';
      const list = grouped.get(region);
      if (list) list.push(option);
    });

    return regionOrder
      .map((region) => ({
        region,
        areas: grouped.get(region) ?? [],
      }))
      .filter((entry) => entry.areas.length > 0);
  }, [areaOptions]);

  const selectedTags = useMemo(() => {
    const tags: string[] = [];
    if (hasLargeBath) tags.push('露天風呂付き客室');
    if (hasSauna) tags.push('サウナ');
    if (bathroomType === 'separate') tags.push('貸切風呂');
    return tags;
  }, [bathroomType, hasLargeBath, hasSauna]);

  const bathroomTypeValue = useMemo(
    () => bathroomTypeOptions.filter((option) => option.id === bathroomType),
    [bathroomType],
  );
  const sortValue = useMemo(
    () => sortOptions.filter((option) => option.id === sortBy),
    [sortBy],
  );

  const validateSearchInput = useCallback(() => {
    if (selectedAreas.length === 0) {
      return '場所を1つ以上選択してください。';
    }

    const checkinDate = new Date(`${checkin}T00:00:00`);
    const checkoutDate = new Date(`${checkout}T00:00:00`);
    if (
      Number.isNaN(checkinDate.getTime()) ||
      Number.isNaN(checkoutDate.getTime())
    ) {
      return '日付の形式が不正です。';
    }
    if (checkinDate >= checkoutDate) {
      return 'チェックアウト日はチェックイン日より後の日付を指定してください。';
    }

    const guestsValue = Number(guests);
    if (!Number.isInteger(guestsValue) || guestsValue < 1) {
      return '人数は1以上の整数で指定してください。';
    }

    const minPriceValue = minPrice === '' ? null : Number(minPrice);
    const maxPriceValue = maxPrice === '' ? null : Number(maxPrice);
    if (
      minPriceValue !== null &&
      (!Number.isFinite(minPriceValue) || minPriceValue < 0)
    ) {
      return '下限料金は0以上の数値で指定してください。';
    }
    if (
      maxPriceValue !== null &&
      (!Number.isFinite(maxPriceValue) || maxPriceValue < 0)
    ) {
      return '上限料金は0以上の数値で指定してください。';
    }
    if (
      minPriceValue !== null &&
      maxPriceValue !== null &&
      minPriceValue > maxPriceValue
    ) {
      return '下限料金は上限料金以下で指定してください。';
    }

    return null;
  }, [checkin, checkout, guests, maxPrice, minPrice, selectedAreas]);

  const handleSearch = useCallback(
    async (resetPage = true) => {
      setError('');
      const validationError = validateSearchInput();
      if (validationError) {
        setError(validationError);
        return;
      }
      setLoading(true);

      try {
        const params = new URLSearchParams({
          checkin,
          checkout,
          guests,
          tags: selectedTags.join(','),
        });
        params.set('areas', selectedAreas.join(','));
        if (minPrice) params.set('min_price', minPrice);
        if (maxPrice) params.set('max_price', maxPrice);

        const response = await fetch(`/api/hotels?${params.toString()}`);
        const data = (await response.json()) as {
          hotels?: Hotel[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? '検索に失敗しました。');
        }

        setHotels(data.hotels ?? []);
        if (resetPage) {
          await setQuery({ page: 1 });
        }
      } catch (err) {
        setHotels([]);
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
      checkin,
      checkout,
      guests,
      maxPrice,
      minPrice,
      selectedAreas,
      selectedTags,
      setQuery,
      validateSearchInput,
    ],
  );

  const sortedHotels = useMemo(() => {
    const copied = [...hotels];
    if (sortBy === 'recommended') return copied;
    if (sortBy === 'price-low') copied.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') copied.sort((a, b) => b.price - a.price);
    return copied;
  }, [hotels, sortBy]);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(sortedHotels.length / itemsPerPage);
  const paginatedHotels = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedHotels.slice(start, start + itemsPerPage);
  }, [currentPage, sortedHotels]);

  const hasAutoSearched = useRef(false);
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

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background, color: colors.foreground }}
    >
      <header
        className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur"
        style={{ borderColor: colors.border }}
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <h1
            className="tracking-[0.2em] text-xl font-light"
            style={{
              fontFamily: '"Cormorant Garamond", "Times New Roman", serif',
            }}
          >
            風呂旅
          </h1>
          <p
            className="mt-1 text-[10px] tracking-wide"
            style={{ color: colors.muted }}
          >
            シャワーブースのみ、バストイレ別のモダンホテル
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-10 pt-8">
        <section
          className="mx-auto w-full max-w-5xl rounded-sm border bg-white p-6"
          style={{ borderColor: colors.border }}
        >
          <div className="mb-4">
            <label
              className="text-xs uppercase tracking-wider"
              style={{ color: colors.muted }}
              htmlFor="bathroom-type"
            >
              浴室タイプ
            </label>
            <Select
              id="bathroom-type"
              value={bathroomTypeValue}
              options={bathroomTypeOptions}
              searchable={false}
              clearable={false}
              onChange={(params) => {
                const nextValue = params.value[0]?.id;
                if (typeof nextValue === 'string') {
                  void setQuery({ bathroomType: nextValue });
                }
              }}
              overrides={{
                ControlContainer: {
                  style: {
                    marginTop: '6px',
                    minHeight: '36px',
                    borderTopWidth: 0,
                    borderLeftWidth: 0,
                    borderRightWidth: 0,
                    borderBottomColor: colors.border,
                    borderRadius: 0,
                  },
                },
              }}
            />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: colors.muted }}
              >
                場所
              </p>
              <button
                type="button"
                onClick={() => setShowAreaDialog(true)}
                className="flex h-9 w-full items-center justify-between border-0 border-b bg-transparent px-0 text-left outline-none"
                style={{
                  borderBottomColor: colors.border,
                  color: colors.foreground,
                }}
              >
                <span>{selectedAreaLabel}</span>
                <span style={{ color: colors.muted }}>選択</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs uppercase tracking-wider"
                style={{ color: colors.muted }}
                htmlFor="checkin"
              >
                日程
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="checkin"
                  type="date"
                  value={checkin}
                  onChange={(e) =>
                    void setQuery({ checkin: e.currentTarget.value })
                  }
                  className="h-9 min-w-0 flex-1 border-0 border-b bg-transparent px-0 text-sm outline-none"
                  style={{ borderBottomColor: colors.border }}
                />
                <span className="text-sm" style={{ color: colors.muted }}>
                  〜
                </span>
                <input
                  type="date"
                  value={checkout}
                  onChange={(e) =>
                    void setQuery({ checkout: e.currentTarget.value })
                  }
                  className="h-9 min-w-0 flex-1 border-0 border-b bg-transparent px-0 text-sm outline-none"
                  style={{ borderBottomColor: colors.border }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs uppercase tracking-wider"
                style={{ color: colors.muted }}
                htmlFor="guests"
              >
                人数
              </label>
              <input
                id="guests"
                type="number"
                min={1}
                value={guests}
                onChange={(e) =>
                  void setQuery({ guests: e.currentTarget.value })
                }
                className="h-9 w-full border-0 border-b bg-transparent px-0 outline-none"
                style={{ borderBottomColor: colors.border }}
              />
            </div>
          </div>

          <div
            className="flex flex-col items-stretch gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between"
            style={{ borderColor: colors.border }}
          >
            <button
              type="button"
              onClick={() => setShowMore((current) => !current)}
              className="text-left text-sm transition-colors hover:text-slate-900"
              style={{ color: colors.muted }}
            >
              More {showMore ? '▲' : '▼'}
            </button>
            <button
              type="button"
              onClick={() => void handleSearch()}
              disabled={loading}
              className="h-10 w-full rounded-sm px-5 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:min-w-80 md:w-auto"
              style={{ backgroundColor: colors.foreground }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.hoverAccent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.foreground;
              }}
            >
              {loading ? '検索中...' : '検索'}
            </button>
          </div>

          {showMore && (
            <div
              className="mt-4 border-t pt-4"
              style={{ borderColor: colors.border }}
            >
              <div className="mb-4">
                <p
                  className="mb-3 text-xs uppercase tracking-wider"
                  style={{ color: colors.muted }}
                >
                  料金
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                  <input
                    type="number"
                    min={0}
                    placeholder="下限"
                    value={minPrice}
                    onChange={(e) =>
                      void setQuery({ min_price: e.currentTarget.value })
                    }
                    className="h-9 border-0 border-b bg-transparent px-0 outline-none"
                    style={{ borderBottomColor: colors.border }}
                  />
                  <span
                    className="pb-1 text-sm"
                    style={{ color: colors.muted }}
                  >
                    〜
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="上限"
                    value={maxPrice}
                    onChange={(e) =>
                      void setQuery({ max_price: e.currentTarget.value })
                    }
                    className="h-9 border-0 border-b bg-transparent px-0 outline-none"
                    style={{ borderBottomColor: colors.border }}
                  />
                </div>
              </div>
              <div>
                <p
                  className="mb-3 text-xs uppercase tracking-wider"
                  style={{ color: colors.muted }}
                >
                  追加設備
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={hasLargeBath}
                      onChange={(e) =>
                        void setQuery({
                          has_large_bath: e.currentTarget.checked,
                        })
                      }
                    />
                    大浴場
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={hasSauna}
                      onChange={(e) =>
                        void setQuery({ has_sauna: e.currentTarget.checked })
                      }
                    />
                    サウナ
                  </label>
                </div>
              </div>
            </div>
          )}
        </section>

        {error && (
          <p className="mx-auto mt-4 w-full max-w-5xl text-sm text-red-600">
            {error}
          </p>
        )}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="w-52">
              <Select
                value={sortValue}
                options={sortOptions}
                searchable={false}
                clearable={false}
                onChange={(params) => {
                  const nextValue = params.value[0]?.id;
                  if (typeof nextValue === 'string') {
                    void setQuery({ sort: nextValue, page: 1 });
                  }
                }}
                overrides={{
                  ControlContainer: {
                    style: {
                      minHeight: '34px',
                      borderColor: colors.border,
                    },
                  },
                }}
              />
            </div>
            <p className="text-sm" style={{ color: colors.muted }}>
              {sortedHotels.length}件
            </p>
          </div>

          {loading && (
            <div
              className="rounded-sm border bg-white p-8 text-center text-sm"
              style={{ borderColor: colors.border, color: colors.muted }}
            >
              読み込み中...
            </div>
          )}

          {!loading && sortedHotels.length === 0 && (
            <div
              className="rounded-sm border bg-white p-8 text-center text-sm"
              style={{ borderColor: colors.border, color: colors.muted }}
            >
              条件を入力して検索してください。
            </div>
          )}

          {!loading && sortedHotels.length > 0 && (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {paginatedHotels.map((hotel) => (
                <article
                  key={hotel.id}
                  className="group rounded-sm border bg-white transition-all duration-300"
                  style={{ borderColor: colors.border }}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={hotel.imageUrl}
                      alt={hotel.roomName}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span
                      className="absolute right-4 top-4 rounded-sm px-2 py-1 text-xs"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        color: colors.accent,
                      }}
                    >
                      バストイレ別
                    </span>
                  </div>
                  <div className="p-6">
                    <p className="mb-3 text-sm" style={{ color: colors.muted }}>
                      {selectedAreas.length > 1
                        ? '複数エリア選択中'
                        : selectedAreaLabel}
                    </p>
                    <h3 className="mb-4 text-xl">{hotel.name}</h3>
                    <p
                      className="mb-4 line-clamp-2 text-sm"
                      style={{ color: colors.muted }}
                    >
                      {hotel.roomName}
                    </p>

                    <div className="mb-6 flex flex-wrap gap-2">
                      {bathroomType === 'separate' && (
                        <span
                          className="rounded-sm border px-2 py-1 text-xs"
                          style={{ borderColor: colors.border }}
                        >
                          バストイレ別
                        </span>
                      )}
                      <span
                        className="rounded-sm border px-2 py-1 text-xs"
                        style={{ borderColor: colors.border }}
                      >
                        シャワーブースオンリー
                      </span>
                      {hasLargeBath && (
                        <span
                          className="rounded-sm border px-2 py-1 text-xs"
                          style={{ borderColor: colors.border }}
                        >
                          大浴場
                        </span>
                      )}
                      {hasSauna && (
                        <span
                          className="rounded-sm border px-2 py-1 text-xs"
                          style={{ borderColor: colors.border }}
                        >
                          サウナ
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-end justify-between border-t pt-4"
                      style={{ borderColor: colors.border }}
                    >
                      <div>
                        <span className="text-2xl font-medium">
                          ¥{hotel.price.toLocaleString()}
                        </span>
                        <span
                          className="ml-1 text-sm"
                          style={{ color: colors.muted }}
                        >
                          / 泊
                        </span>
                        <p
                          className="mt-1 text-xs"
                          style={{ color: colors.muted }}
                        >
                          評価{' '}
                          {hotel.reviewAverage
                            ? hotel.reviewAverage.toFixed(1)
                            : 'なし'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-sm px-5 py-2 text-sm text-white transition-colors"
                        style={{ backgroundColor: colors.foreground }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            colors.hoverAccent;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            colors.foreground;
                        }}
                      >
                        詳細を見る
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() =>
                void setQuery({ page: Math.max(1, currentPage - 1) })
              }
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm disabled:opacity-30"
              style={{
                color: currentPage === 1 ? colors.muted : colors.foreground,
              }}
            >
              前へ
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => void setQuery({ page })}
                  className="h-8 w-8 rounded-sm text-sm"
                  style={{
                    color: currentPage === page ? 'white' : colors.foreground,
                    backgroundColor:
                      currentPage === page ? colors.foreground : 'transparent',
                    border:
                      currentPage === page
                        ? 'none'
                        : `1px solid ${colors.border}`,
                  }}
                >
                  {page}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() =>
                void setQuery({ page: Math.min(totalPages, currentPage + 1) })
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm disabled:opacity-30"
              style={{
                color:
                  currentPage === totalPages ? colors.muted : colors.foreground,
              }}
            >
              次へ
            </button>
          </div>
        )}
      </main>

      <footer
        className="mt-16 border-t bg-white"
        style={{ borderColor: colors.border }}
      >
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2
                className="mb-2 text-xl tracking-[0.2em] font-light"
                style={{
                  fontFamily: '"Cormorant Garamond", "Times New Roman", serif',
                }}
              >
                風呂旅
              </h2>
              <p className="text-sm" style={{ color: colors.muted }}>
                引き算の美学、モダンなホテル体験
              </p>
            </div>
            <div className="flex gap-8 text-sm" style={{ color: colors.muted }}>
              <a href="/terms">利用規約</a>
              <a href="/privacy">プライバシー</a>
              <a href="/contact">お問い合わせ</a>
            </div>
          </div>
          <div
            className="mt-8 border-t pt-8 text-center text-sm"
            style={{ borderColor: colors.border, color: colors.muted }}
          >
            © 2026 風呂旅. All rights reserved.
          </div>
        </div>
      </footer>

      <Dialog
        heading="都道府県を選択"
        isOpen={showAreaDialog}
        onDismiss={() => setShowAreaDialog(false)}
      >
        <div className="space-y-3">
          <p className="text-sm" style={{ color: colors.muted }}>
            選択中: {selectedAreas.length}件
          </p>
          {areasByRegion.map((group) => (
            <details key={group.region} open={group.region === '関東'}>
              <summary
                className="cursor-pointer text-sm font-medium"
                style={{ color: colors.foreground }}
              >
                {group.region}
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                {group.areas.map((option) => {
                  const isSelected = selectedAreas.includes(option.id);
                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => {
                        const nextAreas = isSelected
                          ? selectedAreas.filter((value) => value !== option.id)
                          : [...selectedAreas, option.id];
                        void setQuery({ areas: nextAreas.join(','), page: 1 });
                      }}
                      className="rounded-sm border px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50"
                      style={{
                        borderColor: isSelected
                          ? colors.foreground
                          : colors.border,
                        color: isSelected ? colors.foreground : colors.muted,
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </details>
          ))}
          <div
            className="flex items-center justify-end gap-2 border-t pt-3"
            style={{ borderColor: colors.border }}
          >
            <button
              type="button"
              onClick={() => void setQuery({ areas: '', page: 1 })}
              className="rounded-sm border px-3 py-1.5 text-sm"
              style={{ borderColor: colors.border, color: colors.muted }}
            >
              すべて解除
            </button>
            <button
              type="button"
              onClick={() => setShowAreaDialog(false)}
              className="rounded-sm px-3 py-1.5 text-sm text-white"
              style={{ backgroundColor: colors.foreground }}
            >
              完了
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
