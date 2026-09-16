// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { closeStore, getStore, resetStore } from './index'

vi.mock('server-only', () => ({}))

afterEach(async () => {
  await closeStore()
  vi.unstubAllEnvs()
})

// Booting the embedded Postgres can exceed the default 5s under load.
describe('store selection', { timeout: 20_000 }, () => {
  it('uses the memory store by default', async () => {
    vi.stubEnv('DATA_STORE', '')
    const store = getStore()
    expect(store.kind).toBe('memory')
    expect((await store.listings.list()).length).toBeGreaterThanOrEqual(48)
  })

  it('uses PGlite when DATA_STORE=pglite', async () => {
    vi.stubEnv('DATA_STORE', 'pglite')
    vi.stubEnv('PGLITE_DATA_DIR', 'memory://')
    const store = getStore()
    expect(store.kind).toBe('pglite')
    expect((await store.propertyRequests.list()).length).toBeGreaterThanOrEqual(10)
  })

  it('rejects unknown store names', () => {
    vi.stubEnv('DATA_STORE', 'mysql')
    expect(() => getStore()).toThrow(/DATA_STORE/)
  })

  it('returns the same instance until reset, and reset reseeds', async () => {
    vi.stubEnv('DATA_STORE', 'memory')
    await getStore().listings.delete('trc-001')
    expect(await getStore().listings.get('trc-001')).toBeUndefined()
    await resetStore()
    expect(await getStore().listings.get('trc-001')).toBeDefined()
  })
})
