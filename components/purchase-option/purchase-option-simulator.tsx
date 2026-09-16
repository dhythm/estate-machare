'use client'

import { useState } from 'react'
import { Calculator } from 'lucide-react'
import { formatYen } from '@/lib/data'
import {
  calculatePurchaseOption,
  type PurchaseOptionTerms,
} from '@/lib/purchase-option'

export function PurchaseOptionSimulator({
  terms,
}: {
  terms: PurchaseOptionTerms
}) {
  const [months, setMonths] = useState(24)
  const estimate = calculatePurchaseOption(terms, Math.max(0, months))
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="p-4">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Calculator className="size-4 text-primary" />
          購入充当シミュレーション
        </h3>
        <div className="mt-4 flex items-center justify-between gap-3">
          <label
            htmlFor="purchase-option-months"
            className="text-xs font-medium text-muted-foreground"
          >
            契約期間
          </label>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              id="purchase-option-months"
              type="number"
              min={1}
              max={360}
              value={months}
              onChange={(event) => setMonths(Number(event.target.value) || 0)}
              className="h-10 w-24 rounded-lg border border-border bg-card px-3 text-right text-sm font-medium tabular-nums text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            か月
          </div>
        </div>
        <dl className="mt-4 grid gap-3 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">賃料合計</dt>
            <dd className="font-medium text-foreground">
              {formatYen(estimate.rentTotal)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              充当額（{terms.creditRate}%
              {terms.creditCap !== undefined &&
                `・上限 ${formatYen(terms.creditCap)}`}
              ）
            </dt>
            <dd className="shrink-0 font-semibold text-primary">
              {formatYen(estimate.credit)}
            </dd>
          </div>
        </dl>
      </div>
      <dl className="bg-secondary px-4 py-3" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-xs font-medium text-secondary-foreground">
            購入時の支払い
          </dt>
          <dd className="font-display text-xl font-bold tracking-tight text-primary">
            {formatYen(estimate.purchasePrice)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
