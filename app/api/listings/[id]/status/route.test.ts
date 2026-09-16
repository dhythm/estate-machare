import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PATCH } from './route'
import { GET as getListingRoute } from '../route'
import { resetStore } from '@/lib/server/store'
import { demoAdmin, demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(() => {
  signInAs(demoSeller)
  return resetStore()
})

const context = (id: string) => ({ params: Promise.resolve({ id }) })
const patch = (id: string, body: unknown) =>
  PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
    context(id),
  )
const read = (id: string) =>
  getListingRoute(new Request('http://localhost'), context(id))

describe('PATCH /api/listings/[id]/status', () => {
  it('withdraws for the owner, hides it publicly, and republishes', async () => {
    const withdrawn = await patch('apt-001', { status: 'withdrawn' })
    expect(withdrawn.status).toBe(200)
    expect((await withdrawn.json()).withdrawnAt).toEqual(expect.any(String))
    signInAs(null)
    expect((await read('apt-001')).status).toBe(404)
    signInAs(demoSeller)
    expect((await read('apt-001')).status).toBe(200)
    expect((await patch('apt-001', { status: 'listed' })).status).toBe(200)
    expect((await patch('apt-001', { status: 'gone' })).status).toBe(400)
    signInAs(demoUser)
    expect((await patch('apt-001', { status: 'withdrawn' })).status).toBe(403)
    signInAs(demoAdmin)
    expect((await patch('missing', { status: 'withdrawn' })).status).toBe(404)
    signInAs(null)
    expect((await patch('apt-001', { status: 'withdrawn' })).status).toBe(401)
  })
})
