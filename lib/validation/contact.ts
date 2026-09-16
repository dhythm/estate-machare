import {
  asRecord,
  finish,
  invalidInput,
  requireChoice,
  requireEmail,
  requireText,
  type FieldErrors,
  type ValidationResult,
} from './shared'

export const contactTopics = [
  '取引について',
  '出品について',
  '物件リクエストについて',
  '不具合の報告',
  'その他',
] as const

export type ContactMessage = {
  name: string
  email: string
  topic: (typeof contactTopics)[number]
  message: string
}

export function validateContact(
  input: unknown,
): ValidationResult<ContactMessage> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: ContactMessage = {
    name: requireText(errors, source, 'name', 'お名前', 60),
    email: requireEmail(errors, source, 'email'),
    topic: requireChoice(
      errors,
      source,
      'topic',
      'お問い合わせ種別',
      contactTopics,
    ) as ContactMessage['topic'],
    message: requireText(errors, source, 'message', 'お問い合わせ内容', 2000),
  }
  return finish(errors, value)
}
