import Image from 'next/image'
import { propertyImage } from '@/lib/property-image'
import Link from 'next/link'
import { MapPin, Star, ArrowUpRight, Repeat2 } from 'lucide-react'
import { type Listing, formatArea, formatYen } from '@/lib/data'

export function ListingCard({ listing }: { listing: Listing }) {
  const canBuy = listing.deals.includes('sale')
  const canRent = listing.deals.includes('rent')
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-[box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_-18px_rgba(23,58,79,0.3)]"
    >
      <div className="relative aspect-[1.4] overflow-hidden bg-muted">
        <Image
          src={propertyImage(listing.image)}
          alt={listing.name}
          fill
          sizes="(min-width: 1280px) 390px, (min-width: 1024px) 31vw, (min-width: 640px) 45vw, 95vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 text-[10px] font-bold">
          {canBuy && (
            <span className="rounded-md bg-white/95 px-2.5 py-1 text-primary">
              売買
            </span>
          )}
          {canRent && (
            <span className="rounded-md bg-accent px-2.5 py-1 text-accent-foreground">
              賃貸
            </span>
          )}
        </div>
        <span className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-bold tracking-wider text-muted-foreground">
          {listing.category} <span className="mx-1.5 text-border">/</span>{' '}
          {listing.zoning}
        </p>
        <h3 className="mt-2 line-clamp-2 text-base font-bold leading-relaxed text-foreground">
          {listing.name}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {listing.layout ? `${listing.layout} · ` : ''}
          {formatArea(listing.floorArea)}
          {listing.builtYear !== undefined && <> · {listing.builtYear}年築</>}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {listing.nearestStation} 徒歩{listing.walkMinutes}分
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {listing.prefecture} {listing.city}
          {listing.purchaseOption && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-primary">
              <Repeat2 className="size-3" />
              買取オプション
            </span>
          )}
        </div>
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {canBuy && listing.salePrice !== undefined && (
            <p className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">
                販売価格
              </span>
              <span className="font-display text-[22px] font-bold tracking-tight text-primary">
                {formatYen(listing.salePrice)}
              </span>
            </p>
          )}
          {canRent && listing.rentPerMonth !== undefined && (
            <p className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">
                月額賃料
              </span>
              <span className="font-display text-lg font-bold text-primary">
                {formatYen(listing.rentPerMonth)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  / 月
                </span>
              </span>
            </p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span className="truncate">{listing.seller.name}</span>
          <span className="flex shrink-0 items-center gap-1">
            {listing.seller.reviews > 0 ? (
              <>
                <Star className="size-3 fill-[#bc933b] text-[#bc933b]" />
                <span className="font-semibold text-foreground">
                  {listing.seller.rating}
                </span>
                ({listing.seller.reviews})
              </>
            ) : (
              '評価なし'
            )}
          </span>
        </div>
      </div>
    </Link>
  )
}
