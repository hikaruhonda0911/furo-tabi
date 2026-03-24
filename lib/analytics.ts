/**
 * アナリティクスユーティリティ
 * GTM の dataLayer.push() 経由でカスタムイベントを送信する。
 * GTM が未設定の場合は何もしない（エラーにならない）。
 */

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

/** dataLayer への安全なプッシュ */
function pushToDataLayer(event: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(event);
}

// ---------------------------------------------------------------------------
// イベント型定義
// ---------------------------------------------------------------------------

export type SearchExecutedParams = {
  area: string;
  filter_bath_separate: boolean;
  results_count: number;
};

export type HotelCardClickParams = {
  hotel_name: string;
  hotel_id: string | number;
  area: string;
  position: number;
};

export type AffiliateLinkClickParams = {
  hotel_name: string;
  hotel_id: string | number;
  affiliate_provider: 'rakuten' | 'jalan';
  link_url: string;
};

export type FilterUsedParams = {
  filter_type:
    | 'bath_separate'
    | 'shower_booth'
    | 'large_bath'
    | 'sauna'
    | 'private_bath'
    | 'price_range'
    | string;
  filter_value: string | boolean | number;
};

export type ShareClickParams = {
  platform: 'twitter' | 'line' | 'copy_link';
  page_url: string;
};

export type PageScrollDepthParams = {
  depth: 25 | 50 | 75 | 100;
  page_path: string;
};

// ---------------------------------------------------------------------------
// イベント送信関数
// ---------------------------------------------------------------------------

/**
 * ホテル検索を実行した時
 */
export function trackSearchExecuted(params: SearchExecutedParams): void {
  pushToDataLayer({ event: 'search_executed', ...params });
}

/**
 * ホテルカードをクリックした時
 */
export function trackHotelCardClick(params: HotelCardClickParams): void {
  pushToDataLayer({ event: 'hotel_card_click', ...params });
}

/**
 * 楽天/じゃらんの予約リンクをクリックした時（最重要）
 */
export function trackAffiliateLinkClick(
  params: AffiliateLinkClickParams,
): void {
  pushToDataLayer({ event: 'affiliate_link_click', ...params });
}

/**
 * フィルターを使った時
 */
export function trackFilterUsed(params: FilterUsedParams): void {
  pushToDataLayer({ event: 'filter_used', ...params });
}

/**
 * SNSシェアボタンを押した時
 */
export function trackShareClick(params: ShareClickParams): void {
  pushToDataLayer({ event: 'share_click', ...params });
}

/**
 * スクロール深度（25/50/75/100%）
 */
export function trackPageScrollDepth(params: PageScrollDepthParams): void {
  pushToDataLayer({ event: 'page_scroll_depth', ...params });
}
