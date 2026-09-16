import 'server-only'
import { generateListings } from './generated-listings'
import { listings as catalogListings } from './data'

import { orderStatusLabels, type Listing, type TransportJob } from '@/lib/data'
import { countRentalDays, rentalStatusLabels } from '@/lib/rent-to-own'
import type {
  AccountStatus,
  CarrierProfile,
  DealEvent,
  DealKind,
  Message,
  Notification,
  Order,
  Rental,
  Review,
  Submission,
  ThreadRead,
} from './store/types'

/**
 * What the marketplace looks like after a few months of use: purchases,
 * rentals, threads, and reviews between the demo accounts and the
 * personas. Loaded on top of the sample listings unless `DEMO_ACTIVITY=off`.
 */
export type DemoActivity = {
  listings: Listing[]
  transportJobs: TransportJob[]
  submissions: Submission[]
  messages: Message[]
  rentals: Rental[]
  orders: Order[]
  reviews: Review[]
  carrierProfiles: CarrierProfile[]
  notifications: Notification[]
  threadReads: ThreadRead[]
  accountStatuses: AccountStatus[]
  dealEvents: DealEvent[]
}

/** `at('09-13 10:30')` → ISO timestamp in 2026, JST. */
function at(stamp: string): string {
  const [date, time] = stamp.split(' ')
  return new Date(`2026-${date}T${time}:00+09:00`).toISOString()
}

const history = [
  {
    id: 'trc-101',
    ownerUserId: 'demo-seller',
    moderationStatus: 'pending' as const,
  },
  {
    id: 'cmb-102',
    ownerUserId: 'yamada-nosan',
    moderationStatus: 'pending' as const,
  },
  {
    id: 'til-103',
    ownerUserId: 'demo-admin',
    moderationStatus: 'approved' as const,
  },
  {
    id: 'til-104',
    ownerUserId: 'demo-seller',
    moderationStatus: 'approved' as const,
    withdrawnAt: at('08-12 16:00'),
  },
  {
    id: 'rpl-105',
    ownerUserId: 'nakamura-farm',
    moderationStatus: 'approved' as const,
    withdrawnAt: at('07-02 12:00'),
  },
  {
    id: 'drn-106',
    ownerUserId: 'demo-seller',
    moderationStatus: 'approved' as const,
  },
]
const listings: Listing[] = generateListings(6, 101).map((listing, index) => ({
  ...listing,
  ...history[index],
  seller: {
    ...listing.seller,
    name:
      history[index].ownerUserId === 'demo-admin' ? '運営デモ' : '掲載者デモ',
  },
  createdAt: at('08-01 10:00'),
  updatedAt: at('09-13 09:10'),
}))

const transportJobs: TransportJob[] = []

function rental(
  input: Omit<Rental, 'days' | 'rentTotal' | 'createdAt' | 'updatedAt'> & {
    createdAt: string
    updatedAt: string
  },
): Rental {
  const days = countRentalDays(input.startDate, input.endDate)
  return { ...input, days, rentTotal: days * input.rentPerDay }
}

const rentals: Rental[] = [
  rental({
    id: 'r-101',
    listingId: 'trc-001',
    renterUserId: 'demo-user',
    startDate: '2026-10-05',
    endDate: '2026-10-08',
    rentPerDay: 22_000,
    salePrice: 18_800_000,
    creditRate: 50,
    creditCap: 5_000_000,
    status: 'requested',
    createdAt: at('09-12 20:15'),
    updatedAt: at('09-12 20:15'),
  }),
  rental({
    id: 'r-102',
    listingId: 'drn-005',
    renterUserId: 'suzuki',
    startDate: '2026-09-10',
    endDate: '2026-09-16',
    rentPerDay: 12_000,
    status: 'active',
    createdAt: at('09-01 09:30'),
    updatedAt: at('09-10 08:00'),
  }),
  rental({
    id: 'r-103',
    listingId: 'rpl-003',
    renterUserId: 'demo-user',
    startDate: '2026-08-20',
    endDate: '2026-08-24',
    rentPerDay: 18_000,
    salePrice: 9_600_000,
    creditRate: 50,
    creditCap: 2_500_000,
    status: 'completed',
    createdAt: at('08-10 12:00'),
    updatedAt: at('08-25 09:10'),
  }),
  rental({
    id: 'r-104',
    listingId: 'cmb-002',
    renterUserId: 'demo-admin',
    startDate: '2026-10-01',
    endDate: '2026-10-03',
    rentPerDay: 45_000,
    salePrice: 24_500_000,
    creditRate: 50,
    creditCap: 6_000_000,
    status: 'requested',
    createdAt: at('09-13 08:50'),
    updatedAt: at('09-13 08:50'),
  }),
  rental({
    id: 'r-105',
    listingId: 'trc-001',
    renterUserId: 'ito-farm',
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    rentPerDay: 22_000,
    salePrice: 18_800_000,
    creditRate: 50,
    creditCap: 5_000_000,
    status: 'completed',
    createdAt: at('06-20 15:00'),
    updatedAt: at('07-06 10:00'),
  }),
  rental({
    id: 'r-106',
    listingId: 'til-004',
    renterUserId: 'takahashi',
    startDate: '2026-09-01',
    endDate: '2026-09-02',
    rentPerDay: 2_500,
    status: 'cancelled',
    createdAt: at('08-28 19:00'),
    updatedAt: at('08-30 08:20'),
  }),
  rental({
    id: 'r-107',
    listingId: 'drn-106',
    renterUserId: 'demo-user',
    startDate: '2026-09-12',
    endDate: '2026-09-18',
    rentPerDay: 14_000,
    status: 'active',
    createdAt: at('09-03 10:00'),
    updatedAt: at('09-12 07:30'),
  }),
  rental({
    id: 'r-108',
    listingId: 'cmb-002',
    renterUserId: 'suzuki',
    startDate: '2026-06-10',
    endDate: '2026-06-12',
    rentPerDay: 45_000,
    salePrice: 24_500_000,
    creditRate: 50,
    creditCap: 6_000_000,
    status: 'completed',
    createdAt: at('05-30 13:00'),
    updatedAt: at('06-13 11:00'),
  }),
]

const orders: Order[] = [
  {
    id: 'o-101',
    listingId: 'cmb-002',
    buyerUserId: 'suzuki',
    sellerUserId: 'demo-seller',
    price: 24_500_000,
    status: 'requested',
    message: '6月の内見で住環境が気に入り、購入を検討しています。',
    createdAt: at('09-13 09:40'),
    updatedAt: at('09-13 09:40'),
  },
  {
    id: 'o-102',
    listingId: 'trc-006',
    buyerUserId: 'demo-user',
    sellerUserId: 'tokachi-agri',
    price: 21_000_000,
    status: 'requested',
    message: '引き渡し時期と契約条件を相談したいです。',
    createdAt: at('09-11 21:00'),
    updatedAt: at('09-11 21:00'),
  },
  {
    id: 'o-103',
    listingId: 'til-004',
    buyerUserId: 'ito-farm',
    sellerUserId: 'kobayashi-engei',
    price: 128_000,
    status: 'accepted',
    createdAt: at('09-09 10:00'),
    updatedAt: at('09-10 09:15'),
  },
  {
    id: 'o-104',
    listingId: 'til-104',
    buyerUserId: 'demo-user',
    sellerUserId: 'demo-seller',
    price: 98_000,
    status: 'completed',
    createdAt: at('08-05 12:00'),
    updatedAt: at('08-12 16:00'),
  },
  {
    id: 'o-105',
    listingId: 'rpl-105',
    buyerUserId: 'kato',
    sellerUserId: 'nakamura-farm',
    price: 1_450_000,
    status: 'completed',
    createdAt: at('06-20 09:00'),
    updatedAt: at('07-02 12:00'),
  },
  {
    id: 'o-106',
    listingId: 'trc-006',
    buyerUserId: 'demo-admin',
    sellerUserId: 'tokachi-agri',
    price: 21_000_000,
    status: 'cancelled',
    message: '検証用の申込です。',
    createdAt: at('09-02 15:00'),
    updatedAt: at('09-03 09:00'),
  },
]

const submissions: Submission[] = [
  {
    id: 's-101',
    kind: 'listingInquiry',
    targetId: 'trc-001',
    userId: 'suzuki',
    receivedAt: at('09-13 10:05'),
    payload: {
      mode: 'rent',
      name: '鈴木さん',
      email: 'suzuki@example.com',
      preferredDate: '2026-10-20',
      message: '10月下旬の入居を希望しています。駐車場の空きはありますか？',
    },
  },
  {
    id: 's-102',
    kind: 'listingInquiry',
    targetId: 'cmb-002',
    userId: 'demo-user',
    receivedAt: at('09-11 19:20'),
    payload: {
      mode: 'question',
      name: '利用者デモ',
      email: 'user@example.com',
      message: '駐車場と収納の広さについて相談できますか？',
    },
    status: 'in_progress',
  },
  {
    id: 's-103',
    kind: 'listingInquiry',
    targetId: 'til-004',
    userId: 'kato',
    receivedAt: at('09-06 08:00'),
    payload: {
      mode: 'buy',
      name: '加藤さん',
      email: 'kato@example.com',
      message: '購入を検討しています。内見に伺えます。',
    },
    status: 'agreed',
  },
  {
    id: 's-104',
    kind: 'listingInquiry',
    targetId: 'drn-005',
    userId: 'demo-admin',
    receivedAt: at('09-12 11:30'),
    payload: {
      mode: 'rent',
      name: '運営デモ',
      email: 'admin@example.com',
      preferredDate: '2026-09-25',
      message: '店舗としての利用条件と入居時期を相談できますか？',
    },
  },
  {
    id: 's-111',
    kind: 'listingInquiry',
    targetId: 'trc-006',
    userId: 'takahashi',
    receivedAt: at('08-20 20:00'),
    payload: {
      mode: 'buy',
      name: '高橋さん',
      email: 'takahashi@example.com',
      message: '値下げの相談はできますか？',
    },
    status: 'declined',
  },
]

const messages: Message[] = [
  {
    id: 'm-101',
    threadId: 's-102',
    senderUserId: 'demo-seller',
    body: '駐車場は1台分あります。収納も内見時にご確認いただけます。',
    createdAt: at('09-12 08:30'),
  },
  {
    id: 'm-103',
    threadId: 's-103',
    senderUserId: 'kobayashi-engei',
    body: 'ありがとうございます。9月中の内見日程をご相談ください。',
    createdAt: at('09-06 18:00'),
  },
]

const reviews: Review[] = [
  {
    id: 'rv-101',
    listingId: 'til-104',
    sellerUserId: 'demo-seller',
    reviewerUserId: 'demo-user',
    sourceKind: 'order',
    sourceId: 'o-104',
    rating: 5,
    comment: '説明どおり明るくきれいな室内でした。引き渡しもスムーズでした。',
    createdAt: at('08-13 21:00'),
  },
  {
    id: 'rv-102',
    listingId: 'rpl-003',
    sellerUserId: 'tamura',
    reviewerUserId: 'demo-user',
    sourceKind: 'rental',
    sourceId: 'r-103',
    rating: 5,
    comment:
      '管理が行き届いていて、周辺環境についても丁寧に説明いただけました。',
    createdAt: at('08-26 07:40'),
  },
  {
    id: 'rv-103',
    listingId: 'trc-001',
    sellerUserId: 'demo-seller',
    reviewerUserId: 'ito-farm',
    sourceKind: 'rental',
    sourceId: 'r-105',
    rating: 4,
    comment: '室内の状態は良好。退去時の清掃条件も事前に確認できました。',
    createdAt: at('07-07 09:00'),
  },
  {
    id: 'rv-104',
    listingId: 'rpl-105',
    sellerUserId: 'nakamura-farm',
    reviewerUserId: 'kato',
    sourceKind: 'order',
    sourceId: 'o-105',
    rating: 4,
    comment:
      '条件に納得できました。契約条件まで丁寧に相談に乗ってもらえました。',
    createdAt: at('07-04 19:30'),
  },
  {
    id: 'rv-105',
    listingId: 'cmb-002',
    sellerUserId: 'demo-seller',
    reviewerUserId: 'suzuki',
    sourceKind: 'rental',
    sourceId: 'r-108',
    rating: 3,
    comment:
      '物件に問題はありませんでしたが、鍵の受け渡し時間の連絡がやや遅めでした。',
    createdAt: at('06-14 20:10'),
  },
]

const carrierProfiles: CarrierProfile[] = []

function listingName(id: string): string {
  return (
    [...catalogListings, ...listings].find((listing) => listing.id === id)
      ?.name ?? '物件'
  )
}

const notifications: Notification[] = [
  {
    id: 'n-101',
    userId: 'demo-seller',
    kind: 'inquiry',
    title: '問い合わせが届きました',
    body: listingName('trc-001'),
    href: '/account/threads/s-101',
    createdAt: at('09-13 10:05'),
  },
  {
    id: 'n-103',
    userId: 'demo-seller',
    kind: 'rental',
    title: '購入の申込が届きました',
    body: listingName('cmb-002'),
    href: '/account',
    createdAt: at('09-13 09:40'),
  },
  {
    id: 'n-104',
    userId: 'demo-seller',
    kind: 'rental',
    title: 'レンタルの申込が届きました',
    body: listingName('cmb-002'),
    href: '/account',
    createdAt: at('09-13 08:50'),
  },
  {
    id: 'n-106',
    userId: 'demo-seller',
    kind: 'rental',
    title: 'レンタルの申込が届きました',
    body: listingName('trc-001'),
    href: '/account',
    createdAt: at('09-12 20:15'),
    readAt: at('09-12 21:00'),
  },
  {
    id: 'n-108',
    userId: 'demo-user',
    kind: 'reply',
    title: '返信が届きました',
    body: listingName('cmb-002'),
    href: '/account/threads/s-102',
    createdAt: at('09-12 08:30'),
  },
  {
    id: 'n-110',
    userId: 'demo-user',
    kind: 'rental',
    title: `レンタルが「${rentalStatusLabels.active}」になりました`,
    body: listingName('drn-106'),
    href: '/account',
    createdAt: at('09-12 07:30'),
  },
  {
    id: 'n-111',
    userId: 'demo-user',
    kind: 'rental',
    title: `レンタルが「${rentalStatusLabels.completed}」になりました`,
    body: listingName('rpl-003'),
    href: '/account',
    createdAt: at('08-25 09:10'),
    readAt: at('08-25 12:00'),
  },
  {
    id: 'n-112',
    userId: 'demo-user',
    kind: 'rental',
    title: `購入が「${orderStatusLabels.completed}」になりました`,
    body: listingName('til-104'),
    href: '/account',
    createdAt: at('08-12 16:00'),
    readAt: at('08-12 18:30'),
  },
  {
    id: 'n-113',
    userId: 'demo-admin',
    kind: 'moderation',
    title: '掲載が承認されました',
    body: listingName('til-103'),
    href: '/listings/til-103',
    createdAt: at('08-30 11:20'),
    readAt: at('08-30 11:25'),
  },
  {
    id: 'n-114',
    userId: 'demo-admin',
    kind: 'rental',
    title: `購入が「${orderStatusLabels.cancelled}」になりました`,
    body: listingName('trc-006'),
    href: '/account',
    createdAt: at('09-03 09:00'),
  },
]

const threadReads: ThreadRead[] = [
  { threadId: 's-102', userId: 'demo-seller', readAt: at('09-12 08:30') },
  { threadId: 's-103', userId: 'kobayashi-engei', readAt: at('09-06 18:00') },
].map((read) => ({ id: `${read.threadId}:${read.userId}`, ...read }))

const accountStatuses: AccountStatus[] = [
  {
    id: 'watanabe',
    status: 'suspended',
    note: '本人確認の書類が未提出',
    updatedAt: at('09-04 10:00'),
  },
]

type EventSeed = [DealKind, string, string, string | undefined, string, string?]

/** [kind, dealId, status, actor, when, note] — order does not matter. */
const eventSeeds: EventSeed[] = [
  [
    'order',
    'o-101',
    'requested',
    'suzuki',
    '09-13 09:40',
    '6月の内見で住環境が気に入り、購入を検討しています。',
  ],
  [
    'order',
    'o-102',
    'requested',
    'demo-user',
    '09-11 21:00',
    '引き渡し時期と契約条件を相談したいです。',
  ],
  ['order', 'o-103', 'requested', 'ito-farm', '09-09 10:00'],
  ['order', 'o-103', 'accepted', 'kobayashi-engei', '09-10 09:15'],
  ['order', 'o-104', 'requested', 'demo-user', '08-05 12:00'],
  ['order', 'o-104', 'accepted', 'demo-seller', '08-06 08:00'],
  ['order', 'o-104', 'delivered', 'demo-seller', '08-10 14:00'],
  ['order', 'o-104', 'completed', 'demo-user', '08-12 16:00'],
  ['order', 'o-105', 'requested', 'kato', '06-20 09:00'],
  ['order', 'o-105', 'accepted', 'nakamura-farm', '06-21 07:30'],
  ['order', 'o-105', 'delivered', 'nakamura-farm', '06-30 11:00'],
  ['order', 'o-105', 'completed', 'kato', '07-02 12:00'],
  [
    'order',
    'o-106',
    'requested',
    'demo-admin',
    '09-02 15:00',
    '検証用の申込です。',
  ],
  ['order', 'o-106', 'cancelled', 'demo-admin', '09-03 09:00'],
  [
    'rental',
    'r-101',
    'requested',
    'demo-user',
    '09-12 20:15',
    '2026-10-05 〜 2026-10-08',
  ],
  [
    'rental',
    'r-102',
    'requested',
    'suzuki',
    '09-01 09:30',
    '2026-09-10 〜 2026-09-16',
  ],
  ['rental', 'r-102', 'active', 'sky-agri', '09-10 08:00'],
  [
    'rental',
    'r-103',
    'requested',
    'demo-user',
    '08-10 12:00',
    '2026-08-20 〜 2026-08-24',
  ],
  ['rental', 'r-103', 'active', 'tamura', '08-20 09:00'],
  ['rental', 'r-103', 'completed', 'tamura', '08-25 09:10'],
  [
    'rental',
    'r-104',
    'requested',
    'demo-admin',
    '09-13 08:50',
    '2026-10-01 〜 2026-10-03',
  ],
  [
    'rental',
    'r-105',
    'requested',
    'ito-farm',
    '06-20 15:00',
    '2026-07-01 〜 2026-07-05',
  ],
  ['rental', 'r-105', 'active', 'demo-seller', '07-01 08:30'],
  ['rental', 'r-105', 'completed', 'demo-seller', '07-06 10:00'],
  [
    'rental',
    'r-106',
    'requested',
    'takahashi',
    '08-28 19:00',
    '2026-09-01 〜 2026-09-02',
  ],
  ['rental', 'r-106', 'cancelled', 'takahashi', '08-30 08:20'],
  [
    'rental',
    'r-107',
    'requested',
    'demo-user',
    '09-03 10:00',
    '2026-09-12 〜 2026-09-18',
  ],
  ['rental', 'r-107', 'active', 'demo-seller', '09-12 07:30'],
  [
    'rental',
    'r-108',
    'requested',
    'suzuki',
    '05-30 13:00',
    '2026-06-10 〜 2026-06-12',
  ],
  ['rental', 'r-108', 'active', 'demo-seller', '06-10 09:00'],
  ['rental', 'r-108', 'completed', 'demo-seller', '06-13 11:00'],
]

const dealEvents: DealEvent[] = eventSeeds
  .map(([dealKind, dealId, status, actorUserId, when, note], index) => ({
    id: `ev-${String(index + 101)}`,
    dealKind,
    dealId,
    status,
    actorUserId,
    note,
    createdAt: at(when),
  }))
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export const demoActivity: DemoActivity = {
  listings,
  transportJobs,
  submissions,
  messages,
  rentals,
  orders,
  reviews,
  carrierProfiles,
  notifications,
  threadReads,
  accountStatuses,
  dealEvents,
}
