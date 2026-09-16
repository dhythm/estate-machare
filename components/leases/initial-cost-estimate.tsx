'use client'

import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { formatYen } from '@/lib/data'
import { brokerageFeeMonths, calculateInitialCost } from '@/lib/lease'

const termChoices = [12, 24, 36]

export function InitialCostEstimate({
  rentPerMonth,
  depositMonths,
  keyMoneyMonths,
}: {
  rentPerMonth: number
  depositMonths?: number
  keyMoneyMonths?: number
}) {
  const [months, setMonths] = useState(termChoices[0])
  const cost = calculateInitialCost({
    rentPerMonth,
    depositMonths,
    keyMoneyMonths,
  })
  const rows = [
    { label: '前家賃（1か月）', value: cost.rent },
    { label: `敷金（${depositMonths ?? 0}か月）`, value: cost.deposit },
    { label: `礼金（${keyMoneyMonths ?? 0}か月）`, value: cost.keyMoney },
    {
      label: `仲介手数料（${brokerageFeeMonths}か月）`,
      value: cost.brokerageFee,
    },
  ]

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Wallet className="size-4 text-primary" />
        初期費用のめやす
      </h3>
      <dl className="mt-4 space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-2"
          >
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium text-foreground">
              {formatYen(row.value)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">入居時の合計</p>
        <p className="font-display text-lg font-bold text-primary">
          {formatYen(cost.total)}
        </p>
      </div>
      <label className="mt-4 block">
        <span className="text-xs text-muted-foreground">契約期間</span>
        <select
          aria-label="契約期間"
          value={months}
          onChange={(event) => setMonths(Number(event.target.value))}
          className="mt-2 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {termChoices.map((choice) => (
            <option key={choice} value={choice}>
              {choice}か月
            </option>
          ))}
        </select>
      </label>
      <p
        className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
        aria-live="polite"
      >
        <span className="text-xs text-muted-foreground">
          期間中の賃料合計（{months}か月）
        </span>
        <span className="font-display text-lg font-bold text-primary">
          {formatYen(rentPerMonth * months)}
        </span>
      </p>
    </div>
  )
}
