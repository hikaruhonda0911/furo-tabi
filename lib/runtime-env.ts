export type SearchCacheNamespace = {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
};

declare global {
  var __FURO_TABI_SEARCH_CACHE: SearchCacheNamespace | undefined;
}

export function getSearchCacheNamespace(): SearchCacheNamespace | null {
  return globalThis.__FURO_TABI_SEARCH_CACHE ?? null;
}
