// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OrderRequestForm } from './order-request-form'

afterEach(() => vi.unstubAllGlobals())

describe('OrderRequestForm', () => {
  it('asks to log in when signed out', () => {
    render(
      <OrderRequestForm
        listingId="apt-001"
        price={88_000_000}
        signedIn={false}
        available
      />,
    )
    expect(
      screen.getByRole('link', { name: 'ログインして購入を申し込む' }),
    ).toHaveAttribute('href', '/login?callbackUrl=%2Flistings%2Fapt-001')
  })

  it('explains when another buyer holds the listing', () => {
    render(
      <OrderRequestForm
        listingId="apt-001"
        price={88_000_000}
        signedIn
        available={false}
      />,
    )
    expect(
      screen.getByText('他の方の購入手続きが進んでいます。'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '購入を申し込む' })).toBeNull()
  })

  it('posts the request and links to the account page', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ id: 'o-1' }, { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(
      <OrderRequestForm
        listingId="apt-001"
        price={88_000_000}
        signedIn
        available
      />,
    )
    const user = userEvent.setup()
    await user.type(
      screen.getByLabelText('出品者へのメッセージ'),
      '来週引き取れます',
    )
    await user.click(screen.getByRole('button', { name: '購入を申し込む' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/listings/apt-001/orders',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(
      JSON.parse(
        (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
          .body as string,
      ),
    ).toEqual({ message: '来週引き取れます' })
    expect(await screen.findByRole('status')).toHaveTextContent(
      '購入を申し込みました',
    )
    expect(
      screen.getByRole('link', { name: 'マイページで確認する' }),
    ).toHaveAttribute('href', '/account')
  })
})
