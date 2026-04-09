import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { colors } from '@/constants/colors';

export const runtime = 'edge';

async function loadGoogleFont(
  family: string,
  weight: number,
  text: string,
): Promise<ArrayBuffer> {
  const params = new URLSearchParams({
    family: `${family}:wght@${weight}`,
    text,
    display: 'swap',
  });
  const url = `https://fonts.googleapis.com/css2?${params.toString()}`;
  const css = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(5000),
  }).then((res) => res.text());

  const fontUrl = css.match(/url\(([^)]+)\)/)?.[1];
  if (!fontUrl) throw new Error(`Font URL not found for ${family}`);

  return fetch(fontUrl, { signal: AbortSignal.timeout(5000) }).then((res) =>
    res.arrayBuffer(),
  );
}

function OgImage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.secondary100,
        fontFamily: 'Noto Sans JP',
        padding: '80px',
      }}
    >
      <div
        style={{
          color: colors.primary500,
          fontSize: 48,
          fontWeight: 700,
          letterSpacing: '0.2em',
        }}
      >
        風呂旅
      </div>
      <div
        style={{
          color: colors.foreground,
          fontSize: 32,
          fontWeight: 700,
          marginTop: 32,
          textAlign: 'center',
          maxWidth: '80%',
          lineHeight: 1.4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: colors.muted,
          fontSize: 20,
          fontWeight: 400,
          marginTop: 16,
          textAlign: 'center',
        }}
      >
        {subtitle}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: 60,
          color: colors.accent,
          fontSize: 16,
          fontWeight: 400,
          opacity: 0.6,
        }}
      >
        {(process.env.NEXT_PUBLIC_SITE_URL ?? 'furotabi.jp').replace(
          /^https?:\/\//,
          '',
        )}
      </div>
    </div>
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'お風呂で選ぶ、新しいホテル探し。';
  const subtitle =
    searchParams.get('subtitle') ||
    'バストイレ別・シャワーブース専門のホテル検索サイト';

  const allText = `風呂旅${title}${subtitle}`;

  try {
    const [fontBold, fontRegular] = await Promise.all([
      loadGoogleFont('Noto Sans JP', 700, allText),
      loadGoogleFont('Noto Sans JP', 400, allText),
    ]);

    return new ImageResponse(<OgImage title={title} subtitle={subtitle} />, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Noto Sans JP',
          data: fontBold,
          weight: 700,
          style: 'normal' as const,
        },
        {
          name: 'Noto Sans JP',
          data: fontRegular,
          weight: 400,
          style: 'normal' as const,
        },
      ],
    });
  } catch {
    return new ImageResponse(<OgImage title={title} subtitle={subtitle} />, {
      width: 1200,
      height: 630,
    });
  }
}
