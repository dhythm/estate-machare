import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { resetStore } from '@/lib/server/store'
import { listSubmissions } from '@/lib/server/submissions'
import { updatePropertyRequestStatus } from '@/lib/server/property-requests'
import { demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(() => {
  signInAs(demoUser)
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

describe('POST /api/transport/requests/[id]/inquiries', () => {
  it('opens a question thread for a request that is not finished', async () => {
    const response = await post('tj-03', { message: '積載方法は？' })
    expect(response.status).toBe(201)
    const [stored] = await listSubmissions('requestInquiry', 'tj-03')
    expect(stored.userId).toBe('demo-user')
    expect(stored.payload.name).toBe('利用者デモ')
    expect((await post('tj-01', { message: '' })).status).toBe(400)
    expect((await post('missing', { message: 'x' })).status).toBe(404)
    await updatePropertyRequestStatus('tj-02', demoSeller, '完了')
    expect((await post('tj-02', { message: 'x' })).status).toBe(409)
    signInAs(null)
    expect((await post('tj-01', { message: 'x' })).status).toBe(401)
  })
})
