import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '利用規約 | 風呂旅',
  description: '風呂旅（ふろたび）の利用規約です。',
};

export default function TermsPage() {
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
          利用規約
        </h1>
        <p className="mb-10 text-sm text-muted">最終更新日: 2026年3月13日</p>

        <div className="space-y-10 text-sm leading-7 text-foreground/90">
          <section>
            <h2 className="mb-4 text-base font-medium">
              第1条（サービスの定義）
            </h2>
            <p>
              「風呂旅（ふろたび）」（以下「本サービス」といいます）は、バストイレ別またはシャワーブースオンリーの客室を持つホテルを検索できる情報提供サイトです。本サービスは本サイト上で提供されます。
            </p>
            <p className="mt-2">
              本サービスの運営者（以下「運営者」といいます）は個人であり、法人ではありません。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">
              第2条（規約への同意）
            </h2>
            <p>
              本サービスをご利用いただいた時点で、本利用規約（以下「本規約」といいます）に同意したものとみなします。本規約に同意いただけない場合は、本サービスのご利用をお控えください。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">
              第3条（サービスの内容）
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                本サービスは、ホテルの客室タイプに関する検索機能を提供する情報提供サイトです。
              </li>
              <li>
                本サービスには、楽天トラベル、Booking.com
                等の外部アフィリエイトサービスへのリンク（以下「アフィリエイトリンク」といいます）が含まれます。
              </li>
              <li>
                ホテルの予約・決済は、すべて外部の予約サイト上で行われます。本サービス上で予約や決済を行う機能はありません。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">
              第4条（アフィリエイトリンクに関する開示）
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                本サイトに掲載されているホテルへのリンクの一部または全部は、アフィリエイトプログラムを利用したリンクです。
              </li>
              <li>
                ユーザーがアフィリエイトリンクを経由して外部サイトで予約等を行った場合、運営者がアフィリエイト報酬を受け取ることがあります。
              </li>
              <li>
                アフィリエイトリンクの利用により、ユーザーに追加の費用が発生することはありません。
              </li>
              <li>
                アフィリエイト報酬の有無が、掲載するホテルの選定や表示順序に影響を与えることはありません。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">第5条（免責事項）</h2>
            <ol className="list-decimal space-y-3 pl-5">
              <li>
                <span className="font-medium">ホテル情報の正確性について:</span>{' '}
                本サービスに掲載されているホテル情報（客室タイプ、料金、設備、写真等）は、外部サービスや公開情報に基づいて提供しています。情報の正確性・最新性について、運営者は最善を尽くしますが、その完全性を保証するものではありません。
              </li>
              <li>
                <span className="font-medium">空室状況・料金について:</span>{' '}
                空室状況や宿泊料金は常に変動します。本サイトに表示された情報と、実際の予約サイトでの情報が異なる場合があります。最新の情報は、必ず各予約サイトにてご確認ください。
              </li>
              <li>
                <span className="font-medium">外部サイトでの予約について:</span>{' '}
                ホテルの予約は外部の予約サイト上で行われるため、予約に関するトラブル（キャンセル、変更、返金、宿泊施設とのトラブル等）について、運営者は一切の責任を負いません。
              </li>
              <li>
                <span className="font-medium">外部サイトについて:</span>{' '}
                本サイトからリンクする外部サイトの内容、サービス、プライバシーポリシー等について、運営者は一切の責任を負いません。
              </li>
              <li>
                <span className="font-medium">サービスの中断・停止:</span>{' '}
                運営者は、メンテナンスやシステム障害等の理由により、予告なく本サービスの全部または一部を中断・停止する場合があります。これによりユーザーに生じた損害について、運営者は責任を負いません。
              </li>
              <li>
                <span className="font-medium">損害について:</span>{' '}
                本サービスの利用により生じたいかなる損害についても、運営者の故意または重大な過失による場合を除き、運営者は責任を負いません。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">第6条（禁止事項）</h2>
            <p className="mb-2">
              ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                本サイトのコンテンツを無断で複製、転載、改変、販売する行為
              </li>
              <li>
                スクレイピング、クローリング等により本サイトに過度なアクセスを行う行為
              </li>
              <li>本サービスの運営を妨害する行為</li>
              <li>不正アクセス、またはそれを試みる行為</li>
              <li>他のユーザーや第三者の権利を侵害する行為</li>
              <li>本サービスを利用して、虚偽の情報を流布する行為</li>
              <li>法令または公序良俗に反する行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">第7条（知的財産権）</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                本サイトに掲載されたコンテンツ（テキスト、画像、デザイン、ロゴ、プログラム等）に関する著作権その他の知的財産権は、運営者または正当な権利者に帰属します。
              </li>
              <li>
                ホテルの画像や情報の一部は、外部サービスの提供するデータに基づいています。それらの著作権は各権利者に帰属します。
              </li>
              <li>
                ユーザーは、私的利用の範囲を超えて本サイトのコンテンツを使用することはできません。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">第8条（規約の変更）</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                運営者は、必要と判断した場合、ユーザーへの事前の通知なく本規約を変更できるものとします。
              </li>
              <li>
                変更後の利用規約は、本サイト上に掲載した時点で効力を生じます。
              </li>
              <li>
                規約変更後に本サービスを利用した場合、変更後の規約に同意したものとみなします。
              </li>
              <li>
                重要な変更を行う場合は、本サイト上で告知するよう努めます。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">
              第9条（準拠法・管轄裁判所）
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>本規約の解釈は、日本法を準拠法とします。</li>
              <li>
                本サービスに関して紛争が生じた場合は、運営者の住所地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-base font-medium">
              第10条（お問い合わせ）
            </h2>
            <p>
              本規約に関するお問い合わせは、本サイト内のお問い合わせフォームよりご連絡ください。
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
