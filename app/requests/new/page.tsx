import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Handshake } from 'lucide-react'
import { BackLink } from '@/components/back-link'
import { LoginPrompt } from '@/components/auth/login-prompt'
import {
  PropertyRequestForm,
  type PropertyRequestInitial,
} from '@/components/forms/property-request-form'
import { PageIntro, PageShell } from '@/components/page-shell'
import { getCurrentUser } from '@/lib/server/auth/session'
import { getListing } from '@/lib/server/listings'

export const metadata: Metadata = {
  title: '希望条件を登録する | Estate Machare',
}

export const dynamic = 'force-dynamic'

async function initialFromListing(
  listingId: string | undefined,
): Promise<PropertyRequestInitial | undefined> {
  if (!listingId) return undefined
  const listing = await getListing(listingId)
  if (!listing) return undefined
  return {
    title: `${listing.name} のような物件を探しています`,
    deal: listing.deals.includes('rent') ? 'rent' : 'sale',
    category: listing.category,
    layout: listing.layout,
    prefecture: listing.prefecture,
    city: listing.city,
  }
}

export default async function NewPropertyRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ listingId?: string }>
}) {
  const user = await getCurrentUser()
  const { listingId } = await searchParams
  const initial = await initialFromListing(listingId)
  const callbackUrl = listingId
    ? `/requests/new?listingId=${encodeURIComponent(listingId)}`
    : '/requests/new'
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <BackLink href="/requests" label="物件リクエストにもどる" />
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
          <div className="lg:sticky lg:top-36 xl:top-24">
            <span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Handshake className="size-5" />
            </span>
            <PageIntro
              title="希望条件を登録する"
              description="探している条件を登録すると、その物件を持つオーナーや宅建業者から提案が届きます。"
            />
            <Link
              href="/costs"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              初期費用のめやす
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8">
            {user ? (
              <PropertyRequestForm
                contact={{ name: user.name, email: user.email }}
                initial={initial}
              />
            ) : (
              <LoginPrompt action="希望条件を登録する" callbackUrl={callbackUrl} />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
