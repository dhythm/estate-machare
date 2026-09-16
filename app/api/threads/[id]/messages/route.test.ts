import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { resetStore } from '@/lib/server/store'
import { acceptSubmission } from '@/lib/server/submissions'
import { listMessages } from '@/lib/server/threads'
import { demoAdmin, demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(() => {
  signInAs(demoSeller)
  return resetStore()
})

const post = (id: string, body: unknown) =>
  POST(
    new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  )

describe('POST /api/threads/[id]/messages', () => {
  it('stores a reply from a participant', async () => {
    const { id } = await acceptSubmission(
      'listingInquiry',
      { mode: 'rent', name: '利用者デモ', message: '借りたい' },
      { targetId: 'apt-001', userId: 'demo-user' },
    )
    const response = await post(id, { body: '在庫あります' })
    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({
      threadId: id,
      senderUserId: 'demo-seller',
      body: '在庫あります',
    })
    expect(await listMessages(id)).toHaveLength(1)
    expect((await post(id, { body: '' })).status).toBe(400)
    signInAs(demoAdmin)
    expect((await post(id, { body: 'x' })).status).toBe(403)
    signInAs(null)
    expect((await post(id, { body: 'x' })).status).toBe(401)
    signInAs(demoUser)
    expect((await post('nope', { body: 'x' })).status).toBe(404)
  })
})
