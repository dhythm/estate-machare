'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Handshake, LayoutDashboard, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const adminMenus = [
  { href: '/admin', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/admin/accounts', label: 'アカウント管理', icon: Users },
  { href: '/admin/deals', label: '取引管理', icon: Handshake },
  { href: '/admin/requests', label: 'リクエスト管理', icon: Handshake },
]

function isCurrent(pathname: string, href: string): boolean {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="運営メニュー" className="-mx-1 px-1 pb-1">
      <ul className="grid grid-cols-2 gap-1.5 sm:flex sm:min-w-max lg:min-w-0 lg:flex-col lg:gap-2">
        {adminMenus.map((item) => {
          const current = isCurrent(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-xl px-2 py-3 text-xs sm:gap-3 sm:px-3 sm:text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50 lg:px-4',
                  current
                    ? 'bg-primary-foreground text-primary shadow-sm'
                    : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground',
                )}
              >
                <item.icon className="size-[18px]" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
