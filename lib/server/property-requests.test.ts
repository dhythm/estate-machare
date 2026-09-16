import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createPropertyRequest,
  deletePropertyRequest,
  getPropertyRequest,
  getPropertyRequestIds,
  getPropertyRequests,
  updatePropertyRequest,
  updatePropertyRequestStatus,
} from './property-requests'
import { listNotifications } from './notifications'
import { acceptSubmission } from './submissions'
import { updateThreadStatus } from './threads'
import { demoAdmin, demoSeller, demoUser } from '@/test/mock-auth'
import { applyModeration } from './moderation'
import { resetStore } from './store'
import type { PropertyRequestInput } from '@/lib/validation/property-request'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

const input: PropertyRequestInput = {
  item: 'トラクター 25馬力',
  from: '長野県 松本市',
  to: '長野県 諏訪市',
  distanceKm: 40,
  weight: '約1.2t',
  desiredDate: '相談',
  reward: 14_000,
  contactEmail: 'owner@example.com',
}

describe('transport requests', () => {
  it('lists requests with unique ids', async () => {
    const ids = await getPropertyRequestIds()
    expect(ids.length).toBeGreaterThanOrEqual(10)
    expect(new Set(ids).size).toBe(ids.length)
    expect((await getPropertyRequests()).map((request) => request.id)).toEqual(ids)
  })

  it('finds a request and handles an unknown id', async () => {
    expect((await getPropertyRequest('tj-01'))?.item).toContain('コンバイン')
    expect(await getPropertyRequest('missing')).toBeUndefined()
  })

  it('creates a pending request that stays off the public board', async () => {
    const created = await createPropertyRequest(input, 'demo-seller')
    expect(created).toMatchObject({
      item: input.item,
      status: '募集中',
      reward: 14_000,
      moderationStatus: 'pending',
      ownerUserId: 'demo-seller',
    })
    expect(JSON.stringify(created)).not.toContain('owner@example.com')
    expect((await getPropertyRequests())[0].id).toBe('tj-01')
    expect(await getPropertyRequestIds()).not.toContain(created.id)
    expect((await getPropertyRequest(created.id))?.item).toBe(input.item)
  })

  it('publishes a request after approval and hides a rejected one', async () => {
    const created = await createPropertyRequest(input, 'demo-seller')
    await applyModeration('propertyRequest', created.id, { status: 'approved' })
    expect((await getPropertyRequests())[0].id).toBe(created.id)
    await applyModeration('propertyRequest', created.id, {
      status: 'rejected',
      note: '区間が不明瞭',
    })
    expect((await getPropertyRequest(created.id))?.moderationNote).toBe(
      '区間が不明瞭',
    )
    expect((await getPropertyRequests()).map((request) => request.id)).not.toContain(
      created.id,
    )
  })

  it('moves an agreed request through 運搬中 to 完了 with the right people', async () => {
    const { id: threadId } = await acceptSubmission(
      'requestProposal',
      {
        name: '利用者デモ',
        vehicle: '2tトラック',
        availableDate: '2026-10-03',
      },
      { targetId: 'tj-01', userId: 'demo-user' },
    )
    const early = await updatePropertyRequestStatus('tj-01', demoUser, '運搬中')
    expect(!early.ok && early.reason).toBe('forbidden')
    await updateThreadStatus(threadId, demoSeller, 'agreed')
    expect((await getPropertyRequest('tj-01'))?.status).toBe('調整中')
    const started = await updatePropertyRequestStatus('tj-01', demoUser, '運搬中')
    expect(started.ok && started.value.status).toBe('運搬中')
    expect(
      (await listNotifications('demo-seller')).map((n) => n.title),
    ).toContain('運搬が始まりました')
    expect((await getPropertyRequests()).map((request) => request.id)).toContain('tj-01')
    const notOwner = await updatePropertyRequestStatus('tj-01', demoUser, '完了')
    expect(!notOwner.ok && notOwner.reason).toBe('forbidden')
    const done = await updatePropertyRequestStatus('tj-01', demoSeller, '完了')
    expect(done.ok && done.value.status).toBe('完了')
    expect(
      (await listNotifications('demo-user')).map((n) => n.title),
    ).toContain('運搬が完了しました')
    expect((await getPropertyRequests()).map((request) => request.id)).not.toContain(
      'tj-01',
    )
    const again = await updatePropertyRequestStatus('tj-01', demoSeller, '運搬中')
    expect(!again.ok && again.reason).toBe('transition')
    const missing = await updatePropertyRequestStatus('missing', demoAdmin, '完了')
    expect(!missing.ok && missing.reason).toBe('not_found')
  })

  it('lets the owner complete straight from 調整中 and refuses 運搬中 from 募集中', async () => {
    const open = await updatePropertyRequestStatus('tj-02', demoSeller, '運搬中')
    expect(!open.ok && open.reason).toBe('transition')
    const done = await updatePropertyRequestStatus('tj-02', demoSeller, '完了')
    expect(done.ok && done.value.status).toBe('完了')
  })

  it('updates and deletes a request', async () => {
    const created = await createPropertyRequest(input, 'demo-seller')
    const updated = await updatePropertyRequest(created.id, {
      ...input,
      reward: 20_000,
    })
    expect(updated).toMatchObject({
      id: created.id,
      reward: 20_000,
      status: '募集中',
    })
    expect(await updatePropertyRequest('missing', input)).toBeUndefined()
    expect(await deletePropertyRequest(created.id)).toBe(true)
    expect(await getPropertyRequest(created.id)).toBeUndefined()
    expect(await deletePropertyRequest(created.id)).toBe(false)
  })
})
