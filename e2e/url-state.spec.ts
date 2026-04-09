import { expect, test } from '@playwright/test';

test.describe('URL状態同期（nuqs）', () => {
  test('URLパラメータから検索条件が復元される', async ({ page }) => {
    await page.goto('/?areas=tokyo&bathroomType=separate&guests=2');

    await expect(page).toHaveTitle(/東京/);
    await expect(page).toHaveTitle(/バストイレ別/);
  });

  test('複数エリア指定がURLに反映される', async ({ page }) => {
    await page.goto('/?areas=tokyo,osaka');
    await expect(page).toHaveTitle(/東京.*大阪|大阪.*東京/);
  });

  test('URLを共有すると同じ検索条件が再現される', async ({ page }) => {
    await page.goto('/?areas=kyoto&bathroomType=shower-only&guests=1');

    await expect(page).toHaveTitle(/京都/);
    await expect(page).toHaveTitle(/シャワーブース/);
  });
});
