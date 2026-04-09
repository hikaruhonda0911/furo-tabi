import type { AreaOption, RegionConfig } from '@/types/hotel';

export const fallbackAreaOptions: AreaOption[] = [
  { id: 'hokkaido', label: '北海道' },
  { id: 'aomori', label: '青森' },
  { id: 'iwate', label: '岩手' },
  { id: 'miyagi', label: '宮城' },
  { id: 'akita', label: '秋田' },
  { id: 'yamagata', label: '山形' },
  { id: 'fukushima', label: '福島' },
  { id: 'ibaraki', label: '茨城' },
  { id: 'tochigi', label: '栃木' },
  { id: 'gunma', label: '群馬' },
  { id: 'saitama', label: '埼玉' },
  { id: 'chiba', label: '千葉' },
  { id: 'tokyo', label: '東京' },
  { id: 'kanagawa', label: '神奈川' },
  { id: 'niigata', label: '新潟' },
  { id: 'toyama', label: '富山' },
  { id: 'ishikawa', label: '石川' },
  { id: 'fukui', label: '福井' },
  { id: 'yamanashi', label: '山梨' },
  { id: 'nagano', label: '長野' },
  { id: 'gifu', label: '岐阜' },
  { id: 'shizuoka', label: '静岡' },
  { id: 'aichi', label: '愛知' },
  { id: 'mie', label: '三重' },
  { id: 'shiga', label: '滋賀' },
  { id: 'kyoto', label: '京都' },
  { id: 'osaka', label: '大阪' },
  { id: 'hyogo', label: '兵庫' },
  { id: 'nara', label: '奈良' },
  { id: 'wakayama', label: '和歌山' },
  { id: 'tottori', label: '鳥取' },
  { id: 'shimane', label: '島根' },
  { id: 'okayama', label: '岡山' },
  { id: 'hiroshima', label: '広島' },
  { id: 'yamaguchi', label: '山口' },
  { id: 'tokushima', label: '徳島' },
  { id: 'kagawa', label: '香川' },
  { id: 'ehime', label: '愛媛' },
  { id: 'kochi', label: '高知' },
  { id: 'fukuoka', label: '福岡' },
  { id: 'saga', label: '佐賀' },
  { id: 'nagasaki', label: '長崎' },
  { id: 'kumamoto', label: '熊本' },
  { id: 'oita', label: '大分' },
  { id: 'miyazaki', label: '宮崎' },
  { id: 'kagoshima', label: '鹿児島' },
  { id: 'okinawa', label: '沖縄' },
];

export const regionConfigs: RegionConfig[] = [
  { name: '北海道', ids: ['hokkaido'] },
  {
    name: '東北',
    ids: ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'],
  },
  {
    name: '関東',
    ids: [
      'ibaraki',
      'tochigi',
      'gunma',
      'saitama',
      'chiba',
      'tokyo',
      'kanagawa',
    ],
  },
  {
    name: '中部',
    ids: [
      'niigata',
      'toyama',
      'ishikawa',
      'fukui',
      'yamanashi',
      'nagano',
      'gifu',
      'shizuoka',
      'aichi',
    ],
  },
  {
    name: '近畿',
    ids: ['mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama'],
  },
  {
    name: '中国',
    ids: ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi'],
  },
  { name: '四国', ids: ['tokushima', 'kagawa', 'ehime', 'kochi'] },
  {
    name: '九州・沖縄',
    ids: [
      'fukuoka',
      'saga',
      'nagasaki',
      'kumamoto',
      'oita',
      'miyazaki',
      'kagoshima',
      'okinawa',
    ],
  },
];

export const areaRegionById = Object.fromEntries(
  regionConfigs.flatMap((region) => region.ids.map((id) => [id, region.name])),
) as Record<string, string>;

export const sortOptions = [
  { id: 'recommended', label: 'おすすめ順' },
  { id: 'price-low', label: '料金が安い順' },
  { id: 'price-high', label: '料金が高い順' },
];

export const bathroomTypeOptions = [
  { id: '', label: '指定なし' },
  { id: 'separate', label: 'バストイレ別' },
  { id: 'shower-only', label: 'シャワーブース' },
];

export const guestOptions = Array.from({ length: 10 }, (_, i) => ({
  id: String(i + 1),
  label: `${i + 1}名`,
}));
