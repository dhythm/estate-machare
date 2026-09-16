import { isApproved } from '@/lib/data'
import { conflict, handleSubmission, notFound } from '@/lib/server/api'
import { requireUser } from '@/lib/server/auth/session'
import { getPropertyRequest } from '@/lib/server/property-requests'
import { validateRequestProposal } from '@/lib/validation/property-request'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const propertyRequest = await getPropertyRequest(id)
  if (!propertyRequest || !isApproved(propertyRequest))
    return notFound('リクエストが見つかりません。')
  if (propertyRequest.status !== '募集中')
    return conflict('募集中のリクエストにのみ提案できます。')
  return handleSubmission(
    request,
    'requestProposal',
    validateRequestProposal,
    { targetId: id, userId: authorized.user.id },
  )
}
