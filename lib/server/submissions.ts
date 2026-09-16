import 'server-only'

import { randomUUID } from 'node:crypto'
import {
  getStore,
  type Submission,
  type SubmissionKind as StoredSubmissionKind,
} from './store'
import { notify } from './notifications'
import { deleteMessagesFor } from './threads'

export type SubmissionKind = Extract<
  StoredSubmissionKind,
  'contact' | 'listingInquiry'
>

export type Receipt = {
  id: string
  receivedAt: string
}

export type SubmissionOptions = {
  /** Listing the submission refers to. */
  targetId?: string
  /** Signed-in sender, when the form requires login. */
  userId?: string
}

/** Store a validated form submission and issue a receipt. */
export async function acceptSubmission(
  kind: SubmissionKind,
  payload: Record<string, unknown>,
  options: SubmissionOptions = {},
): Promise<Receipt> {
  const submission: Submission = {
    id: randomUUID(),
    kind,
    targetId: options.targetId,
    userId: options.userId,
    receivedAt: new Date().toISOString(),
    payload,
  }
  await getStore().submissions.create(submission)
  await notifyTargetOwner(submission)
  return { id: submission.id, receivedAt: submission.receivedAt }
}

async function notifyTargetOwner(submission: Submission): Promise<void> {
  if (!submission.targetId) return
  const store = getStore()
  if (submission.kind === 'listingInquiry') {
    const listing = await store.listings.get(submission.targetId)
    if (!listing?.ownerUserId) return
    await notify({
      userId: listing.ownerUserId,
      kind: 'inquiry',
      title: '問い合わせが届きました',
      body: listing.name,
      href: `/account/threads/${submission.id}`,
    })
  }
}

export async function listSubmissions(
  kind: SubmissionKind,
  targetId?: string,
): Promise<Submission[]> {
  const submissions = await getStore().submissions.list()
  return submissions.filter(
    (submission) =>
      submission.kind === kind &&
      (targetId === undefined || submission.targetId === targetId),
  )
}

export async function listSubmissionsByUser(
  userId: string,
): Promise<Submission[]> {
  const submissions = await getStore().submissions.list()
  return submissions.filter(
    (submission) =>
      submission.userId === userId &&
      (submission.kind === 'listingInquiry' || submission.kind === 'contact'),
  )
}

export async function deleteSubmissionsFor(targetId: string): Promise<void> {
  const submissions = await getStore().submissions.list()
  const related = submissions.filter(
    (submission) => submission.targetId === targetId,
  )
  await deleteMessagesFor(related.map((submission) => submission.id))
  await Promise.all(
    related.map((submission) => getStore().submissions.delete(submission.id)),
  )
}
