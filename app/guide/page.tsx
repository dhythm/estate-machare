import type { Metadata } from 'next'
import Link from 'next/link'
import { Repeat2, ShoppingCart, Tag, Truck } from 'lucide-react'
import { PageIntro, PageShell } from '@/components/page-shell'
import { Badge } from '@/components/badge'

export const metadata: Metadata = { title: 'はじめての方へ | Estate Machare' }

const roles = [
  {
    icon: Tag,
    title: '売る・貸す',
    body: '住み替えで売却する、所有物件を貸し出す。所在地・間取り・面積・価格を登録し、購入希望者や入居希望者を募ります。',
    href: '/listings/new',
    action: '掲載する',
  },
  {
    icon: Repeat2,
    title: '借りる',
    body: 'エリア・家賃・間取りから住まいを検索。気になる物件は内見や入居条件を相談し、マイページでやり取りを確認できます。',
    href: '/listings?deal=rent',
    action: '賃貸できる物件を探す',
  },
  {
    icon: ShoppingCart,
    title: '買う',
    body: '写真・価格・間取り・周辺環境を比較。気になる物件の掲載者に内見や購入条件を相談できます。',
    href: '/listings?deal=sale',
    action: '販売中の物件を探す',
  },
  {
    icon: Truck,
    title: '引越す',
    body: '新しい住まいへの引越しや家具配送を相談。荷物量・区間・希望日を登録して、対応できるパートナーを探します。',
    href: '/transport',
    action: '引越し案件を見る',
  },
]

const searchSteps = [
  {
    title: '条件に合う物件を探す',
    body: 'エリア・価格・間取りを比較して、気になる住まいを見つけます。',
  },
  {
    title: '内見・条件を相談する',
    body: '掲載者へ問い合わせ。内見希望日や入居時期をメッセージで調整します。',
  },
  {
    title: '新生活の準備へ',
    body: '条件を確認し、引越し先が決まったら家具配送や引越しも相談できます。',
  },
]

export default function GuidePage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <p className="eyebrow mb-5">HOW ESTATE MACHARE WORKS</p>
        <PageIntro
          title="はじめての方へ"
          description="買う、借りる、売る、貸す。物件探しから新しい暮らしまで、あなたに合う入口から。"
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

        <section id="find-your-home" className="mt-12 scroll-mt-20">
          <Badge variant="accent">
            <Repeat2 className="size-3.5" />
            住まい探しの流れ
          </Badge>
          <h2 className="mt-3 font-display text-xl font-bold text-foreground">
            見つける、その先まで。
          </h2>
          <ol className="mt-4 grid gap-4 md:grid-cols-3">
            {searchSteps.map((step, index) => (
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
            href="/listings"
            className="mt-4 inline-block text-sm font-medium text-primary"
          >
            あなたに合う物件を探す →
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
              所在地・築年・間取り・面積を掲載時に登録し、詳細ページで確認できます。
            </li>
            <li>
              <strong className="text-foreground">引越しもまとめて。</strong>
              入居先への家具配送や引越しを相談できます。料金は
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
