import {
  asRecord,
  finish,
  invalidInput,
  optionalText,
  readInteger,
  requireChoice,
  requireText,
  type FieldErrors,
  type ValidationResult,
} from './shared'

const sourceKinds = ['lease', 'thread', 'order'] as const

export type ReviewInput = {
  sourceKind: (typeof sourceKinds)[number]
  sourceId: string
  rating: number
  comment?: string
}

export function validateReview(input: unknown): ValidationResult<ReviewInput> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: ReviewInput = {
    sourceKind: requireChoice(
      errors,
      source,
      'sourceKind',
      '対象',
      sourceKinds,
    ) as ReviewInput['sourceKind'],
    sourceId: requireText(errors, source, 'sourceId', '対象ID', 80),
    rating: readInteger(errors, source, 'rating', '評価', {
      min: 1,
      max: 5,
    }) as number,
    comment: optionalText(errors, source, 'comment', 'コメント', 1000),
  }
  return finish(errors, value)
}
