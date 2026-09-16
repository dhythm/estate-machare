import { forbidden, notFound, parseBody } from '@/lib/server/api'
import {
  canManage,
  canView,
  getCurrentUser,
  requireUser,
} from '@/lib/server/auth/session'
import {
  deletePropertyRequest,
  getPropertyRequest,
  updatePropertyRequest,
} from '@/lib/server/property-requests'
import { validatePropertyRequest } from '@/lib/validation/property-request'

type Context = { params: Promise<{ id: string }> }

const missing = () => notFound('リクエストが見つかりません。')
const notOwner = () => forbidden('このリクエストを編集する権限がありません。')

export async function GET(_request: Request, { params }: Context) {
  const propertyRequest = await getPropertyRequest((await params).id)
  if (!propertyRequest) return missing()
  return canView(await getCurrentUser(), propertyRequest)
    ? Response.json(propertyRequest)
    : missing()
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const current = await getPropertyRequest(id)
  if (!current) return missing()
  if (!canManage(authorized.user, current)) return notOwner()
  const parsed = await parseBody(request, validatePropertyRequest)
  if (!parsed.ok) return parsed.response
  const updated = await updatePropertyRequest(id, parsed.value)
  return updated ? Response.json(updated) : missing()
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const current = await getPropertyRequest(id)
  if (!current) return missing()
  if (!canManage(authorized.user, current)) return notOwner()
  const deleted = await deletePropertyRequest(id)
  return deleted ? new Response(null, { status: 204 }) : missing()
}
