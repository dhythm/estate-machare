import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Inbox,
  MessageSquare,
  Plus,
  Truck,
} from 'lucide-react'
import { AccountNavigation } from './account-navigation'
import { AccountActivity } from './account-activity'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/badge'
import {
  formatYen,
  threadStatusLabels,
  type ModerationStatus,
} from '@/lib/data'
import type { AccountOverview } from '@/lib/server/account'
import type { Submission } from '@/lib/server/store/types'
import { CompleteJobButton } from './complete-job-button'
import { RentalActions } from './rental-actions'
import { StartHaulButton } from './start-haul-button'
import { ListingStatusButton } from '@/components/listings/listing-status-button'
import { ReviewForm } from '@/components/reviews/review-form'
import { StarRating } from '@/components/reviews/star-rating'
import type { Review } from '@/lib/server/store/types'
import { rentalStatusLabels } from '@/lib/rent-to-own'
import { orderStatusLabels } from '@/lib/data'
import type { OrderWithListing } from '@/lib/server/orders'
import { OrderActions } from './order-actions'
import type { RentalWithListing } from '@/lib/server/rentals'

const moderationLabels: Record<ModerationStatus, string> = {
  pending: '審査待ち',
  approved: '公開中',
  rejected: '却下',
}

function ModerationBadge({ status }: { status?: ModerationStatus }) {
  const resolved = status ?? 'approved'
  return (
    <Badge variant={resolved === 'approved' ? 'muted' : 'default'}>
      {moderationLabels[resolved]}
    </Badge>
  )
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function ThreadMeta({
  submission,
  replyCount,
  unread = false,
}: {
  submission: Submission
  replyCount: number
  unread?: boolean
}) {
  const status = submission.status ?? 'new'
  return (
    <span className="flex flex-wrap items-center gap-2">
      {unread && <Badge variant="accent">未読</Badge>}
      <Badge variant={status === 'new' ? 'default' : 'muted'}>
        {threadStatusLabels[status]}
      </Badge>
      {replyCount > 0 && (
        <span className="text-xs text-muted-foreground">
          返信 {replyCount}件
        </span>
      )}
      <Link
        href={`/account/threads/${submission.id}`}
        className="ml-auto inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        やり取りを開く
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </Link>
    </span>
  )
}

function receivedAt(submission: Submission): string {
  return new Date(submission.receivedAt).toLocaleString('ja-JP')
}

function Section({
  title,
  id,
  count,
  action,
  children,
}: {
  title: string
  id?: string
  count?: number
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`section-${title}`}
      className="min-w-0 scroll-mt-28"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 font-display text-xl font-bold tracking-tight text-foreground">
          <span id={`section-${title}`}>{title}</span>
          {count !== undefined && (
            <span className="text-sm font-normal tabular-nums text-muted-foreground">
              {count}件
            </span>
          )}
        </h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6 text-sm text-muted-foreground">
      {label}
    </p>
  )
}

function IncomingList({
  items,
  empty,
  render,
}: {
  items: Submission[]
  empty: string
  render: (submission: Submission) => React.ReactNode
}) {
  if (items.length === 0)
    return empty ? (
      <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
        {empty}
      </p>
    ) : null
  return (
    <ul className="mt-5 flex flex-col divide-y divide-border border-t border-border">
      {items.map((submission) => (
        <li key={submission.id} className="py-4 text-sm last:pb-0">
          {render(submission)}
        </li>
      ))}
    </ul>
  )
}

function WrittenReview({ review }: { review: Review }) {
  return (
    <div className="mt-2 rounded-xl bg-muted/60 p-3 text-sm">
      <StarRating rating={review.rating} />
      {review.comment && (
        <p className="mt-1 text-foreground">{review.comment}</p>
      )}
    </div>
  )
}

function OrderList({
  items,
  party,
  reviewedSources,
}: {
  items: OrderWithListing[]
  party: 'buyer' | 'seller'
  reviewedSources: Record<string, Review>
}) {
  if (items.length === 0) return <Empty label="まだありません" />
  return (
    <ul className="flex flex-col gap-3">
      {items.map(({ order, listing }) => (
        <li
          key={order.id}
          className="rounded-2xl border border-border bg-card p-5 text-sm sm:p-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            {listing ? (
              <Link
                href={`/listings/${listing.id}`}
                className="font-semibold text-foreground hover:text-primary hover:underline"
              >
                {listing.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">削除された物件</span>
            )}
            <Badge variant={order.status === 'requested' ? 'default' : 'muted'}>
              {orderStatusLabels[order.status]}
            </Badge>
            <span className="text-muted-foreground">
              {formatYen(order.price)}
              {order.sourceRentalId && '（賃貸から切替）'}
            </span>
          </div>
          {order.message && (
            <p className="mt-1 text-foreground">{order.message}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <OrderActions
              orderId={order.id}
              status={order.status}
              party={party}
            />
            {party === 'buyer' &&
              listing &&
              (order.status === 'delivered' ||
                order.status === 'completed') && (
                <Link
                  href={`/transport/new?listingId=${listing.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  引越しを依頼する
                </Link>
              )}
          </div>
          {party === 'buyer' &&
            order.status === 'completed' &&
            (reviewedSources[`order:${order.id}`] ? (
              <WrittenReview review={reviewedSources[`order:${order.id}`]} />
            ) : (
              <div className="mt-3 border-t border-border pt-3">
                <ReviewForm sourceKind="order" sourceId={order.id} />
              </div>
            ))}
        </li>
      ))}
    </ul>
  )
}

function RentalList({
  items,
  party,
  reviewedSources,
}: {
  items: RentalWithListing[]
  party: 'owner' | 'renter'
  reviewedSources: Record<string, Review>
}) {
  if (items.length === 0) return <Empty label="まだありません" />
  return (
    <ul className="flex flex-col gap-3">
      {items.map(({ rental, listing }) => (
        <li
          key={rental.id}
          className="rounded-2xl border border-border bg-card p-5 text-sm sm:p-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            {listing ? (
              <Link
                href={`/listings/${listing.id}`}
                className="font-semibold text-foreground hover:text-primary hover:underline"
              >
                {listing.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">削除された物件</span>
            )}
            <Badge
              variant={rental.status === 'requested' ? 'default' : 'muted'}
            >
              {rentalStatusLabels[rental.status]}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            {rental.startDate} 〜 {rental.endDate}・{rental.days}日間・
            {formatYen(rental.rentTotal)}
          </p>
          {rental.purchasePrice !== undefined && (
            <p className="mt-1 text-foreground">
              購入価格 {formatYen(rental.purchasePrice)}（充当後）
            </p>
          )}
          {rental.status === 'converted' && listing && party === 'renter' && (
            <Link
              href={`/transport/new?listingId=${listing.id}`}
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              引越しを依頼する
            </Link>
          )}
          <div className="mt-4 border-t border-border pt-4">
            <RentalActions
              rentalId={rental.id}
              status={rental.status}
              party={party}
              canConvert={
                rental.salePrice !== undefined &&
                rental.creditRate !== undefined
              }
            />
          </div>
          {party === 'renter' &&
            (rental.status === 'completed' || rental.status === 'converted') &&
            (reviewedSources[`rental:${rental.id}`] ? (
              <WrittenReview review={reviewedSources[`rental:${rental.id}`]} />
            ) : (
              <div className="mt-3 border-t border-border pt-3">
                <ReviewForm sourceKind="rental" sourceId={rental.id} />
              </div>
            ))}
        </li>
      ))}
    </ul>
  )
}

export function AccountOverviewView({
  overview,
}: {
  overview: AccountOverview
}) {
  const getReplyCount = (submission: Submission) =>
    overview.replyCounts[submission.id] ?? 0
  const unread = new Set(overview.unreadThreadIds)
  const summaryCards = [
    {
      label: '未読のやり取り',
      value: overview.summary.unreadThreads,
      href: '#activity',
      icon: MessageSquare,
    },
    {
      label: '未対応の問い合わせ・応募',
      value: overview.summary.openInquiries,
      href: '#activity',
      icon: Inbox,
    },
    {
      label: '承認待ちの賃貸',
      value: overview.summary.requestedRentals,
      href: '#lending',
      icon: CalendarDays,
    },
    {
      label: '審査待ちの掲載',
      value: overview.summary.pendingListings,
      href: '#equipment',
      icon: Clock3,
    },
  ]
  return (
    <div className="space-y-8">
      <section aria-labelledby="section-summary">
        <h2 id="section-summary" className="sr-only">
          概要
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summaryCards.map(({ label, value, href, icon: Icon }) => (
            <li key={label}>
              <Link
                href={href}
                className="group block h-full rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  <ArrowUpRight
                    className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-4 font-display text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                  {value}件
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {label}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <div className="grid items-start gap-7 lg:grid-cols-[205px_minmax(0,1fr)] lg:gap-9">
        <AccountNavigation isCarrier={Boolean(overview.carrier)} />
        <div className="flex min-w-0 flex-col gap-10">
          <AccountActivity overview={overview} />
          <Section
            id="equipment"
            title="自分の掲載"
            count={overview.listings.length}
            action={
              <Link
                href="/listings/new"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'gap-1.5',
                )}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                掲載する
              </Link>
            }
          >
            {overview.listings.length === 0 ? (
              <Empty label="まだありません" />
            ) : (
              <ul className="flex flex-col gap-4">
                {overview.listings.map(({ listing, inquiries }) => (
                  <li
                    key={listing.id}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-4">
                        <Image
                          src={listing.image}
                          alt=""
                          width={72}
                          height={72}
                          className="size-[72px] shrink-0 rounded-xl bg-muted object-contain p-1"
                        />
                        <div className="min-w-0">
                          <p className="mb-1 text-xs text-muted-foreground">
                            {listing.maker} · {listing.category}
                          </p>
                          <Link
                            href={`/listings/${listing.id}`}
                            className="font-semibold text-foreground hover:text-primary hover:underline"
                          >
                            {listing.name}
                          </Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <ModerationBadge
                              status={listing.moderationStatus}
                            />
                            {listing.withdrawnAt && <Badge>取り下げ中</Badge>}
                          </div>
                        </div>
                      </div>
                      <span className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        問い合わせ {inquiries.length}件
                        <Link
                          href={`/listings/${listing.id}/edit`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          編集
                        </Link>
                        <ListingStatusButton
                          listingId={listing.id}
                          withdrawn={listing.withdrawnAt !== undefined}
                        />
                      </span>
                    </div>
                    {listing.moderationNote && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        運営メモ: {listing.moderationNote}
                      </p>
                    )}
                    <IncomingList
                      items={inquiries}
                      empty="問い合わせはまだありません"
                      render={(inquiry) => (
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="shrink-0 text-muted-foreground">
                              {receivedAt(inquiry)}
                            </span>
                            <span className="shrink-0 font-medium">
                              {text(inquiry.payload.name)}
                            </span>
                            <span className="text-foreground">
                              {text(inquiry.payload.message)}
                            </span>
                          </div>
                          <ThreadMeta
                            submission={inquiry}
                            replyCount={getReplyCount(inquiry)}
                            unread={unread.has(inquiry.id)}
                          />
                        </div>
                      )}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section id="deals" title="取引の履歴" count={overview.deals.length}>
            {overview.deals.length === 0 ? (
              <Empty label="まだありません" />
            ) : (
              <ul className="flex flex-col gap-2">
                {overview.deals.map((deal) => (
                  <li
                    key={`${deal.kind}-${deal.id}`}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm"
                  >
                    <Badge variant="outline">
                      {deal.kind === 'order'
                        ? '注文'
                        : deal.kind === 'rental'
                          ? '賃貸'
                          : '引越し'}
                    </Badge>
                    <Link
                      href={`/account/deals/${deal.kind}/${deal.id}`}
                      className="font-semibold text-foreground hover:text-primary hover:underline"
                    >
                      {deal.title}
                    </Link>
                    <Badge variant="muted">{deal.statusLabel}</Badge>
                    <span className="text-muted-foreground">
                      {deal.role}・相手: {deal.counterpart}・
                      {formatYen(deal.amount)}
                    </span>
                    {deal.updatedAt && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(deal.updatedAt).toLocaleString('ja-JP')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            id="purchases"
            title="買った物件"
            count={overview.orders.asBuyer.length}
          >
            <OrderList
              items={overview.orders.asBuyer}
              party="buyer"
              reviewedSources={overview.reviewedSources}
            />
          </Section>

          <Section
            id="sales"
            title="売った物件"
            count={overview.orders.asSeller.length}
          >
            <OrderList
              items={overview.orders.asSeller}
              party="seller"
              reviewedSources={overview.reviewedSources}
            />
          </Section>

          <Section
            id="rentals"
            title="借りている物件"
            count={overview.rentals.asRenter.length}
          >
            <RentalList
              items={overview.rentals.asRenter}
              party="renter"
              reviewedSources={overview.reviewedSources}
            />
          </Section>

          <Section
            id="lending"
            title="貸している物件"
            count={overview.rentals.asOwner.length}
          >
            <RentalList
              items={overview.rentals.asOwner}
              party="owner"
              reviewedSources={overview.reviewedSources}
            />
          </Section>

          <Section
            id="transport"
            title="自分の引越し依頼"
            count={overview.transportJobs.length}
            action={
              <Link
                href="/transport/new"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'gap-1.5',
                )}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                引越しを依頼
              </Link>
            }
          >
            {overview.transportJobs.length === 0 ? (
              <Empty label="まだありません" />
            ) : (
              <ul className="flex flex-col gap-4">
                {overview.transportJobs.map(
                  ({ job, applications, inquiries }) => (
                    <li
                      key={job.id}
                      className="rounded-2xl border border-border bg-card p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/transport/${job.id}`}
                            className="font-semibold text-foreground hover:text-primary hover:underline"
                          >
                            {job.item}
                          </Link>
                          <ModerationBadge status={job.moderationStatus} />
                          <Badge variant="muted">{job.status}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {job.from} → {job.to}・{formatYen(job.reward)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Link
                          href={`/transport/${job.id}/edit`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          編集
                        </Link>
                        {job.status !== '完了' && (
                          <CompleteJobButton jobId={job.id} />
                        )}
                      </div>
                      <IncomingList
                        items={inquiries}
                        empty=""
                        render={(inquiry) => (
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              <span className="shrink-0 text-muted-foreground">
                                {receivedAt(inquiry)}
                              </span>
                              <Badge variant="outline">質問</Badge>
                              <span className="shrink-0 font-medium">
                                {text(inquiry.payload.name)}
                              </span>
                              <span className="text-foreground">
                                {text(inquiry.payload.message)}
                              </span>
                            </div>
                            <ThreadMeta
                              submission={inquiry}
                              replyCount={getReplyCount(inquiry)}
                              unread={unread.has(inquiry.id)}
                            />
                          </div>
                        )}
                      />
                      <IncomingList
                        items={applications}
                        empty="応募はまだありません"
                        render={(application) => (
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              <span className="shrink-0 text-muted-foreground">
                                {receivedAt(application)}
                              </span>
                              <span className="shrink-0 font-medium">
                                {text(application.payload.name)}
                              </span>
                              <span className="text-muted-foreground">
                                {text(application.payload.vehicle)}
                                {text(application.payload.availableDate) &&
                                  `・${text(application.payload.availableDate)}`}
                              </span>
                              <span className="text-foreground">
                                {text(application.payload.message)}
                              </span>
                            </div>
                            <ThreadMeta
                              submission={application}
                              replyCount={getReplyCount(application)}
                              unread={unread.has(application.id)}
                            />
                          </div>
                        )}
                      />
                    </li>
                  ),
                )}
              </ul>
            )}
          </Section>

          {overview.carrier && (
            <Section id="carrier" title="引越しパートナープロフィール">
              <div className="rounded-2xl border border-border bg-card p-5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">
                    {overview.carrier.profile.name}
                  </span>
                  <Badge variant="muted">{overview.carrier.profile.kind}</Badge>
                  <span className="text-muted-foreground">
                    拠点 {overview.carrier.profile.prefecture}
                  </span>
                  <Link
                    href="/transport/register"
                    className="ml-auto text-xs font-medium text-primary hover:underline"
                  >
                    プロフィールを編集
                  </Link>
                </div>
                <p className="mt-2 text-muted-foreground">
                  車両: {overview.carrier.profile.vehicles.join('・')}
                  ／対応地域: {overview.carrier.profile.serviceAreas.join('・')}
                </p>
                <h3 className="mt-4 text-sm font-medium text-foreground">
                  対応地域の募集中案件
                </h3>
                {overview.carrier.matchingJobs.length === 0 ? (
                  <p className="mt-1 text-muted-foreground">該当なし</p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-1">
                    {overview.carrier.matchingJobs.map((job) => (
                      <li key={job.id} className="flex flex-wrap gap-2">
                        <Link
                          href={`/transport/${job.id}`}
                          className="font-semibold text-foreground hover:text-primary hover:underline"
                        >
                          {job.item}
                        </Link>
                        <span className="text-muted-foreground">
                          {job.from} → {job.to}・{formatYen(job.reward)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Section>
          )}

          {!overview.carrier && (
            <Link
              href="/transport/register"
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 px-5 py-5 text-sm font-semibold text-primary"
            >
              <span className="flex items-center gap-3">
                <Truck className="size-5" aria-hidden="true" />
                引越しパートナーとして登録する
              </span>
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          )}

          <Section
            id="sent"
            title="送った問い合わせ"
            count={overview.sentInquiries.length}
          >
            {overview.sentInquiries.length === 0 ? (
              <Empty label="まだありません" />
            ) : (
              <ul className="flex flex-col gap-3">
                {overview.sentInquiries.map(({ submission, listing }) => (
                  <li
                    key={submission.id}
                    className="rounded-2xl border border-border bg-card p-5 text-sm sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {listing ? (
                        <Link
                          href={`/listings/${listing.id}`}
                          className="font-semibold text-foreground hover:text-primary hover:underline"
                        >
                          {listing.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          削除された物件
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {receivedAt(submission)}
                      </span>
                    </div>
                    <p className="mt-1 text-foreground">
                      {text(submission.payload.message)}
                    </p>
                    <div className="mt-2">
                      <ThreadMeta
                        submission={submission}
                        replyCount={getReplyCount(submission)}
                        unread={unread.has(submission.id)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="送った応募" count={overview.sentApplications.length}>
            {overview.sentApplications.length === 0 ? (
              <Empty label="まだありません" />
            ) : (
              <ul className="flex flex-col gap-3">
                {overview.sentApplications.map(({ submission, job }) => (
                  <li
                    key={submission.id}
                    className="rounded-2xl border border-border bg-card p-5 text-sm sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {job ? (
                        <Link
                          href={`/transport/${job.id}`}
                          className="font-semibold text-foreground hover:text-primary hover:underline"
                        >
                          {job.item}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          削除された案件
                        </span>
                      )}
                      {job && <Badge variant="muted">{job.status}</Badge>}
                      <span className="text-muted-foreground">
                        {receivedAt(submission)}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {text(submission.payload.vehicle)}・
                      {text(submission.payload.availableDate)}
                    </p>
                    {submission.status === 'agreed' &&
                      job?.status === '調整中' && (
                        <div className="mt-2">
                          <StartHaulButton jobId={job.id} />
                        </div>
                      )}
                    <div className="mt-2">
                      <ThreadMeta
                        submission={submission}
                        replyCount={getReplyCount(submission)}
                        unread={unread.has(submission.id)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="送った質問" count={overview.sentJobInquiries.length}>
            {overview.sentJobInquiries.length === 0 ? (
              <Empty label="まだありません" />
            ) : (
              <ul className="flex flex-col gap-3">
                {overview.sentJobInquiries.map(({ submission, job }) => (
                  <li
                    key={submission.id}
                    className="rounded-2xl border border-border bg-card p-5 text-sm sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {job ? (
                        <Link
                          href={`/transport/${job.id}`}
                          className="font-semibold text-foreground hover:text-primary hover:underline"
                        >
                          {job.item}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          削除された案件
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {receivedAt(submission)}
                      </span>
                    </div>
                    <p className="mt-1 text-foreground">
                      {text(submission.payload.message)}
                    </p>
                    <div className="mt-2">
                      <ThreadMeta
                        submission={submission}
                        replyCount={getReplyCount(submission)}
                        unread={unread.has(submission.id)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}
