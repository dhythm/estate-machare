import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ListingDetail } from './listing-detail'
import { getListing } from '@/lib/server/listings'
import { buildModes } from '@/lib/server/listing-detail'

describe('ListingDetail', () => {
  it('preserves the selected equipment when starting a transport request', async () => {
    const listing = (await getListing('trc-001'))!
    render(
      <ListingDetail
        listing={listing}
        modes={buildModes(listing)}
        related={[]}
        booked={[]}
        viewer={{ signedIn: false, isOwner: false }}
      />,
    )

    expect(
      screen.getByRole('link', { name: '引越しを相談する' }),
    ).toHaveAttribute('href', '/transport/new?listingId=trc-001')
  })

  it('exposes the selected transaction and retains purchase and question destinations', async () => {
    const listing = (await getListing('trc-001'))!
    render(
      <ListingDetail
        listing={listing}
        modes={buildModes(listing)}
        related={[]}
        booked={[]}
        viewer={{ signedIn: false, isOwner: false }}
      />,
    )
    const purchase = screen.getByRole('button', { name: '購入する' })
    expect(purchase).toHaveAttribute('aria-pressed', 'false')
    await userEvent.setup().click(purchase)

    expect(purchase).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('link', { name: '購入・内見を相談する' }),
    ).toHaveAttribute('href', '/listings/trc-001/inquiry?mode=buy')
    expect(
      screen.getByRole('link', { name: '掲載者に質問する' }),
    ).toHaveAttribute('href', '/listings/trc-001/inquiry?mode=question')
  })

  it('links the seller block to the seller page', async () => {
    const listing = (await getListing('trc-001'))!
    render(
      <ListingDetail
        listing={listing}
        modes={buildModes(listing)}
        related={[]}
        booked={[]}
        viewer={{ signedIn: false, isOwner: false }}
      />,
    )

    expect(screen.getByRole('link', { name: '掲載者ページ' })).toHaveAttribute(
      'href',
      '/sellers/demo-seller',
    )
  })
})
