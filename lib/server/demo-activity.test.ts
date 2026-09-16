import { describe, expect, it, vi } from 'vitest'
import { countRentalDays } from '@/lib/rent-to-own'
import { isThreadKind } from '@/lib/data'
import { configuredAccounts } from './auth/accounts'
import { listings, transportJobs } from './data'
import { demoActivity } from './demo-activity'

vi.mock('server-only', () => ({}))

const allListings = [...listings, ...demoActivity.listings]
const allJobs = [...transportJobs, ...demoActivity.transportJobs]
const listingById = new Map(allListings.map((listing) => [listing.id, listing]))
const jobById = new Map(allJobs.map((job) => [job.id, job]))
const userIds = new Set(configuredAccounts().map((account) => account.id))

describe('demoActivity', () => {
  it('uses only property language in visible activity content', () => {
    const copy = [
      ...demoActivity.notifications.flatMap((item) => [item.title, item.body]),
      ...demoActivity.messages.map((item) => item.body),
      ...demoActivity.submissions.map((item) => item.payload.message),
      ...demoActivity.reviews.map((item) => item.comment),
    ].join(' ')
    expect(copy).not.toMatch(
      /引越|引っ越|運搬|搬入|搬出|農機|農業|トラクター|コンバイン|田植機|耕運機|クボタ|ヤンマー|ロータリー|キャビン|フォークリフト|機体|6条/,
    )
  })

  it('references only known accounts, listings, and jobs', () => {
    const {
      orders,
      rentals,
      submissions,
      messages,
      reviews,
      carrierProfiles,
      notifications,
      threadReads,
      accountStatuses,
    } = demoActivity
    for (const listing of allListings)
      if (listing.ownerUserId) expect(userIds).toContain(listing.ownerUserId)
    for (const job of allJobs)
      if (job.ownerUserId) expect(userIds).toContain(job.ownerUserId)
    for (const order of orders) {
      expect(userIds).toContain(order.buyerUserId)
      expect(listingById.get(order.listingId)?.ownerUserId).toBe(
        order.sellerUserId,
      )
    }
    for (const rental of rentals) {
      expect(userIds).toContain(rental.renterUserId)
      const listing = listingById.get(rental.listingId)
      expect(listing).toBeDefined()
      expect(rental.rentPerDay).toBeGreaterThan(0)
      expect(rental.days).toBe(
        countRentalDays(rental.startDate, rental.endDate),
      )
      expect(rental.rentTotal).toBe(rental.days * rental.rentPerDay)
    }
    for (const submission of submissions) {
      expect(isThreadKind(submission.kind)).toBe(true)
      expect(userIds).toContain(submission.userId)
      const target =
        submission.kind === 'listingInquiry'
          ? listingById.get(submission.targetId ?? '')
          : jobById.get(submission.targetId ?? '')
      expect(target).toBeDefined()
    }
    const threadIds = new Set(submissions.map((submission) => submission.id))
    for (const message of messages) {
      expect(threadIds).toContain(message.threadId)
      expect(userIds).toContain(message.senderUserId)
    }
    for (const read of threadReads) {
      expect(threadIds).toContain(read.threadId)
      expect(read.id).toBe(`${read.threadId}:${read.userId}`)
    }
    for (const review of reviews) {
      expect(listingById.get(review.listingId)?.ownerUserId).toBe(
        review.sellerUserId,
      )
      const source =
        review.sourceKind === 'order'
          ? orders.find((order) => order.id === review.sourceId)
          : rentals.find((rental) => rental.id === review.sourceId)
      expect(source?.status).toBe('completed')
    }
    for (const profile of carrierProfiles) expect(userIds).toContain(profile.id)
    for (const notification of notifications)
      expect(userIds).toContain(notification.userId)
    for (const status of accountStatuses) expect(userIds).toContain(status.id)
  })

  it('links every deal event to an existing deal, newest first', () => {
    const { dealEvents, orders, rentals } = demoActivity
    for (const event of dealEvents) {
      const exists =
        event.dealKind === 'order'
          ? orders.some((order) => order.id === event.dealId)
          : event.dealKind === 'rental'
            ? rentals.some((rental) => rental.id === event.dealId)
            : jobById.has(event.dealId)
      expect(exists).toBe(true)
    }
    const stamps = dealEvents.map((event) => event.createdAt)
    expect(stamps).toEqual([...stamps].sort().reverse())
  })

  it('seeds only property transactions and keeps dashboards useful', () => {
    expect(transportJobs).toEqual([])
    expect(demoActivity.transportJobs).toEqual([])
    expect(demoActivity.carrierProfiles).toEqual([])
    expect(
      demoActivity.submissions.every((item) => item.kind === 'listingInquiry'),
    ).toBe(true)
    expect(
      demoActivity.dealEvents.every((item) => item.dealKind !== 'transportJob'),
    ).toBe(true)
    expect(
      demoActivity.notifications.every(
        (item) => !item.href.startsWith('/transport'),
      ),
    ).toBe(true)
    expect(
      demoActivity.orders.filter((order) => order.status === 'requested')
        .length,
    ).toBeGreaterThan(0)
    expect(
      demoActivity.listings.filter((l) => l.moderationStatus === 'pending')
        .length,
    ).toBeGreaterThan(0)
    expect(demoActivity.reviews.length).toBeGreaterThan(2)
    expect(
      new Set(demoActivity.orders.map((order) => order.buyerUserId)).size,
    ).toBeGreaterThan(2)
  })

  it('touches every sign-in account so each workspace has content', () => {
    for (const userId of ['demo-admin', 'demo-seller', 'demo-user']) {
      const involved =
        demoActivity.orders.some(
          (o) => o.buyerUserId === userId || o.sellerUserId === userId,
        ) || demoActivity.rentals.some((r) => r.renterUserId === userId)
      expect(involved, userId).toBe(true)
      expect(
        demoActivity.notifications.some((n) => n.userId === userId),
        userId,
      ).toBe(true)
    }
  })
})
