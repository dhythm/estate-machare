import { prefectureNames } from '@/lib/prefectures'
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
import { listingCategories } from './listing-submission'
import { agentKinds } from './property-request'

export type AgentProfileInput = {
  name: string
  kind: (typeof agentKinds)[number]
  prefecture: string
  handledCategories: (typeof listingCategories)[number][]
  serviceAreas: string[]
  note?: string
}

function readChoices<const T extends readonly string[]>(
  errors: FieldErrors,
  source: Record<string, unknown>,
  key: string,
  label: string,
  choices: T,
): T[number][] {
  const raw = source[key]
  const values = Array.isArray(raw) ? raw : []
  if (values.length === 0) {
    errors[key] = `${label}を1つ以上選択してください。`
    return []
  }
  if (!values.every((value) => choices.includes(value))) {
    errors[key] = `${label}の選択が正しくありません。`
    return []
  }
  return [...new Set(values as T[number][])]
}

export function validateAgentProfile(
  input: unknown,
): ValidationResult<AgentProfileInput> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: AgentProfileInput = {
    name: requireText(errors, source, 'name', 'お名前・商号', 60),
    kind: requireChoice(
      errors,
      source,
      'kind',
      '区分',
      agentKinds,
    ) as AgentProfileInput['kind'],
    prefecture: requireChoice(
      errors,
      source,
      'prefecture',
      '拠点の都道府県',
      prefectureNames,
    ) as string,
    handledCategories: readChoices(
      errors,
      source,
      'handledCategories',
      '取扱カテゴリ',
      listingCategories,
    ),
    serviceAreas: readChoices(
      errors,
      source,
      'serviceAreas',
      '対応地域',
      prefectureNames,
    ),
    note: optionalText(errors, source, 'note', '補足', 1000),
  }
  return finish(errors, value)
}
