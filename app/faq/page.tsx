import type { Metadata } from 'next'
import Link from 'next/link'
import { PageIntro, PageShell } from '@/components/page-shell'

export const metadata: Metadata = { title: 'よくある質問 | Estate Machare' }

const groups = [
  {
    title: '取引について',
    items: [
      {
        q: '買取オプションでは、賃料はいくら充当されますか？',
        a: '支払い済み賃料のうち、出品者が設定した割合（多くは 50%）を購入価格に充当します。割合と上限は詳細ページの「賃貸して試す → 購入」に表示され、日数を入れると充当額と購入価格を確認できます。',
      },
      {
        q: 'このサービスで決済できますか？',
        a: '現在はコンセプト検証版で、実際の取引・決済は行われません。物件の検索、申込み、メッセージ、取引管理の流れを確認できます。',
      },
      {
        q: '入居中に故障した場合はどうなりますか？',
        a: '出品者とのメッセージで状況を共有してください。貸し出し条件や整備状況は、物件の詳細と申込み前のやり取りで確認できます。',
      },
    ],
  },
  {
    title: '出品について',
    items: [
      {
        q: '出品に費用はかかりますか？',
        a: '現在のコンセプト検証版では、掲載料や成約手数料は請求されません。',
      },
      {
        q: '販売と賃貸の両方で出品できますか？',
        a: 'できます。出品フォームで両方を選ぶと、買取オプションの受け付けも設定できます。',
      },
    ],
  },
  {
    title: '物件リクエストについて',
    items: [
      {
        q: '担当者になるには資格が必要ですか？',
        a: '宅地建物取引業の免許が必要な場合があります。個人のオーナーとして自分の物件を提案する場合は不要です。',
      },
      {
        q: '物件リクエストの報酬はどのように決まりますか？',
        a: '依頼者が種類と距離をもとに設定します。基準額は「料金のめやす」を参照してください。',
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
