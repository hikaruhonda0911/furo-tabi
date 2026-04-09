import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | 風呂旅',
  description: '風呂旅（ふろたび）のプライバシーポリシーです。',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <Image src="/icon.svg" alt="風呂旅" width={72} height={40} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-8 font-serif text-2xl tracking-wide font-light">
          プライバシーポリシー
        </h1>
        <p className="mb-4 text-sm text-muted">最終更新日: 2026年3月13日</p>
        <p className="mb-10 text-sm leading-7 text-foreground/90">
          風呂旅（ふろたび）（以下「本サービス」といいます）の運営者（以下「運営者」といいます）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。本プライバシーポリシーでは、本サービスにおける情報の取り扱いについて説明します。
        </p>

        <div className="space-y-10 text-sm leading-7 text-foreground/90">
          <section>
            <h2 className="mb-4 text-base font-medium">1. 収集する情報</h2>

            <h3 className="mb-2 mt-4 text-sm font-medium">
              1-1. お問い合わせ情報
            </h3>
            <p>
              お問い合わせフォームをご利用いただいた際に、以下の情報をご提供いただく場合があります。
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>お名前（ニックネーム可）</li>
              <li>メールアドレス</li>
              <li>お問い合わせ内容</li>
            </ul>
            <p className="mt-2">
              これらの情報は、ユーザーが自発的に入力した場合にのみ取得します。
            </p>

            <h3 className="mb-2 mt-6 text-sm font-medium">
              1-2. アクセスログ情報
            </h3>
            <p>
              本サイトへのアクセス時に、サーバーが自動的に以下の情報を記録する場合があります。
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>IPアドレス</li>
              <li>ブラウザの種類・バージョン</li>
              <li>オペレーティングシステム</li>
              <li>アクセス日時</li>
              <li>参照元URL（リファラー）</li>
              <li>閲覧したページ</li>
            </ul>

            <h3 className="mb-2 mt-6 text-sm font-medium">
              1-3. Cookie（クッキー）情報
            </h3>
            <p>本サイトでは、以下の目的でCookieを使用しています。</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium">アクセス解析用Cookie:</span>{' '}
                Google Analyticsによるサイト利用状況の分析
              </li>
              <li>
                <span className="font-medium">アフィリエイト用Cookie:</span>{' '}
                楽天トラベル、Booking.com等のアフィリエイトプログラムに関連するCookie
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">
              2. Google Analyticsの使用について
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                本サイトでは、Googleが提供するアクセス解析ツール「Google
                Analytics」を使用しています。
              </li>
              <li>
                Google
                Analyticsは、Cookieを使用してユーザーのサイト利用状況に関するデータを収集します。このデータは匿名で収集されており、個人を特定するものではありません。
              </li>
              <li>
                Google Analyticsによるデータ収集の仕組みについては、
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:opacity-70"
                >
                  Googleのプライバシーポリシー
                </a>
                および
                <a
                  href="https://marketingplatform.google.com/about/analytics/terms/jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:opacity-70"
                >
                  Google Analyticsの利用規約
                </a>
                をご確認ください。
              </li>
              <li>
                Google Analyticsによるデータ収集を望まない場合は、
                <a
                  href="https://tools.google.com/dlpage/gaoptout?hl=ja"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:opacity-70"
                >
                  Google Analyticsオプトアウトアドオン
                </a>
                をご利用いただくことで無効化できます。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">
              3. アフィリエイトCookieについて
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                本サイトには、楽天トラベル、Booking.com等のアフィリエイトプログラムを利用したリンクが含まれています。
              </li>
              <li>
                これらのリンクをクリックした際、各アフィリエイトプログラムのCookieがユーザーのブラウザに保存される場合があります。
              </li>
              <li>
                アフィリエイトCookieは、ユーザーがどのサイトを経由して予約サイトにアクセスしたかを追跡するために使用されます。
              </li>
              <li>
                アフィリエイトCookieの取り扱いについては、各アフィリエイトプログラム提供元のプライバシーポリシーをご確認ください。
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    <a
                      href="https://privacy.rakuten.co.jp/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:opacity-70"
                    >
                      楽天グループのプライバシーポリシー
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.booking.com/content/privacy.ja.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:opacity-70"
                    >
                      Booking.comのプライバシーポリシー
                    </a>
                  </li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">4. 情報の利用目的</h2>
            <p className="mb-2">収集した情報は、以下の目的で利用します。</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <span className="font-medium">お問い合わせへの対応:</span>{' '}
                ユーザーからのお問い合わせに回答するため
              </li>
              <li>
                <span className="font-medium">サービスの改善:</span>{' '}
                アクセス解析データをもとに、本サービスの機能改善やコンテンツの充実を図るため
              </li>
              <li>
                <span className="font-medium">サービスの維持・運営:</span>{' '}
                不正アクセスの検知やシステムの安定運用のため
              </li>
              <li>
                <span className="font-medium">統計データの作成:</span>{' '}
                個人を特定できない形でのアクセス統計の作成・分析のため
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">
              5. 第三者への情報提供
            </h2>
            <p className="mb-2">
              運営者は、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>ユーザー本人の同意がある場合</li>
              <li>
                法令に基づく場合（裁判所、警察等の公的機関からの法的な要請があった場合）
              </li>
              <li>
                人の生命、身体または財産の保護のために必要であり、本人の同意を得ることが困難な場合
              </li>
            </ol>
            <p className="mt-2">
              ただし、Google
              Analytics等の外部サービスへのアクセスデータの送信については、本ポリシーに記載のとおり行っています。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">
              6. 情報の保管と安全管理
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                お問い合わせにより取得した個人情報は、対応完了後、合理的な期間が経過した後に削除します。
              </li>
              <li>
                運営者は、取得した情報の漏洩、滅失、毀損を防止するため、合理的な安全管理措置を講じます。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">7. Cookieの管理方法</h2>
            <p>
              ユーザーは、ブラウザの設定により、Cookieの受け入れを制御することができます。
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium">Cookieの無効化:</span>{' '}
                ブラウザの設定でCookieを無効にすることができます。ただし、一部の機能が正常に動作しなくなる場合があります。
              </li>
              <li>
                <span className="font-medium">Cookieの削除:</span>{' '}
                ブラウザの設定で、保存済みのCookieを削除することができます。
              </li>
            </ul>
            <p className="mt-4">主要ブラウザのCookie設定方法：</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647?hl=ja"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:opacity-70"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/ja-jp/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:opacity-70"
                >
                  Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/ja/kb/enhanced-tracking-protection-firefox-desktop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:opacity-70"
                >
                  Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/ja-jp/microsoft-edge/microsoft-edge-%E3%81%A7-cookie-%E3%82%92%E5%89%8A%E9%99%A4%E3%81%99%E3%82%8B-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:opacity-70"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">8. ユーザーの権利</h2>
            <p className="mb-2">
              ユーザーは、個人情報の保護に関する法律（個人情報保護法）に基づき、運営者が保有するご自身の個人情報について、以下の請求を行うことができます。
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>利用目的の通知</li>
              <li>開示</li>
              <li>内容の訂正、追加または削除</li>
              <li>利用の停止または消去</li>
              <li>第三者への提供の停止</li>
            </ol>
            <p className="mt-2">
              これらの請求を行う場合は、本サイト内のお問い合わせフォームよりご連絡ください。ご本人確認のうえ、合理的な期間内に対応いたします。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">
              9. 未成年者の利用について
            </h2>
            <p>
              本サービスは、未成年者の個人情報を意図的に収集することはありません。未成年者がお問い合わせフォームを利用する場合は、保護者の同意を得たうえでご利用ください。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">
              10. プライバシーポリシーの変更
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                運営者は、必要に応じて本プライバシーポリシーを変更する場合があります。
              </li>
              <li>
                変更後のプライバシーポリシーは、本サイト上に掲載した時点で効力を生じます。
              </li>
              <li>
                重要な変更を行う場合は、本サイト上で告知するよう努めます。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">11. お問い合わせ</h2>
            <p>
              本プライバシーポリシーに関するお問い合わせは、本サイト内のお問い合わせフォームよりご連絡ください。
            </p>
          </section>
        </div>
      </main>

      <footer className="mt-16 border-t border-border bg-white">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center text-sm text-muted">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            ← 風呂旅トップに戻る
          </Link>
        </div>
      </footer>
    </div>
  );
}
