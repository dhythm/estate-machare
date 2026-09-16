import { notFound } from 'next/navigation'
import { PageShell } from '@/components/page-shell'
import { ListingDetail } from '@/components/listing-detail'
import { canManage, canView, getCurrentUser } from '@/lib/server/auth/session'
import { getListing, getRelatedListings } from '@/lib/server/listings'
import { buildModes } from '@/lib/server/listing-detail'
import { listBookedRanges } from '@/lib/server/leases'
import { listingHasOpenOrder } from '@/lib/server/orders'
import { listReviewsForSeller } from '@/lib/server/reviews'
import type { PurchaseOptionTerms } from '@/lib/purchase-option'
import type { Listing } from '@/lib/data'

export const dynamic = 'force-dynamic'

function purchaseOptionTerms(listing: Listing): PurchaseOptionTerms | undefined {
  if (
    !listing.purchaseOption ||
    !listing.rentPerMonth ||
    !listing.salePrice ||
    !listing.purchaseOptionCreditRate
  )
    return undefined
  return {
    rentPerMonth: listing.rentPerMonth,
    salePrice: listing.salePrice,
    creditRate: listing.purchaseOptionCreditRate,
    creditCap: listing.purchaseOptionCreditCap,
  }
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const listing = await getListing(id)
  const user = await getCurrentUser()

  if (!listing || !canView(user, listing)) {
    notFound()
  }

  return (
    <PageShell>
      <ListingDetail
        listing={listing}
        modes={buildModes(listing)}
        related={await getRelatedListings(listing, 3)}
        purchaseOptionTerms={purchaseOptionTerms(listing)}
        booked={await listBookedRanges(listing.id)}
        sellerReviews={
          listing.ownerUserId
            ? (await listReviewsForSeller(listing.ownerUserId)).slice(0, 10)
            : []
        }
        viewer={{
          signedIn: user !== undefined,
          isOwner: user !== undefined && listing.ownerUserId === user.id,
          canEdit: canManage(user, listing),
        }}
        purchaseAvailable={!(await listingHasOpenOrder(listing.id))}
      />
    </PageShell>
  )
}
