import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Star } from 'lucide-react'
import { BackLink } from '@/components/back-link'
import { ListingCard } from '@/components/listing-card'
import { PageShell } from '@/components/page-shell'
import { StarRating } from '@/components/reviews/star-rating'
import { getSellerProfile } from '@/lib/server/sellers'

export const metadata: Metadata = { title: '掲載者 | Estate Machare' }

export const dynamic = 'force-dynamic'

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await getSellerProfile(id)
  if (!profile) notFound()
  const listingName = new Map(
    profile.listings.map((listing) => [listing.id, listing.name]),
  )

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <BackLink href="/listings" label="物件一覧にもどる" />
        <header className="mt-6 flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-card p-6">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-2xl font-bold text-primary">
            {profile.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-primary">
              SELLER
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {profile.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              出品中 {profile.listings.length}件
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {profile.rating !== undefined ? (
              <>
                <Star className="size-5 fill-primary text-primary" />
                <span className="font-display text-2xl font-bold text-foreground">
                  {profile.rating}
                </span>
                <span>({profile.reviewCount}件)</span>
              </>
            ) : (
              <span>評価なし</span>
            )}
          </div>
        </header>

        <section className="mt-10" aria-labelledby="seller-listings">
          <h2
            id="seller-listings"
            className="font-display text-xl font-bold text-foreground"
          >
            出品中の物件
          </h2>
          {profile.listings.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              現在出品中の物件はありません
            </p>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {profile.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10" aria-labelledby="seller-reviews">
          <h2
            id="seller-reviews"
            className="font-display text-xl font-bold text-foreground"
          >
            レビュー
          </h2>
          {profile.reviews.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              まだレビューはありません
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card px-5">
              {profile.reviews.map((review) => (
                <li key={review.id} className="py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <StarRating rating={review.rating} />
                    <Link
                      href={`/listings/${review.listingId}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {listingName.get(review.listingId) ?? '（掲載終了）'}
                    </Link>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 leading-7 text-foreground">
                      {review.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  )
}
