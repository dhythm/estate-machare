'use client'

import { useState } from 'react'
import Image from 'next/image'
import { propertyImage } from '@/lib/property-image'
import Link from 'next/link'
import {
  MapPin,
  Star,
  Ruler,
  Calendar,
  TrainFront,
  ShieldCheck,
  Repeat2,
  ShoppingCart,
  MessageSquare,
  CircleCheckBig,
  ArrowRight,
  Pencil,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/badge'
import { BackLink } from '@/components/back-link'
import { ListingCard } from '@/components/listing-card'
import { PurchaseOptionSimulator } from '@/components/purchase-option/purchase-option-simulator'
import { LeaseRequestForm } from '@/components/leases/lease-request-form'
import { OrderRequestForm } from '@/components/orders/order-request-form'
import { InitialCostEstimate } from '@/components/leases/initial-cost-estimate'
import { StarRating } from '@/components/reviews/star-rating'
import type { Review } from '@/lib/server/store/types'
import type { DateRange } from '@/lib/lease'
import type { PurchaseOptionTerms } from '@/lib/purchase-option'
import {
  formatArea,
  formatBuildingAge,
  formatYen,
  type Listing,
  type ListingMode,
  type ListingModeConfig,
} from '@/lib/data'

const modeIcon = { buy: ShoppingCart, rent: Calendar, purchaseOption: Repeat2 }
const modeLabel = {
  buy: '購入',
  rent: '賃貸',
  purchaseOption: '住んでから買う',
}

export function ListingDetail({
  listing,
  modes,
  related,
  purchaseOptionTerms,
  booked,
  viewer,
  sellerReviews = [],
  purchaseAvailable = true,
}: {
  listing: Listing
  modes: ListingModeConfig[]
  related: Listing[]
  purchaseOptionTerms?: PurchaseOptionTerms
  booked: DateRange[]
  viewer: { signedIn: boolean; isOwner: boolean; canEdit?: boolean }
  sellerReviews?: Review[]
  /** False while another buyer's order holds the listing. */
  purchaseAvailable?: boolean
}) {
  const [mode, setMode] = useState<ListingMode>(modes[0].id)
  const active = modes.find((item) => item.id === mode) ?? modes[0]
  const pictures =
    listing.images && listing.images.length > 0
      ? listing.images
      : [listing.image]
  const [pictureIndex, setPictureIndex] = useState(0)
  const mainPicture =
    pictures[pictureIndex] ?? pictures[0] ?? '/placeholder.svg'

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <BackLink href="/listings" label="物件一覧にもどる" />
        {viewer.canEdit && (
          <Link
            href={`/listings/${listing.id}/edit`}
            className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
          >
            <Pencil className="size-3.5" />
            編集する
          </Link>
        )}
      </div>
      <header className="mt-7 border-b border-border pb-7">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link
            href={`/listings?category=${encodeURIComponent(listing.category)}`}
            className="text-primary hover:underline"
          >
            {listing.category}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{listing.zoning}</span>
        </div>
        <h1 className="mt-3 text-balance font-display text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {listing.name}
        </h1>
        <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          {listing.prefecture} {listing.city}
        </p>
      </header>

      <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(350px,1fr)] lg:gap-x-9">
        <section aria-label="物件の写真と仕様" className="min-w-0">
          <div className="relative aspect-[1.4] overflow-hidden rounded-lg bg-muted">
            <Image
              src={propertyImage(mainPicture)}
              alt={listing.name}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1280px) 700px, (min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
            <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
              {listing.deals.includes('sale') && (
                <Badge className="bg-card/95 text-foreground shadow-sm">
                  売買
                </Badge>
              )}
              {listing.deals.includes('rent') && (
                <Badge className="bg-accent text-accent-foreground shadow-sm">
                  賃貸
                </Badge>
              )}
              {listing.purchaseOption && (
                <Badge className="bg-primary text-primary-foreground shadow-sm">
                  買取オプション
                </Badge>
              )}
            </div>
            <span className="absolute bottom-4 right-4 rounded-full bg-foreground/65 px-3 py-1 text-xs tabular-nums text-background">
              {pictureIndex + 1} / {pictures.length}
            </span>
          </div>
          {pictures.length > 1 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="写真">
              {pictures.map((picture, index) => (
                <li key={index}>
                  <button
                    type="button"
                    aria-label={`写真 ${index + 1}`}
                    aria-pressed={index === pictureIndex}
                    onClick={() => setPictureIndex(index)}
                    className={cn(
                      'relative h-16 w-20 overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      index === pictureIndex
                        ? 'border-primary'
                        : 'border-transparent opacity-70 hover:opacity-100',
                    )}
                  >
                    <Image
                      src={propertyImage(picture)}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <dl className="mt-5 grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-4">
            <Spec
              icon={<Ruler className="size-4" />}
              label="間取り・専有面積"
              value={`${listing.layout ? `${listing.layout} / ` : ''}${formatArea(listing.floorArea)}`}
            />
            <Spec
              icon={<Calendar className="size-4" />}
              label="築年"
              value={
                listing.builtYear === undefined
                  ? '—'
                  : `${listing.builtYear}年（${formatBuildingAge(listing.builtYear, new Date())}）`
              }
            />
            <Spec
              icon={<TrainFront className="size-4" />}
              label="最寄駅"
              value={`${listing.nearestStation} 徒歩${listing.walkMinutes}分`}
            />
            <Spec
              icon={<MapPin className="size-4" />}
              label="用途地域"
              value={listing.zoning}
            />
          </dl>
        </section>

        <aside
          className="min-w-0 lg:sticky lg:top-36 xl:top-24 lg:row-span-2"
          aria-label="利用方法と申し込み"
        >
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-5 sm:px-6">
              <h2 className="text-sm font-semibold text-foreground">
                利用方法を選ぶ
              </h2>
              <div
                className="mt-4 flex gap-1 rounded-lg bg-muted p-1"
                role="group"
                aria-label="利用方法"
              >
                {modes.map((item) => {
                  const Icon = modeIcon[item.id]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={item.title}
                      aria-pressed={mode === item.id}
                      onClick={() => setMode(item.id)}
                      className={cn(
                        'flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-lg px-1 py-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                        mode === item.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-card hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4" />
                      {modeLabel[item.id]}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-xs font-medium text-muted-foreground">
                {active.title}
              </p>
              <p className="mt-2 break-words font-display text-3xl font-bold leading-tight tracking-tight text-primary sm:text-4xl">
                {active.id === 'purchaseOption' && listing.rentPerMonth
                  ? `${formatYen(listing.rentPerMonth)}/月`
                  : active.price}
              </p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                {active.desc}
              </p>
              {active.note && (
                <div className="mt-4 flex gap-2 rounded-lg bg-secondary p-3 text-xs leading-6 text-secondary-foreground">
                  <CircleCheckBig className="mt-1 size-4 shrink-0 text-primary" />
                  <span>{active.note}</span>
                </div>
              )}
              {active.id === 'purchaseOption' && purchaseOptionTerms && (
                <div className="mt-4">
                  <PurchaseOptionSimulator terms={purchaseOptionTerms} />
                </div>
              )}
              <div className="mt-6 flex flex-col gap-2">
                {active.id !== 'buy' &&
                listing.rentPerMonth &&
                !viewer.isOwner ? (
                  <LeaseRequestForm
                    listingId={listing.id}
                    rentPerMonth={listing.rentPerMonth}
                    booked={booked}
                    signedIn={viewer.signedIn}
                  />
                ) : active.id === 'buy' &&
                  listing.salePrice &&
                  !viewer.isOwner ? (
                  <OrderRequestForm
                    listingId={listing.id}
                    price={listing.salePrice}
                    signedIn={viewer.signedIn}
                    available={purchaseAvailable}
                  />
                ) : (
                  <Link
                    href={`/listings/${listing.id}/inquiry?mode=${active.id}`}
                    className={cn(buttonVariants(), 'h-12 gap-2')}
                  >
                    {active.cta}
                    <ArrowRight className="size-4" />
                  </Link>
                )}
                <Link
                  href={`/listings/${listing.id}/inquiry?mode=question`}
                  className={cn(buttonVariants({ variant: 'outline' }), 'h-11')}
                >
                  <MessageSquare className="size-4" />
                  出品者に質問する
                </Link>
              </div>
            </div>
            <div className="border-t border-border bg-muted/35 p-5 sm:px-6">
              {listing.rentPerMonth === undefined ? (
                <Link
                  href={`/requests/new?listingId=${encodeURIComponent(listing.id)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  希望条件を登録して提案を受ける
                  <ArrowRight className="size-3.5" />
                </Link>
              ) : (
                <>
                  <InitialCostEstimate
                    rentPerMonth={listing.rentPerMonth}
                    depositMonths={listing.depositMonths}
                    keyMoneyMonths={listing.keyMoneyMonths}
                  />
                  <Link
                    href={`/requests/new?listingId=${encodeURIComponent(listing.id)}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    希望条件を登録して提案を受ける
                    <ArrowRight className="size-3.5" />
                  </Link>
                </>
              )}
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 px-2 text-xs leading-6 text-muted-foreground">
            <ShieldCheck className="mt-1 size-4 shrink-0 text-primary" />
            申込みと出品者とのやり取りは、マイページで確認できます。
          </p>
        </aside>

        <div className="min-w-0 lg:col-start-1">
          <section className="border-b border-border pb-8">
            <h2 className="font-display text-xl font-bold text-foreground">
              この物件について
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-8 text-muted-foreground">
              {listing.summary}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
          <section className="mt-8" aria-label="出品者情報">
            <h2 className="font-display text-xl font-bold text-foreground">
              出品者
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-lg font-bold text-primary">
                {listing.seller.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">
                  {listing.seller.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {listing.seller.kind}
                </p>
                {listing.ownerUserId && (
                  <Link
                    href={`/sellers/${listing.ownerUserId}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    出品者ページ
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {listing.seller.reviews > 0 ? (
                  <>
                    <Star className="size-4 fill-primary text-primary" />
                    <span className="font-semibold text-foreground">
                      {listing.seller.rating}
                    </span>
                    <span>({listing.seller.reviews}件)</span>
                  </>
                ) : (
                  <span className="text-xs">評価なし</span>
                )}
              </div>
            </div>
          </section>
          {sellerReviews.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-bold text-foreground">
                出品者へのレビュー
              </h2>
              <ul className="mt-4 divide-y divide-border">
                {sellerReviews.map((review) => (
                  <li key={review.id} className="py-4 text-sm first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-3 leading-7 text-foreground">
                        {review.comment}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-16 border-t border-border pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              こちらの物件も
            </h2>
            <Link
              href={`/listings?category=${encodeURIComponent(listing.category)}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              {listing.category}をすべて見る
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Spec({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="p-4">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-2 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  )
}
