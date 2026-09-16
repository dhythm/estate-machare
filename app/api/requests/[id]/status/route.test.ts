import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PATCH } from './route'
import { resetStore } from '@/lib/server/store'
import { acceptSubmission } from '@/lib/server/submissions'
import { updateThreadStatus } from '@/lib/server/threads'
import { getPropertyRequest } from '@/lib/server/property-requests'
import { demoAdmin, demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(() => {
  signInAs(demoSeller)
  return resetStore()
})

const patch = (id: string, body: unknown) =>
  PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  )

describe('PATCH /api/transport/requests/[id]/status', () => {
  it('lets the agreed agent start the haul', async () => {
    const { id } = await acceptSubmission(
      'requestProposal',
      {
        name: '利用者デモ',
        vehicle: '2tトラック',
        availableDate: '2026-10-03',
      },
      { targetId: 'tj-01', userId: 'demo-user' },
    )
    await updateThreadStatus(id, demoSeller, 'agreed')
    signInAs(demoUser)
    const started = await patch('tj-01', { status: '運搬中' })
    expect(started.status).toBe(200)
    expect((await started.json()).status).toBe('運搬中')
    expect((await patch('tj-01', { status: '完了' })).status).toBe(403)
    expect((await patch('tj-01', { status: '運搬中' })).status).toBe(409)
  })

  it('lets the owner or an admin complete a request', async () => {
    const response = await patch('tj-01', { status: '完了' })
    expect(response.status).toBe(200)
    expect((await response.json()).status).toBe('完了')
    expect((await getPropertyRequest('tj-01'))?.status).toBe('完了')
    expect((await patch('tj-02', { status: '募集中' })).status).toBe(400)
    expect((await patch('tj-02', { status: '運搬中' })).status).toBe(409)
    signInAs(demoUser)
    expect((await patch('tj-02', { status: '完了' })).status).toBe(403)
    signInAs(null)
    expect((await patch('tj-02', { status: '完了' })).status).toBe(401)
    signInAs(demoAdmin)
    expect((await patch('tj-03', { status: '完了' })).status).toBe(200)
    expect((await patch('missing', { status: '完了' })).status).toBe(404)
  })
})
