'use client';

import { Calendar } from 'lucide-react';
import type { ReactNode } from 'react';

import { UiButton } from '@/components/ui/button';
import { UiCheckbox } from '@/components/ui/checkbox';
import { UiSelect } from '@/components/ui/select';
import { bathroomTypeOptions, guestOptions } from '@/constants/areas';

type ValidationErrors = {
  checkin?: string;
  checkout?: string;
  guests?: string;
};

type SearchFormProps = {
  bathroomType: string;
  selectedAreaLabel: string;
  checkin: string;
  checkout: string;
  guests: string;
  loading: boolean;
  showMore: boolean;
  validationErrors?: ValidationErrors;
  onBathroomTypeChange: (value: string) => void;
  onCheckinChange: (value: string) => void;
  onCheckoutChange: (value: string) => void;
  onClearDates: () => void;
  onRestoreDates: () => void;
  onGuestsChange: (value: string) => void;
  onOpenAreaDialog: () => void;
  onToggleMore: () => void;
  onSearch: () => void;
  children?: ReactNode;
};

export function SearchForm({
  bathroomType,
  selectedAreaLabel,
  checkin,
  checkout,
  guests,
  loading,
  showMore,
  validationErrors = {},
  onBathroomTypeChange,
  onCheckinChange,
  onCheckoutChange,
  onClearDates,
  onRestoreDates,
  onGuestsChange,
  onOpenAreaDialog,
  onToggleMore,
  onSearch,
  children,
}: SearchFormProps) {
  return (
    <section className="mx-auto w-full max-w-3xl rounded-xl bg-white px-6 py-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 grid grid-cols-2 gap-4 md:block md:space-y-4">
        <div className="space-y-1.5">
          <label
            className="block text-[11px] font-medium uppercase tracking-wider text-muted"
            htmlFor="bathroom-type"
          >
            浴室タイプ
          </label>
          <div className="flex h-11 items-center border-b border-border transition-colors has-[button[data-state=open]]:border-foreground">
            <UiSelect
              id="bathroom-type"
              value={bathroomType}
              options={bathroomTypeOptions}
              placeholder="指定なし"
              onValueChange={onBathroomTypeChange}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <p
            id="area-label"
            className="block text-[11px] font-medium uppercase tracking-wider text-muted"
          >
            都道府県
          </p>
          <UiButton
            variant="ghost"
            onClick={onOpenAreaDialog}
            aria-labelledby="area-label"
            className="flex h-11 w-full items-center justify-between border-b border-border text-left text-sm transition-colors hover:border-foreground/30"
          >
            <span
              className={`truncate ${selectedAreaLabel ? 'text-foreground' : 'text-muted'}`}
            >
              {selectedAreaLabel || '指定なし'}
            </span>
            <span className="shrink-0 text-xs text-muted">選択</span>
          </UiButton>
        </div>

        <div className="col-span-2 space-y-1.5 md:col-span-1">
          <div className="flex items-center justify-between">
            <label
              className="block text-[11px] font-medium uppercase tracking-wider text-muted"
              htmlFor="checkin"
            >
              日程
            </label>
            <UiCheckbox
              checked={!checkin && !checkout}
              onCheckedChange={(checked) => {
                if (checked) {
                  onClearDates();
                } else {
                  onRestoreDates();
                }
              }}
              size="sm"
            >
              日付指定なし
            </UiCheckbox>
          </div>
          <div
            className={`grid grid-cols-[1fr_auto_1fr] items-start gap-2 ${!checkin && !checkout ? 'opacity-40' : ''}`}
          >
            <div>
              <div className="relative">
                <input
                  id="checkin"
                  type="date"
                  value={checkin}
                  onChange={(e) => onCheckinChange(e.currentTarget.value)}
                  aria-describedby={
                    validationErrors.checkin ? 'checkin-error' : undefined
                  }
                  aria-invalid={!!validationErrors.checkin}
                  className={`h-11 w-full border-0 border-b bg-transparent px-0 pr-6 text-[13px] outline-none transition-colors focus:border-foreground [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:size-6 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${validationErrors.checkin ? 'border-red-500' : 'border-border'}`}
                />
                <Calendar className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-muted" />
              </div>
              {validationErrors.checkin && (
                <p
                  id="checkin-error"
                  className="mt-1 text-[11px] text-red-600"
                  role="alert"
                >
                  {validationErrors.checkin}
                </p>
              )}
            </div>
            <span className="mt-3 text-sm text-muted">〜</span>
            <div>
              <div className="relative">
                <input
                  aria-label="チェックアウト日"
                  type="date"
                  value={checkout}
                  onChange={(e) => onCheckoutChange(e.currentTarget.value)}
                  aria-describedby={
                    validationErrors.checkout ? 'checkout-error' : undefined
                  }
                  aria-invalid={!!validationErrors.checkout}
                  className={`h-11 w-full border-0 border-b bg-transparent px-0 pr-6 text-[13px] outline-none transition-colors focus:border-foreground [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:size-6 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${validationErrors.checkout ? 'border-red-500' : 'border-border'}`}
                />
                <Calendar className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-muted" />
              </div>
              {validationErrors.checkout && (
                <p
                  id="checkout-error"
                  className="mt-1 text-[11px] text-red-600"
                  role="alert"
                >
                  {validationErrors.checkout}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            className="block text-[11px] font-medium uppercase tracking-wider text-muted"
            htmlFor="guests"
          >
            人数
          </label>
          <div
            className={`flex h-11 items-center border-b transition-colors has-[button[data-state=open]]:border-foreground ${validationErrors.guests ? 'border-red-500' : 'border-border'}`}
          >
            <UiSelect
              id="guests"
              value={guests}
              options={guestOptions}
              placeholder="選択"
              onValueChange={onGuestsChange}
            />
          </div>
          {validationErrors.guests && (
            <p className="mt-1 text-[11px] text-red-600" role="alert">
              {validationErrors.guests}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <UiButton
          variant="ghost"
          onClick={onToggleMore}
          className="self-start text-xs text-muted transition-colors hover:text-foreground"
        >
          More {showMore ? '▲' : '▼'}
        </UiButton>

        {children}

        <UiButton
          onClick={onSearch}
          disabled={loading}
          className="h-10 w-full px-5 text-sm md:ml-auto md:min-w-60 md:w-auto"
        >
          {loading ? '検索中...' : '検索する'}
        </UiButton>
      </div>
    </section>
  );
}
