'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Search, MoveRight } from 'lucide-react'
import { categories, type DealFilter } from '@/lib/data'
import { cn } from '@/lib/utils'

const options = [
  { id: 'sale', label: '買う', caption: 'BUY' },
  { id: 'rent', label: '借りる', caption: 'RENT' },
] as const

export function Hero() {
  const [deal, setDeal] = useState<DealFilter>('sale')
  return (
    <section className="relative mx-auto max-w-[1440px] px-4 pb-8 pt-5 sm:px-8 lg:px-10">
      <div className="grid overflow-hidden bg-[#ece8df] lg:min-h-[510px] lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative z-10 px-6 pb-7 pt-7 sm:px-10 sm:pt-14 lg:pb-32 lg:pl-12">
          <p className="eyebrow flex items-center gap-3 !text-primary">
            <span className="h-px w-8 bg-primary" /> A PLACE FOR YOUR NEXT
            CHAPTER
          </p>
          <h1 className="mt-5 font-display text-[clamp(2.1rem,4.2vw,4.2rem)] font-medium leading-[1.5] tracking-[-0.05em]">
            この場所から、
            <br />
            次の暮らしを。
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            住まいも、仕事の拠点も。
            <br />
            買う・借りる、その先の暮らしまでつなぐ。
          </p>
          <Link
            href="/guide"
            className="mt-5 inline-flex items-center gap-5 border-b border-primary/30 pb-2 text-xs font-medium"
          >
            Estate Machare について
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="relative min-h-[180px] sm:min-h-[340px] lg:min-h-full">
          <Image
            src="/estate-hero.webp"
            alt="木の床と大きな窓から自然光が入る、緑を望む住まい"
            fill
            preload
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
          />
          <span className="absolute bottom-5 right-5 bg-white/85 px-3 py-2 text-[9px] tracking-widest text-primary">
            SPACE TO LIVE. ROOM TO GROW.
          </span>
        </div>
      </div>
      <div className="relative z-20 mx-auto -mt-3 max-w-[1160px] bg-card px-5 pb-6 pt-5 shadow-[0_12px_40px_-20px_rgba(32,58,67,0.25)] sm:px-8 lg:-mt-20">
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex gap-8" role="group" aria-label="取引方法">
            {options.map(({ id, label, caption }) => (
              <button
                type="button"
                key={id}
                onClick={() => setDeal(id)}
                aria-pressed={deal === id}
                className={cn(
                  'relative flex items-baseline gap-3 pb-4 text-base font-bold after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5',
                  deal === id
                    ? 'text-primary after:bg-primary'
                    : 'text-muted-foreground',
                )}
              >
                {label}
                <span className="text-[10px] font-medium tracking-widest">
                  {caption}
                </span>
              </button>
            ))}
          </div>
          <Link
            href="/listings/new"
            className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground"
          >
            売りたい・貸したい
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
        <form
          action="/listings"
          method="get"
          role="search"
          aria-label="物件を探す"
          className="mt-5 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]"
        >
          <input type="hidden" name="deal" value={deal} />
          <label className="flex flex-col gap-2 border border-border px-4 py-3">
            <span className="text-[10px] font-bold text-muted-foreground">
              物件種別
            </span>
            <select
              name="category"
              className="w-full bg-transparent text-sm outline-none"
              defaultValue="すべて"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'すべて' ? 'すべての物件' : category}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 border border-border px-4 py-3">
            <span className="text-[10px] font-bold text-muted-foreground">
              エリア・キーワード
            </span>
            <input
              type="search"
              name="q"
              placeholder="市区町村・駅名・物件名"
              maxLength={100}
              className="min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </label>
          <button
            type="submit"
            className="flex min-h-14 items-center justify-center gap-3 bg-primary px-8 text-sm font-bold text-white transition-colors hover:bg-primary/85"
          >
            <Search className="size-4" />
            物件を探す
          </button>
        </form>
      </div>
      <div className="mx-auto mt-6 flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-1 text-xs text-muted-foreground">
        <p>暮らしに合う物件を、自分らしい選び方で。</p>
        <Link
          href="/transport/new"
          className="inline-flex items-center gap-3 hover:text-primary"
        >
          新居への引越しを相談
          <MoveRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
