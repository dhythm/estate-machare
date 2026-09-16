import Link from 'next/link'
import { ArrowRight, Check, MessageSquare } from 'lucide-react'
import type { AccountOverview } from '@/lib/server/account'
import { Badge } from '@/components/badge'

export function AccountActivity({ overview }: { overview: AccountOverview }) {
  const unread = new Set(overview.unreadThreadIds)
  const incoming = [
    ...overview.listings.flatMap(({ listing, inquiries }) =>
      inquiries.map((submission) => ({
        submission,
        title: listing.name,
        received: true,
      })),
    ),
    ...overview.transportJobs.flatMap(({ job, applications }) =>
      applications.map((submission) => ({
        submission,
        title: job.item,
        received: true,
      })),
    ),
    ...overview.sentInquiries.map(({ submission, listing }) => ({
      submission,
      title: listing?.name ?? '削除された物件',
      received: false,
    })),
    ...overview.sentApplications.map(({ submission, job }) => ({
      submission,
      title: job?.item ?? '削除された案件',
      received: false,
    })),
  ]
  const seen = new Set<string>()
  const items = incoming
    .filter(({ submission, received }) => {
      if (seen.has(submission.id)) return false
      seen.add(submission.id)
      return (
        unread.has(submission.id) ||
        (received && (submission.status ?? 'new') === 'new')
      )
    })
    .sort(
      (a, b) =>
        Number(unread.has(b.submission.id)) -
          Number(unread.has(a.submission.id)) ||
        b.submission.receivedAt.localeCompare(a.submission.receivedAt),
    )

  return (
    <div id="activity" className="scroll-mt-28">
      {overview.summary.requestedRentals > 0 && (
        <Link
          href="#lending"
          aria-label="賃貸申込を確認する"
          className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-primary transition-colors hover:bg-primary/10"
        >
          <span>
            <span className="font-semibold">
              {overview.summary.requestedRentals}件の賃貸申込
            </span>
            が承認を待っています
          </span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      )}
      <section
        aria-labelledby="activity-title"
        className="overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-5 sm:px-6">
          <h2
            id="activity-title"
            className="flex items-center gap-2.5 font-display text-base font-bold text-foreground"
          >
            <MessageSquare className="size-4 text-primary" aria-hidden="true" />
            確認が必要なやり取り
          </h2>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
            {items.length}
          </span>
        </div>
        {items.length === 0 ? (
          <div className="flex items-center gap-3 px-5 py-8 text-sm text-muted-foreground sm:px-6">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
              <Check className="size-4" aria-hidden="true" />
            </span>
            未確認のやり取りはありません
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map(({ submission, title }) => (
              <li key={submission.id}>
                <Link
                  href={`/account/threads/${submission.id}`}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-primary sm:px-6"
                >
                  <span className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary sm:flex">
                    <MessageSquare className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {title}
                      </span>
                      <Badge
                        variant={unread.has(submission.id) ? 'accent' : 'muted'}
                      >
                        {unread.has(submission.id) ? '未読' : '未対応'}
                      </Badge>
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {submission.kind === 'listingInquiry'
                        ? '物件の問い合わせ'
                        : '引越しへの応募'}
                      {typeof submission.payload.name === 'string' &&
                        ` · ${submission.payload.name}`}
                    </span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
