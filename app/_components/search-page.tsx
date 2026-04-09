'use client';

import { Button } from '@base-ui/react/button';
import { addDays, format, parseISO } from 'date-fns';
import { List, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { trackPageScrollDepth } from '@/lib/analytics';
import { getDefaultCheckin, getDefaultCheckout } from '@/lib/defaults';
import type { Hotel } from '@/types/hotel';
import { useHotelSearch } from '../_hooks/use-hotel-search';
import { AreaDialog } from './area-dialog';
import { HotelJsonLd } from './hotel-json-ld';
import { HotelList } from './hotel-list';
import { HotelMap } from './hotel-map';
import { SearchFilters } from './search-filters';
import { SearchForm } from './search-form';

type SearchPageProps = {
  initialHotels: Hotel[];
};

/** スクロール深度トラッキング用カスタムフック */
function useScrollDepth() {
  const reportedDepths = useRef(new Set<number>());

  useEffect(() => {
    const thresholds = [25, 50, 75, 100] as const;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      for (const threshold of thresholds) {
        if (
          scrollPercent >= threshold &&
          !reportedDepths.current.has(threshold)
        ) {
          reportedDepths.current.add(threshold);
          trackPageScrollDepth({
            depth: threshold,
            page_path: window.location.pathname + window.location.search,
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
}

function getNextDate(date: string, amount: number): string {
  return format(addDays(parseISO(date), amount), 'yyyy-MM-dd');
}

export function SearchPage({ initialHotels }: SearchPageProps) {
  const {
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
    allHotels,
    totalCount,
    loading,
    error,
    currentPage,
    totalPages,
    hasSearched,
    handleSearch,
    validationErrors,
    trackFilterUsed,
  } = useHotelSearch({ initialHotels });

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useScrollDepth();

  const handleCheckinChange = (value: string) => {
    if (!value) {
      void setQuery({ checkin: '', checkout: '' });
      return;
    }

    const nextCheckout =
      query.checkout && query.checkout > value
        ? query.checkout
        : getNextDate(value, 1);

    void setQuery({
      checkin: value,
      checkout: nextCheckout,
    });
  };

  const handleCheckoutChange = (value: string) => {
    if (!value) {
      void setQuery({ checkin: '', checkout: '' });
      return;
    }

    const nextCheckin =
      query.checkin && query.checkin < value
        ? query.checkin
        : getNextDate(value, -1);

    void setQuery({
      checkin: nextCheckin,
      checkout: value,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-3">
          <a href="/" className="flex items-center gap-2 no-underline">
            <Image
              src="/icon.svg"
              alt="風呂旅"
              width={40}
              height={22}
              className="shrink-0"
              priority
            />
            <p className="text-[10px] tracking-wide text-muted">
              シャワーブース、バストイレ別のモダンホテル
            </p>
          </a>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-6 pb-10 pt-8">
        <SearchForm
          bathroomType={query.bathroomType}
          selectedAreaLabel={selectedAreaLabel}
          checkin={query.checkin}
          checkout={query.checkout}
          guests={query.guests}
          loading={loading}
          showMore={showMore}
          validationErrors={validationErrors}
          onBathroomTypeChange={(value) => {
            void setQuery({ bathroomType: value });
            trackFilterUsed({
              filter_type: 'bath_separate',
              filter_value: value,
            });
          }}
          onCheckinChange={handleCheckinChange}
          onCheckoutChange={handleCheckoutChange}
          onClearDates={() => void setQuery({ checkin: '', checkout: '' })}
          onRestoreDates={() =>
            void setQuery({
              checkin: getDefaultCheckin(),
              checkout: getDefaultCheckout(),
            })
          }
          onGuestsChange={(value) => void setQuery({ guests: value })}
          onOpenAreaDialog={() => setShowAreaDialog(true)}
          onToggleMore={() => setShowMore((prev) => !prev)}
          onSearch={() => void handleSearch()}
        >
          {showMore && (
            <SearchFilters
              minPrice={query.min_price}
              maxPrice={query.max_price}
              hasLargeBath={query.has_large_bath}
              hasSauna={query.has_sauna}
              hasPrivateBath={query.has_private_bath}
              onMinPriceChange={(value) => void setQuery({ min_price: value })}
              onMaxPriceChange={(value) => void setQuery({ max_price: value })}
              onLargeBathChange={(value) => {
                void setQuery({ has_large_bath: value });
                trackFilterUsed({
                  filter_type: 'large_bath',
                  filter_value: value,
                });
              }}
              onSaunaChange={(value) => {
                void setQuery({ has_sauna: value });
                trackFilterUsed({ filter_type: 'sauna', filter_value: value });
              }}
              onPrivateBathChange={(value) => {
                void setQuery({ has_private_bath: value });
                trackFilterUsed({
                  filter_type: 'private_bath',
                  filter_value: value,
                });
              }}
            />
          )}
        </SearchForm>

        {paginatedHotels.length > 0 && <HotelJsonLd hotels={paginatedHotels} />}

        {error && (
          <p className="mx-auto mt-4 w-full max-w-5xl text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <div className="flex rounded-lg border border-border">
            <Button
              onClick={() => setViewMode('list')}
              className={`flex cursor-pointer items-center gap-1 border-0 px-3 py-1.5 text-xs transition-colors rounded-l-lg ${viewMode === 'list' ? 'bg-foreground text-white' : 'bg-transparent text-muted hover:text-foreground'}`}
            >
              <List className="size-3.5" />
              リスト
            </Button>
            <Button
              onClick={() => setViewMode('map')}
              className={`flex cursor-pointer items-center gap-1 border-0 border-l border-border px-3 py-1.5 text-xs transition-colors rounded-r-lg ${viewMode === 'map' ? 'bg-foreground text-white' : 'bg-transparent text-muted hover:text-foreground'}`}
            >
              <MapPin className="size-3.5" />
              マップ
            </Button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <>
            <HotelList
              hotels={paginatedHotels}
              totalCount={totalCount}
              sort={query.sort}
              onSortChange={(value) => void setQuery({ sort: value, page: 1 })}
              loading={loading}
              hasSearched={hasSearched}
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => void setQuery({ page })}
              />
            )}
          </>
        ) : (
          <div className="mt-4">
            <p className="mb-2 text-sm text-muted">{totalCount}件</p>
            <HotelMap hotels={allHotels} />
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-6 py-6 text-xs text-muted md:flex-row md:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/icon.svg"
              alt="風呂旅"
              width={28}
              height={15}
              className="shrink-0"
            />
            <a href="/terms">利用規約</a>
            <a href="/privacy">プライバシー</a>
            <a href="/contact">お問い合わせ</a>
          </div>
          <p>© 2026 風呂旅</p>
        </div>
      </footer>

      <AreaDialog
        isOpen={showAreaDialog}
        onDismiss={() => setShowAreaDialog(false)}
        areasByRegion={areasByRegion}
        selectedAreas={selectedAreas}
        onToggleArea={(areaId) => {
          const isSelected = selectedAreas.includes(areaId);
          const nextAreas = isSelected
            ? selectedAreas.filter((value) => value !== areaId)
            : [...selectedAreas, areaId];
          void setQuery({ areas: nextAreas.join(','), page: 1 });
        }}
        onClearAll={() => void setQuery({ areas: '', page: 1 })}
      />
    </div>
  );
}
