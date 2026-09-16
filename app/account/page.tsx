import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowUpRight, Plus } from 'lucide-react'
import { AccountOverviewView } from '@/components/account/account-overview'
import { PageShell } from '@/components/page-shell'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAccountOverview } from '@/lib/server/account'
import { getCurrentUser } from '@/lib/server/auth/session'

export const metadata: Metadata = { title: 'マイページ | Estate Machare' }

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?callbackUrl=%2Faccount')
  const overview = await getAccountOverview(user.id)

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.22em] text-primary">
              MY WORKSPACE
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              取引ワークスペース
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm">
              <span
                className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                aria-hidden="true"
              >
                {user.name.slice(0, 1)}
              </span>
              <span className="font-medium text-foreground">{user.name}</span>
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/listings"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'h-10 px-4',
              )}
            >
              物件を探す
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/listings/new"
              className={cn(buttonVariants(), 'h-10 px-4')}
            >
              <Plus className="size-4" aria-hidden="true" />
              新しく出品する
            </Link>
          </div>
        </div>
        <div className="mt-8 sm:mt-10">
          <AccountOverviewView overview={overview} />
        </div>
      </div>
    </PageShell>
  )
}
