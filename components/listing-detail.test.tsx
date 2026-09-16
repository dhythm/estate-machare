import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ListingDetail } from './listing-detail'
import { getListing } from '@/lib/server/listings'
import { buildModes } from '@/lib/server/listing-detail'

describe('ListingDetail', () => {
  it('carries the listing over when starting a property request', async () => {
    const listing = (await getListing('apt-001'))!
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
      screen.getByRole('link', { name: '希望条件を登録して提案を受ける' }),
    ).toHaveAttribute('href', '/requests/new?listingId=apt-001')
  })

  it('exposes the selected transaction and retains purchase and question destinations', async () => {
    const listing = (await getListing('apt-001'))!
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
      screen.getByRole('link', { name: 'ログインして購入を申し込む' }),
    ).toHaveAttribute('href', '/login?callbackUrl=%2Flistings%2Fapt-001')
    expect(
      screen.getByRole('link', { name: '出品者に質問する' }),
    ).toHaveAttribute('href', '/listings/apt-001/inquiry?mode=question')
  })

  it('links the seller block to the seller page', async () => {
    const listing = (await getListing('apt-001'))!
    render(
      <ListingDetail
        listing={listing}
        modes={buildModes(listing)}
        related={[]}
        booked={[]}
        viewer={{ signedIn: false, isOwner: false }}
      />,
    )

    expect(screen.getByRole('link', { name: '出品者ページ' })).toHaveAttribute(
      'href',
      '/sellers/demo-seller',
    )
  })
})
