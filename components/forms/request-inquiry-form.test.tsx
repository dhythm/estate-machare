// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RequestInquiryForm } from './request-inquiry-form'

afterEach(() => vi.unstubAllGlobals())

describe('RequestInquiryForm', () => {
  it('posts a question and links to the thread', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        { id: 't-9', receivedAt: '2026-09-13T00:00:00.000Z' },
        { status: 201 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RequestInquiryForm requestId="tj-01" />
      </QueryClientProvider>,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '質問を送る' }))
    expect(screen.getByLabelText('質問')).toHaveAccessibleDescription(
      '質問を入力してください。',
    )
    await user.type(screen.getByLabelText('質問'), '積載方法は？')
    await user.click(screen.getByRole('button', { name: '質問を送る' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      '受け付けました',
    )
    expect(
      screen.getByRole('link', { name: 'やり取りを見る' }),
    ).toHaveAttribute('href', '/account/threads/t-9')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/transport/requests/tj-01/inquiries',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
