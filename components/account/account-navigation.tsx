import Link from 'next/link'
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Inbox,
  Send,
  Tractor,
  Truck,
  History,
} from 'lucide-react'

const navigationItems = [
  { label: '確認すること', href: '#activity', icon: Inbox },
  { label: '取引の履歴', href: '#deals', icon: History },
  { label: '出品管理', href: '#equipment', icon: Tractor },
  { label: 'レンタル管理', href: '#leases', icon: CalendarDays },
  { label: '運搬管理', href: '#transport', icon: Truck },
  { label: '送信したやり取り', href: '#sent', icon: Send },
]

export function AccountNavigation({ isAgent }: { isAgent: boolean }) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-36 xl:top-24 lg:self-start">
      <nav
        aria-label="取引メニュー"
        className="rounded-2xl border border-border bg-card p-2 lg:p-3"
      >
        <p className="hidden px-3 pb-3 pt-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground lg:block">
          MY WORKSPACE
        </p>
        <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {navigationItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon className="size-4 text-primary" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <Link
            href="/account/notifications"
            className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:mt-2 lg:border-t lg:border-border lg:pt-4"
          >
            <Bell className="size-4 text-primary" aria-hidden="true" />
            通知
          </Link>
        </div>
      </nav>
      <Link
        href={isAgent ? '#agent' : '/transport/register'}
        className="mt-4 hidden rounded-2xl bg-primary p-5 text-primary-foreground transition-opacity hover:opacity-90 lg:block"
      >
        <Truck className="size-6" aria-hidden="true" />
        <span className="mt-5 flex items-center justify-between gap-2 text-sm font-semibold">
          {isAgent ? '運搬者プロフィール' : '運搬者として参加する'}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </Link>
    </aside>
  )
}
