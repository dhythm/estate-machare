import 'server-only'

import {
  isApproved,
  type Listing,
  type ModerationQueue,
  type ModerationQueueFilter,
  type ModerationStatus,
  type TransportJob,
} from '@/lib/data'
import { recordDealEvent } from './deal-events'
import { notify } from './notifications'
import { getStore } from './store'

export type ModerationKind = 'listing' | 'transportJob'

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
  const [listings, transportJobs] = await Promise.all([
    store.listings.list(),
    store.transportJobs.list(),
  ])
  return {
    listings: listings.filter((listing) => matchesFilter(listing, status)),
    transportJobs: transportJobs.filter((job) => matchesFilter(job, status)),
  }
}

export async function applyModeration(
  kind: ModerationKind,
  id: string,
  decision: ModerationDecision,
): Promise<Listing | TransportJob | undefined> {
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
      : await store.transportJobs.update(id, patch)
  if (updated && kind === 'transportJob')
    await recordDealEvent({
      dealKind: 'transportJob',
      dealId: id,
      status: decision.status,
      note: decision.note,
    })
  if (updated?.ownerUserId) {
    const label = kind === 'listing' ? '掲載' : '運搬依頼'
    const name = 'name' in updated ? updated.name : updated.item
    await notify({
      userId: updated.ownerUserId,
      kind: 'moderation',
      title: `${label}が${decision.status === 'approved' ? '承認' : '却下'}されました`,
      body: decision.note ? `${name}: ${decision.note}` : name,
      href: kind === 'listing' ? `/listings/${id}` : `/transport/${id}`,
    })
  }
  return updated
}
