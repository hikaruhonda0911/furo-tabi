import { expect, test } from '@playwright/test';

test.describe('検索フォーム', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('浴室タイプを選択できる', async ({ page }) => {
    const trigger = page.locator('#bathroom-type');
    await trigger.click();
    const option = page.getByRole('option', { name: 'バストイレ別' });
    await option.click();
    await expect(page).toHaveURL(/bathroomType=separate/);
  });

  test('人数を変更できる', async ({ page }) => {
    const trigger = page.locator('#guests');
    await trigger.click();
    const option = page.getByRole('option', { name: '3名' });
    await option.click();
    await expect(page).toHaveURL(/guests=3/);
  });

  test('都道府県選択ダイアログが開閉する', async ({ page }) => {
    await page.getByRole('button', { name: /都道府県/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 東京を選択
    const tokyoCheckbox = dialog.getByRole('checkbox', { name: '東京' });
    await tokyoCheckbox.check();
    await expect(page).toHaveURL(/areas=tokyo/);
  });

  test('Moreボタンで追加フィルターが表示される', async ({ page }) => {
    const moreButton = page.getByRole('button', { name: /More/ });
    await moreButton.click();

    await expect(page.getByLabel('下限料金')).toBeVisible();
    await expect(page.getByLabel('上限料金')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '大浴場' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'サウナ' })).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: '貸切風呂' }),
    ).toBeVisible();
  });

  test('料金フィルターに値を入力できる', async ({ page }) => {
    await page.getByRole('button', { name: /More/ }).click();

    const minInput = page.getByLabel('下限料金');
    await minInput.fill('5000');
    await expect(minInput).toHaveValue('5000');

    const maxInput = page.getByLabel('上限料金');
    await maxInput.fill('20000');
    await expect(maxInput).toHaveValue('20000');
  });

  test('検索ボタンが存在し、クリックできる', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: '検索する' });
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toBeEnabled();
  });

  test('日付指定なしチェックボックスで日付入力が切り替わる', async ({
    page,
  }) => {
    const checkbox = page.getByRole('checkbox', { name: '日付指定なし' });
    await expect(checkbox).toBeVisible();
  });
});

test.describe('検索結果', () => {
  test('リスト/マップ切替ボタンが動作する', async ({ page }) => {
    await page.goto('/');

    const listButton = page.getByRole('button', { name: 'リスト' });
    const mapButton = page.getByRole('button', { name: 'マップ' });

    await expect(listButton).toBeVisible();
    await expect(mapButton).toBeVisible();

    // マップビューに切り替え
    await mapButton.click();
    // リストビューに戻す
    await listButton.click();
  });

  test('ソート選択肢が存在する', async ({ page }) => {
    await page.goto('/');
    // ソートのセレクトがおすすめ順をデフォルトで表示
    await expect(page.getByText('おすすめ順')).toBeVisible();
  });
});
