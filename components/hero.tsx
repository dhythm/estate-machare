'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  Truck,
  ShoppingBag,
  CalendarDays,
  Repeat2,
} from 'lucide-react'
import { categories, type DealFilter } from '@/lib/data'
import { cn } from '@/lib/utils'

const options = [
  { id: 'sale', label: '買う', icon: ShoppingBag },
  { id: 'rent', label: '借りる', icon: CalendarDays },
  { id: 'purchaseOption', label: '借りてから買う', icon: Repeat2 },
] as const

export function Hero() {
  const [deal, setDeal] = useState<DealFilter>('sale')
  return (
    <section className="relative pb-8 sm:pb-12">
      <div className="relative isolate overflow-hidden bg-primary">
        <Image
          src="/brand-field.webp"
          alt="夕暮れの街並みに並ぶ住宅とマンション"
          fill
          preload
          sizes="100vw"
          className="object-cover object-[65%_60%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,39,28,0.88)_0%,rgba(10,39,28,0.66)_35%,rgba(10,39,28,0.06)_100%)]" />
        <div className="relative mx-auto max-w-[1360px] px-5 pb-36 pt-14 sm:px-8 sm:pb-32 sm:pt-20 lg:px-10 lg:pb-28 lg:pt-16">
          <p className="flex items-center gap-2.5 text-[10px] font-semibold tracking-[0.22em] text-[#d9eb8b] sm:text-xs">
            <span className="h-px w-7 bg-[#d9eb8b]" />
            THE NEXT FIELD, TOGETHER.
          </p>
          <h1 className="mt-7 font-display text-[clamp(2.4rem,4.8vw,4.25rem)] font-bold leading-[1.4] tracking-[-0.035em] text-white">
            物件の可能性を、
            <br />
            次の人へ。
          </h1>
          <p className="mt-5 text-sm font-medium leading-[2] tracking-wide text-white/85 sm:text-base">
            買う。借りる。使ってから決める。
            <br />
            あなたの暮らしに合う一件を、提案が届くところまでつなぐ。
          </p>
          <Link
            href="/guide"
            className="mt-7 inline-flex items-center gap-3 border-b border-white/50 pb-2 text-xs font-medium text-white hover:border-white"
          >
            Estate Machare について
            <ArrowUpRight className="size-4" />
          </Link>
          <div className="absolute bottom-28 right-10 hidden items-end gap-4 text-white/90 lg:flex">
            <span className="h-12 w-px bg-white/40" />
            <p className="text-[10px] leading-6 tracking-[0.12em]">
              つくる人を、つなぐ。
              <br />
              AGRICULTURE / MACHINERY / SHARE
            </p>
          </div>
        </div>
      </div>
      <div className="relative mx-auto -mt-20 max-w-[1200px] px-4 sm:px-8">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_12px_48px_-20px_rgba(16,50,38,0.28)] sm:p-7">
          <div className="flex items-center justify-between gap-4 border-b border-border">
            <div
              className="flex gap-4 sm:gap-8"
              role="group"
              aria-label="取引方法"
            >
              {options.map(({ id, label, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setDeal(id)}
                  aria-pressed={deal === id}
                  className={cn(
                    'relative flex items-center gap-2 pb-4 text-sm font-bold transition-colors after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[3px] after:rounded-t-full',
                    deal === id
                      ? 'text-primary after:bg-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="hidden size-4 sm:block" />
                  {label}
                </button>
              ))}
            </div>
            <span className="hidden pb-4 text-[10px] tracking-wider text-muted-foreground md:block">
              FIND YOUR NEXT PARTNER
            </span>
          </div>
          <form
            action="/listings"
            method="get"
            role="search"
            aria-label="物件を探す"
            className="mt-5 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]"
          >
            <input type="hidden" name="deal" value={deal} />
            <label className="flex flex-col gap-2 rounded-lg border border-border px-4 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span className="text-[10px] font-bold text-muted-foreground">
                カテゴリ
              </span>
              <select
                name="category"
                className="w-full bg-transparent text-sm font-medium outline-none"
                defaultValue="すべて"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'すべて' ? 'すべての物件' : category}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 rounded-lg border border-border px-4 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span className="text-[10px] font-bold text-muted-foreground">
                キーワード
              </span>
              <input
                type="search"
                name="q"
                placeholder="物件名・最寄駅・地域から探す"
                maxLength={100}
                className="min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </label>
            <button
              type="submit"
              className="flex min-h-14 items-center justify-center gap-3 rounded-lg bg-primary px-8 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Search className="size-4" />
              物件を探す
            </button>
          </form>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs text-muted-foreground sm:gap-x-7">
          <span className="inline-flex items-center gap-2">
            <Truck className="size-4 text-primary" />
            物件リクエストも、ここから。
          </span>
          <Link
            href="/requests/new"
            className="inline-flex items-center gap-2 font-bold text-primary hover:underline"
          >
            希望条件を登録する
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 font-bold text-primary hover:underline"
          >
            物件リクエストを探す
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
