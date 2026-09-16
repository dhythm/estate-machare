// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LeaseActions } from './lease-actions'

const refresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

afterEach(() => vi.unstubAllGlobals())

describe('LeaseActions', () => {
  it('offers the owner approve and decline on a request', async () => {
    const fetchMock = vi.fn(async () => Response.json({ status: 'active' }))
    vi.stubGlobal('fetch', fetchMock)
    render(
      <LeaseActions
        leaseId="r-1"
        status="requested"
        party="owner"
        canConvert={false}
      />,
    )
    expect(screen.getByRole('button', { name: '辞退する' })).toBeInTheDocument()
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '承認する' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/leases/r-1',
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(
      JSON.parse(
        (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
          .body as string,
      ),
    ).toEqual({ status: 'active' })
    expect(refresh).toHaveBeenCalled()
  })

  it('offers the tenant conversion only when allowed', () => {
    render(
      <LeaseActions leaseId="r-1" status="active" party="tenant" canConvert />,
    )
    expect(
      screen.getByRole('button', { name: '購入に切り替える' }),
    ).toBeInTheDocument()
    render(
      <LeaseActions
        leaseId="r-2"
        status="active"
        party="tenant"
        canConvert={false}
      />,
    )
    expect(
      screen.getAllByRole('button', { name: '購入に切り替える' }),
    ).toHaveLength(1)
  })

  it('renders nothing when no action applies', () => {
    const { container } = render(
      <LeaseActions
        leaseId="r-1"
        status="completed"
        party="owner"
        canConvert={false}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
