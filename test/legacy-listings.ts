import { getStore } from '@/lib/server/store'

/** Explicit daily-rental fixtures for regression coverage of existing contracts. */
export async function seedLegacyRentalListings() {
  await getStore().listings.update('trc-001', {
    property: undefined,
    rentPerDay: 22000,
    salePrice: 18800000,
    rentToOwn: true,
    rentToOwnCreditRate: 50,
    rentToOwnCreditCap: 5000000,
    seller: {
      name: '掲載者デモ',
      kind: '不動産会社',
      rating: 4.8,
      reviews: 34,
    },
  })
  await getStore().listings.update('cmb-002', {
    property: undefined,
    seller: {
      name: '掲載者デモ',
      kind: '不動産会社',
      rating: 4.6,
      reviews: 58,
    },
    deals: ['sale', 'rent'],
    rentPerDay: 45000,
    salePrice: 24500000,
    rentToOwn: true,
    rentToOwnCreditRate: 50,
    rentToOwnCreditCap: 6000000,
  })
  await getStore().listings.update('til-004', {
    property: undefined,
    deals: ['sale', 'rent'],
    rentPerDay: 2500,
    salePrice: 128000,
    rentToOwn: false,
    ownerUserId: 'kobayashi-engei',
  })
  await getStore().listings.update('drn-005', {
    property: undefined,
    deals: ['rent'],
    rentPerDay: 12000,
    salePrice: undefined,
    rentToOwn: false,
    ownerUserId: 'sky-agri',
  })
  await getStore().listings.update('trc-006', {
    property: undefined,
    deals: ['sale'],
    rentPerDay: undefined,
    salePrice: 21000000,
    rentToOwn: false,
    ownerUserId: 'tokachi-agri',
  })
}
