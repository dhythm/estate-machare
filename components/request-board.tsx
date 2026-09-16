import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Handshake,
  MapPin,
  Ruler,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/badge'
import { cn } from '@/lib/utils'
import { formatYen } from '@/lib/data'
import { getPropertyRequests } from '@/lib/server/property-requests'

const steps = [
  '希望エリア・条件・予算を登録',
  '宅建業者やオーナーから提案を受ける',
  '内見・条件調整・成約まで記録',
]

export async function RequestBoard() {
  const propertyRequests = await getPropertyRequests()
  const openCount = propertyRequests.filter(
    (request) => request.status === '募集中',
  ).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-9 text-primary-foreground sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 size-96 rounded-full border-[48px] border-primary-foreground/5"
        />
        <div className="relative grid gap-9 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-primary-foreground/70">
              <Handshake className="size-4" /> PROPERTY REQUESTS
            </p>
            <h1 className="mt-5 font-display text-3xl font-bold leading-[1.4] tracking-tight sm:text-4xl lg:text-5xl">
              探している条件から、
              <br />
              物件を見つける。
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-primary-foreground/75">
              希望のエリア・間取り・予算を登録すると、条件に合う物件を持つオーナーや宅建業者から提案が届きます。
            </p>
            <Link
              href="/costs"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-foreground underline decoration-primary-foreground/35 underline-offset-4"
            >
              初期費用のめやす <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col rounded-2xl bg-accent p-5 text-accent-foreground sm:p-6">
              <ArrowUpRight className="size-7" strokeWidth={1.5} />
              <p className="mt-6 text-xs font-medium opacity-70">
                物件を探している方
              </p>
              <h2 className="mt-2 text-lg font-bold">条件を登録する</h2>
              <p className="mt-2 flex-1 text-xs leading-6 opacity-75">
                エリアと予算を登録して、提案を待つ。
              </p>
              <Link
                href="/requests/new"
                className={cn(buttonVariants(), 'mt-6 h-11 w-full gap-2')}
              >
                条件を登録する <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="flex flex-col rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 p-5 sm:p-6">
              <ArrowDownLeft className="size-7" strokeWidth={1.5} />
              <p className="mt-6 text-xs font-medium text-primary-foreground/65">
                物件をお持ちの方・宅建業者の方
              </p>
              <h2 className="mt-2 text-lg font-bold">空き物件を、提案に。</h2>
              <p className="mt-2 flex-1 text-xs leading-6 text-primary-foreground/75">
                取扱カテゴリと対応地域を登録して、条件に合うリクエストへ。
              </p>
              <Link
                href="/requests/register"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'mt-6 h-11 w-full border-primary-foreground/30 bg-transparent px-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground',
                )}
              >
                担当者として登録する
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 lg:mt-14" aria-labelledby="request-heading">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
              OPEN REQUESTS
            </p>
            <h2
              id="request-heading"
              className="mt-2 font-display text-2xl font-bold text-foreground"
            >
              物件リクエスト
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="mr-1 font-display text-2xl font-semibold text-primary">
              {openCount}
            </span>
            件募集中
            <span className="ml-3 text-xs">
              公開中 {propertyRequests.length}件
            </span>
          </p>
        </div>

        {propertyRequests.length === 0 ? (
          <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <Handshake className="size-9 text-primary/50" strokeWidth={1.5} />
            <p className="mt-5 font-medium text-foreground">
              現在、公開中の物件リクエストはありません
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              新しいリクエストが公開されると、ここに表示されます。
            </p>
          </div>
        ) : (
          <ul className="mt-5 grid gap-4">
            {propertyRequests.map((request) => (
              <li
                key={request.id}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30 sm:p-6"
              >
                <div className="grid gap-5 lg:grid-cols-[1.1fr_1.4fr_auto] lg:items-center lg:gap-8">
                  <div>
                    <Badge
                      variant={request.status === '募集中' ? 'default' : 'muted'}
                    >
                      {request.status}
                    </Badge>
                    <h3 className="mt-3 text-lg font-bold text-foreground">
                      {request.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="size-3.5" />
                        {request.category}
                      </span>
                      {request.layout && (
                        <span className="inline-flex items-center gap-1.5">
                          <Ruler className="size-3.5" />
                          {request.layout}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/55 px-4 py-4">
                    <p className="flex items-center gap-3 text-sm">
                      <MapPin className="size-4 shrink-0 text-primary" />
                      <span className="font-medium text-foreground">
                        {request.prefecture} {request.city}
                      </span>
                    </p>
                    <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                      <CalendarClock className="size-3.5" />
                      入居・引渡し希望 {request.moveInDate}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 lg:min-w-44 lg:flex-col lg:items-end">
                    <div className="shrink-0">
                      <p className="text-xs text-muted-foreground lg:text-right">
                        {request.deal === 'rent' ? '月額賃料の上限' : '予算の上限'}
                      </p>
                      <p className="mt-1 font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                        {formatYen(request.budget)}
                      </p>
                    </div>
                    <Link
                      href={`/requests/${request.id}`}
                      className={cn(
                        buttonVariants({ variant: 'outline' }),
                        'h-10 gap-2 px-3 text-xs sm:px-4 sm:text-sm',
                      )}
                    >
                      {request.status === '募集中'
                        ? 'このリクエストに提案する'
                        : 'リクエストの詳細を見る'}
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <ol className="mt-10 grid gap-4 border-t border-border pt-8 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step}
            className="flex items-center gap-3 text-sm text-muted-foreground"
          >
            <span className="font-display text-xl font-semibold text-primary/40">
              0{index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}
