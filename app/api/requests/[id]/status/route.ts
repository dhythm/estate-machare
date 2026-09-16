import { badRequest, conflict, forbidden, notFound } from '@/lib/server/api'
import { requireUser } from '@/lib/server/auth/session'
import { updatePropertyRequestStatus } from '@/lib/server/property-requests'
import { asRecord } from '@/lib/validation/shared'

/** Matching happens by accepting a proposal; this moves the request forward. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const body = asRecord(await request.json().catch(() => undefined))
  const status = body?.status
  if (status !== '紹介中' && status !== '成約')
    return badRequest('状態は「紹介中」か「成約」を指定してください。')
  const result = await updatePropertyRequestStatus(
    (await params).id,
    authorized.user,
    status,
  )
  if (result.ok) return Response.json(result.value)
  switch (result.reason) {
    case 'not_found':
      return notFound('リクエストが見つかりません。')
    case 'forbidden':
      return forbidden('このリクエストを更新する権限がありません。')
    case 'transition':
      return conflict('現在の状態ではその操作はできません。')
  }
}
