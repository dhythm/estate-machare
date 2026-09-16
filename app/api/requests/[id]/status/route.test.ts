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

describe('PATCH /api/requests/[id]/status', () => {
  it('lets the agreed agent start the haul', async () => {
    const { id } = await acceptSubmission(
      'requestProposal',
      {
        name: '利用者デモ',
        vehicle: 'マンション',
        availableDate: '2026-10-03',
      },
      { targetId: 'pr-01', userId: 'demo-user' },
    )
    await updateThreadStatus(id, demoSeller, 'agreed')
    signInAs(demoUser)
    const started = await patch('pr-01', { status: '紹介中' })
    expect(started.status).toBe(200)
    expect((await started.json()).status).toBe('紹介中')
    expect((await patch('pr-01', { status: '成約' })).status).toBe(403)
    expect((await patch('pr-01', { status: '紹介中' })).status).toBe(409)
  })

  it('lets the owner or an admin complete a request', async () => {
    const response = await patch('pr-01', { status: '成約' })
    expect(response.status).toBe(200)
    expect((await response.json()).status).toBe('成約')
    expect((await getPropertyRequest('pr-01'))?.status).toBe('成約')
    expect((await patch('pr-02', { status: '募集中' })).status).toBe(400)
    expect((await patch('pr-02', { status: '紹介中' })).status).toBe(409)
    signInAs(demoUser)
    expect((await patch('pr-02', { status: '成約' })).status).toBe(403)
    signInAs(null)
    expect((await patch('pr-02', { status: '成約' })).status).toBe(401)
    signInAs(demoAdmin)
    expect((await patch('pr-03', { status: '成約' })).status).toBe(200)
    expect((await patch('missing', { status: '成約' })).status).toBe(404)
  })
})
