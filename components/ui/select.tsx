'use client';

import { Select } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

type UiSelectProps = {
  value: string;
  options: { id: string; label: string }[];
  placeholder?: string;
  onValueChange: (value: string) => void;
  className?: string;
  id?: string;
};

export function UiSelect({
  value,
  options,
  placeholder = '選択',
  onValueChange,
  className,
  id,
}: UiSelectProps) {
  const selectedLabel = options.find((o) => o.id === value)?.label;

  return (
    <Select.Root
      value={value}
      onValueChange={(v) => {
        onValueChange(typeof v === 'string' ? v : '');
      }}
    >
      <Select.Trigger
        id={id}
        className={`group flex w-full items-center justify-between bg-transparent text-sm outline-none transition-colors ${
          value ? 'text-foreground' : 'text-muted'
        }${className ? ` ${className}` : ''}`}
      >
        <span>{selectedLabel ?? placeholder}</span>
        <Select.Icon>
          <ChevronDown
            size={16}
            className="text-muted transition-transform group-data-[popup-open]:rotate-180"
          />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner
          side="bottom"
          sideOffset={8}
          align="start"
          alignItemWithTrigger={false}
          className="z-50"
        >
          <Select.Popup className="max-h-60 min-w-[var(--anchor-width)] overflow-auto rounded-lg border border-border bg-white py-1 shadow-[var(--shadow-dropdown)] animate-dropdown-in">
            {options.map((option) => (
              <Select.Item
                key={option.id}
                value={option.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-foreground outline-none transition-colors data-[highlighted]:bg-slate-50"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="ml-auto">
                  <Check size={14} className="text-foreground" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
