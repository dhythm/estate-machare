import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  acceptSubmission,
  listSubmissions,
  listSubmissionsByUser,
} from './submissions'
import { deleteListing } from './listings'
import { resetStore } from './store'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

describe('submissions', () => {
  it('issues a unique receipt and stores the payload', async () => {
    const first = await acceptSubmission('contact', { message: 'a' })
    const second = await acceptSubmission('contact', { message: 'b' })
    expect(first.id).not.toBe(second.id)
    expect(Date.parse(first.receivedAt)).not.toBeNaN()
    const stored = await listSubmissions('contact')
    expect(stored.map((submission) => submission.payload.message)).toEqual([
      'b',
      'a',
    ])
  })

  it('filters by kind and target', async () => {
    await acceptSubmission(
      'listingInquiry',
      { message: 'x' },
      { targetId: 'trc-001' },
    )
    await acceptSubmission(
      'listingInquiry',
      { message: 'y' },
      { targetId: 'trc-006' },
    )
    expect(await listSubmissions('listingInquiry', 'trc-001')).toHaveLength(1)
    expect(await listSubmissions('listingInquiry')).toHaveLength(2)
  })

  it('records the sender and lists submissions by user', async () => {
    await acceptSubmission(
      'listingInquiry',
      { message: 'mine' },
      { targetId: 'trc-001', userId: 'demo-user' },
    )
    await acceptSubmission('contact', { message: 'anonymous' })
    const mine = await listSubmissionsByUser('demo-user')
    expect(mine.map((submission) => submission.payload.message)).toEqual([
      'mine',
    ])
    expect(mine[0].userId).toBe('demo-user')
    expect(await listSubmissionsByUser('demo-seller')).toEqual([])
  })

  it('removes inquiries when their listing is deleted', async () => {
    await acceptSubmission(
      'listingInquiry',
      { message: 'x' },
      { targetId: 'trc-001' },
    )
    await acceptSubmission(
      'listingInquiry',
      { message: 'y' },
      { targetId: 'trc-006' },
    )
    await deleteListing('trc-001')
    expect(await listSubmissions('listingInquiry')).toHaveLength(1)
  })
})
