import 'server-only'

import { randomUUID } from 'node:crypto'
import { isApproved, type PropertyRequest } from '@/lib/data'
import type { PropertyRequestInput } from '@/lib/validation/property-request'
import type { AuthenticatedUser } from './auth/accounts'
import { canManage } from './auth/access'
import { recordDealEvent } from './deal-events'
import { notify } from './notifications'
import { getStore } from './store'
import { deleteSubmissionsFor } from './submissions'

/** Public board: approved requests that are still open. */
export async function getPropertyRequests(): Promise<PropertyRequest[]> {
  return (await getStore().propertyRequests.list()).filter(
    (request) => isApproved(request) && request.status !== '成約',
  )
}

export function getPropertyRequest(id: string): Promise<PropertyRequest | undefined> {
  return getStore().propertyRequests.get(id)
}

export async function getPropertyRequestIds(): Promise<string[]> {
  return (await getPropertyRequests()).map((request) => request.id)
}

/** Public request fields; the seeker's contact email is not published. */
function requestFields(input: PropertyRequestInput) {
  return {
    title: input.title,
    deal: input.deal,
    category: input.category,
    layout: input.layout,
    prefecture: input.prefecture,
    city: input.city,
    budget: input.budget,
    moveInDate: input.moveInDate,
  }
}

export async function createPropertyRequest(
  input: PropertyRequestInput,
  ownerUserId: string,
): Promise<PropertyRequest> {
  const now = new Date().toISOString()
  const request = await getStore().propertyRequests.create({
    id: randomUUID(),
    ...requestFields(input),
    ownerUserId,
    status: '募集中',
    createdAt: now,
    updatedAt: now,
    moderationStatus: 'pending',
  })
  await recordDealEvent({
    dealKind: 'propertyRequest',
    dealId: request.id,
    status: '募集中',
    actorUserId: ownerUserId,
  })
  return request
}

export function updatePropertyRequest(
  id: string,
  input: PropertyRequestInput,
): Promise<PropertyRequest | undefined> {
  return getStore().propertyRequests.update(id, {
    ...requestFields(input),
    updatedAt: new Date().toISOString(),
  })
}

export type RequestStatusResult =
  | { ok: true; value: PropertyRequest }
  | { ok: false; reason: 'not_found' | 'forbidden' | 'transition' }

/** The proposer whose proposal the seeker agreed to, if any. */
async function agreedAgentOf(requestId: string): Promise<string | undefined> {
  const submissions = await getStore().submissions.list()
  return submissions.find(
    (submission) =>
      submission.kind === 'requestProposal' &&
      submission.targetId === requestId &&
      submission.status === 'agreed',
  )?.userId
}

const requestTransitions: Record<string, PropertyRequest['status'][]> = {
  募集中: ['成約'],
  調整中: ['紹介中', '成約'],
  紹介中: ['成約'],
  成約: [],
}

/** The agreed agent starts showing properties; the seeker (or an admin) closes it. */
export async function updatePropertyRequestStatus(
  id: string,
  user: AuthenticatedUser,
  status: '紹介中' | '成約',
): Promise<RequestStatusResult> {
  const store = getStore()
  const request = await store.propertyRequests.get(id)
  if (!request) return { ok: false, reason: 'not_found' }
  const agent = await agreedAgentOf(id)
  const manages = canManage(user, request)
  const allowed = status === '紹介中' ? manages || agent === user.id : manages
  if (!allowed) return { ok: false, reason: 'forbidden' }
  if (!requestTransitions[request.status]?.includes(status))
    return { ok: false, reason: 'transition' }
  const updated = await store.propertyRequests.update(id, {
    status,
    updatedAt: new Date().toISOString(),
  })
  if (!updated) return { ok: false, reason: 'not_found' }
  await recordDealEvent({
    dealKind: 'propertyRequest',
    dealId: id,
    status,
    actorUserId: user.id,
  })
  const recipient = status === '紹介中' ? request.ownerUserId : agent
  if (recipient && recipient !== user.id)
    await notify({
      userId: recipient,
      kind: 'application',
      title:
        status === '紹介中'
          ? '物件の紹介が始まりました'
          : 'リクエストが成約しました',
      body: request.title,
      href: `/requests/${id}`,
    })
  return { ok: true, value: updated }
}

export async function deletePropertyRequest(id: string): Promise<boolean> {
  const deleted = await getStore().propertyRequests.delete(id)
  if (deleted) await deleteSubmissionsFor(id)
  return deleted
}
