import Link from 'next/link'
import { Badge } from '@/components/badge'
import { formatYen, threadStatusLabels } from '@/lib/data'
import { rentalStatusLabels } from '@/lib/rent-to-own'
import type { AccountSummary, ThreadSummary } from '@/lib/server/admin-overview'
import type { RentalWithListing } from '@/lib/server/rentals'
import type { CarrierProfile, Review } from '@/lib/server/store/types'
import { StarRating } from '@/components/reviews/star-rating'
import {
  OrderCancelButton,
  RentalCancelButton,
  ThreadCloseButton,
} from './admin-actions'
import { orderStatusLabels } from '@/lib/data'
import type { OrderWithListing } from '@/lib/server/orders'
import { AccountStatusButton } from './account-status-button'
import { AdminDataTable } from './admin-data-table'

function when(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RentalTable({ items }: { items: RentalWithListing[] }) {
  return (
    <AdminDataTable
      title="賃貸"
      headers={['物件', '申込者', '期間', '金額', '状態', '購入価格', '']}
      rows={items.map(({ rental, listing }) => ({
        key: rental.id,
        searchText: `${rental.id} ${listing?.name ?? '削除済み'} ${rental.renterUserId} ${rentalStatusLabels[rental.status]} ${rental.startDate} ${rental.endDate}`,
        cells: [
          listing ? (
            <Link
              href={`/listings/${listing.id}`}
              className="font-semibold text-foreground decoration-primary/40 underline-offset-4 hover:text-primary hover:underline"
            >
              {listing.name}
            </Link>
          ) : (
            <span className="text-muted-foreground">（削除済み）</span>
          ),
          <code key="code-71" className="text-xs">
            {rental.renterUserId}
          </code>,
          `${rental.startDate} 〜 ${rental.endDate}（${rental.days}日）`,
          formatYen(rental.rentTotal),
          <Badge
            key="badge-74"
            variant={rental.status === 'requested' ? 'default' : 'muted'}
          >
            {rentalStatusLabels[rental.status]}
          </Badge>,
          rental.purchasePrice !== undefined
            ? formatYen(rental.purchasePrice)
            : '—',
          <span key="actions" className="inline-flex items-center gap-2">
            <Link
              href={`/account/deals/rental/${rental.id}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              履歴
            </Link>
            {(rental.status === 'requested' || rental.status === 'active') && (
              <RentalCancelButton rentalId={rental.id} />
            )}
          </span>,
        ],
      }))}
    />
  )
}

export function ThreadTable({ items }: { items: ThreadSummary[] }) {
  return (
    <AdminDataTable
      title="やり取り"
      headers={['対象', '送信者', '受付', '状態', '返信', '操作']}
      rows={items.map((thread) => ({
        key: thread.id,
        searchText: `${thread.id} ${thread.targetName} ${thread.senderName} ${threadStatusLabels[thread.status]}`,
        cells: [
          thread.targetId && !thread.targetName.startsWith('（') ? (
            <Link
              href={
                thread.kind === 'listingInquiry'
                  ? `/listings/${thread.targetId}`
                  : `/transport/${thread.targetId}`
              }
              className="font-semibold text-foreground decoration-primary/40 underline-offset-4 hover:text-primary hover:underline"
            >
              {thread.targetName}
            </Link>
          ) : (
            <span className="text-muted-foreground">{thread.targetName}</span>
          ),
          thread.senderName,
          when(thread.receivedAt),
          <Badge
            key="badge-109"
            variant={thread.status === 'new' ? 'default' : 'muted'}
          >
            {threadStatusLabels[thread.status]}
          </Badge>,
          String(thread.replyCount),
          <Link
            key="link-113"
            href={`/account/threads/${thread.id}`}
            className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            開く
          </Link>,
          thread.status === 'declined' ? (
            ''
          ) : (
            <ThreadCloseButton key="close" threadId={thread.id} />
          ),
        ],
      }))}
    />
  )
}

export function CarrierTable({ items }: { items: CarrierProfile[] }) {
  return (
    <AdminDataTable
      title="引越しパートナー"
      headers={[
        '引越しパートナー',
        '区分',
        '拠点',
        '車両',
        '対応地域',
        '更新日',
      ]}
      rows={items.map((carrier) => ({
        key: carrier.id,
        searchText: `${carrier.id} ${carrier.name} ${carrier.kind} ${carrier.prefecture} ${carrier.vehicles.join(' ')} ${carrier.serviceAreas.join(' ')}`,
        cells: [
          <div key="identity" className="min-w-40 space-y-1">
            <p className="font-semibold text-foreground">{carrier.name}</p>
            <code className="text-xs text-muted-foreground">{carrier.id}</code>
          </div>,
          carrier.kind,
          carrier.prefecture,
          <span key="vehicle" className="block min-w-32 whitespace-normal">
            {carrier.vehicles.join('・')}
          </span>,
          <span key="area" className="block min-w-32 whitespace-normal">
            {carrier.serviceAreas.join('・')}
          </span>,
          when(carrier.updatedAt),
        ],
      }))}
    />
  )
}

const roleLabels = { admin: '運営', user: '一般' } as const

export function AccountTable({
  items,
  currentUserId,
}: {
  items: AccountSummary[]
  currentUserId: string
}) {
  return (
    <AdminDataTable
      title="アカウント"
      headers={[
        'アカウント',
        '役割',
        '掲載',
        '引越し依頼',
        '賃貸',
        '状態',
        '操作',
      ]}
      rows={items.map((account) => ({
        key: account.id,
        searchText: `${account.id} ${account.name} ${account.email} ${roleLabels[account.role]} ${account.status === 'suspended' ? '停止中' : '有効'} ${account.note ?? ''}`,
        cells: [
          <div key="identity" className="min-w-44 space-y-1">
            <p className="font-semibold text-foreground">{account.name}</p>
            <p className="text-xs text-muted-foreground">{account.email}</p>
            <code className="text-[10px] text-muted-foreground">
              {account.id}
            </code>
          </div>,
          <Badge
            key="badge-155"
            variant={account.role === 'admin' ? 'default' : 'muted'}
          >
            {roleLabels[account.role]}
          </Badge>,
          String(account.listingCount),
          String(account.transportJobCount),
          String(account.rentalCount),
          <span key="status" className="flex flex-col gap-1">
            <Badge
              variant={account.status === 'suspended' ? 'default' : 'muted'}
            >
              {account.status === 'suspended' ? '停止中' : '有効'}
            </Badge>
            {account.note && (
              <span className="text-xs text-muted-foreground">
                {account.note}
              </span>
            )}
          </span>,
          <AccountStatusButton
            key="action"
            userId={account.id}
            status={account.status}
            self={account.id === currentUserId}
          />,
        ],
      }))}
    />
  )
}

export type ReviewRow = { review: Review; listingName: string }

export function ReviewTable({ items }: { items: ReviewRow[] }) {
  return (
    <AdminDataTable
      title="レビュー"
      headers={['物件', '掲載者', 'レビュー者', '評価', 'コメント', '日時']}
      rows={items.map(({ review, listingName }) => ({
        key: review.id,
        searchText: `${listingName} ${review.sellerUserId} ${review.reviewerUserId} ${review.comment ?? ''} ${review.rating}`,
        cells: [
          listingName,
          <code key="seller" className="text-xs">
            {review.sellerUserId}
          </code>,
          <code key="reviewer" className="text-xs">
            {review.reviewerUserId}
          </code>,
          <StarRating key="rating" rating={review.rating} />,
          <span
            key="comment"
            className="block min-w-40 max-w-80 whitespace-normal"
          >
            {review.comment ?? '—'}
          </span>,
          when(review.createdAt),
        ],
      }))}
    />
  )
}

export function OrderTable({ items }: { items: OrderWithListing[] }) {
  return (
    <AdminDataTable
      title="注文"
      headers={['物件', '買い手', '掲載者', '価格', '状態', '日時', '']}
      rows={items.map(({ order, listing }) => ({
        key: order.id,
        searchText: `${order.id} ${listing?.name ?? '削除済み'} ${order.buyerUserId} ${order.sellerUserId} ${orderStatusLabels[order.status]}`,
        cells: [
          listing ? (
            <Link
              key="listing"
              href={`/listings/${listing.id}`}
              className="font-semibold text-foreground decoration-primary/40 underline-offset-4 hover:text-primary hover:underline"
            >
              {listing.name}
            </Link>
          ) : (
            <span key="listing" className="text-muted-foreground">
              （削除済み）
            </span>
          ),
          <code key="buyer" className="text-xs">
            {order.buyerUserId}
          </code>,
          <code key="seller" className="text-xs">
            {order.sellerUserId}
          </code>,
          formatYen(order.price),
          <Badge
            key="status"
            variant={order.status === 'requested' ? 'default' : 'muted'}
          >
            {orderStatusLabels[order.status]}
          </Badge>,
          new Date(order.createdAt).toLocaleString('ja-JP'),
          <span key="actions" className="inline-flex items-center gap-2">
            <Link
              href={`/account/deals/order/${order.id}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              履歴
            </Link>
            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <OrderCancelButton orderId={order.id} />
            )}
          </span>,
        ],
      }))}
    />
  )
}
