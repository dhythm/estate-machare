import { isApproved } from '@/lib/data'
import { handleSubmission, notFound } from '@/lib/server/api'
import { requireUser } from '@/lib/server/auth/session'
import { buildModes } from '@/lib/server/listing-detail'
import { getListing } from '@/lib/server/listings'
import { validateListingInquiry } from '@/lib/validation/listing-inquiry'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const listing = await getListing(id)
  if (!listing || !isApproved(listing))
    return notFound('物件が見つかりません。')
  const offered = buildModes(listing).map((mode) => mode.id)
  return handleSubmission(request, 'listingInquiry', validateListingInquiry, {
    targetId: id,
    userId: authorized.user.id,
    refine: (value) =>
      value.mode !== 'question' && !offered.includes(value.mode)
        ? { mode: 'この物件では選択できない取引方法です。' }
        : undefined,
  })
}
