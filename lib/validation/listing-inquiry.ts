import {
  asRecord,
  finish,
  invalidInput,
  readDate,
  requireChoice,
  requireEmail,
  requireText,
  type FieldErrors,
  type ValidationResult,
} from './shared'

export const inquiryModes = [
  'buy',
  'rent',
  'purchaseOption',
  'question',
] as const

export type InquiryMode = (typeof inquiryModes)[number]

export type ListingInquiry = {
  mode: InquiryMode
  name: string
  email: string
  preferredDate?: string
  message: string
}

export function validateListingInquiry(
  input: unknown,
): ValidationResult<ListingInquiry> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: ListingInquiry = {
    mode: requireChoice(
      errors,
      source,
      'mode',
      '目的',
      inquiryModes,
    ) as InquiryMode,
    name: requireText(errors, source, 'name', 'お名前', 60),
    email: requireEmail(errors, source, 'email'),
    preferredDate: readDate(errors, source, 'preferredDate', '希望日', false),
    message: requireText(errors, source, 'message', 'メッセージ', 2000),
  }
  return finish(errors, value)
}
