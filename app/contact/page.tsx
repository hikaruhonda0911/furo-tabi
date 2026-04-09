import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'お問い合わせ | 風呂旅',
  description: '風呂旅（ふろたび）へのお問い合わせページです。',
};

export default function ContactPage() {
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
          お問い合わせ
        </h1>

        <div className="space-y-6 text-sm leading-7 text-foreground/90">
          <p>
            風呂旅に関するご質問・ご意見・掲載に関するお問い合わせは、以下のメールアドレスまでご連絡ください。
          </p>

          <div className="rounded-sm border border-border bg-white p-8">
            <p className="mb-2 text-base font-medium">メールでのお問い合わせ</p>
            <a
              href="mailto:contact@furotabi.jp"
              className="text-primary-500 underline underline-offset-4"
            >
              contact@furotabi.jp
            </a>
          </div>

          <div className="space-y-2 text-muted">
            <p>※ 返信にはお時間をいただく場合がございます。</p>
            <p>
              ※
              ホテルの予約・キャンセルに関するお問い合わせは、各予約サイトへ直接ご連絡ください。
            </p>
          </div>
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
