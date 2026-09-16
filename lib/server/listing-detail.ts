import 'server-only'

import { formatYen, type Listing, type ListingModeConfig } from '@/lib/data'

export function buildModes(listing: Listing): ListingModeConfig[] {
  const modes: ListingModeConfig[] = []
  if (listing.property?.monthlyRent) {
    modes.push({
      id: 'rent',
      title: '借りる',
      price: `${formatYen(listing.property.monthlyRent)}/月`,
      desc: '入居時期・初期費用・契約条件を相談できます。',
      cta: '賃貸・内見を相談する',
    })
  }
  if (listing.rentPerDay && !listing.property) {
    modes.push({
      id: 'rent',
      title: 'レンタルする',
      price: `${formatYen(listing.rentPerDay)}/日`,
      desc: '繁忙期や試したい期間だけ。日単位・シーズン単位で相談できます。',
      cta: 'レンタルを申し込む',
    })
  }
  if (listing.rentToOwn && listing.rentPerDay && listing.rentToOwnCreditRate) {
    const cap = listing.rentToOwnCreditCap
    modes.push({
      id: 'rentToOwn',
      title: 'レンタルして試す → 購入',
      price: 'まず試す',
      desc: '借りて使ってみて、良ければそのまま購入。支払ったレンタル料の一部を購入価格に充当します。',
      cta: 'お試しレンタルを始める',
      note: `レンタル料の${listing.rentToOwnCreditRate}%${cap ? `（上限 ${formatYen(cap)}）` : ''}を購入価格に充当します。試してから決められるので、高額な買い物でも安心です。`,
    })
  }
  if (listing.salePrice) {
    modes.push({
      id: 'buy',
      title: '購入する',
      price: formatYen(listing.salePrice),
      desc: '物件の詳細や内見日程、購入条件を相談できます。',
      cta: '購入・内見を相談する',
    })
  }
  return modes
}
