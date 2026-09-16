import 'server-only'

import type { ValidationResult } from '@/lib/validation/shared'
import { acceptSubmission, type SubmissionKind } from './submissions'

export function badRequest(
  error: string,
  errors?: Record<string, string>,
): Response {
  return Response.json(errors ? { error, errors } : { error }, {
    status: 400,
  })
}

export function notFound(error: string): Response {
  return Response.json({ error }, { status: 404 })
}

export function unauthorized(error = 'ログインが必要です。'): Response {
  return Response.json({ error }, { status: 401 })
}

export function forbidden(error: string): Response {
  return Response.json({ error }, { status: 403 })
}

export function conflict(error: string): Response {
  return Response.json({ error }, { status: 409 })
}

/** Map a lease service failure to its HTTP response. */
export function leaseFailure(
  reason:
    | 'not_found'
    | 'forbidden'
    | 'conflict'
    | 'unavailable'
    | 'invalid'
    | 'transition',
): Response {
  switch (reason) {
    case 'not_found':
      return notFound('レンタルが見つかりません。')
    case 'forbidden':
      return forbidden('このレンタルを操作する権限がありません。')
    case 'conflict':
      return conflict('その期間はすでに予約されています。')
    case 'unavailable':
      return conflict('この農機具はレンタルできません。')
    case 'invalid':
      return badRequest('期間の指定が正しくありません。')
    case 'transition':
      return conflict('現在の状態ではその操作はできません。')
  }
}

/** Map an order service failure to its HTTP response. */
export function orderFailure(
  reason: 'not_found' | 'forbidden' | 'conflict' | 'unavailable' | 'transition',
): Response {
  switch (reason) {
    case 'not_found':
      return notFound('注文が見つかりません。')
    case 'forbidden':
      return forbidden('この注文を操作する権限がありません。')
    case 'conflict':
      return conflict('他の方の購入手続きが進んでいます。')
    case 'unavailable':
      return conflict('この農機具は購入できません。')
    case 'transition':
      return conflict('現在の状態ではその操作はできません。')
  }
}

/** Map a thread service failure to its HTTP response. */
export function threadFailure(reason: 'not_found' | 'forbidden'): Response {
  return reason === 'not_found'
    ? notFound('スレッドが見つかりません。')
    : forbidden('このスレッドを見る権限がありません。')
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}

type Parsed<T> = { ok: true; value: T } | { ok: false; response: Response }

/** Read and validate a JSON body, producing the 400 response on failure. */
export async function parseBody<T>(
  request: Request,
  validate: (input: unknown) => ValidationResult<T>,
  refine?: (value: T) => Record<string, string> | undefined,
): Promise<Parsed<T>> {
  const input = await readJson(request)
  if (input === undefined)
    return { ok: false, response: badRequest('JSON を読み取れませんでした。') }
  const result = validate(input)
  if (!result.ok)
    return {
      ok: false,
      response: badRequest('入力内容に誤りがあります。', result.errors),
    }
  const errors = refine?.(result.value)
  if (errors)
    return {
      ok: false,
      response: badRequest('入力内容に誤りがあります。', errors),
    }
  return { ok: true, value: result.value }
}

export async function handleSubmission<T extends Record<string, unknown>>(
  request: Request,
  kind: SubmissionKind,
  validate: (input: unknown) => ValidationResult<T>,
  options: {
    targetId?: string
    userId?: string
    refine?: (value: T) => Record<string, string> | undefined
  } = {},
): Promise<Response> {
  const parsed = await parseBody(request, validate, options.refine)
  if (!parsed.ok) return parsed.response
  const receipt = await acceptSubmission(kind, parsed.value, {
    targetId: options.targetId,
    userId: options.userId,
  })
  return Response.json(receipt, { status: 201 })
}
