import Link from 'next/link'
import { Badge } from '@/components/badge'
import { formatYen } from '@/lib/data'
import type { DealView } from '@/lib/server/deals'

const kindLabels = {
  order: '注文',
  rental: 'レンタル',
  transportJob: '引越し',
} as const

function when(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP')
}

export function DealTimeline({ deal }: { deal: DealView }) {
  const { summary } = deal
  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{kindLabels[summary.kind]}</Badge>
          <Link
            href={summary.href}
            className="font-semibold text-foreground hover:text-primary hover:underline"
          >
            {summary.title}
          </Link>
          <Badge>{summary.statusLabel}</Badge>
        </div>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">金額</dt>
            <dd className="font-display font-bold">
              {formatYen(summary.amount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">あなたの立場</dt>
            <dd>{summary.role}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">相手</dt>
            <dd>{summary.counterpart}</dd>
          </div>
        </dl>
      </div>

      <section>
        <h2 className="font-display text-lg font-bold">履歴</h2>
        <ol
          aria-label="履歴"
          className="mt-3 flex flex-col gap-3 border-l border-border pl-5"
        >
          {deal.events.map((event) => (
            <li key={event.id} className="relative text-sm">
              <span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full bg-primary" />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-medium text-foreground">
                  {event.statusLabel}
                </span>
                {event.actorName && (
                  <span className="text-muted-foreground">
                    {event.actorName}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {when(event.createdAt)}
                </span>
              </div>
              {event.note && (
                <p className="mt-1 text-muted-foreground">{event.note}</p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {(deal.relatedThreads.length > 0 || deal.relatedDeals.length > 0) && (
        <section>
          <h2 className="font-display text-lg font-bold">関連</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {deal.relatedDeals.map((related) => (
              <li key={`${related.kind}-${related.id}`}>
                <Link
                  href={`/account/deals/${related.kind}/${related.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {kindLabels[related.kind]}: {related.title}（
                  {related.statusLabel}）
                </Link>
              </li>
            ))}
            {deal.relatedThreads.map((thread) => (
              <li key={thread.id}>
                <Link
                  href={`/account/threads/${thread.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {thread.label}のやり取り（{thread.statusLabel}）
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
