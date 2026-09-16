import { notFound, parseBody, rentalFailure } from '@/lib/server/api'
import { canView, getCurrentUser, requireUser } from '@/lib/server/auth/session'
import { getListing } from '@/lib/server/listings'
import { listBookedRanges, requestRental } from '@/lib/server/rentals'
import { validateRentalRequest } from '@/lib/validation/rental'

type Context = { params: Promise<{ id: string }> }

const missing = () => notFound('物件が見つかりません。')

/** Booked date ranges of a listing (no renter details). */
export async function GET(_request: Request, { params }: Context) {
  const listing = await getListing((await params).id)
  if (!listing || !canView(await getCurrentUser(), listing)) return missing()
  return Response.json({ booked: await listBookedRanges(listing.id) })
}

export async function POST(request: Request, { params }: Context) {
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const listing = await getListing((await params).id)
  if (!listing || !canView(authorized.user, listing)) return missing()
  const parsed = await parseBody(request, validateRentalRequest)
  if (!parsed.ok) return parsed.response
  const result = await requestRental(listing, authorized.user, parsed.value)
  return result.ok
    ? Response.json(result.value, { status: 201 })
    : rentalFailure(result.reason)
}
