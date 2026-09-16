import Link from 'next/link'
import { Truck, Route, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/badge'
import { formatYen } from '@/lib/data'
import { getTransportJobs } from '@/lib/server/transport'

export async function TransportPreview() {
  const jobs = (await getTransportJobs()).slice(0, 3)

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:pb-16">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid gap-8 p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
          <div className="flex flex-col">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground">
              <Truck className="size-5" />
            </span>
            <p className="eyebrow mt-5">MOVING SUPPORT</p>
            <h2 className="mt-3 text-balance font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              新しい暮らしへの、橋渡し。
            </h2>
            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
              物件が決まったら、引越しの相談も。希望のエリアと日程に合うパートナーを探せます。
            </p>
            <Link
              href="/transport"
              className="mt-6 inline-flex w-fit items-center gap-1 text-sm font-medium text-primary"
            >
              引越しの依頼を見る
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <ul className="flex flex-col gap-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/transport/${job.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary/40"
                >
                  <span className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary sm:flex">
                    <Route className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-foreground">
                        {job.item}
                      </p>
                      <Badge
                        variant={job.status === '募集中' ? 'default' : 'muted'}
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {job.from} → {job.to}・{job.distanceKm}km・{job.weight}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-base font-bold text-foreground">
                      {formatYen(job.reward)}
                    </p>
                    <p className="text-xs text-muted-foreground">報酬</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
