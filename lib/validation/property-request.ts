import { isLayout, layouts, type Layout } from '@/lib/data'
import { listingCategories } from './listing-submission'
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

export const agentKinds = ['個人', '宅建業者', '管理会社', '法人'] as const

export const requestDeals = ['sale', 'rent'] as const

export type RequestProposal = {
  name: string
  email: string
  /** Listing the proposer is offering, when they picked one of their own. */
  listingId?: string
  availableDate: string
  message?: string
}

export type RequestInquiry = { message: string }

export function validateRequestInquiry(
  input: unknown,
): ValidationResult<RequestInquiry> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: RequestInquiry = {
    message: requireText(errors, source, 'message', '質問', 2000),
  }
  return finish(errors, value)
}

export function validateRequestProposal(
  input: unknown,
): ValidationResult<RequestProposal> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: RequestProposal = {
    name: requireText(errors, source, 'name', 'お名前・屋号', 60),
    email: requireEmail(errors, source, 'email'),
    listingId: optionalText(errors, source, 'listingId', '紹介する物件', 60),
    availableDate: readDate(
      errors,
      source,
      'availableDate',
      '案内可能日',
      true,
    ) as string,
    message: optionalText(errors, source, 'message', 'メッセージ', 1000),
  }
  return finish(errors, value)
}

export type PropertyRequestInput = {
  title: string
  deal: (typeof requestDeals)[number]
  category: (typeof listingCategories)[number]
  layout?: Layout
  prefecture: string
  city: string
  budget: number
  moveInDate: string
  contactEmail: string
}

/** Land has no rooms, so a layout is neither asked for nor kept. */
function readLayout(
  errors: FieldErrors,
  source: Record<string, unknown>,
): Layout | undefined {
  const raw = source.layout
  if (raw === undefined || raw === null || raw === '') return undefined
  if (typeof raw !== 'string' || !isLayout(raw)) {
    errors.layout = '間取りの選択が正しくありません。'
    return undefined
  }
  return raw
}

export function validatePropertyRequest(
  input: unknown,
): ValidationResult<PropertyRequestInput> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: PropertyRequestInput = {
    title: requireText(errors, source, 'title', '希望条件の見出し', 80),
    deal: requireChoice(
      errors,
      source,
      'deal',
      '希望する取引',
      requestDeals,
    ) as PropertyRequestInput['deal'],
    category: requireChoice(
      errors,
      source,
      'category',
      'カテゴリ',
      listingCategories,
    ) as PropertyRequestInput['category'],
    layout: readLayout(errors, source),
    prefecture: requireText(errors, source, 'prefecture', '都道府県', 10),
    city: requireText(errors, source, 'city', '市区町村', 40),
    budget: readInteger(errors, source, 'budget', '予算の上限', {
      min: 1,
      max: 1_000_000_000,
    }) as number,
    moveInDate: readDate(
      errors,
      source,
      'moveInDate',
      '入居・引渡し希望日',
      true,
    ) as string,
    contactEmail: requireEmail(errors, source, 'contactEmail'),
  }
  if (value.category === '土地') value.layout = undefined
  return finish(errors, value)
}

export const requestLayouts = layouts
