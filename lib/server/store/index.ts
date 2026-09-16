import 'server-only'

import { createMemoryStore } from './memory'
import { createPgliteStore, defaultPgliteDataDir } from './pglite'
import type { Store, StoreKind } from './types'

export type {
  AccountStatus,
  DealEvent,
  DealKind,
  Message,
  Notification,
  NotificationKind,
  Order,
  Rental,
  Review,
  ReviewSourceKind,
  Store,
  Submission,
  SubmissionKind,
} from './types'

/**
 * `DATA_STORE` selects the implementation:
 * - `memory` (default): volatile in-process store, for `pnpm dev` and mocks.
 * - `pglite`: embedded PostgreSQL at `PGLITE_DATA_DIR` (default
 *   `.data/pglite`, `memory://` for a volatile database).
 * `DEMO_ACTIVITY=off` seeds only the listings and jobs, without activity.
 */
function resolveStoreKind(): StoreKind {
  const value = process.env.DATA_STORE?.trim() || 'memory'
  if (value === 'memory' || value === 'pglite') return value
  throw new Error(
    `DATA_STORE must be "memory" or "pglite" (received "${value}").`,
  )
}

/** Sample activity is on unless `DEMO_ACTIVITY=off` (the test suite turns it off). */
function demoActivityEnabled(): boolean {
  return process.env.DEMO_ACTIVITY?.trim() !== 'off'
}

function createStore(): Store {
  const demoActivity = demoActivityEnabled()
  switch (resolveStoreKind()) {
    case 'pglite':
      return createPgliteStore({
        dataDir: process.env.PGLITE_DATA_DIR?.trim() || defaultPgliteDataDir,
        demoActivity,
      })
    case 'memory':
      return createMemoryStore({ demoActivity })
  }
}

// Kept on globalThis so the instance survives module re-evaluation during
// development (HMR).
const storeKey = Symbol.for('agri-machare.store')
type StoreHolder = { [storeKey]?: Store }

export function getStore(): Store {
  const holder = globalThis as StoreHolder
  holder[storeKey] ??= createStore()
  return holder[storeKey]
}

export function resetStore(): Promise<void> {
  return getStore().reset()
}

export async function closeStore(): Promise<void> {
  const holder = globalThis as StoreHolder
  const store = holder[storeKey]
  holder[storeKey] = undefined
  await store?.close()
}
