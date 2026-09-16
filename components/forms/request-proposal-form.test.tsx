// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PropertyRequest } from '@/lib/data'
import { RequestProposalForm } from './request-proposal-form'

const request: PropertyRequest = {
  id: 'pr-01',
  title: '駅徒歩10分以内の2LDKを借りたい',
  deal: 'rent',
  category: 'マンション',
  layout: '2LDK',
  prefecture: '東京都',
  city: '世田谷区',
  budget: 38_000,
  moveInDate: '2026-12-01',
  status: '募集中',
}

afterEach(() => vi.unstubAllGlobals())

describe('RequestProposalForm', () => {
  it('prefills the contact, validates, and posts', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        { id: 'a-1', receivedAt: '2026-09-13T00:00:00.000Z' },
        { status: 201 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RequestProposalForm
          request={request}
          contact={{ name: '高橋不動産', email: 'k@example.com' }}
          listings={[{ id: 'apt-001', name: 'シティタワー 世田谷区 3LDK' }]}
        />
      </QueryClientProvider>,
    )
    const user = userEvent.setup()
    expect(screen.getByLabelText('お名前・商号')).toHaveValue('高橋不動産')
    expect(screen.getByLabelText('紹介する物件')).toHaveValue('')
    await user.click(screen.getByRole('button', { name: '提案する' }))
    expect(screen.getByLabelText('案内可能日')).toHaveAccessibleDescription(
      '案内可能日を入力してください。',
    )
    expect(fetchMock).not.toHaveBeenCalled()
    await user.type(screen.getByLabelText('案内可能日'), '2026-10-03')
    await user.click(screen.getByRole('button', { name: '提案する' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      '受け付けました',
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/requests/pr-01/proposals',
      expect.objectContaining({ method: 'POST' }),
    )
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string,
    )
    expect(body).toMatchObject({
      name: '高橋不動産',
      availableDate: '2026-10-03',
    })
  })
})
