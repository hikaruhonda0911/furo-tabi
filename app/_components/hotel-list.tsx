'use client';

import { UiSelect } from '@/components/ui/select';
import { sortOptions } from '@/constants/areas';
import type { Hotel } from '@/types/hotel';

import { HotelCard } from './hotel-card';

// 24件分のスケルトンに使う固定キー（インデックスキーを避けるため）
const SKELETON_KEYS = Array.from(
  { length: 24 },
  (_, i) => `skeleton-${i}`,
) as string[];

type HotelListProps = {
  hotels: Hotel[];
  totalCount: number;
  sort: string;
  onSortChange: (value: string) => void;
  loading: boolean;
  hasSearched: boolean;
};

export function HotelList({
  hotels,
  totalCount,
  sort,
  onSortChange,
  loading,
  hasSearched,
}: HotelListProps) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="w-fit">
          <UiSelect
            value={sort}
            options={sortOptions}
            onValueChange={onSortChange}
          />
        </div>
        <p className="text-sm text-muted">{totalCount}件</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {SKELETON_KEYS.map((key) => (
            <div
              key={key}
              className="rounded-sm bg-white shadow-[var(--shadow-card)]"
            >
              <div className="aspect-video animate-pulse bg-border/50" />
              <div className="space-y-3 p-6">
                <div className="h-3 w-20 animate-pulse rounded bg-border/50" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-border/50" />
                <div className="h-3 w-full animate-pulse rounded bg-border/50" />
                <div className="flex items-end justify-between border-t border-border pt-4">
                  <div className="h-6 w-24 animate-pulse rounded bg-border/50" />
                  <div className="h-9 w-24 animate-pulse rounded bg-border/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && totalCount === 0 && !hasSearched && (
        <div className="rounded-sm bg-white p-8 text-center text-sm text-muted shadow-[var(--shadow-card)]">
          条件を入力して検索してください。
        </div>
      )}

      {!loading && totalCount === 0 && hasSearched && (
        <div className="rounded-sm bg-white p-8 text-center text-sm text-muted shadow-[var(--shadow-card)]">
          検索条件に一致する施設が見つかりませんでした。条件を変更してお試しください。
        </div>
      )}

      {!loading && totalCount > 0 && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel, index) => (
            <HotelCard key={hotel.id} hotel={hotel} position={index + 1} />
          ))}
        </div>
      )}
    </section>
  );
}
