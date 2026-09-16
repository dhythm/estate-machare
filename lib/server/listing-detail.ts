import 'server-only'

import { formatYen, type Listing, type ListingModeConfig } from '@/lib/data'

export function buildModes(listing: Listing): ListingModeConfig[] {
  const modes: ListingModeConfig[] = []
  if (listing.rentPerMonth) {
    modes.push({
      id: 'rent',
      title: '借りる',
      price: `${formatYen(listing.rentPerMonth)}/月`,
      desc: `${listing.leaseType ?? '普通借家'}。入居時期や契約期間は出品者と相談できます。`,
      cta: '入居を申し込む',
    })
  }
  if (
    listing.purchaseOption &&
    listing.rentPerMonth &&
    listing.purchaseOptionCreditRate
  ) {
    const cap = listing.purchaseOptionCreditCap
    modes.push({
      id: 'purchaseOption',
      title: '住んでから買う',
      price: 'まず借りる',
      desc: '借りて住んでみて、良ければそのまま購入。支払った賃料の一部を購入価格に充当します。',
      cta: '入居を申し込む',
      note: `賃料の${listing.purchaseOptionCreditRate}%${cap ? `（上限 ${formatYen(cap)}）` : ''}を購入価格に充当します。住んでから決められるので、高額な買い物でも安心です。`,
    })
  }
  if (listing.salePrice) {
    modes.push({
      id: 'buy',
      title: '購入する',
      price: formatYen(listing.salePrice),
      desc: '写真・間取り・築年を確認し、出品者と購入条件を相談できます。',
      cta: '購入手続きへ進む',
    })
  }
  return modes
}
