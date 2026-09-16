import { forbidden, notFound, parseBody } from '@/lib/server/api'
import {
  canManage,
  canView,
  getCurrentUser,
  requireUser,
} from '@/lib/server/auth/session'
import { deleteListing, getListing, updateListing } from '@/lib/server/listings'
import { validateListingSubmission } from '@/lib/validation/listing-submission'

type Context = { params: Promise<{ id: string }> }

const missing = () => notFound('物件が見つかりません。')
const notOwner = () => forbidden('この物件を編集する権限がありません。')

export async function GET(_request: Request, { params }: Context) {
  const listing = await getListing((await params).id)
  if (!listing) return missing()
  return canView(await getCurrentUser(), listing)
    ? Response.json(listing)
    : missing()
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const current = await getListing(id)
  if (!current) return missing()
  if (!canManage(authorized.user, current)) return notOwner()
  const parsed = await parseBody(request, validateListingSubmission)
  if (!parsed.ok) return parsed.response
  const listing = await updateListing(id, parsed.value)
  return listing ? Response.json(listing) : missing()
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const current = await getListing(id)
  if (!current) return missing()
  if (!canManage(authorized.user, current)) return notOwner()
  const deleted = await deleteListing(id)
  return deleted ? new Response(null, { status: 204 }) : missing()
}
