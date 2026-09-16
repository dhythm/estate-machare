// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LeaseRequestForm } from './lease-request-form'

afterEach(() => vi.unstubAllGlobals())

const props = {
  listingId: 'apt-001',
  rentPerMonth: 268_000,
  booked: [{ startDate: '2027-10-01', endDate: '2029-09-30' }],
}

describe('LeaseRequestForm', () => {
  it('asks to log in when signed out', () => {
    render(<LeaseRequestForm {...props} signedIn={false} />)
    expect(
      screen.getByRole('link', { name: 'ログインして申し込む' }),
    ).toHaveAttribute('href', '/login?callbackUrl=%2Flistings%2Fapt-001')
    expect(screen.getByText('10/1 〜 9/30')).toBeInTheDocument()
  })

  it('previews the total and submits the range', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ id: 'r-1', status: 'requested' }, { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<LeaseRequestForm {...props} signedIn />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('開始日'), '2026-10-01')
    await user.type(screen.getByLabelText('終了日'), '2027-09-30')
    expect(screen.getByText('12か月 · ¥3,216,000')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '入居を申し込む' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/listings/apt-001/leases',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      '入居を申し込みました',
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
          { error: 'その期間はすでに契約されています。' },
          { status: 409 },
        ),
      ),
    )
    render(<LeaseRequestForm {...props} signedIn />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('開始日'), '2027-10-01')
    await user.type(screen.getByLabelText('終了日'), '2028-09-30')
    await user.click(screen.getByRole('button', { name: '入居を申し込む' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'その期間はすでに契約されています。',
    )
  })
})
