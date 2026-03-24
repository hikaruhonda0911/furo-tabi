import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { GtmNoscript, GtmScript } from '@/components/ui/gtm';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  preload: false,
});

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://furo-tabi.mui-co.workers.dev',
  ),
  title: '風呂旅 | バストイレ別ホテル専門の検索サイト',
  description:
    'ユニットバスはもう卒業。バストイレ別・シャワーブース付きの部屋だけを検索できるホテル検索サイト。',
  openGraph: {
    title: '風呂旅 | バストイレ別ホテル専門の検索サイト',
    description:
      'ユニットバスはもう卒業。バストイレ別・シャワーブース付きの部屋だけを検索できるホテル検索サイト。',
    images: ['/api/og'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '風呂旅 | バストイレ別ホテル専門の検索サイト',
    description:
      'ユニットバスはもう卒業。バストイレ別・シャワーブース付きの部屋だけを検索できるホテル検索サイト。',
    images: ['/api/og'],
  },
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://furo-tabi.mui-co.workers.dev';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '風呂旅',
  description: 'バストイレ別・シャワーブースのみのモダンホテル検索サイト',
  url: siteUrl,
  applicationCategory: 'TravelApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'JPY',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/?areas={area}`,
    },
    'query-input': 'required name=area',
  },
};

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 構造化データはインライン必須
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <head>
        {GSC_VERIFICATION && (
          <meta name="google-site-verification" content={GSC_VERIFICATION} />
        )}
        <JsonLd data={jsonLd} />
        <GtmScript gtmId={GTM_ID} ga4Id={GA4_ID} />
      </head>
      <body className="antialiased">
        <GtmNoscript gtmId={GTM_ID} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          メインコンテンツへスキップ
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
