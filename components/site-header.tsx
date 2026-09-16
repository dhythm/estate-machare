'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, ArrowUpRight } from 'lucide-react'
import { AccountMenu } from '@/components/auth/account-menu'
import { BrandLogo } from '@/components/brand-logo'

const links = [
  { href: '/listings', label: '物件を探す' },
  { href: '/transport', label: '引越しサポート' },
  { href: '/guide', label: 'はじめての方へ' },
]

export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1360px] items-center justify-between gap-3 px-4 sm:px-8 lg:px-10">
        <Link href="/" aria-label="Estate Machare ホーム">
          <BrandLogo />
        </Link>
        <nav
          aria-label="メインナビゲーション"
          className="hidden items-center gap-7 text-[13px] font-bold xl:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? 'page'
                  : undefined
              }
              className="py-3 transition-colors hover:text-primary/65 aria-[current=page]:text-primary aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <AccountMenu />
          <Link
            href="/listings/new"
            className="hidden h-11 items-center gap-2 rounded-sm bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/85 sm:inline-flex"
          >
            <Plus className="size-4" />
            物件を掲載
          </Link>
        </div>
      </div>
      <nav
        aria-label="サービスナビゲーション"
        className="flex justify-start gap-5 overflow-x-auto sm:justify-center border-t border-border/60 px-4 text-xs font-bold xl:hidden"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={
              pathname === link.href || pathname.startsWith(`${link.href}/`)
                ? 'page'
                : undefined
            }
            className="shrink-0 py-3.5 hover:text-primary/65 aria-[current=page]:text-primary aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/listings/new"
          className="inline-flex shrink-0 items-center gap-1 py-3.5 text-primary sm:hidden"
        >
          物件を掲載
          <ArrowUpRight className="size-3" />
        </Link>
      </nav>
    </header>
  )
}
