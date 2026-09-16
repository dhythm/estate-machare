import 'server-only'

import {
  isApproved,
  type Listing,
  type ModerationQueue,
  type ModerationQueueFilter,
  type ModerationStatus,
  type PropertyRequest,
} from '@/lib/data'
import { recordDealEvent } from './deal-events'
import { notify } from './notifications'
import { getStore } from './store'

export type ModerationKind = 'listing' | 'propertyRequest'

export type ModerationDecision = {
  status: Extract<ModerationStatus, 'approved' | 'rejected'>
  note?: string
}

function matchesFilter(
  entity: { moderationStatus?: ModerationStatus },
  status: ModerationQueueFilter,
): boolean {
  if (status === 'all') return true
  if (status === 'approved') return isApproved(entity)
  return entity.moderationStatus === status
}

export async function getModerationQueue(
  status: ModerationQueueFilter = 'pending',
): Promise<ModerationQueue> {
  const store = getStore()
  const [listings, propertyRequests] = await Promise.all([
    store.listings.list(),
    store.propertyRequests.list(),
  ])
  return {
    listings: listings.filter((listing) => matchesFilter(listing, status)),
    propertyRequests: propertyRequests.filter((request) =>
      matchesFilter(request, status),
    ),
  }
}

export async function applyModeration(
  kind: ModerationKind,
  id: string,
  decision: ModerationDecision,
): Promise<Listing | PropertyRequest | undefined> {
  const now = new Date().toISOString()
  const patch = {
    moderationStatus: decision.status,
    moderationNote: decision.note,
    moderatedAt: now,
    updatedAt: now,
  }
  const store = getStore()
  const updated =
    kind === 'listing'
      ? await store.listings.update(id, patch)
      : await store.propertyRequests.update(id, patch)
  if (updated && kind === 'propertyRequest')
    await recordDealEvent({
      dealKind: 'propertyRequest',
      dealId: id,
      status: decision.status,
      note: decision.note,
    })
  if (updated?.ownerUserId) {
    const label = kind === 'listing' ? '出品' : '物件リクエスト'
    const name = 'name' in updated ? updated.name : updated.title
    await notify({
      userId: updated.ownerUserId,
      kind: 'moderation',
      title: `${label}が${decision.status === 'approved' ? '承認' : '却下'}されました`,
      body: decision.note ? `${name}: ${decision.note}` : name,
      href: kind === 'listing' ? `/listings/${id}` : `/requests/${id}`,
    })
  }
  return updated
}
