'use client';

/**
 * Google Tag Manager スクリプトコンポーネント
 *
 * - GTM_ID が設定されている場合: GTM スクリプトを読み込む
 * - GTM_ID が未設定で GA4_ID が設定されている場合: GA4 を直接読み込む（フォールバック）
 * - どちらも未設定の場合: 何もレンダリングしない
 *
 * CSP に gtm.js / googletagmanager.com / google-analytics.com を許可する設定が
 * next.config.ts 側で必要（layout.tsx 経由で呼び出される）。
 */

import Script from 'next/script';

type GtmProps = {
  gtmId: string | undefined;
  ga4Id: string | undefined;
};

// GTM インラインスクリプト（biome-ignore 対象: 外部スニペット必須のため）
function buildGtmSnippet(id: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`;
}

// GA4 設定スニペット（biome-ignore 対象: gtag 初期化に必須）
function buildGa4Snippet(id: string): string {
  return `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`;
}

export function GtmScript({ gtmId, ga4Id }: GtmProps) {
  if (gtmId) {
    return (
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: GTM 公式スニペットはインラインスクリプト必須
        dangerouslySetInnerHTML={{ __html: buildGtmSnippet(gtmId) }}
      />
    );
  }

  if (ga4Id) {
    return (
      <>
        <Script
          id="ga4-script"
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
        />
        <Script
          id="ga4-config"
          strategy="afterInteractive"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: GA4 初期化スクリプトはインライン必須
          dangerouslySetInnerHTML={{ __html: buildGa4Snippet(ga4Id) }}
        />
      </>
    );
  }

  return null;
}

type GtmNoscriptProps = {
  gtmId: string | undefined;
};

export function GtmNoscript({ gtmId }: GtmNoscriptProps) {
  if (!gtmId) return null;

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
