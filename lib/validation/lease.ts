import { leaseStatuses, type LeaseStatus } from '@/lib/lease'
import {
  asRecord,
  finish,
  invalidInput,
  readDate,
  requireChoice,
  type FieldErrors,
  type ValidationResult,
} from './shared'

export type LeaseRequestInput = { startDate: string; endDate: string }

export function validateLeaseRequest(
  input: unknown,
): ValidationResult<LeaseRequestInput> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: LeaseRequestInput = {
    startDate: readDate(errors, source, 'startDate', '開始日', true) as string,
    endDate: readDate(errors, source, 'endDate', '終了日', true) as string,
  }
  return finish(errors, value)
}

export type LeaseStatusInput = { status: LeaseStatus }

export function validateLeaseStatus(
  input: unknown,
): ValidationResult<LeaseStatusInput> {
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}
  const value: LeaseStatusInput = {
    status: requireChoice(
      errors,
      source,
      'status',
      '状態',
      leaseStatuses,
    ) as LeaseStatus,
  }
  return finish(errors, value)
}
