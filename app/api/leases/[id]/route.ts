import { parseBody, leaseFailure } from '@/lib/server/api'
import { requireUser } from '@/lib/server/auth/session'
import { updateLeaseStatus } from '@/lib/server/leases'
import { validateLeaseStatus } from '@/lib/validation/lease'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const parsed = await parseBody(request, validateLeaseStatus)
  if (!parsed.ok) return parsed.response
  const result = await updateLeaseStatus(
    (await params).id,
    authorized.user,
    parsed.value.status,
  )
  return result.ok ? Response.json(result.value) : leaseFailure(result.reason)
}
