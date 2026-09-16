// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ListingStatusButton } from './listing-status-button'

const refresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

afterEach(() => vi.unstubAllGlobals())

describe('ListingStatusButton', () => {
  it('withdraws a listed listing', async () => {
    const fetchMock = vi.fn(async () => Response.json({ withdrawnAt: 'x' }))
    vi.stubGlobal('fetch', fetchMock)
    render(<ListingStatusButton listingId="apt-001" withdrawn={false} />)
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '取り下げる' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/listings/apt-001/status',
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(
      JSON.parse(
        (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
          .body as string,
      ),
    ).toEqual({ status: 'withdrawn' })
    expect(refresh).toHaveBeenCalled()
  })

  it('republishes and shows the server error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ error: '進行中の賃貸があります。' }, { status: 409 }),
      ),
    )
    render(<ListingStatusButton listingId="apt-001" withdrawn />)
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '再掲載する' }))
    expect(
      await screen.findByText('進行中の賃貸があります。'),
    ).toBeInTheDocument()
  })
})
