import { notFound, orderFailure, parseBody } from '@/lib/server/api'
import { canView, requireUser } from '@/lib/server/auth/session'
import { getListing } from '@/lib/server/listings'
import { requestOrder } from '@/lib/server/orders'
import { validateOrderRequest } from '@/lib/validation/order'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const listing = await getListing((await params).id)
  if (!listing || !canView(authorized.user, listing))
    return notFound('物件が見つかりません。')
  const parsed = await parseBody(request, validateOrderRequest)
  if (!parsed.ok) return parsed.response
  const result = await requestOrder(listing, authorized.user, parsed.value)
  return result.ok
    ? Response.json(result.value, { status: 201 })
    : orderFailure(result.reason)
}
