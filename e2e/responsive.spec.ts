import { expect, test } from '@playwright/test';

test.describe('レスポンシブデザイン', () => {
  test('デスクトップ: 検索フォームが正しく表示される', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.getByRole('button', { name: '検索する' })).toBeVisible();
  });

  test('モバイル: ヘッダーが表示される', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('button', { name: '検索する' })).toBeVisible();
  });

  test('タブレット: レイアウトが崩れない', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('#main-content')).toBeVisible();
    const mainContent = page.locator('#main-content');
    const box = await mainContent.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeLessThanOrEqual(768);
  });
});
