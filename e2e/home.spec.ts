import { expect, test } from '@playwright/test';

test.describe('ホームページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ページが正しく読み込まれる', async ({ page }) => {
    await expect(page).toHaveTitle(/風呂旅/);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('ヘッダーのロゴからトップに遷移できる', async ({ page }) => {
    await page.goto('/terms');
    await page.locator('header a[href="/"]').first().click();
    await expect(page).toHaveURL('/');
  });

  test('フッターのナビゲーションリンクが存在する', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: '利用規約' })).toBeVisible();
    await expect(
      footer.getByRole('link', { name: 'プライバシー' }),
    ).toBeVisible();
    await expect(
      footer.getByRole('link', { name: 'お問い合わせ' }),
    ).toBeVisible();
  });

  test('スキップリンクが存在する', async ({ page }) => {
    const skipLink = page.getByRole('link', {
      name: 'メインコンテンツへスキップ',
    });
    await expect(skipLink).toBeAttached();
  });
});
