// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CloseRequestButton } from './close-request-button'

const refresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

afterEach(() => vi.unstubAllGlobals())

describe('CloseRequestButton', () => {
  it('marks the request as agreed', async () => {
    const fetchMock = vi.fn(async () => Response.json({ status: '成約' }))
    vi.stubGlobal('fetch', fetchMock)
    render(<CloseRequestButton requestId="pr-01" />)
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '成約にする' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/requests/pr-01/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: '成約' }),
      }),
    )
    expect(refresh).toHaveBeenCalled()
  })
})
