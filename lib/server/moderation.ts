import 'server-only'

import {
  isApproved,
  type Listing,
  type ModerationQueue,
  type ModerationQueueFilter,
  type ModerationStatus,
} from '@/lib/data'
import { notify } from './notifications'
import { getStore } from './store'

export type ModerationKind = 'listing'

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
  const listings = await store.listings.list()
  return {
    listings: listings.filter((listing) => matchesFilter(listing, status)),
  }
}

export async function applyModeration(
  kind: ModerationKind,
  id: string,
  decision: ModerationDecision,
): Promise<Listing | undefined> {
  const now = new Date().toISOString()
  const patch = {
    moderationStatus: decision.status,
    moderationNote: decision.note,
    moderatedAt: now,
    updatedAt: now,
  }
  const store = getStore()
  const updated =
    kind === 'listing' ? await store.listings.update(id, patch) : undefined
  if (updated?.ownerUserId) {
    const label = '掲載'
    const name = updated.name
    await notify({
      userId: updated.ownerUserId,
      kind: 'moderation',
      title: `${label}が${decision.status === 'approved' ? '承認' : '却下'}されました`,
      body: decision.note ? `${name}: ${decision.note}` : name,
      href: `/listings/${id}`,
    })
  }
  return updated
}
