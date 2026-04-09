import { expect, test } from '@playwright/test';

test.describe('利用規約ページ', () => {
  test('ページが正しく表示される', async ({ page }) => {
    await page.goto('/terms');
    await expect(page).toHaveTitle(/利用規約/);
    await expect(
      page.getByRole('heading', { name: '利用規約', level: 1 }),
    ).toBeVisible();
    await expect(page.getByText('第1条')).toBeVisible();
  });

  test('トップに戻るリンクが動作する', async ({ page }) => {
    await page.goto('/terms');
    await page.getByRole('link', { name: /風呂旅トップに戻る/ }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('プライバシーポリシーページ', () => {
  test('ページが正しく表示される', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveTitle(/プライバシーポリシー/);
    await expect(
      page.getByRole('heading', { name: 'プライバシーポリシー', level: 1 }),
    ).toBeVisible();
    await expect(page.getByText('1. 収集する情報')).toBeVisible();
  });

  test('外部リンクが新しいタブで開く属性を持つ', async ({ page }) => {
    await page.goto('/privacy');
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(externalLinks.nth(i)).toHaveAttribute('rel', /noopener/);
    }
  });
});

test.describe('お問い合わせページ', () => {
  test('ページが正しく表示される', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveTitle(/お問い合わせ/);
    await expect(
      page.getByRole('heading', { name: 'お問い合わせ', level: 1 }),
    ).toBeVisible();
  });

  test('メールリンクが正しい', async ({ page }) => {
    await page.goto('/contact');
    const mailLink = page.getByRole('link', { name: 'contact@furotabi.jp' });
    await expect(mailLink).toBeVisible();
    await expect(mailLink).toHaveAttribute(
      'href',
      'mailto:contact@furotabi.jp',
    );
  });
});
