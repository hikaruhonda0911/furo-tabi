'use client';

import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';

import { UiButton } from '@/components/ui/button';
import type { AreaOption } from '@/types/hotel';

type AreaGroup = {
  region: string;
  areas: AreaOption[];
};

type AreaDialogProps = {
  isOpen: boolean;
  onDismiss: () => void;
  areasByRegion: AreaGroup[];
  selectedAreas: string[];
  onToggleArea: (areaId: string) => void;
  onClearAll: () => void;
};

export function AreaDialog({
  isOpen,
  onDismiss,
  areasByRegion,
  selectedAreas,
  onToggleArea,
  onClearAll,
}: AreaDialogProps) {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 data-[starting-style]:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-[var(--shadow-dialog)] data-[starting-style]:opacity-0 data-[starting-style]:scale-95 transition-[opacity,transform] duration-250">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold">
              都道府県を選択
            </Dialog.Title>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-slate-100 hover:text-foreground cursor-pointer">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted">
              選択中:{' '}
              <span className="font-medium text-foreground">
                {selectedAreas.length}
              </span>
              件
            </p>
            {areasByRegion.map((group) => (
              <details
                key={group.region}
                open={group.region === '関東'}
                className="group"
              >
                <summary className="flex cursor-pointer items-center gap-1 py-1 text-sm font-medium text-foreground select-none">
                  <span className="transition-transform group-open:rotate-90">
                    ▸
                  </span>
                  {group.region}
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                  {group.areas.map((option) => {
                    const isSelected = selectedAreas.includes(option.id);
                    return (
                      <UiButton
                        key={option.id}
                        variant="outline"
                        onClick={() => onToggleArea(option.id)}
                        aria-pressed={isSelected}
                        className={`justify-start py-2 text-left text-sm ${
                          isSelected
                            ? 'border-foreground bg-foreground/5 text-foreground font-medium'
                            : ''
                        }`}
                      >
                        {option.label}
                      </UiButton>
                    );
                  })}
                </div>
              </details>
            ))}
            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <UiButton variant="outline" onClick={onClearAll}>
                すべて解除
              </UiButton>
              <UiButton onClick={onDismiss} className="px-6">
                完了
              </UiButton>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
