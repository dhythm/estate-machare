import type { Metadata } from 'next'
import Link from 'next/link'
import { Repeat2, ShoppingCart, Tag, Truck } from 'lucide-react'
import { PageIntro, PageShell } from '@/components/page-shell'
import { Badge } from '@/components/badge'

export const metadata: Metadata = { title: 'はじめての方へ | Agri Machare' }

const roles = [
  {
    icon: Tag,
    title: '売る・貸す',
    body: '使わない期間だけ貸す、買い替えで手放す。出品フォームから機種・状態・価格を登録すると、販売とレンタルをまとめて募集できます。',
    href: '/listings/new',
    action: '出品する',
  },
  {
    icon: Repeat2,
    title: '借りる',
    body: '必要な期間だけレンタル。農機具の詳細で利用日を選び、申込み後はマイページで承認状況を確認できます。',
    href: '/listings?deal=rent',
    action: 'レンタルできる農機具を探す',
  },
  {
    icon: ShoppingCart,
    title: '買う',
    body: '写真・状態・稼働時間を確認して、出品者に問い合わせ。マイページのメッセージで条件を相談し、取引を進めます。',
    href: '/listings?deal=sale',
    action: '販売中の農機具を探す',
  },
  {
    icon: Truck,
    title: '運ぶ',
    body: '空きトラックや帰り便で農機具を運び、報酬を受け取ります。運搬者登録のあと、案件に応募できます。',
    href: '/transport',
    action: '運搬案件を見る',
  },
]

const purchaseOptionSteps = [
  {
    title: 'まず借りて試す',
    body: '「レンタル購入可」の農機具を短期レンタル。自分の圃場・作業に合うかを実機で確かめます。',
  },
  {
    title: '気に入ったら購入へ',
    body: 'レンタル中はマイページから購入に切り替えられます。申込み時の充当条件で購入価格が決まります。',
  },
  {
    title: 'レンタル料を一部充当',
    body: '支払い済みレンタル料の一部（出品者が設定した割合・上限）を購入価格に充当。試した分が無駄になりません。',
  },
]

export default function GuidePage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <p className="eyebrow mb-5">HOW AGRI MACHARE WORKS</p>
        <PageIntro
          title="はじめての方へ"
          description="農機具を売る、買う、借りる、運ぶ。あなたに合う入口から、次のつながりを。出品・申込み・問い合わせにはログインが必要です。"
        />

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-foreground">
            4つの使い方
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {roles.map(({ icon: Icon, title, body, href, action }) => (
              <div
                key={title}
                className="flex flex-col rounded-2xl border border-border bg-card p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
                <Link
                  href={href}
                  className="mt-4 text-sm font-medium text-primary"
                >
                  {action} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section id="purchase-option" className="mt-12 scroll-mt-20">
          <Badge variant="accent">
            <Repeat2 className="size-3.5" />
            レンタル購入
          </Badge>
          <h2 className="mt-3 font-display text-xl font-bold text-foreground">
            「借りて、良ければ買う」の流れ
          </h2>
          <ol className="mt-4 grid gap-4 md:grid-cols-3">
            {purchaseOptionSteps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <span className="font-display text-sm font-bold text-accent-foreground">
                  0{index + 1}
                </span>
                <h3 className="mt-1 font-medium text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <Link
            href="/listings?deal=purchaseOption"
            className="mt-4 inline-block text-sm font-medium text-primary"
          >
            レンタル購入できる農機具を探す →
          </Link>
        </section>

        <section className="mt-12 rounded-2xl bg-secondary p-7 sm:p-10">
          <h2 className="font-display text-xl font-bold text-foreground">
            安心して取引するために
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">
                やり取りをひとつの場所に。
              </strong>
              問い合わせ・応募・返信をマイページで確認できます。現在はコンセプト検証版のため、実際の取引・決済は行われません。
            </li>
            <li>
              <strong className="text-foreground">状態の記録。</strong>
              年式・稼働時間・整備記録を出品時に登録し、詳細ページで確認できます。
            </li>
            <li>
              <strong className="text-foreground">運搬もまとめて。</strong>
              遠方の農機具は運搬チャネルで配送を手配できます。料金は
              <Link href="/transport/pricing" className="text-primary">
                料金のめやす
              </Link>
              を参照してください。
            </li>
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            ほかに気になることは
            <Link href="/faq" className="mx-1 text-primary">
              よくある質問
            </Link>
            または
            <Link href="/contact" className="mx-1 text-primary">
              お問い合わせ
            </Link>
            から。
          </p>
        </section>
      </div>
    </PageShell>
  )
}
