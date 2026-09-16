export type ValidationResult<T> =
  { ok: true; value: T } | { ok: false; errors: Record<string, string> }

export type FieldErrors = Record<string, string>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    return null
  return input as Record<string, unknown>
}

function readText(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function requireText(
  errors: FieldErrors,
  source: Record<string, unknown>,
  key: string,
  label: string,
  maxLength = 200,
): string {
  const value = readText(source, key)
  if (value.length === 0) errors[key] = `${label}を入力してください。`
  else if (value.length > maxLength)
    errors[key] = `${label}は${maxLength}文字以内で入力してください。`
  return value
}

export function optionalText(
  errors: FieldErrors,
  source: Record<string, unknown>,
  key: string,
  label: string,
  maxLength = 2000,
): string | undefined {
  const value = readText(source, key)
  if (value.length === 0) return undefined
  if (value.length > maxLength)
    errors[key] = `${label}は${maxLength}文字以内で入力してください。`
  return value
}

export function requireEmail(
  errors: FieldErrors,
  source: Record<string, unknown>,
  key: string,
): string {
  const value = requireText(errors, source, key, 'メールアドレス')
  if (value.length > 0 && !emailPattern.test(value))
    errors[key] = 'メールアドレスの形式が正しくありません。'
  return value
}

export function requireChoice<const T extends readonly string[]>(
  errors: FieldErrors,
  source: Record<string, unknown>,
  key: string,
  label: string,
  choices: T,
): T[number] | undefined {
  const value = readText(source, key)
  if (choices.includes(value)) return value as T[number]
  errors[key] = `${label}を選択してください。`
  return undefined
}

export function readInteger(
  errors: FieldErrors,
  source: Record<string, unknown>,
  key: string,
  label: string,
  range: { min: number; max: number },
  required = true,
): number | undefined {
  const raw = source[key]
  const text = typeof raw === 'number' ? String(raw) : readText(source, key)
  if (text.length === 0) {
    if (required) errors[key] = `${label}を入力してください。`
    return undefined
  }
  const value = Number(text.replace(/[,，]/g, ''))
  if (!Number.isInteger(value) || value < range.min || value > range.max) {
    errors[key] =
      `${label}は${range.min}〜${range.max}の整数で入力してください。`
    return undefined
  }
  return value
}

/** A measurement with at most two decimals, such as a floor area in m². */
export function readDecimal(
  errors: FieldErrors,
  source: Record<string, unknown>,
  key: string,
  label: string,
  range: { min: number; max: number },
  required = true,
): number | undefined {
  const raw = source[key]
  const text = typeof raw === 'number' ? String(raw) : readText(source, key)
  if (text.length === 0) {
    if (required) errors[key] = `${label}を入力してください。`
    return undefined
  }
  const value = Number(text.replace(/[,，]/g, ''))
  if (
    !Number.isFinite(value) ||
    value < range.min ||
    value > range.max ||
    Number(value.toFixed(2)) !== value
  ) {
    errors[key] =
      `${label}は${range.min}〜${range.max}の数値（小数第2位まで）で入力してください。`
    return undefined
  }
  return value
}

export function readBoolean(
  source: Record<string, unknown>,
  key: string,
): boolean {
  const value = source[key]
  return value === true || value === 'true' || value === 'on'
}

export function readDate(
  errors: FieldErrors,
  source: Record<string, unknown>,
  key: string,
  label: string,
  required: boolean,
): string | undefined {
  const value = readText(source, key)
  if (value.length === 0) {
    if (required) errors[key] = `${label}を入力してください。`
    return undefined
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    errors[key] = `${label}は日付で入力してください。`
    return undefined
  }
  return value
}

export function finish<T>(errors: FieldErrors, value: T): ValidationResult<T> {
  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value }
}

export const invalidInput: ValidationResult<never> = {
  ok: false,
  errors: { form: '入力内容を読み取れませんでした。' },
}
