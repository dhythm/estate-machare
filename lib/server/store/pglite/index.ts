import { mkdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { seedRows, type SeedOptions } from '../seed'
import type { Store } from '../types'
import { migrate } from './migrate'
import { createSqlRepository } from './sql-repository'
import type { TableSpec } from './sql-repository'
import {
  accountStatusTable,
  agentProfileTable,
  dealEventTable,
  listingTable,
  messageTable,
  notificationTable,
  orderTable,
  leaseTable,
  reviewTable,
  submissionTable,
  threadReadTable,
  propertyRequestTable,
} from './tables'

export type PgliteStoreOptions = SeedOptions & {
  /** Directory for the database files, or `memory://` for a volatile one. */
  dataDir: string
}

export const defaultPgliteDataDir = '.data/pglite'

async function seed(db: PGlite, options: SeedOptions): Promise<void> {
  // Rows list newest-first by `seq`, so insert each seed back to front to
  // keep the sample order (trc-001 first).
  const rows = seedRows(options)
  await db.transaction(async (tx) => {
    const connect = async () => tx
    const insert = async <T extends { id: string }>(
      table: TableSpec<T>,
      entities: T[],
    ) => {
      const repository = createSqlRepository(table, connect)
      for (const entity of [...entities].reverse())
        await repository.create(entity)
    }
    await insert(listingTable, rows.listings)
    await insert(propertyRequestTable, rows.propertyRequests)
    await insert(submissionTable, rows.submissions)
    await insert(messageTable, rows.messages)
    await insert(leaseTable, rows.leases)
    await insert(accountStatusTable, rows.accountStatuses)
    await insert(notificationTable, rows.notifications)
    await insert(reviewTable, rows.reviews)
    await insert(threadReadTable, rows.threadReads)
    await insert(agentProfileTable, rows.agentProfiles)
    await insert(orderTable, rows.orders)
    await insert(dealEventTable, rows.dealEvents)
  })
}

async function seedIfEmpty(db: PGlite, options: SeedOptions): Promise<void> {
  const result = await db.query<{ count: number }>(
    `select count(*)::int as count from listings`,
  )
  if (result.rows[0].count === 0) await seed(db, options)
}

/** Open (or create) the database, apply migrations, and seed when empty. */
export async function openPglite(
  dataDir: string,
  options: SeedOptions = {},
): Promise<PGlite> {
  if (!dataDir.startsWith('memory://')) {
    await mkdir(dataDir, { recursive: true })
  }
  const db = new PGlite(dataDir)
  await db.waitReady
  await migrate(db)
  await seedIfEmpty(db, options)
  return db
}

export function createPgliteStore(options: PgliteStoreOptions): Store {
  const ready = openPglite(options.dataDir, options)
  const connect = () => ready
  return {
    kind: 'pglite',
    listings: createSqlRepository(listingTable, connect),
    propertyRequests: createSqlRepository(propertyRequestTable, connect),
    submissions: createSqlRepository(submissionTable, connect),
    messages: createSqlRepository(messageTable, connect),
    leases: createSqlRepository(leaseTable, connect),
    accountStatuses: createSqlRepository(accountStatusTable, connect),
    notifications: createSqlRepository(notificationTable, connect),
    reviews: createSqlRepository(reviewTable, connect),
    threadReads: createSqlRepository(threadReadTable, connect),
    agentProfiles: createSqlRepository(agentProfileTable, connect),
    orders: createSqlRepository(orderTable, connect),
    dealEvents: createSqlRepository(dealEventTable, connect),
    async reset() {
      const db = await ready
      await db.exec(
        `truncate listings, property_requests, submissions, messages, leases, account_statuses, notifications, reviews, thread_reads, agent_profiles, orders, deal_events restart identity`,
      )
      await seed(db, options)
    },
    async close() {
      const db = await ready
      await db.close()
    },
  }
}
