import { moderationStatuses, type ModerationQueueFilter } from '@/lib/data'
import {
  asRecord,
  finish,
  invalidInput,
  optionalText,
  requireChoice,
  requireText,
  type FieldErrors,
  type ValidationResult,
} from './shared'

const moderationKinds = ['listing'] as const
const moderationDecisions = ['approved', 'rejected'] as const
const moderationQueueFilters = ['all', ...moderationStatuses] as const

export type ModerationInput = {
  kind: (typeof moderationKinds)[number]
  id: string
  status: (typeof moderationDecisions)[number]
  note?: string
}

export function validateModerationInput(
  input: unknown,
): ValidationResult<ModerationInput> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: ModerationInput = {
    kind: requireChoice(
      errors,
      source,
      'kind',
      '対象',
      moderationKinds,
    ) as ModerationInput['kind'],
    id: requireText(errors, source, 'id', '対象ID', 80),
    status: requireChoice(
      errors,
      source,
      'status',
      '判定',
      moderationDecisions,
    ) as ModerationInput['status'],
    note: optionalText(errors, source, 'note', 'メモ', 500),
  }
  return finish(errors, value)
}

export function readModerationQueueFilter(
  value: string | undefined,
): ModerationQueueFilter | undefined {
  const resolved = value || 'pending'
  return moderationQueueFilters.includes(resolved as ModerationQueueFilter)
    ? (resolved as ModerationQueueFilter)
    : undefined
}
