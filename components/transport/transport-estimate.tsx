'use client'

import { useState } from 'react'
import { Truck, MapPin } from 'lucide-react'
import { formatYen } from '@/lib/data'
import {
  estimateDistanceKm,
  estimateTransportFee,
  prefectureNames,
  transportBaseRate,
} from '@/lib/transport-fee'

export function TransportEstimate({
  category,
  fromPrefecture,
}: {
  category: string
  fromPrefecture: string
}) {
  const [to, setTo] = useState('')
  const distance = to ? estimateDistanceKm(fromPrefecture, to) : undefined

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Truck className="size-4 text-primary" />
        引越し料金のめやす
      </h3>
      <div className="mt-4 grid grid-cols-[1fr_1.3fr] items-end gap-3">
        <div className="min-w-0 pb-3">
          <p className="text-xs text-muted-foreground">出発地</p>
          <p className="mt-2 flex items-center gap-1 text-sm font-medium text-foreground">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            {fromPrefecture}
          </p>
        </div>
        <label className="block min-w-0">
          <span className="text-xs text-muted-foreground">
            届け先の都道府県
          </span>
          <select
            aria-label="届け先の都道府県"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <option value="">選択してください</option>
            {prefectureNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
        aria-live="polite"
      >
        <p className="text-xs text-muted-foreground">
          {distance === undefined ? '基準額' : `約${distance}km`}
        </p>
        <p className="font-display text-lg font-bold text-primary">
          {distance === undefined
            ? `${formatYen(transportBaseRate(category))}〜`
            : `目安 ${formatYen(estimateTransportFee(category, distance))}`}
        </p>
      </div>
    </div>
  )
}
