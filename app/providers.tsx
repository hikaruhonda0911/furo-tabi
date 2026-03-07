'use client';

import { BaseProvider, LightTheme } from 'baseui';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useMemo } from 'react';
import {
  Client as StyletronClient,
  Server as StyletronServer,
} from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';

export function Providers({ children }: { children: React.ReactNode }) {
  const engine = useMemo(
    () =>
      typeof window === 'undefined'
        ? new StyletronServer()
        : new StyletronClient(),
    [],
  );

  return (
    <NuqsAdapter>
      <StyletronProvider value={engine}>
        <BaseProvider theme={LightTheme}>{children}</BaseProvider>
      </StyletronProvider>
    </NuqsAdapter>
  );
}
