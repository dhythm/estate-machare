import { badRequest, conflict, forbidden, notFound } from '@/lib/server/api'
import { requireUser } from '@/lib/server/auth/session'
import { setListingStatus } from '@/lib/server/listings'
import { asRecord } from '@/lib/validation/shared'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorized = await requireUser()
  if (!authorized.ok) return authorized.response
  const body = asRecord(await request.json().catch(() => undefined))
  const status = body?.status
  if (status !== 'withdrawn' && status !== 'listed')
    return badRequest('状態は「withdrawn」か「listed」を指定してください。')
  const result = await setListingStatus(
    (await params).id,
    status,
    authorized.user,
  )
  if (result.ok) return Response.json(result.value)
  switch (result.reason) {
    case 'not_found':
      return notFound('物件が見つかりません。')
    case 'forbidden':
      return forbidden('この物件を編集する権限がありません。')
    case 'rental_open':
      return conflict('進行中のレンタルがあります。')
  }
}
