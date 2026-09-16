import Link from 'next/link'
import { ArrowUpRight, Tag } from 'lucide-react'

export function RoleChannels() {
  return (
    <section className="mx-auto grid max-w-[1280px] gap-5 px-5 pb-20 pt-4 sm:px-8">
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
            大切な場所に、次の出会いを。
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            売却も、賃貸も。物件の魅力を、探している人へ。
          </p>
          <span className="mt-5 inline-flex items-center gap-3 text-sm font-bold text-primary">
            物件を掲載する
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </section>
  )
}
