import 'server-only'

import type { Listing, TransportJob } from '@/lib/data'
import { generateListings } from './generated-listings'

const curatedListings = generateListings(6, 1).map((listing, index) => ({
  ...listing,
  ownerUserId: [
    'demo-seller',
    'demo-seller',
    'tamura',
    'kobayashi-engei',
    'sky-agri',
    'tokachi-agri',
  ][index],
  id: ['trc-001', 'cmb-002', 'rpl-003', 'til-004', 'drn-005', 'trc-006'][index],
}))

export const listings: Listing[] = [
  ...curatedListings,
  ...generateListings(42, 7),
]

/** Retained for existing store schemas; moving is outside the product scope. */
export const transportJobs: TransportJob[] = []
