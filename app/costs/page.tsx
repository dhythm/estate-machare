import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calculator, Handshake } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { BackLink } from '@/components/back-link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatYen } from '@/lib/data'
import {
  brokerageFeeMonths,
  calculateInitialCost,
  categoryInitialCostMonths,
  defaultInitialCostMonths,
} from '@/lib/lease'

export const metadata: Metadata = {
  title: '初期費用のめやす | Estate Machare',
}

/** A worked example on the page, so the arithmetic is visible. */
const exampleRent = 150_000
const exampleCategory = 'マンション'

export default function InitialCostPage() {
  const example = calculateInitialCost({
    rentPerMonth: exampleRent,
    ...categoryInitialCostMonths[exampleCategory],
  })
  const breakdown = [
    { label: '前家賃', value: example.rent, months: 1 },
    {
      label: '敷金',
      value: example.deposit,
      months: categoryInitialCostMonths[exampleCategory].depositMonths,
    },
    {
      label: '礼金',
      value: example.keyMoney,
      months: categoryInitialCostMonths[exampleCategory].keyMoneyMonths,
    },
    {
      label: '仲介手数料',
      value: example.brokerageFee,
      months: brokerageFeeMonths,
    },
  ]

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <BackLink href="/requests" label="物件リクエストにもどる" />
        <header className="mt-8 grid gap-6 rounded-2xl bg-primary p-6 text-primary-foreground sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium tracking-[0.16em] text-primary-foreground/65">
              <Calculator className="size-4" />
              INITIAL COST
            </p>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              初期費用のめやす
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/75">
              入居時にかかる費用を、月額賃料から見通せる。実際の条件は物件ごとに設定し、出品者と相談できます。
            </p>
          </div>
          <div className="rounded-xl border border-primary-foreground/20 p-5 text-center">
            <p className="text-xs text-primary-foreground/65">計算方法</p>
            <p className="mt-3 text-lg font-semibold">
              月額賃料 <span className="px-2 text-accent">×</span>{' '}
              前家賃・敷金・礼金・仲介手数料の月数
            </p>
          </div>
        </header>
        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1.25fr_1fr]">
          <section>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground">
              01 / CATEGORY
            </p>
            <h2 className="mt-2 font-display text-xl font-bold text-foreground">
              カテゴリ別の相場（月数）
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              仲介手数料は一律で賃料{brokerageFeeMonths}か月分
            </p>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-4 font-medium">
                      カテゴリ
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-right font-medium"
                    >
                      敷金
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-right font-medium"
                    >
                      礼金
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(categoryInitialCostMonths).map(
                    ([category, months]) => (
                      <tr key={category}>
                        <th
                          scope="row"
                          className="whitespace-nowrap px-4 py-5 text-left font-medium text-foreground"
                        >
                          {category}
                        </th>
                        <td className="whitespace-nowrap px-4 py-5 text-right font-display font-bold text-primary">
                          {months.depositMonths}か月
                        </td>
                        <td className="whitespace-nowrap px-4 py-5 text-right font-display font-bold text-primary">
                          {months.keyMoneyMonths}か月
                        </td>
                      </tr>
                    ),
                  )}
                  <tr>
                    <th
                      scope="row"
                      className="px-4 py-5 text-left font-medium text-foreground"
                    >
                      その他
                    </th>
                    <td className="px-4 py-5 text-right font-display font-bold text-primary">
                      {defaultInitialCostMonths.depositMonths}か月
                    </td>
                    <td className="px-4 py-5 text-right font-display font-bold text-primary">
                      {defaultInitialCostMonths.keyMoneyMonths}か月
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground">
              02 / BREAKDOWN
            </p>
            <h2 className="mt-2 font-display text-xl font-bold text-foreground">
              内訳
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {breakdown.map((row) => (
                <div
                  key={row.label}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <p className="text-xs text-muted-foreground">
                    {row.label}（{row.months}か月）
                  </p>
                  <p className="mt-3 font-display text-2xl font-bold tracking-tight text-primary">
                    {formatYen(row.value)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-secondary p-5">
              <p className="text-xs font-medium text-secondary-foreground">
                例：月額 {formatYen(exampleRent)} の{exampleCategory}
              </p>
              <p className="mt-3 text-sm text-secondary-foreground">
                {formatYen(exampleRent)} ×{' '}
                {1 +
                  categoryInitialCostMonths[exampleCategory].depositMonths +
                  categoryInitialCostMonths[exampleCategory].keyMoneyMonths +
                  brokerageFeeMonths}
                か月
              </p>
              <p className="mt-1 font-display text-3xl font-bold tracking-tight text-primary">
                {formatYen(example.total)}
              </p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                火災保険料・鍵交換費用は物件ごとに異なります。
              </p>
            </div>
          </section>
        </div>
        <section className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-[auto_1fr_auto] sm:items-start">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
            <Handshake className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              提案から入居まで
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
              提案後はメッセージで内見日や条件を調整します。入居後は募集者がマイページで成約を記録できます。
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Link
              href="/requests"
              className={cn(buttonVariants(), 'h-11 px-4')}
            >
              募集中のリクエストを見る
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/requests/register"
              className="text-sm font-medium text-primary"
            >
              担当者として登録する
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
