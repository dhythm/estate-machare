import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ListingDetail } from './listing-detail'
import { getListing } from '@/lib/server/listings'
import { buildModes } from '@/lib/server/listing-detail'

describe('ListingDetail', () => {
  it('refreshes saved demo artwork while retaining uploaded gallery pictures', async () => {
    const listing = (await getListing('apt-001'))!
    const uploaded = 'data:image/jpeg;base64,/9j/4AAQ'
    render(
      <ListingDetail
        listing={{
          ...listing,
          images: ['/properties/apartment.svg', uploaded],
        }}
        modes={buildModes(listing)}
        related={[]}
        booked={[]}
        viewer={{ signedIn: false, isOwner: false }}
      />,
    )

    expect(
      decodeURIComponent(
        screen.getByRole('img', { name: listing.name }).getAttribute('src')!,
      ),
    ).toContain('/properties/apartment.webp')
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '写真 2' }))
    expect(screen.getByRole('img', { name: listing.name })).toHaveAttribute(
      'src',
      uploaded,
    )
    expect(screen.getByRole('button', { name: '写真 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

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
