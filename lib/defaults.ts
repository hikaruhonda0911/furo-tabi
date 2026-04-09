import { addDays, format } from 'date-fns';

export function getDefaultCheckin(): string {
  return format(addDays(new Date(), 14), 'yyyy-MM-dd');
}

export function getDefaultCheckout(): string {
  return format(addDays(new Date(), 15), 'yyyy-MM-dd');
}

/** サーバー・クライアント共通の検索デフォルト値 */
export const searchDefaults = {
  areas: '',
  bathroomType: '',
  guests: '2',
  min_price: '',
  max_price: '',
  has_large_bath: false,
  has_sauna: false,
  sort: 'recommended',
  page: 1,
} as const;

export type SearchDefaults = typeof searchDefaults;
