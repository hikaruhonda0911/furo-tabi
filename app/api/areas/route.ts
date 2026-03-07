import { NextResponse } from 'next/server';

type AreaOption = {
  id: string;
  label: string;
};

const collectMiddleClasses = (value: unknown, collector: AreaOption[]) => {
  if (Array.isArray(value)) {
    value.forEach((item) => {
      collectMiddleClasses(item, collector);
    });
    return;
  }

  if (!value || typeof value !== 'object') return;

  const node = value as Record<string, unknown>;
  const maybeCode = node.middleClassCode;
  const maybeName = node.middleClassName;

  if (typeof maybeCode === 'string' && typeof maybeName === 'string') {
    collector.push({ id: maybeCode, label: maybeName });
  }

  Object.values(node).forEach((child) => {
    collectMiddleClasses(child, collector);
  });
};

export async function GET() {
  const rakutenAppId = process.env.RAKUTEN_APP_ID;
  if (!rakutenAppId) {
    return NextResponse.json(
      { error: '楽天APIキーが未設定です。' },
      { status: 500 },
    );
  }

  try {
    const url = new URL(
      'https://app.rakuten.co.jp/services/api/Travel/GetAreaClass/20131024',
    );
    url.searchParams.append('applicationId', rakutenAppId);
    url.searchParams.append('format', 'json');

    const response = await fetch(url.toString());
    if (!response.ok) {
      return NextResponse.json(
        { error: 'エリア候補の取得に失敗しました。' },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as unknown;
    const extracted: AreaOption[] = [];
    collectMiddleClasses(payload, extracted);

    const deduped = Array.from(
      new Map(extracted.map((area) => [area.id, area])).values(),
    );

    if (deduped.length === 0) {
      return NextResponse.json(
        { error: 'エリア候補が取得できませんでした。' },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { areas: deduped },
      { headers: { 'Cache-Control': 'public, max-age=86400' } },
    );
  } catch (error) {
    console.error(
      'Area API failed:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
