## Demo

https://furo-tabi.mui-co.workers.dev/

# 1. プロダクトビジョン

「風呂トイレ別の宿を、誰もが簡単に見つけられる世界を創る」

# 2. コア・バリュー（三原則）

- **Physical First**: 風呂トイレ別、シャワーブースのみの２つの条件をもとに宿泊施設を厳選。無駄な情報は省き、所在地、風呂情報（バストイレ別、シャワーブースのみの部屋がどのグレードか）、大浴場、サウナの有無等の情報に厳選して提供。
- **URL Driven**: `nuqs` を活用し、検索条件（エリア、浴室タイプ、日付、人数、価格帯、設備タグ、並び順、ページ）をURLパラメータに同期。共有リンクと戻る/進む操作に強い検索体験を実現する。
- **Hybrid Fetch**: リアルタイムな空室・価格（楽天API）と、信頼された設備データ（Supabase）をサーバーサイドで結合する。

# 3. 画面設計・機能要件

## 3.1. 検索パネル (Search Panel)

- **エリア選択**: 都道府県をモーダル（Base UI Dialog）で複数選択。候補は楽天 `GetAreaClass` API から取得し、地域（北海道/東北/関東...）ごとに開閉して選ぶ。
- **日付・人数**: チェックイン/アウト日、大人人数（楽天APIの必須パラメータ）。デフォルトは今日から14日後チェックイン、15日後チェックアウト、大人2名。
- **設備タグ (Toggle)**: 「サウナ」「露天風呂」「入浴剤あり」など、Supabase側のフラグでフィルタリング。

## 3.2. 検索結果一覧 (Hotel List)

- **表示項目**: 施設名、最安料金（税込）、施設画像、レビュー平均点。
- **ソート**: おすすめ順（DBのおすすめランク順）/ 料金の安い順 / 料金の高い順（デフォルトはおすすめ順）。
- **外部リンク**: 楽天トラベルの施設ページへダイレクトに遷移。別タブで開く。

# 4. ブランドアセット

| ファイル | パス | 用途 |
|---|---|---|
| favicon.ico | `app/favicon.ico` | ブラウザタブ |
| icon.svg | `app/icon.svg` | 汎用アイコン（Web、SNSプロフィール等） |
| apple-icon.png | `app/apple-icon.png` | Apple タッチアイコン |

広告・SNS・OGP等で使用する場合は上記ファイルを利用してください。

# 5. システムアーキテクチャ

## 5.1. データフロー詳細

1.  **Request**: フロントエンドから `/api/hotels?areas=tokyo,kanagawa,...&checkin=...&checkout=...&guests=...&min_price=...&max_price=...&tags=...` へGETリクエスト。
2.  **Filter (Supabase)**: 指定されたエリアコードと設備タグに合致する `hotel_id` を抽出。
    - この際、`is_verified = true`（風呂トイレ別確定）のもののみを対象とする。
3.  **Fetch (Rakuten API)**: `vacantHotelSearch` を実行。エリア内の空室がある宿を取得。
4.  **Intersection (Logic)**: 楽天の空室リストの中から、SupabaseのIDリストに含まれるものだけを抽出（フィルター）。
5.  **Response**: 抽出された宿情報を、定義したJSONフォーマットでフロントに返却。

## 5.2. URL同期（nuqs）

`app/page.tsx` では `nuqs` の `useQueryStates` で以下をURL同期する:

- `areas`（カンマ区切り複数）
- `bathroomType`
- `checkin`
- `checkout`
- `guests`
- `min_price`
- `max_price`
- `has_large_bath`
- `has_sauna`
- `sort`
- `page`

これにより、URLを共有すると同じ検索条件を再現できる。

## 5.3. バリデーション方針（フロント + サーバー）

同じルールをフロントと `/api/hotels` の両方で検証する:

- `checkin < checkout`
- `guests >= 1`（整数）
- `min_price <= max_price`（両方指定時）

不正値の場合:

- フロント: 検索実行を中断し、入力エラーメッセージを表示
- サーバー: `400 Bad Request` と明示的なエラーメッセージを返却
