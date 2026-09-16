import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Truck,
  Route,
  Scale,
  CalendarClock,
  MapPin,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/badge'
import { cn } from '@/lib/utils'
import { formatYen } from '@/lib/data'
import { getTransportJobs } from '@/lib/server/transport'

const steps = [
  '区間・希望日を登録',
  '引越しパートナーと条件を調整',
  '荷物の確認・引越し・完了を記録',
]

export async function TransportBoard() {
  const transportJobs = await getTransportJobs()
  const openCount = transportJobs.filter(
    (job) => job.status === '募集中',
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
              <Truck className="size-4" /> MOVING SUPPORT
            </p>
            <h1 className="mt-5 font-display text-3xl font-bold leading-[1.4] tracking-tight sm:text-4xl lg:text-5xl">
              新しい住まいへ、
              <br />
              暮らしをつなぐ。
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-primary-foreground/75">
              物件探しの、その先まで。家具や家電の配送から家族の引越しまで、地域のパートナーと。
            </p>
            <Link
              href="/transport/pricing"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-foreground underline decoration-primary-foreground/35 underline-offset-4"
            >
              料金のめやす <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col rounded-2xl bg-accent p-5 text-accent-foreground sm:p-6">
              <ArrowUpRight className="size-7" strokeWidth={1.5} />
              <p className="mt-6 text-xs font-medium opacity-70">
                引越しをお考えの方
              </p>
              <h2 className="mt-2 text-lg font-bold">引越しを依頼する</h2>
              <p className="mt-2 flex-1 text-xs leading-6 opacity-75">
                出発地と届け先を登録して、運べる人を見つける。
              </p>
              <Link
                href="/transport/new"
                className={cn(buttonVariants(), 'mt-6 h-11 w-full gap-2')}
              >
                引越しを依頼する <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="flex flex-col rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 p-5 sm:p-6">
              <ArrowDownLeft className="size-7" strokeWidth={1.5} />
              <p className="mt-6 text-xs font-medium text-primary-foreground/65">
                引越し・配送事業者の方
              </p>
              <h2 className="mt-2 text-lg font-bold">空き便を、仕事に。</h2>
              <p className="mt-2 flex-1 text-xs leading-6 text-primary-foreground/75">
                車両と対応地域を登録して、あなたに合う引越し案件へ。
              </p>
              <Link
                href="/transport/register"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'mt-6 h-11 w-full border-primary-foreground/30 bg-transparent px-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground',
                )}
              >
                引越しパートナーとして登録する
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mt-10 lg:mt-14"
        aria-labelledby="transport-job-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
              AVAILABLE ROUTES
            </p>
            <h2
              id="transport-job-heading"
              className="mt-2 font-display text-2xl font-bold text-foreground"
            >
              引越し案件
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="mr-1 font-display text-2xl font-semibold text-primary">
              {openCount}
            </span>
            件募集中
            <span className="ml-3 text-xs">
              公開中 {transportJobs.length}件
            </span>
          </p>
        </div>

        {transportJobs.length === 0 ? (
          <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <Truck className="size-9 text-primary/50" strokeWidth={1.5} />
            <p className="mt-5 font-medium text-foreground">
              現在、公開中の引越し案件はありません
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              新しい案件が公開されると、ここに表示されます。
            </p>
          </div>
        ) : (
          <ul className="mt-5 grid gap-4">
            {transportJobs.map((job) => (
              <li
                key={job.id}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30 sm:p-6"
              >
                <div className="grid gap-5 lg:grid-cols-[1.1fr_1.4fr_auto] lg:items-center lg:gap-8">
                  <div>
                    <Badge
                      variant={job.status === '募集中' ? 'default' : 'muted'}
                    >
                      {job.status}
                    </Badge>
                    <h3 className="mt-3 text-lg font-bold text-foreground">
                      {job.item}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Scale className="size-3.5" />
                        {job.weight}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Route className="size-3.5" />約{job.distanceKm}km
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/55 px-4 py-4">
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
                      <MapPin className="size-4 text-primary" />
                      <p className="font-medium text-foreground">{job.from}</p>
                      <span
                        aria-hidden="true"
                        className="mx-auto h-3 border-l border-dashed border-primary/40"
                      />
                      <span className="text-[10px] font-medium tracking-wider text-muted-foreground">
                        届け先
                      </span>
                      <span
                        aria-hidden="true"
                        className="mx-auto size-2 rounded-full bg-primary"
                      />
                      <p className="font-medium text-foreground">{job.to}</p>
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                      <CalendarClock className="size-3.5" />
                      希望日 {job.desiredDate}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 lg:min-w-44 lg:flex-col lg:items-end">
                    <div className="shrink-0">
                      <p className="text-xs text-muted-foreground lg:text-right">
                        報酬（税込）
                      </p>
                      <p className="mt-1 font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                        {formatYen(job.reward)}
                      </p>
                    </div>
                    <Link
                      href={`/transport/${job.id}`}
                      className={cn(
                        buttonVariants({ variant: 'outline' }),
                        'h-10 gap-2 px-3 text-xs sm:px-4 sm:text-sm',
                      )}
                    >
                      {job.status === '募集中'
                        ? 'この案件に応募する'
                        : '案件の詳細を見る'}
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
