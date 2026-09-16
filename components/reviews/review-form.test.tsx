// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReviewForm } from './review-form'

const refresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

afterEach(() => vi.unstubAllGlobals())

describe('ReviewForm', () => {
  it('posts the chosen rating and comment', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ id: 'rv-1' }, { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<ReviewForm sourceKind="lease" sourceId="r-1" />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('radio', { name: '4' }))
    await user.type(screen.getByLabelText('コメント'), '助かりました')
    await user.click(screen.getByRole('button', { name: 'レビューを送る' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/reviews',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(
      JSON.parse(
        (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
          .body as string,
      ),
    ).toEqual({
      sourceKind: 'lease',
      sourceId: 'r-1',
      rating: 4,
      comment: '助かりました',
    })
    expect(refresh).toHaveBeenCalled()
  })

  it('shows the server error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ error: 'すでにレビュー済みです。' }, { status: 409 }),
      ),
    )
    render(<ReviewForm sourceKind="thread" sourceId="t-1" />)
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'レビューを送る' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'すでにレビュー済みです。',
    )
  })
})
