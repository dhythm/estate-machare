import type { Listing, PropertyRequest } from '@/lib/data'
import { seedRows, type SeedOptions } from './seed'
import { createMemoryRepository } from './memory-repository'
import type { Repository } from './repository'
import type {
  AccountStatus,
  AgentProfile,
  DealEvent,
  Message,
  Notification,
  Order,
  Lease,
  Review,
  Store,
  Submission,
  ThreadRead,
} from './types'

export function createMemoryStore(options: SeedOptions = {}): Store {
  const load = () => {
    const rows = seedRows(options)
    return {
      listings: createMemoryRepository(rows.listings),
      propertyRequests: createMemoryRepository(rows.propertyRequests),
      submissions: createMemoryRepository<Submission>(rows.submissions),
      messages: createMemoryRepository<Message>(rows.messages),
      leases: createMemoryRepository<Lease>(rows.leases),
      accountStatuses: createMemoryRepository<AccountStatus>(
        rows.accountStatuses,
      ),
      notifications: createMemoryRepository<Notification>(rows.notifications),
      reviews: createMemoryRepository<Review>(rows.reviews),
      threadReads: createMemoryRepository<ThreadRead>(rows.threadReads),
      agentProfiles: createMemoryRepository<AgentProfile>(
        rows.agentProfiles,
      ),
      orders: createMemoryRepository<Order>(rows.orders),
      dealEvents: createMemoryRepository<DealEvent>(rows.dealEvents),
    }
  }
  let store = load()
  const proxy = <T extends { id: string }>(
    pick: () => Repository<T>,
  ): Repository<T> => ({
    list: () => pick().list(),
    get: (id) => pick().get(id),
    create: (entity) => pick().create(entity),
    update: (id, patch) => pick().update(id, patch),
    delete: (id) => pick().delete(id),
  })
  return {
    kind: 'memory',
    listings: proxy<Listing>(() => store.listings),
    propertyRequests: proxy<PropertyRequest>(() => store.propertyRequests),
    submissions: proxy<Submission>(() => store.submissions),
    messages: proxy<Message>(() => store.messages),
    leases: proxy<Lease>(() => store.leases),
    accountStatuses: proxy<AccountStatus>(() => store.accountStatuses),
    notifications: proxy<Notification>(() => store.notifications),
    reviews: proxy<Review>(() => store.reviews),
    threadReads: proxy<ThreadRead>(() => store.threadReads),
    agentProfiles: proxy<AgentProfile>(() => store.agentProfiles),
    orders: proxy<Order>(() => store.orders),
    dealEvents: proxy<DealEvent>(() => store.dealEvents),
    async reset() {
      store = load()
    },
    async close() {},
  }
}
