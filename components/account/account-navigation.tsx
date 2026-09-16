import Link from 'next/link'
import {
  Bell,
  CalendarDays,
  Inbox,
  Send,
  Building2,
  History,
} from 'lucide-react'

const navigationItems = [
  { label: '確認すること', href: '#activity', icon: Inbox },
  { label: '取引の履歴', href: '#deals', icon: History },
  { label: '掲載管理', href: '#equipment', icon: Building2 },
  { label: '賃貸管理', href: '#rentals', icon: CalendarDays },
  { label: '送信したやり取り', href: '#sent', icon: Send },
]

export function AccountNavigation() {
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
    </aside>
  )
}
