import { describe, expect, it } from 'vitest'
import {
  validatePropertyRequest,
  validateRequestProposal,
} from './property-request'

describe('validateRequestProposal', () => {
  const valid = {
    name: '高橋 健',
    email: 'ken@example.com',
    listingId: 'apt-001',
    availableDate: '2026-10-03',
    message: '',
  }

  it('accepts a proposal', () => {
    expect(validateRequestProposal(valid).ok).toBe(true)
  })

  it('accepts a proposal without a listing of its own', () => {
    expect(validateRequestProposal({ ...valid, listingId: '' }).ok).toBe(true)
  })

  it('requires a name, email, and date', () => {
    const result = validateRequestProposal({})
    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(Object.keys(result.errors).sort()).toEqual([
        'availableDate',
        'email',
        'name',
      ])
  })
})

describe('validatePropertyRequest', () => {
  const valid = {
    title: '駅徒歩10分以内の2LDKを借りたい',
    deal: 'rent',
    category: 'マンション',
    layout: '2LDK',
    prefecture: '東京都',
    city: '世田谷区',
    budget: '140,000',
    moveInDate: '2026-12-01',
    contactEmail: 'seeker@example.com',
  }

  it('accepts a request and normalizes numbers', () => {
    const result = validatePropertyRequest(valid)
    expect(result.ok).toBe(true)
    if (result.ok)
      expect(result.value).toMatchObject({ budget: 140_000, layout: '2LDK' })
  })

  it('drops the layout for land, which has no rooms', () => {
    const result = validatePropertyRequest({ ...valid, category: '土地' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.layout).toBeUndefined()
  })

  it('reports an invalid title, budget and layout', () => {
    const result = validatePropertyRequest({
      ...valid,
      title: '',
      budget: 'abc',
      layout: '5LDK',
    })
    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(Object.keys(result.errors).sort()).toEqual([
        'budget',
        'layout',
        'title',
      ])
  })
})
