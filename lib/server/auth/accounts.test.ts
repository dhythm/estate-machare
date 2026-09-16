import { afterEach, describe, expect, it, vi } from 'vitest'
import { authenticate, configuredAccounts, isUserRole } from './accounts'

afterEach(() => {
  vi.unstubAllEnvs()
})

function clearAccountEnv() {
  vi.stubEnv('DEMO_ADMIN_EMAIL', '')
  vi.stubEnv('DEMO_ADMIN_PASSWORD', '')
  vi.stubEnv('DEMO_USER_EMAIL', '')
  vi.stubEnv('DEMO_USER_PASSWORD', '')
  vi.stubEnv('DEMO_SELLER_EMAIL', '')
  vi.stubEnv('DEMO_SELLER_PASSWORD', '')
  vi.stubEnv('DEMO_PERSONA_PASSWORD', '')
}

describe('configuredAccounts', () => {
  it('provides demo accounts outside production when unset', () => {
    clearAccountEnv()
    vi.stubEnv('NODE_ENV', 'test')
    expect(configuredAccounts().slice(0, 3)).toEqual([
      expect.objectContaining({
        id: 'demo-admin',
        email: 'admin@example.com',
        role: 'admin',
      }),
      expect.objectContaining({
        id: 'demo-seller',
        email: 'seller@example.com',
        name: '出品者デモ',
        role: 'user',
      }),
      expect.objectContaining({
        id: 'demo-user',
        email: 'user@example.com',
        role: 'user',
      }),
    ])
  })

  it('reads accounts from the environment', () => {
    vi.stubEnv('DEMO_ADMIN_EMAIL', 'Ops@Example.com ')
    vi.stubEnv('DEMO_ADMIN_PASSWORD', 'ops-pass')
    vi.stubEnv('DEMO_SELLER_EMAIL', 'farm@example.com')
    vi.stubEnv('DEMO_SELLER_PASSWORD', 'farm-pass')
    vi.stubEnv('DEMO_USER_EMAIL', 'farmer@example.com')
    vi.stubEnv('DEMO_USER_PASSWORD', 'farmer-pass')
    expect(
      configuredAccounts()
        .slice(0, 3)
        .map((account) => account.email),
    ).toEqual(['ops@example.com', 'farm@example.com', 'farmer@example.com'])
  })

  it('lists the demo personas after the environment accounts', () => {
    clearAccountEnv()
    vi.stubEnv('NODE_ENV', 'test')
    const personas = configuredAccounts().slice(3)
    expect(personas.length).toBeGreaterThanOrEqual(16)
    expect(personas.map((account) => account.id)).toContain('nakamura-estate')
    expect(personas.every((account) => account.role === 'user')).toBe(true)
    expect(new Set(configuredAccounts().map((a) => a.email)).size).toBe(
      configuredAccounts().length,
    )
  })

  it('disables unset accounts in production', () => {
    clearAccountEnv()
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DEMO_ADMIN_EMAIL', 'ops@example.com')
    vi.stubEnv('DEMO_ADMIN_PASSWORD', 'ops-pass')
    expect(
      configuredAccounts()
        .filter((account) => account.id.startsWith('demo-'))
        .map((account) => account.id),
    ).toEqual(['demo-admin'])
  })

  it('ignores an account whose password is missing', () => {
    clearAccountEnv()
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DEMO_ADMIN_EMAIL', 'ops@example.com')
    expect(
      configuredAccounts().filter((account) => account.id.startsWith('demo-')),
    ).toEqual([])
  })
})

describe('authenticate', () => {
  it('returns the user without the password on a match', () => {
    clearAccountEnv()
    vi.stubEnv('NODE_ENV', 'test')
    const user = authenticate(' Admin@Example.com ', 'dev-admin')
    expect(user).toEqual({
      id: 'demo-admin',
      email: 'admin@example.com',
      name: '運営デモ',
      role: 'admin',
    })
  })

  it('signs personas in with the shared persona password', () => {
    clearAccountEnv()
    vi.stubEnv('NODE_ENV', 'test')
    expect(authenticate('nakamura-estate@example.com', 'dev-persona')).toEqual({
      id: 'nakamura-estate',
      email: 'nakamura-estate@example.com',
      name: '中村不動産',
      role: 'user',
    })
    vi.stubEnv('DEMO_PERSONA_PASSWORD', 'shared-pass')
    expect(
      authenticate('nakamura-estate@example.com', 'dev-persona'),
    ).toBeUndefined()
    expect(
      authenticate('nakamura-estate@example.com', 'shared-pass'),
    ).toBeDefined()
  })

  it('keeps personas listed but not signable in production without a password', () => {
    clearAccountEnv()
    vi.stubEnv('NODE_ENV', 'production')
    expect(configuredAccounts().map((a) => a.id)).toContain('nakamura-estate')
    expect(
      authenticate('nakamura-estate@example.com', 'dev-persona'),
    ).toBeUndefined()
  })

  it('rejects a wrong password, unknown email, or empty input', () => {
    clearAccountEnv()
    vi.stubEnv('NODE_ENV', 'test')
    expect(authenticate('admin@example.com', 'dev-user')).toBeUndefined()
    expect(authenticate('nobody@example.com', 'dev-admin')).toBeUndefined()
    expect(authenticate('', '')).toBeUndefined()
  })
})

describe('isUserRole', () => {
  it('accepts only known roles', () => {
    expect(isUserRole('admin')).toBe(true)
    expect(isUserRole('user')).toBe(true)
    expect(isUserRole('owner')).toBe(false)
    expect(isUserRole(undefined)).toBe(false)
  })
})
