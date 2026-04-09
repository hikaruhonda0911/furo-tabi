import { expect, test } from '@playwright/test';

test.describe('SEO・メタデータ', () => {
  test('トップページのメタデータが正しい', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/風呂旅/);

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute(
      'content',
      /バストイレ別|シャワーブース/,
    );
  });

  test('OGPメタタグが設定されている', async ({ page }) => {
    await page.goto('/');

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /風呂旅/);

    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveAttribute('content', /.+/);

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /og/);
  });

  test('Twitterカードが設定されている', async ({ page }) => {
    await page.goto('/');
    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');
  });

  test('構造化データ（JSON-LD）が存在する', async ({ page }) => {
    await page.goto('/');
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThan(0);

    const content = await jsonLd.first().textContent();
    expect(content).toBeTruthy();
    const parsed = JSON.parse(content!);
    expect(parsed['@type']).toBe('WebApplication');
    expect(parsed.name).toBe('風呂旅');
  });

  test('lang属性がjaに設定されている', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ja');
  });

  test('robots.txtが取得できる', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('User-Agent');
    expect(text).toContain('Disallow: /api/');
  });

  test('sitemap.xmlが取得できる', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('<urlset');
    expect(text).toContain('<url>');
  });

  test('セキュリティヘッダーが設定されている', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
  });
});

test.describe('動的メタデータ', () => {
  test('エリア指定でタイトルが変わる', async ({ page }) => {
    await page.goto('/?areas=osaka');
    await expect(page).toHaveTitle(/大阪/);
  });

  test('浴室タイプ指定でタイトルが変わる', async ({ page }) => {
    await page.goto('/?bathroomType=shower-only');
    await expect(page).toHaveTitle(/シャワーブース/);
  });
});
