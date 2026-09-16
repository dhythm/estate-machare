import { describe, expect, it, vi } from 'vitest'
import { countLeaseMonths } from '@/lib/lease'
import { isThreadKind } from '@/lib/data'
import { configuredAccounts } from './auth/accounts'
import { listings, propertyRequests } from './data'
import { demoActivity } from './demo-activity'

vi.mock('server-only', () => ({}))

const allListings = [...listings, ...demoActivity.listings]
const allJobs = [...propertyRequests, ...demoActivity.propertyRequests]
const listingById = new Map(allListings.map((listing) => [listing.id, listing]))
const jobById = new Map(allJobs.map((request) => [request.id, request]))
const userIds = new Set(configuredAccounts().map((account) => account.id))

describe('demoActivity', () => {
  it('references only known accounts, listings, and requests', () => {
    const {
      orders,
      leases,
      submissions,
      messages,
      reviews,
      agentProfiles,
      notifications,
      threadReads,
      accountStatuses,
    } = demoActivity
    for (const listing of allListings)
      if (listing.ownerUserId) expect(userIds).toContain(listing.ownerUserId)
    for (const request of allJobs)
      if (request.ownerUserId) expect(userIds).toContain(request.ownerUserId)
    for (const order of orders) {
      expect(userIds).toContain(order.buyerUserId)
      expect(listingById.get(order.listingId)?.ownerUserId).toBe(
        order.sellerUserId,
      )
    }
    for (const lease of leases) {
      expect(userIds).toContain(lease.tenantUserId)
      const listing = listingById.get(lease.listingId)
      expect(listing?.rentPerMonth).toBe(lease.rentPerMonth)
      expect(lease.months).toBe(
        countLeaseMonths(lease.startDate, lease.endDate),
      )
      expect(lease.rentTotal).toBe(lease.months * lease.rentPerMonth)
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
          : leases.find((lease) => lease.id === review.sourceId)
      expect(source?.status).toBe('completed')
    }
    for (const profile of agentProfiles) expect(userIds).toContain(profile.id)
    for (const notification of notifications)
      expect(userIds).toContain(notification.userId)
    for (const status of accountStatuses) expect(userIds).toContain(status.id)
  })

  it('links every deal event to an existing deal, newest first', () => {
    const { dealEvents, orders, leases } = demoActivity
    for (const event of dealEvents) {
      const exists =
        event.dealKind === 'order'
          ? orders.some((order) => order.id === event.dealId)
          : event.dealKind === 'lease'
            ? leases.some((lease) => lease.id === event.dealId)
            : jobById.has(event.dealId)
      expect(exists).toBe(true)
    }
    const stamps = dealEvents.map((event) => event.createdAt)
    expect(stamps).toEqual([...stamps].sort().reverse())
  })

  it('gives the hauling request an agreed agent and the dashboard something to show', () => {
    const hauling = demoActivity.propertyRequests.filter(
      (request) => request.status === '紹介中',
    )
    expect(hauling.length).toBeGreaterThan(0)
    for (const request of hauling)
      expect(
        demoActivity.submissions.some(
          (submission) =>
            submission.kind === 'requestProposal' &&
            submission.targetId === request.id &&
            submission.status === 'agreed',
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
        ) || demoActivity.leases.some((r) => r.tenantUserId === userId)
      expect(involved, userId).toBe(true)
      expect(
        demoActivity.notifications.some((n) => n.userId === userId),
        userId,
      ).toBe(true)
    }
  })
})
