// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StartIntroductionButton } from './start-introduction-button'

const refresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

afterEach(() => vi.unstubAllGlobals())

describe('StartIntroductionButton', () => {
  it('moves the request into 紹介中', async () => {
    const fetchMock = vi.fn(async () => Response.json({ status: '紹介中' }))
    vi.stubGlobal('fetch', fetchMock)
    render(<StartIntroductionButton requestId="pr-01" />)
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '紹介を開始する' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/requests/pr-01/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: '紹介中' }),
      }),
    )
    expect(refresh).toHaveBeenCalled()
  })

  it('shows the server error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { error: '現在の状態ではその操作はできません。' },
          { status: 409 },
        ),
      ),
    )
    render(<StartIntroductionButton requestId="pr-01" />)
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '紹介を開始する' }))
    expect(
      await screen.findByText('現在の状態ではその操作はできません。'),
    ).toBeInTheDocument()
  })
})
