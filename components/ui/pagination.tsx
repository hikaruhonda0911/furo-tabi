'use client';

import { UiButton } from '@/components/ui/button';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav
      aria-label="ページネーション"
      className="mt-10 flex items-center justify-center gap-1"
    >
      <UiButton
        variant="ghost"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="前のページ"
        className={`h-9 justify-center rounded-lg px-3 text-sm ${currentPage === 1 ? 'cursor-not-allowed text-muted/40' : 'text-foreground hover:bg-border/40'}`}
      >
        前へ
      </UiButton>

      {pages.map((page, i) =>
        page === '...' ? (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis items have no stable key
            key={`ellipsis-${i}`}
            className="inline-flex h-9 w-9 items-center justify-center text-sm text-muted"
          >
            ...
          </span>
        ) : (
          <UiButton
            key={page}
            variant={currentPage === page ? 'primary' : 'ghost'}
            onClick={() => onPageChange(page)}
            aria-label={`${page}ページ目`}
            aria-current={currentPage === page ? 'page' : undefined}
            className={`h-9 w-9 justify-center rounded-lg p-0 text-sm ${
              currentPage === page
                ? 'bg-primary-500 text-white'
                : 'text-foreground hover:bg-border/40'
            }`}
          >
            {page}
          </UiButton>
        ),
      )}

      <UiButton
        variant="ghost"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="次のページ"
        className={`h-9 justify-center rounded-lg px-3 text-sm ${currentPage === totalPages ? 'cursor-not-allowed text-muted/40' : 'text-foreground hover:bg-border/40'}`}
      >
        次へ
      </UiButton>
    </nav>
  );
}
