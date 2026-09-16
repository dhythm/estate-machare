'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  categories,
  isLayout,
  isListingSort,
  layouts,
  listingSortLabels,
  listingSorts,
  type DealFilter,
  type ListingFilter,
} from '@/lib/data'
import { prefectureNames } from '@/lib/prefectures'

const dealFilters: { id: DealFilter; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'sale', label: '購入できる' },
  { id: 'rent', label: '賃貸できる' },
  { id: 'purchaseOption', label: '買取オプション可' },
]

export function DealFilterToggle({
  value,
  onChange,
}: {
  value: DealFilter
  onChange: (deal: DealFilter) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:inline-flex sm:flex-wrap">
      {dealFilters.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          aria-pressed={value === f.id}
          className={cn(
            'min-h-11 rounded-md px-2 py-2 text-xs font-medium sm:px-3 sm:text-sm transition-colors',
            value === f.id
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

export function CategoryChips({
  value,
  onChange,
}: {
  value: string
  onChange: (category: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={value === c}
          className={cn(
            'min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            value === c
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
          )}
        >
          {c}
        </button>
      ))}
    </div>
  )
}

const yenText = (value: number | undefined) =>
  value === undefined ? '' : String(value)

function readYen(value: string): number | undefined {
  const digits = value.replace(/[,，]/g, '').trim()
  return /^\d+$/.test(digits) ? Number(digits) : undefined
}

const emptyRefinements = {
  prefecture: undefined,
  layout: undefined,
  priceMin: undefined,
  priceMax: undefined,
  sort: undefined,
  availableFrom: undefined,
  availableTo: undefined,
}

const controlClass =
  'h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30'

/** Prefecture, layout, price range, sort, and move-in dates; each change reports only its own keys. */
export function SearchRefinements({
  value,
  onChange,
}: {
  value: ListingFilter
  onChange: (patch: Partial<ListingFilter>) => void
}) {
  const [priceMin, setPriceMin] = useState(yenText(value.priceMin))
  const [priceMax, setPriceMax] = useState(yenText(value.priceMax))
  const [from, setFrom] = useState(value.availableFrom ?? '')
  const [to, setTo] = useState(value.availableTo ?? '')
  const priceLabel = value.deal === 'rent' ? '月額賃料' : '販売価格'
  const active =
    value.prefecture !== undefined ||
    value.layout !== undefined ||
    value.priceMin !== undefined ||
    value.priceMax !== undefined ||
    (value.sort !== undefined && value.sort !== 'newest') ||
    value.availableFrom !== undefined

  const applyDates = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom)
    setTo(nextTo)
    if (nextFrom && nextTo && nextFrom <= nextTo)
      onChange({ availableFrom: nextFrom, availableTo: nextTo })
    else if (!nextFrom && !nextTo)
      onChange({ availableFrom: undefined, availableTo: undefined })
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
        都道府県
        <select
          value={value.prefecture ?? ''}
          onChange={(event) =>
            onChange({ prefecture: event.target.value || undefined })
          }
          className={cn(controlClass, 'w-36')}
        >
          <option value="">すべて</option>
          {prefectureNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
        間取り
        <select
          value={value.layout ?? ''}
          onChange={(event) => {
            const layout = event.target.value
            onChange({ layout: isLayout(layout) ? layout : undefined })
          }}
          className={cn(controlClass, 'w-32')}
        >
          <option value="">すべて</option>
          {layouts.map((layout) => (
            <option key={layout} value={layout}>
              {layout}
            </option>
          ))}
        </select>
      </label>
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          onChange({ priceMin: readYen(priceMin), priceMax: readYen(priceMax) })
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
          {priceLabel}の下限
          <input
            inputMode="numeric"
            value={priceMin}
            onChange={(event) => setPriceMin(event.target.value)}
            placeholder="円"
            className={cn(controlClass, 'w-28')}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
          {priceLabel}の上限
          <input
            inputMode="numeric"
            value={priceMax}
            onChange={(event) => setPriceMax(event.target.value)}
            placeholder="円"
            className={cn(controlClass, 'w-28')}
          />
        </label>
        <button
          type="submit"
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:border-primary/40"
        >
          価格で絞り込む
        </button>
      </form>
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
          入居開始日
          <input
            type="date"
            value={from}
            onChange={(event) => applyDates(event.target.value, to)}
            className={cn(controlClass, 'w-40')}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
          入居終了日
          <input
            type="date"
            value={to}
            onChange={(event) => applyDates(from, event.target.value)}
            className={cn(controlClass, 'w-40')}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
        並び替え
        <select
          value={value.sort ?? 'newest'}
          onChange={(event) => {
            const sort = event.target.value
            onChange({
              sort: isListingSort(sort) && sort !== 'newest' ? sort : undefined,
            })
          }}
          className={cn(controlClass, 'w-44')}
        >
          {listingSorts.map((sort) => (
            <option key={sort} value={sort}>
              {listingSortLabels[sort]}
            </option>
          ))}
        </select>
      </label>
      {active && (
        <button
          type="button"
          onClick={() => {
            setPriceMin('')
            setPriceMax('')
            setFrom('')
            setTo('')
            onChange(emptyRefinements)
          }}
          className="h-11 text-sm font-medium text-primary hover:underline"
        >
          絞り込みを解除
        </button>
      )}
    </div>
  )
}
