import 'server-only'

import { randomUUID } from 'node:crypto'
import { getStore, type DealEvent, type DealKind } from './store'

export type DealEventInput = {
  dealKind: DealKind
  dealId: string
  status: string
  actorUserId?: string
  note?: string
}

export function recordDealEvent(input: DealEventInput): Promise<DealEvent> {
  return getStore().dealEvents.create({
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  })
}

/** Oldest first; the store lists newest first, so reverse before the stable sort. */
export async function listDealEvents(
  dealKind: DealKind,
  dealId: string,
): Promise<DealEvent[]> {
  const events = await getStore().dealEvents.list()
  return events
    .filter((event) => event.dealKind === dealKind && event.dealId === dealId)
    .reverse()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** Newest first across every deal, for the operator dashboard. */
export async function listRecentDealEvents(
  limit: number,
): Promise<DealEvent[]> {
  return (await getStore().dealEvents.list()).slice(0, limit)
}
