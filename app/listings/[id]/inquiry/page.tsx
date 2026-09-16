import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { PageShell } from '@/components/page-shell'
import { BackLink } from '@/components/back-link'
import { InquiryForm } from '@/components/forms/inquiry-form'
import { formatYen, isApproved } from '@/lib/data'
import { getCurrentUser } from '@/lib/server/auth/session'
import { getListing } from '@/lib/server/listings'
import { buildModes } from '@/lib/server/listing-detail'
import {
  inquiryModes,
  type InquiryMode,
} from '@/lib/validation/listing-inquiry'

export const metadata: Metadata = { title: '出品者に連絡する | Estate Machare' }

export const dynamic = 'force-dynamic'

export default async function InquiryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string | string[] }>
}) {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing || !isApproved(listing)) notFound()
  const user = await getCurrentUser()

  const modes = buildModes(listing)
  const requested = (await searchParams).mode
  const offered = new Set<InquiryMode>([
    ...modes.map((mode) => mode.id),
    'question',
  ])
  const initialMode =
    typeof requested === 'string' &&
    (inquiryModes as readonly string[]).includes(requested) &&
    offered.has(requested as InquiryMode)
      ? (requested as InquiryMode)
      : modes[0].id

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <BackLink href={`/listings/${listing.id}`} label="物件の詳細にもどる" />
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
            <Image
              src={listing.image}
              alt={listing.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {listing.category} · {listing.zoning}
            </p>
            <h1 className="mt-0.5 truncate font-display text-lg font-bold text-foreground">
              {listing.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {listing.rentPerMonth && `${formatYen(listing.rentPerMonth)}/日`}
              {listing.rentPerMonth && listing.salePrice && ' · '}
              {listing.salePrice && `販売 ${formatYen(listing.salePrice)}`}
            </p>
          </div>
        </div>
        <h2 className="mt-8 font-display text-2xl font-bold text-foreground">
          出品者に連絡する
        </h2>
        <div className="mt-6">
          {user ? (
            <InquiryForm
              listing={listing}
              modes={modes}
              initialMode={initialMode}
              contact={{ name: user.name, email: user.email }}
            />
          ) : (
            <LoginPrompt
              action="出品者に連絡する"
              callbackUrl={`/listings/${listing.id}/inquiry?mode=${initialMode}`}
            />
          )}
        </div>
      </div>
    </PageShell>
  )
}
