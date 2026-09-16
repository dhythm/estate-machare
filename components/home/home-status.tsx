import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export type HomeStatusCounts = {
  unreadThreads: number
  openInquiries: number
  requestedRentals: number
  requestedOrders: number
  pendingListings: number
  unreadNotifications: number
}

export function HomeStatus({
  name,
  status,
}: {
  name: string
  status: HomeStatusCounts
}) {
  const items = [
    { label: '未読のやり取り', value: status.unreadThreads, href: '/account' },
    {
      label: '未対応の問い合わせ',
      value: status.openInquiries,
      href: '/account',
    },
    {
      label: '申込中の賃貸',
      value: status.requestedRentals,
      href: '/account',
    },
    {
      label: '承諾待ちの注文',
      value: status.requestedOrders,
      href: '/account',
    },
    {
      label: '審査待ちの掲載',
      value: status.pendingListings,
      href: '/account',
    },
    {
      label: '通知',
      value: status.unreadNotifications,
      href: '/account/notifications',
    },
  ].filter((item) => item.value > 0)

  return (
    <section
      aria-labelledby="home-status"
      className="mx-auto max-w-[1280px] px-5 sm:px-8"
    >
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="home-status" className="font-display text-lg font-bold">
            あなたの状況
          </h2>
          <span className="text-sm text-muted-foreground">{name}</span>
        </div>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            対応が必要なものはありません。
            <Link href="/account" className="ml-2 font-medium text-primary">
              マイページへ
            </Link>
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm transition-colors hover:border-primary/40"
                >
                  <span className="text-foreground">{item.label}</span>
                  <span className="flex items-center gap-2 font-display text-xl font-bold text-primary">
                    {item.value}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
