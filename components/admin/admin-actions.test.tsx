// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LeaseCancelButton, ThreadCloseButton } from './admin-actions'

const refresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

afterEach(() => vi.unstubAllGlobals())

describe('admin actions', () => {
  it('closes a thread as declined', async () => {
    const fetchMock = vi.fn(async () => Response.json({ status: 'declined' }))
    vi.stubGlobal('fetch', fetchMock)
    render(<ThreadCloseButton threadId="t-1" />)
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '終了する' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/threads/t-1',
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(
      JSON.parse(
        (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
          .body as string,
      ),
    ).toEqual({ status: 'declined' })
    expect(refresh).toHaveBeenCalled()
  })

  it('cancels a lease', async () => {
    const fetchMock = vi.fn(async () => Response.json({ status: 'cancelled' }))
    vi.stubGlobal('fetch', fetchMock)
    render(<LeaseCancelButton leaseId="r-1" />)
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '取り消す' }))
    expect(
      JSON.parse(
        (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
          .body as string,
      ),
    ).toEqual({ status: 'cancelled' })
  })
})
