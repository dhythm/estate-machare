import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  Handshake,
  MessageSquare,
  Users,
} from 'lucide-react'
import { AdminSection } from '@/components/admin/admin-section'
import {
  getAdminCounts,
  listRecentActivity,
  listRecentReviews,
} from '@/lib/server/admin-overview'
import { StarRating } from '@/components/reviews/star-rating'
import { Badge } from '@/components/badge'

export const metadata: Metadata = {
  title: 'ダッシュボード | Estate Machare 運営',
}

export const dynamic = 'force-dynamic'

const workspaces = [
  {
    title: '取引管理',
    icon: Handshake,
    links: [
      { label: '掲載の審査', href: '/admin/deals' },
      { label: '注文', href: '/admin/deals/orders' },
      { label: '賃貸', href: '/admin/deals/rentals' },
      { label: '問い合わせ', href: '/admin/deals/inquiries' },
      { label: 'レビュー', href: '/admin/deals/reviews' },
    ],
  },
  {
    title: 'アカウント管理',
    icon: Users,
    links: [{ label: 'アカウントと利用状況', href: '/admin/accounts' }],
  },
]

export default async function AdminDashboardPage() {
  const [counts, activity, reviews] = await Promise.all([
    getAdminCounts(),
    listRecentActivity(8),
    listRecentReviews(5),
  ])
  const pendingCount = counts.pendingListings
  const metrics = [
    {
      label: '承諾待ちの注文',
      value: counts.requestedOrders,
      icon: Handshake,
      links: [{ label: '注文一覧', href: '/admin/deals/orders' }],
    },
    {
      label: '申込中の賃貸',
      value: counts.requestedRentals,
      icon: CalendarDays,
      links: [{ label: '申込一覧', href: '/admin/deals/rentals' }],
    },
    {
      label: '未対応のやり取り',
      value: counts.openThreads,
      icon: MessageSquare,
      links: [{ label: '問い合わせ', href: '/admin/deals/inquiries' }],
    },
  ]

  return (
    <AdminSection
      title="ダッシュボード"
      description="物件と人をつなぐ、日々の運営をここから。"
    >
      <section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-12 size-80 rounded-full border border-primary-foreground/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-24 size-80 rounded-full border border-primary-foreground/10"
        />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="mb-4 flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-primary-foreground/65">
              <ClipboardCheck className="size-4" aria-hidden="true" />
              REVIEW QUEUE
            </p>
            <h2 className="text-lg font-medium">審査を待っている案件</h2>
            <p
              aria-label={`審査待ち ${pendingCount} 件`}
              className="mt-2 font-display text-6xl font-medium tracking-tight tabular-nums"
            >
              {pendingCount}
              <span className="ml-3 text-sm font-normal tracking-normal text-primary-foreground/60">
                件
              </span>
            </p>
          </div>
          <div className="grid gap-3 xl:w-[52%]">
            {[
              {
                label: '審査待ちの掲載',
                value: counts.pendingListings,
                href: '/admin/deals',
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 p-5 transition-colors hover:bg-primary-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-foreground"
              >
                <span className="text-xs text-primary-foreground/75">
                  {item.label}
                </span>
                <span className="mt-4 flex items-end justify-between gap-4">
                  <span className="font-display text-3xl font-medium tabular-nums">
                    {item.value}
                    <span className="ml-2 text-xs text-primary-foreground/60">
                      件
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    審査する
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {metrics.map((metric) => (
          <li
            key={metric.label}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <metric.icon
                className="size-5 shrink-0 text-primary/60"
                aria-hidden="true"
              />
            </div>
            <p className="mt-4 mb-5 font-display text-4xl font-medium tabular-nums text-foreground">
              {metric.value}
              <span className="ml-2 text-xs text-muted-foreground">件</span>
            </p>
            <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4">
              {metric.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-6 items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  {link.label}
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="recent-activity">
          <div className="mb-5 flex items-center gap-3">
            <h2
              id="recent-activity"
              className="font-display text-lg font-bold text-foreground"
            >
              直近の取引の動き
            </h2>
            <span className="h-px flex-1 bg-border" />
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだありません</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
              {activity.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
                >
                  <Badge variant="outline">
                    {item.kind === 'order' ? '注文' : '賃貸'}
                  </Badge>
                  <Link
                    href={item.href}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {item.title}
                  </Link>
                  <Badge variant="muted">{item.statusLabel}</Badge>
                  {item.actorName && (
                    <span className="text-muted-foreground">
                      {item.actorName}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString('ja-JP')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="recent-reviews">
          <div className="mb-5 flex items-center gap-3">
            <h2
              id="recent-reviews"
              className="font-display text-lg font-bold text-foreground"
            >
              直近のレビュー
            </h2>
            <span className="h-px flex-1 bg-border" />
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだありません</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {reviews.map(({ review, listingName }) => (
                <li
                  key={review.id}
                  className="rounded-2xl border border-border bg-card p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="font-medium text-foreground">
                      {listingName}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-1 text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/deals/reviews"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            レビュー一覧
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </section>
      </div>

      <section className="mt-10">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-display text-lg font-bold text-foreground">
            運営業務
          </h2>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {workspaces.map((workspace) => (
            <div
              key={workspace.title}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6"
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/7 text-primary">
                  <workspace.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  {workspace.title}
                </h3>
              </div>
              <ul className="space-y-1">
                {workspace.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group -mx-2 flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      {link.label}
                      <ArrowUpRight
                        className="size-4 text-muted-foreground/50 transition-colors group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </AdminSection>
  )
}
