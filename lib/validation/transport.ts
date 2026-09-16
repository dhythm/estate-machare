import {
  asRecord,
  finish,
  invalidInput,
  optionalText,
  readDate,
  readInteger,
  requireChoice,
  requireEmail,
  requireText,
  type FieldErrors,
  type ValidationResult,
} from './shared'

export const carrierKinds = ['個人', '法人'] as const
export const vehicleTypes = [
  '軽トラック',
  '2tトラック',
  '4tトラック',
  'トレーラー',
] as const

export type TransportApplication = {
  name: string
  email: string
  vehicle: (typeof vehicleTypes)[number]
  availableDate: string
  message?: string
}

export type TransportInquiry = { message: string }

export function validateTransportInquiry(
  input: unknown,
): ValidationResult<TransportInquiry> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: TransportInquiry = {
    message: requireText(errors, source, 'message', '質問', 2000),
  }
  return finish(errors, value)
}

export function validateTransportApplication(
  input: unknown,
): ValidationResult<TransportApplication> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: TransportApplication = {
    name: requireText(errors, source, 'name', 'お名前・屋号', 60),
    email: requireEmail(errors, source, 'email'),
    vehicle: requireChoice(
      errors,
      source,
      'vehicle',
      '車両',
      vehicleTypes,
    ) as TransportApplication['vehicle'],
    availableDate: readDate(
      errors,
      source,
      'availableDate',
      '対応可能日',
      true,
    ) as string,
    message: optionalText(errors, source, 'message', 'メッセージ', 1000),
  }
  return finish(errors, value)
}

export type TransportJobInput = {
  item: string
  from: string
  to: string
  distanceKm: number
  weight: string
  desiredDate: string
  reward: number
  contactEmail: string
}

export function validateTransportJob(
  input: unknown,
): ValidationResult<TransportJobInput> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: TransportJobInput = {
    item: requireText(errors, source, 'item', '運ぶもの', 80),
    from: requireText(errors, source, 'from', '出発地', 60),
    to: requireText(errors, source, 'to', '届け先', 60),
    distanceKm: readInteger(errors, source, 'distanceKm', '距離', {
      min: 1,
      max: 3000,
    }) as number,
    weight: requireText(errors, source, 'weight', '荷物量', 30),
    desiredDate: requireText(errors, source, 'desiredDate', '希望日', 30),
    reward: readInteger(errors, source, 'reward', '報酬', {
      min: 1,
      max: 10_000_000,
    }) as number,
    contactEmail: requireEmail(errors, source, 'contactEmail'),
  }
  return finish(errors, value)
}
