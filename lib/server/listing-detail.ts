import 'server-only'

import { formatYen, type Listing, type ListingModeConfig } from '@/lib/data'

export function buildModes(listing: Listing): ListingModeConfig[] {
  const modes: ListingModeConfig[] = []
  if (listing.rentPerMonth) {
    modes.push({
      id: 'rent',
      title: 'レンタルする',
      price: `${formatYen(listing.rentPerMonth)}/日`,
      desc: '繁忙期や試したい期間だけ。日単位・シーズン単位で相談できます。',
      cta: 'レンタルを申し込む',
    })
  }
  if (listing.purchaseOption && listing.rentPerMonth && listing.purchaseOptionCreditRate) {
    const cap = listing.purchaseOptionCreditCap
    modes.push({
      id: 'purchaseOption',
      title: 'レンタルして試す → 購入',
      price: 'まず試す',
      desc: '借りて使ってみて、良ければそのまま購入。支払ったレンタル料の一部を購入価格に充当します。',
      cta: 'お試しレンタルを始める',
      note: `レンタル料の${listing.purchaseOptionCreditRate}%${cap ? `（上限 ${formatYen(cap)}）` : ''}を購入価格に充当します。試してから決められるので、高額な買い物でも安心です。`,
    })
  }
  if (listing.salePrice) {
    modes.push({
      id: 'buy',
      title: '購入する',
      price: formatYen(listing.salePrice),
      desc: '写真・状態・稼働時間を確認し、出品者と購入条件を相談できます。',
      cta: '購入手続きへ進む',
    })
  }
  return modes
}
