// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LeaseRequestForm } from './lease-request-form'

afterEach(() => vi.unstubAllGlobals())

const props = {
  listingId: 'trc-001',
  rentPerMonth: 22_000,
  booked: [{ startDate: '2026-10-10', endDate: '2026-10-12' }],
}

describe('LeaseRequestForm', () => {
  it('asks to log in when signed out', () => {
    render(<LeaseRequestForm {...props} signedIn={false} />)
    expect(
      screen.getByRole('link', { name: 'ログインして申し込む' }),
    ).toHaveAttribute('href', '/login?callbackUrl=%2Flistings%2Ftrc-001')
    expect(screen.getByText('10/10 〜 10/12')).toBeInTheDocument()
  })

  it('previews the total and submits the range', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ id: 'r-1', status: 'requested' }, { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<LeaseRequestForm {...props} signedIn />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('開始日'), '2026-10-01')
    await user.type(screen.getByLabelText('終了日'), '2026-10-07')
    expect(screen.getByText('7日間 · ¥154,000')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'レンタルを申し込む' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/listings/trc-001/leases',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'レンタルを申し込みました',
    )
    expect(
      screen.getByRole('link', { name: 'マイページで確認する' }),
    ).toHaveAttribute('href', '/account')
  })

  it('shows the server error for a booked range', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { error: 'その期間はすでに予約されています。' },
          { status: 409 },
        ),
      ),
    )
    render(<LeaseRequestForm {...props} signedIn />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('開始日'), '2026-10-10')
    await user.type(screen.getByLabelText('終了日'), '2026-10-11')
    await user.click(screen.getByRole('button', { name: 'レンタルを申し込む' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'その期間はすでに予約されています。',
    )
  })
})
