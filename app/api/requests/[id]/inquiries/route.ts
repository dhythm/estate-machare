import { isApproved } from '@/lib/data'
import { conflict, handleSubmission, notFound } from '@/lib/server/api'
import { requireUser } from '@/lib/server/auth/session'
import { getPropertyRequest } from '@/lib/server/property-requests'
import { validateRequestInquiry } from '@/lib/validation/property-request'

/** A question to the seeker that opens a thread without proposing anything. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const { id } = await params
  const propertyRequest = await getPropertyRequest(id)
  if (!propertyRequest || !isApproved(propertyRequest))
    return notFound('リクエストが見つかりません。')
  if (propertyRequest.status === '成約')
    return conflict('成約したリクエストには質問できません。')
  return handleSubmission(
    request,
    'requestInquiry',
    (input) => {
      const result = validateRequestInquiry(input)
      return result.ok
        ? { ok: true, value: { ...result.value, name: authorized.user.name } }
        : result
    },
    { targetId: id, userId: authorized.user.id },
  )
}
