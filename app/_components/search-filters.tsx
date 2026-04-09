'use client';

import { UiCheckbox } from '@/components/ui/checkbox';
import { UiInput } from '@/components/ui/input';

type SearchFiltersProps = {
  minPrice: string;
  maxPrice: string;
  hasLargeBath: boolean;
  hasSauna: boolean;
  hasPrivateBath: boolean;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onLargeBathChange: (value: boolean) => void;
  onSaunaChange: (value: boolean) => void;
  onPrivateBathChange: (value: boolean) => void;
};

export function SearchFilters({
  minPrice,
  maxPrice,
  hasLargeBath,
  hasSauna,
  hasPrivateBath,
  onMinPriceChange,
  onMaxPriceChange,
  onLargeBathChange,
  onSaunaChange,
  onPrivateBathChange,
}: SearchFiltersProps) {
  return (
    <>
      <div className="mb-4">
        <p className="mb-3 text-xs uppercase tracking-wider text-muted">料金</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <UiInput
            aria-label="下限料金"
            type="number"
            min={0}
            placeholder="下限"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.currentTarget.value)}
          />
          <span className="pb-1 text-sm text-muted">〜</span>
          <UiInput
            aria-label="上限料金"
            type="number"
            min={0}
            placeholder="上限"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.currentTarget.value)}
          />
        </div>
      </div>
      <div>
        <p className="mb-3 text-xs uppercase tracking-wider text-muted">
          追加設備
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <UiCheckbox
            checked={hasLargeBath}
            onCheckedChange={onLargeBathChange}
          >
            大浴場
          </UiCheckbox>
          <UiCheckbox checked={hasSauna} onCheckedChange={onSaunaChange}>
            サウナ
          </UiCheckbox>
          <UiCheckbox
            checked={hasPrivateBath}
            onCheckedChange={onPrivateBathChange}
          >
            貸切風呂
          </UiCheckbox>
        </div>
      </div>
    </>
  );
}
