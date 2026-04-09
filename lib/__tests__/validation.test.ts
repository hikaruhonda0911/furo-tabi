import { describe, expect, it } from 'vitest';

import { validateApiSearchQuery, validateSearchParams } from '../validation';

const validInput = {
  checkin: '2026-04-01',
  checkout: '2026-04-02',
  guests: '2',
  minPrice: '',
  maxPrice: '',
};

describe('validateSearchParams', () => {
  it('有効な入力ならnullを返す', () => {
    expect(validateSearchParams(validInput)).toBeNull();
  });

  describe('日付バリデーション', () => {
    it('不正な日付形式でエラーを返す', () => {
      expect(validateSearchParams({ ...validInput, checkin: 'invalid' })).toBe(
        '日付の形式が不正です。',
      );
    });

    it('チェックインとチェックアウトが同日ならエラーを返す', () => {
      expect(
        validateSearchParams({
          ...validInput,
          checkin: '2026-04-01',
          checkout: '2026-04-01',
        }),
      ).toBe(
        'チェックアウト日はチェックイン日より後の日付を指定してください。',
      );
    });

    it('チェックアウトがチェックインより前ならエラーを返す', () => {
      expect(
        validateSearchParams({
          ...validInput,
          checkin: '2026-04-05',
          checkout: '2026-04-01',
        }),
      ).toBe(
        'チェックアウト日はチェックイン日より後の日付を指定してください。',
      );
    });

    it('チェックアウトがチェックインより後なら正常', () => {
      expect(
        validateSearchParams({
          ...validInput,
          checkin: '2026-04-01',
          checkout: '2026-04-03',
        }),
      ).toBeNull();
    });
  });

  describe('宿泊人数バリデーション', () => {
    it('0人はエラーを返す', () => {
      expect(validateSearchParams({ ...validInput, guests: '0' })).toBe(
        '人数は1以上の整数で指定してください。',
      );
    });

    it('負の数はエラーを返す', () => {
      expect(validateSearchParams({ ...validInput, guests: '-1' })).toBe(
        '人数は1以上の整数で指定してください。',
      );
    });

    it('小数はエラーを返す', () => {
      expect(validateSearchParams({ ...validInput, guests: '1.5' })).toBe(
        '人数は1以上の整数で指定してください。',
      );
    });

    it('文字列はエラーを返す', () => {
      expect(validateSearchParams({ ...validInput, guests: 'abc' })).toBe(
        '人数は1以上の整数で指定してください。',
      );
    });

    it('1人は正常', () => {
      expect(validateSearchParams({ ...validInput, guests: '1' })).toBeNull();
    });
  });

  describe('料金バリデーション', () => {
    it('下限料金が負の数ならエラーを返す', () => {
      expect(validateSearchParams({ ...validInput, minPrice: '-100' })).toBe(
        '下限料金は0以上の数値で指定してください。',
      );
    });

    it('上限料金が負の数ならエラーを返す', () => {
      expect(validateSearchParams({ ...validInput, maxPrice: '-100' })).toBe(
        '上限料金は0以上の数値で指定してください。',
      );
    });

    it('下限が上限を超えるとエラーを返す', () => {
      expect(
        validateSearchParams({
          ...validInput,
          minPrice: '20000',
          maxPrice: '10000',
        }),
      ).toBe('下限料金は上限料金以下で指定してください。');
    });

    it('下限と上限が同じ値は正常', () => {
      expect(
        validateSearchParams({
          ...validInput,
          minPrice: '10000',
          maxPrice: '10000',
        }),
      ).toBeNull();
    });

    it('空文字列の料金は無視される', () => {
      expect(
        validateSearchParams({
          ...validInput,
          minPrice: '',
          maxPrice: '',
        }),
      ).toBeNull();
    });

    it('下限のみ指定は正常', () => {
      expect(
        validateSearchParams({
          ...validInput,
          minPrice: '5000',
          maxPrice: '',
        }),
      ).toBeNull();
    });

    it('上限のみ指定は正常', () => {
      expect(
        validateSearchParams({
          ...validInput,
          minPrice: '',
          maxPrice: '30000',
        }),
      ).toBeNull();
    });

    it('下限が文字列ならエラーを返す', () => {
      expect(validateSearchParams({ ...validInput, minPrice: 'abc' })).toBe(
        '下限料金は0以上の数値で指定してください。',
      );
    });

    it('0円は正常', () => {
      expect(
        validateSearchParams({
          ...validInput,
          minPrice: '0',
          maxPrice: '0',
        }),
      ).toBeNull();
    });
  });
});

describe('validateApiSearchQuery', () => {
  it('チェックインだけ指定した場合はエラーを返す', () => {
    expect(
      validateApiSearchQuery({
        rawQuery: 'checkin=2026-04-01',
        tagCount: 1,
        areaCount: 1,
        checkin: '2026-04-01',
        checkout: null,
        guests: '2',
        minPrice: '',
        maxPrice: '',
      }),
    ).toBe('チェックイン日とチェックアウト日はセットで指定してください。');
  });

  it('クエリが長すぎる場合はエラーを返す', () => {
    expect(
      validateApiSearchQuery({
        rawQuery: 'a'.repeat(513),
        tagCount: 1,
        areaCount: 1,
        checkin: null,
        checkout: null,
        guests: '2',
        minPrice: '',
        maxPrice: '',
      }),
    ).toBe('検索条件が多すぎます。条件を減らしてください。');
  });

  it('エリア選択が多すぎる場合はエラーを返す', () => {
    expect(
      validateApiSearchQuery({
        rawQuery: 'areas=1',
        tagCount: 1,
        areaCount: 21,
        checkin: null,
        checkout: null,
        guests: '2',
        minPrice: '',
        maxPrice: '',
      }),
    ).toBe('エリアの選択数が多すぎます。20件以下で指定してください。');
  });
});
