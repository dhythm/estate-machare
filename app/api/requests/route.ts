import { parseBody } from '@/lib/server/api'
import { requireUser } from '@/lib/server/auth/session'
import {
  createPropertyRequest,
  getPropertyRequests,
} from '@/lib/server/property-requests'
import { validatePropertyRequest } from '@/lib/validation/property-request'

export async function GET() {
  return Response.json(await getPropertyRequests())
}

export async function POST(request: Request) {
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const parsed = await parseBody(request, validatePropertyRequest)
  if (!parsed.ok) return parsed.response
  const created = await createPropertyRequest(parsed.value, authorized.user.id)
  return Response.json(
    { id: created.id, receivedAt: created.createdAt, request: created },
    { status: 201 },
  )
}
