import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { PATCH } from '../../../orders/[id]/route'
import { resetStore } from '@/lib/server/store'
import { demoAdmin, demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(() => {
  signInAs(demoUser)
  return resetStore()
})

const context = (id: string) => ({ params: Promise.resolve({ id }) })
const post = (id: string, body: unknown) =>
  POST(
    new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    context(id),
  )
const patch = (id: string, body: unknown) =>
  PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
    context(id),
  )

describe('orders API', () => {
  it('opens an order and walks it to completion', async () => {
    const created = await post('trc-001', { message: '現金で' })
    expect(created.status).toBe(201)
    const order = await created.json()
    expect(order).toMatchObject({ status: 'requested', price: 42_800_000 })
    expect((await post('trc-001', {})).status).toBe(409)
    expect((await patch(order.id, { status: 'accepted' })).status).toBe(409)
    signInAs(demoSeller)
    expect((await patch(order.id, { status: 'accepted' })).status).toBe(200)
    expect((await patch(order.id, { status: 'completed' })).status).toBe(409)
    expect((await patch(order.id, { status: 'delivered' })).status).toBe(200)
    signInAs(demoUser)
    const done = await patch(order.id, { status: 'completed' })
    expect((await done.json()).status).toBe('completed')
    expect((await patch(order.id, { status: 'paid' })).status).toBe(400)
  })

  it('maps failures', async () => {
    expect((await post('drn-005', {})).status).toBe(409)
    expect((await post('missing', {})).status).toBe(404)
    signInAs(demoSeller)
    expect((await post('trc-001', {})).status).toBe(403)
    signInAs(demoAdmin)
    expect((await patch('nope', { status: 'cancelled' })).status).toBe(404)
    signInAs(null)
    expect((await post('trc-001', {})).status).toBe(401)
    expect((await patch('nope', { status: 'cancelled' })).status).toBe(401)
  })
})
