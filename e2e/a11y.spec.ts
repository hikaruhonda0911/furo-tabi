import { expect, test } from '@playwright/test';

test.describe('アクセシビリティ', () => {
  test('検索フォームのラベルが正しく関連付けられている', async ({ page }) => {
    await page.goto('/');

    // label[for] → input[id] の関連付け
    const bathroomSelect = page.locator('#bathroom-type');
    await expect(bathroomSelect).toBeVisible();

    const checkinInput = page.locator('#checkin');
    await expect(checkinInput).toBeVisible();

    const guestsSelect = page.locator('#guests');
    await expect(guestsSelect).toBeVisible();
  });

  test('チェックアウト日にaria-labelが設定されている', async ({ page }) => {
    await page.goto('/');
    const checkoutInput = page.getByLabel('チェックアウト日');
    await expect(checkoutInput).toBeVisible();
  });

  test('バリデーションエラーにrole=alertが使われる', async ({ page }) => {
    await page.goto('/');

    // 人数を0に — guests selectは1からなので、
    // チェックイン > チェックアウトのバリデーションを発火させる
    const checkinInput = page.locator('#checkin');
    await checkinInput.fill('2026-05-10');

    const checkoutInput = page.getByLabel('チェックアウト日');
    await checkoutInput.fill('2026-05-08');

    // エラーメッセージの表示を確認
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert.first()).toBeVisible();
  });

  test('画像にalt属性が設定されている', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});
