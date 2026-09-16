import type { Metadata } from 'next'
import Link from 'next/link'
import { PageIntro, PageShell } from '@/components/page-shell'

export const metadata: Metadata = { title: 'よくある質問 | Estate Machare' }

const groups = [
  {
    title: '物件探し・内見について',
    items: [
      {
        q: '購入と賃貸の両方で探せますか？',
        a: '物件一覧で「買う」「借りる」を切り替えられます。エリアや物件種別で絞り込み、価格・間取り・面積を比較できます。',
      },
      {
        q: '内見や入居条件はどこから相談できますか？',
        a: '物件詳細の問い合わせから掲載者へ相談できます。希望日時や確認したいことを記入し、返信はマイページで確認してください。',
      },
      {
        q: 'このサービスで契約・決済できますか？',
        a: '現在はコンセプト検証版です。検索・問い合わせ・申込み・メッセージの流れを確認できますが、実際の契約や決済は行われません。',
      },
    ],
  },
  {
    title: '物件掲載について',
    items: [
      {
        q: '掲載に費用はかかりますか？',
        a: '現在のコンセプト検証版では、掲載料や成約手数料は請求されません。',
      },
      {
        q: 'どのような情報を掲載できますか？',
        a: '物件写真、所在地、築年、間取り、面積、売買価格や月額賃料を登録できます。売買と賃貸の両方で募集することもできます。',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <PageIntro title="よくある質問" />
        {groups.map((group) => (
          <section key={group.title} className="mt-10">
            <h2 className="font-display text-lg font-bold text-foreground">
              {group.title}
            </h2>
            <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
              {group.items.map((item) => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-medium text-foreground marker:hidden after:text-xl after:font-normal after:text-primary after:content-['+'] group-open:after:content-['−']">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <p className="mt-10 text-sm text-muted-foreground">
          解決しない場合は
          <Link href="/contact" className="mx-1 text-primary">
            お問い合わせ
          </Link>
          からご連絡ください。
        </p>
      </div>
    </PageShell>
  )
}
