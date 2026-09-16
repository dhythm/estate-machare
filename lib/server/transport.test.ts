import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createTransportJob,
  deleteTransportJob,
  getTransportJob,
  getTransportJobIds,
  getTransportJobs,
  updateTransportJob,
  updateTransportJobStatus,
} from './transport'
import { listNotifications } from './notifications'
import { acceptSubmission } from './submissions'
import { updateThreadStatus } from './threads'
import { demoAdmin, demoSeller, demoUser } from '@/test/mock-auth'
import { applyModeration } from './moderation'
import { resetStore } from './store'
import type { TransportJobInput } from '@/lib/validation/transport'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

const input: TransportJobInput = {
  item: 'トラクター 25馬力',
  from: '長野県 松本市',
  to: '長野県 諏訪市',
  distanceKm: 40,
  weight: '約1.2t',
  desiredDate: '相談',
  reward: 14_000,
  contactEmail: 'owner@example.com',
}

describe('transport jobs', () => {
  it('lists jobs with unique ids', async () => {
    const ids = await getTransportJobIds()
    expect(ids.length).toBeGreaterThanOrEqual(10)
    expect(new Set(ids).size).toBe(ids.length)
    expect((await getTransportJobs()).map((job) => job.id)).toEqual(ids)
  })

  it('finds a job and handles an unknown id', async () => {
    expect((await getTransportJob('tj-01'))?.item).toContain('引越し')
    expect(await getTransportJob('missing')).toBeUndefined()
  })

  it('creates a pending job that stays off the public board', async () => {
    const created = await createTransportJob(input, 'demo-seller')
    expect(created).toMatchObject({
      item: input.item,
      status: '募集中',
      reward: 14_000,
      moderationStatus: 'pending',
      ownerUserId: 'demo-seller',
    })
    expect(JSON.stringify(created)).not.toContain('owner@example.com')
    expect((await getTransportJobs())[0].id).toBe('tj-01')
    expect(await getTransportJobIds()).not.toContain(created.id)
    expect((await getTransportJob(created.id))?.item).toBe(input.item)
  })

  it('publishes a job after approval and hides a rejected one', async () => {
    const created = await createTransportJob(input, 'demo-seller')
    await applyModeration('transportJob', created.id, { status: 'approved' })
    expect((await getTransportJobs())[0].id).toBe(created.id)
    await applyModeration('transportJob', created.id, {
      status: 'rejected',
      note: '区間が不明瞭',
    })
    expect((await getTransportJob(created.id))?.moderationNote).toBe(
      '区間が不明瞭',
    )
    expect((await getTransportJobs()).map((job) => job.id)).not.toContain(
      created.id,
    )
  })

  it('moves an agreed job through 運搬中 to 完了 with the right people', async () => {
    const { id: threadId } = await acceptSubmission(
      'transportApplication',
      {
        name: '利用者デモ',
        vehicle: '2tトラック',
        availableDate: '2026-10-03',
      },
      { targetId: 'tj-01', userId: 'demo-user' },
    )
    const early = await updateTransportJobStatus('tj-01', demoUser, '運搬中')
    expect(!early.ok && early.reason).toBe('forbidden')
    await updateThreadStatus(threadId, demoSeller, 'agreed')
    expect((await getTransportJob('tj-01'))?.status).toBe('調整中')
    const started = await updateTransportJobStatus('tj-01', demoUser, '運搬中')
    expect(started.ok && started.value.status).toBe('運搬中')
    expect(
      (await listNotifications('demo-seller')).map((n) => n.title),
    ).toContain('運搬が始まりました')
    expect((await getTransportJobs()).map((job) => job.id)).toContain('tj-01')
    const notOwner = await updateTransportJobStatus('tj-01', demoUser, '完了')
    expect(!notOwner.ok && notOwner.reason).toBe('forbidden')
    const done = await updateTransportJobStatus('tj-01', demoSeller, '完了')
    expect(done.ok && done.value.status).toBe('完了')
    expect(
      (await listNotifications('demo-user')).map((n) => n.title),
    ).toContain('運搬が完了しました')
    expect((await getTransportJobs()).map((job) => job.id)).not.toContain(
      'tj-01',
    )
    const again = await updateTransportJobStatus('tj-01', demoSeller, '運搬中')
    expect(!again.ok && again.reason).toBe('transition')
    const missing = await updateTransportJobStatus('missing', demoAdmin, '完了')
    expect(!missing.ok && missing.reason).toBe('not_found')
  })

  it('lets the owner complete straight from 調整中 and refuses 運搬中 from 募集中', async () => {
    const open = await updateTransportJobStatus('tj-02', demoSeller, '運搬中')
    expect(!open.ok && open.reason).toBe('transition')
    const done = await updateTransportJobStatus('tj-02', demoSeller, '完了')
    expect(done.ok && done.value.status).toBe('完了')
  })

  it('updates and deletes a job', async () => {
    const created = await createTransportJob(input, 'demo-seller')
    const updated = await updateTransportJob(created.id, {
      ...input,
      reward: 20_000,
    })
    expect(updated).toMatchObject({
      id: created.id,
      reward: 20_000,
      status: '募集中',
    })
    expect(await updateTransportJob('missing', input)).toBeUndefined()
    expect(await deleteTransportJob(created.id)).toBe(true)
    expect(await getTransportJob(created.id)).toBeUndefined()
    expect(await deleteTransportJob(created.id)).toBe(false)
  })
})
