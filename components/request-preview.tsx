import Link from 'next/link'
import { Handshake, MapPin, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/badge'
import { formatYen } from '@/lib/data'
import { getPropertyRequests } from '@/lib/server/property-requests'

export async function RequestPreview() {
  const requests = (await getPropertyRequests()).slice(0, 3)

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:pb-16">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid gap-8 p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
          <div className="flex flex-col">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground">
              <Handshake className="size-5" />
            </span>
            <p className="eyebrow mt-5">PROPERTY REQUESTS</p>
            <h2 className="mt-3 text-balance font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              条件から、出会いを。
            </h2>
            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
              探している条件を登録すると、その物件を持つオーナーや宅建業者から提案が届きます。空いている物件を、次の住まいに。
            </p>
            <Link
              href="/requests"
              className="mt-6 inline-flex w-fit items-center gap-1 text-sm font-medium text-primary"
            >
              物件リクエストをすべて見る
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <ul className="flex flex-col gap-3">
            {requests.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/requests/${request.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary/40"
                >
                  <span className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary sm:flex">
                    <MapPin className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-foreground">
                        {request.title}
                      </p>
                      <Badge
                        variant={request.status === '募集中' ? 'default' : 'muted'}
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {request.prefecture} {request.city}・{request.category}
                      {request.layout ? `・${request.layout}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-base font-bold text-foreground">
                      {formatYen(request.budget)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.deal === 'rent' ? '月額上限' : '予算上限'}
                    </p>
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
