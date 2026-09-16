// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PropertyRequestForm } from './property-request-form'

function setup(
  initial?: Parameters<typeof PropertyRequestForm>[0]['initial'],
  edit?: Parameters<typeof PropertyRequestForm>[0]['edit'],
) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PropertyRequestForm initial={initial} edit={edit} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

afterEach(() => vi.unstubAllGlobals())

describe('PropertyRequestForm', () => {
  it('edits an existing request with PUT', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ id: 'pr-01', updatedAt: '2026-09-13T00:00:00.000Z' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup(undefined, {
      requestId: 'pr-01',
      values: {
        title: '駅徒歩10分以内の2LDKを借りたい',
        deal: 'rent',
        category: 'マンション',
        layout: '2LDK',
        prefecture: '東京都',
        city: '世田谷区',
        budget: '140000',
        moveInDate: '2026-12-01',
        contactEmail: 'seeker@example.com',
      },
    })
    expect(screen.getByLabelText('希望条件の見出し')).toHaveValue(
      '駅徒歩10分以内の2LDKを借りたい',
    )
    expect(screen.getByLabelText('都道府県')).toHaveValue('東京都')
    expect(screen.getByLabelText('市区町村')).toHaveValue('世田谷区')
    expect(screen.getByLabelText('希望の間取り')).toHaveValue('2LDK')
    const budget = screen.getByLabelText('月額賃料の上限（円）')
    expect(budget).toHaveValue('140000')
    await user.clear(budget)
    await user.type(budget, '160000')
    await user.click(screen.getByRole('button', { name: '更新する' }))
    expect(await screen.findByRole('status')).toHaveTextContent('更新しました')
    expect(
      screen.getByRole('link', { name: 'リクエストの詳細を見る' }),
    ).toHaveAttribute('href', '/requests/pr-01')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/requests/pr-01',
      expect.objectContaining({ method: 'PUT' }),
    )
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string,
    )
    expect(body).toMatchObject({
      budget: '160000',
      prefecture: '東京都',
      city: '世田谷区',
    })
  })

  it('hides the layout for land, which has no rooms', async () => {
    const user = setup()
    await user.selectOptions(screen.getByLabelText('カテゴリ'), 'マンション')
    expect(screen.getByLabelText('希望の間取り')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('カテゴリ'), '土地')
    expect(screen.queryByLabelText('希望の間取り')).not.toBeInTheDocument()
  })

  it('labels the budget by the wanted deal', async () => {
    const user = setup()
    expect(screen.getByLabelText('月額賃料の上限（円）')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('希望する取引'), 'sale')
    expect(screen.getByLabelText('予算の上限（円）')).toBeInTheDocument()
  })

  it('prefills from a listing', () => {
    setup({
      title: 'シティタワー 世田谷区 3LDK のような物件を探しています',
      deal: 'rent',
      category: 'マンション',
      layout: '3LDK',
      prefecture: '東京都',
      city: '世田谷区',
    })
    expect(screen.getByLabelText('希望条件の見出し')).toHaveValue(
      'シティタワー 世田谷区 3LDK のような物件を探しています',
    )
    expect(screen.getByLabelText('カテゴリ')).toHaveValue('マンション')
    expect(screen.getByLabelText('希望の間取り')).toHaveValue('3LDK')
    expect(screen.getByLabelText('都道府県')).toHaveValue('東京都')
    expect(screen.getByLabelText('市区町村')).toHaveValue('世田谷区')
  })

  it('validates before posting', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = setup()
    await user.click(screen.getByRole('button', { name: '条件を登録する' }))
    expect(
      screen.getByLabelText('希望条件の見出し'),
    ).toHaveAccessibleDescription('希望条件の見出しを入力してください。')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts the request and returns to the board', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        { id: 'request-1', receivedAt: '2026-09-13T00:00:00.000Z' },
        { status: 201 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup()
    await user.type(
      screen.getByLabelText('希望条件の見出し'),
      '単身用1Kを駅徒歩10分以内で',
    )
    await user.selectOptions(screen.getByLabelText('カテゴリ'), 'マンション')
    await user.selectOptions(screen.getByLabelText('希望の間取り'), '1K')
    await user.selectOptions(screen.getByLabelText('都道府県'), '長野県')
    await user.type(screen.getByLabelText('市区町村'), '長野市')
    await user.type(screen.getByLabelText('月額賃料の上限（円）'), '98000')
    await user.type(screen.getByLabelText('入居・引渡し希望日'), '2026-12-01')
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'seeker@example.com',
    )
    await user.click(screen.getByRole('button', { name: '条件を登録する' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      '受け付けました',
    )
    expect(
      screen.getByRole('link', { name: 'リクエスト一覧にもどる' }),
    ).toHaveAttribute('href', '/requests')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/requests',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
