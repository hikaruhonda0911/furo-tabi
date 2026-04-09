export type SearchValidationInput = {
  checkin: string;
  checkout: string;
  guests: string;
  minPrice: string;
  maxPrice: string;
};

export type ApiSearchQueryValidationInput = {
  rawQuery: string;
  tagCount: number;
  areaCount: number;
  checkin: string | null;
  checkout: string | null;
  guests: string;
  minPrice: string;
  maxPrice: string;
};

const MAX_QUERY_LENGTH = 512;
const MAX_TAG_COUNT = 4;
const MAX_AREA_COUNT = 20;

function validateDateRange(checkin: string, checkout: string): string | null {
  const checkinDate = new Date(`${checkin}T00:00:00`);
  const checkoutDate = new Date(`${checkout}T00:00:00`);
  if (
    Number.isNaN(checkinDate.getTime()) ||
    Number.isNaN(checkoutDate.getTime())
  ) {
    return '日付の形式が不正です。';
  }
  if (checkinDate >= checkoutDate) {
    return 'チェックアウト日はチェックイン日より後の日付を指定してください。';
  }

  const now = new Date();
  const maxDate = new Date(
    now.getFullYear() + 1,
    now.getMonth(),
    now.getDate(),
  );
  if (checkoutDate > maxDate) {
    return '1年先までの日付を指定してください。';
  }

  return null;
}

function validateGuestAndPrice(
  guests: string,
  minPrice: string,
  maxPrice: string,
): string | null {
  const guestsValue = Number(guests);
  if (!Number.isInteger(guestsValue) || guestsValue < 1) {
    return '人数は1以上の整数で指定してください。';
  }
  if (guestsValue > 10) {
    return '人数は10名以下で指定してください。';
  }

  const minPriceValue = minPrice === '' ? null : Number(minPrice);
  const maxPriceValue = maxPrice === '' ? null : Number(maxPrice);
  if (
    minPriceValue !== null &&
    (!Number.isFinite(minPriceValue) || minPriceValue < 0)
  ) {
    return '下限料金は0以上の数値で指定してください。';
  }
  if (
    maxPriceValue !== null &&
    (!Number.isFinite(maxPriceValue) || maxPriceValue < 0)
  ) {
    return '上限料金は0以上の数値で指定してください。';
  }
  if (
    minPriceValue !== null &&
    maxPriceValue !== null &&
    minPriceValue > maxPriceValue
  ) {
    return '下限料金は上限料金以下で指定してください。';
  }

  return null;
}

export function validateSearchParams(
  input: SearchValidationInput,
): string | null {
  const dateError = validateDateRange(input.checkin, input.checkout);
  if (dateError) {
    return dateError;
  }

  return validateGuestAndPrice(input.guests, input.minPrice, input.maxPrice);
}

export function validateApiSearchQuery(
  input: ApiSearchQueryValidationInput,
): string | null {
  if (input.rawQuery.length > MAX_QUERY_LENGTH) {
    return '検索条件が多すぎます。条件を減らしてください。';
  }
  if (input.tagCount > MAX_TAG_COUNT) {
    return '検索条件が多すぎます。条件を減らしてください。';
  }
  if (input.areaCount > MAX_AREA_COUNT) {
    return 'エリアの選択数が多すぎます。20件以下で指定してください。';
  }
  if (
    (input.checkin && !input.checkout) ||
    (!input.checkin && input.checkout)
  ) {
    return 'チェックイン日とチェックアウト日はセットで指定してください。';
  }

  const guestAndPriceError = validateGuestAndPrice(
    input.guests,
    input.minPrice,
    input.maxPrice,
  );
  if (guestAndPriceError) {
    return guestAndPriceError;
  }

  if (input.checkin && input.checkout) {
    return validateDateRange(input.checkin, input.checkout);
  }

  return null;
}
