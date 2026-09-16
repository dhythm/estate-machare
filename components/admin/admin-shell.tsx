import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { BrandLogo } from '@/components/brand-logo'
import { AdminNav } from './admin-nav'

export function AdminShell({
  user,
  children,
}: {
  user: { name: string }
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/35 lg:flex-row">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-card px-5 py-3 text-primary focus:translate-y-0"
      >
        本文へ移動
      </a>
      <aside className="relative flex shrink-0 flex-col gap-6 bg-primary px-5 pt-6 pb-4 text-primary-foreground lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:gap-10 lg:px-5 lg:py-8">
        <Link
          href="/admin"
          aria-label="Estate Machare 運営ホーム"
          className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
        >
          <BrandLogo inverse />
        </Link>
        <div>
          <p className="mb-4 hidden px-3 text-[10px] font-semibold tracking-[0.2em] text-primary-foreground/50 lg:block">
            WORKSPACE
          </p>
          <AdminNav />
        </div>
        <div className="mt-auto hidden border-t border-primary-foreground/15 pt-6 lg:block">
          <div className="flex items-center gap-3 px-3">
            <ShieldCheck
              className="size-5 text-primary-foreground/60"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium">運営ワークスペース</p>
              <p className="mt-1 text-xs text-primary-foreground/55">
                Estate Machare
              </p>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-20 flex-wrap items-center gap-3 border-b border-border bg-card/80 px-5 py-3 sm:px-8 lg:px-10">
          <span className="mr-auto hidden text-xs font-medium tracking-wide text-muted-foreground sm:block">
            運営コンソール
          </span>
          <Link
            href="/"
            className="mr-auto flex min-h-10 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary sm:mr-3"
          >
            サイトを表示
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
          <span className="flex items-center gap-2.5 border-l border-border pl-4 text-sm font-medium text-foreground">
            <span
              aria-hidden="true"
              className="hidden size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary sm:flex"
            >
              {user.name.slice(0, 1)}
            </span>
            {user.name}
          </span>
          <SignOutButton />
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10"
        >
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
