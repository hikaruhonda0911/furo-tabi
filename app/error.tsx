'use client';

import { UiButton } from '@/components/ui/button';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="mx-auto max-w-md px-6 text-center">
        <h1 className="mb-4 font-serif text-2xl tracking-wide font-light">
          エラーが発生しました
        </h1>
        <p className="mb-6 text-sm text-muted">
          予期しないエラーが発生しました。
        </p>
        <UiButton onClick={reset} className="px-6 py-2">
          もう一度試す
        </UiButton>
      </div>
    </div>
  );
}
