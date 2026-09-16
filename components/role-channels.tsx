import Link from 'next/link'
import { ArrowUpRight, Tag, Truck } from 'lucide-react'

export function RoleChannels() {
  return (
    <section className="mx-auto grid max-w-[1280px] gap-5 px-5 pb-20 pt-4 sm:px-8 md:grid-cols-2">
      <Link
        href="/listings/new"
        className="group flex items-start gap-5 rounded-xl border border-border bg-card p-7 transition-colors hover:border-primary/50 sm:p-8"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
          <Tag className="size-5" />
        </span>
        <div className="flex-1">
          <p className="eyebrow">FOR OWNERS</p>
          <h2 className="mt-2 text-lg font-bold">
            眠っている一台を、誰かの力に。
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            販売も、使わない期間の貸し出しも。
          </p>
          <span className="mt-5 inline-flex items-center gap-3 text-sm font-bold text-primary">
            物件を出品する
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
      <Link
        href="/requests/register"
        className="group flex items-start gap-5 rounded-xl border border-border bg-card p-7 transition-colors hover:border-primary/50 sm:p-8"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
          <Truck className="size-5" />
        </span>
        <div className="flex-1">
          <p className="eyebrow">FOR TRANSPORT PARTNERS</p>
          <h2 className="mt-2 text-lg font-bold">
            その空室が、次の暮らしにつながる。
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            取扱カテゴリと対応エリアを登録して、条件に合うリクエストへ提案を。
          </p>
          <span className="mt-5 inline-flex items-center gap-3 text-sm font-bold text-primary">
            担当者として登録する
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </section>
  )
}
