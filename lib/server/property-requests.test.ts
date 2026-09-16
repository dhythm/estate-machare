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
  title: '駅徒歩10分以内の2LDKを借りたい',
  deal: 'rent',
  category: 'マンション',
  layout: '2LDK',
  prefecture: '長野県',
  city: '長野市',
  budget: 140_000,
  moveInDate: '2026-12-01',
  contactEmail: 'seeker@example.com',
}

describe('property requests', () => {
  it('lists requests with unique ids', async () => {
    const ids = await getPropertyRequestIds()
    expect(ids.length).toBeGreaterThanOrEqual(10)
    expect(new Set(ids).size).toBe(ids.length)
    expect((await getPropertyRequests()).map((request) => request.id)).toEqual(
      ids,
    )
  })

  it('finds a request and handles an unknown id', async () => {
    expect((await getPropertyRequest('pr-01'))?.title).toContain('2LDK')
    expect(await getPropertyRequest('missing')).toBeUndefined()
  })

  it('creates a pending request that stays off the public board', async () => {
    const created = await createPropertyRequest(input, 'demo-seller')
    expect(created).toMatchObject({
      title: input.title,
      status: '募集中',
      budget: 140_000,
      moderationStatus: 'pending',
      ownerUserId: 'demo-seller',
    })
    expect(JSON.stringify(created)).not.toContain('seeker@example.com')
    expect((await getPropertyRequests())[0].id).toBe('pr-01')
    expect(await getPropertyRequestIds()).not.toContain(created.id)
    expect((await getPropertyRequest(created.id))?.title).toBe(input.title)
  })

  it('publishes a request after approval and hides a rejected one', async () => {
    const created = await createPropertyRequest(input, 'demo-seller')
    await applyModeration('propertyRequest', created.id, { status: 'approved' })
    expect((await getPropertyRequests())[0].id).toBe(created.id)
    await applyModeration('propertyRequest', created.id, {
      status: 'rejected',
      note: '条件が不明瞭',
    })
    expect((await getPropertyRequest(created.id))?.moderationNote).toBe(
      '条件が不明瞭',
    )
    expect(
      (await getPropertyRequests()).map((request) => request.id),
    ).not.toContain(created.id)
  })

  it('moves an agreed request through 紹介中 to 成約 with the right people', async () => {
    const { id: threadId } = await acceptSubmission(
      'requestProposal',
      {
        name: '利用者デモ',
        availableDate: '2026-10-03',
      },
      { targetId: 'pr-01', userId: 'demo-user' },
    )
    const early = await updatePropertyRequestStatus('pr-01', demoUser, '紹介中')
    expect(!early.ok && early.reason).toBe('forbidden')
    await updateThreadStatus(threadId, demoSeller, 'agreed')
    expect((await getPropertyRequest('pr-01'))?.status).toBe('調整中')
    const started = await updatePropertyRequestStatus(
      'pr-01',
      demoUser,
      '紹介中',
    )
    expect(started.ok && started.value.status).toBe('紹介中')
    expect(
      (await listNotifications('demo-seller')).map((n) => n.title),
    ).toContain('物件の紹介が始まりました')
    expect(
      (await getPropertyRequests()).map((request) => request.id),
    ).toContain('pr-01')
    const notOwner = await updatePropertyRequestStatus(
      'pr-01',
      demoUser,
      '成約',
    )
    expect(!notOwner.ok && notOwner.reason).toBe('forbidden')
    const done = await updatePropertyRequestStatus('pr-01', demoSeller, '成約')
    expect(done.ok && done.value.status).toBe('成約')
    expect(
      (await listNotifications('demo-user')).map((n) => n.title),
    ).toContain('リクエストが成約しました')
    expect(
      (await getPropertyRequests()).map((request) => request.id),
    ).not.toContain('pr-01')
    const again = await updatePropertyRequestStatus(
      'pr-01',
      demoSeller,
      '紹介中',
    )
    expect(!again.ok && again.reason).toBe('transition')
    const missing = await updatePropertyRequestStatus(
      'missing',
      demoAdmin,
      '成約',
    )
    expect(!missing.ok && missing.reason).toBe('not_found')
  })

  it('lets the owner close straight from 募集中 and refuses 紹介中 before matching', async () => {
    const open = await updatePropertyRequestStatus(
      'pr-02',
      demoSeller,
      '紹介中',
    )
    expect(!open.ok && open.reason).toBe('transition')
    const done = await updatePropertyRequestStatus('pr-02', demoSeller, '成約')
    expect(done.ok && done.value.status).toBe('成約')
  })

  it('updates and deletes a request', async () => {
    const created = await createPropertyRequest(input, 'demo-seller')
    const updated = await updatePropertyRequest(created.id, {
      ...input,
      budget: 180_000,
    })
    expect(updated).toMatchObject({
      id: created.id,
      budget: 180_000,
      status: '募集中',
    })
    expect(await updatePropertyRequest('missing', input)).toBeUndefined()
    expect(await deletePropertyRequest(created.id)).toBe(true)
    expect(await getPropertyRequest(created.id)).toBeUndefined()
    expect(await deletePropertyRequest(created.id)).toBe(false)
  })
})
