'use client';

import { Check } from 'lucide-react';
import { useId } from 'react';

type UiCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
  children?: React.ReactNode;
};

const sizeConfig = {
  sm: { box: 'h-3.5 w-3.5', icon: 9, gap: 'pl-1.5', text: 'text-xs' },
  md: { box: 'h-[18px] w-[18px]', icon: 12, gap: 'pl-2.5', text: 'text-sm' },
};

export function UiCheckbox({
  checked,
  onCheckedChange,
  size = 'md',
  children,
}: UiCheckboxProps) {
  const id = useId();
  const s = sizeConfig[size];
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center group">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex ${s.box} shrink-0 items-center justify-center rounded border transition-all group-hover:border-foreground/30 ${
          checked
            ? 'border-foreground bg-foreground text-white'
            : 'border-border bg-white'
        }`}
      >
        {checked && (
          <span className="animate-fade-in">
            <Check size={s.icon} strokeWidth={3} />
          </span>
        )}
      </span>
      {children && (
        <span className={`${s.gap} ${s.text} select-none`}>{children}</span>
      )}
    </label>
  );
}
