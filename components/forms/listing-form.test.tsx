// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ListingForm } from './listing-form'

const { resizeImage, resizeDataUrl } = vi.hoisted(() => ({
  resizeImage: vi.fn(),
  resizeDataUrl: vi.fn(),
}))
vi.mock('@/lib/images', () => ({ resizeImage, resizeDataUrl }))

function setup(
  contact?: { name: string; email: string },
  edit?: Parameters<typeof ListingForm>[0]['edit'],
) {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <ListingForm contact={contact} edit={edit} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

const existing = {
  listingId: 'trc-001',
  values: {
    areaSqm: '68.5',
    builtYear: '2019',
    floorPlan: '2LDK',
    access: '駅 徒歩8分',
    monthlyRent: '168000',
    name: 'クボタ マンション 45馬力',
    category: 'マンション',
    maker: 'クボタ',
    year: '2019',
    hours: '620',
    condition: '目立った傷なし',
    prefecture: '新潟県',
    city: '長岡市',
    deals: ['sale', 'rent'] as ('sale' | 'rent')[],
    salePrice: '18800000',
    rentPerDay: '22000',
    rentToOwn: false,
    rentToOwnCreditRate: '50',
    rentToOwnCreditCap: '5000000',
    summary: 'キャビン付き',
    sellerName: '中村ファーム',
    sellerKind: '不動産会社',
    contactEmail: 'seller@example.com',
  },
  images: ['data:image/jpeg;base64,one', 'data:image/jpeg;base64,two'],
  thumbnail: 'data:image/jpeg;base64,thumbone',
}

afterEach(() => vi.unstubAllGlobals())

describe('ListingForm', () => {
  it('focuses the first invalid field on submit without moving focus while typing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = setup()
    await user.click(screen.getByRole('button', { name: '掲載を申し込む' }))
    const name = screen.getByLabelText('物件名')
    expect(name).toHaveFocus()
    await user.type(name, 'マンション')
    expect(name).toHaveValue('マンション')
    expect(name).toHaveFocus()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('edits an existing listing with PUT, keeping remaining pictures', async () => {
    resizeDataUrl.mockResolvedValue('data:image/jpeg;base64,thumbtwo')
    const fetchMock = vi.fn(async () =>
      Response.json({ id: 'trc-001', updatedAt: '2026-09-13T00:00:00.000Z' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup(undefined, existing)
    expect(screen.getByLabelText('物件名')).toHaveValue(
      'クボタ マンション 45馬力',
    )

    expect(screen.getAllByRole('img', { name: /写真/ })).toHaveLength(2)
    await user.click(screen.getAllByRole('button', { name: '削除' })[0])
    await user.clear(screen.getByLabelText('物件名'))
    await user.type(screen.getByLabelText('物件名'), '更新後の名前')
    await user.click(screen.getByRole('button', { name: '更新する' }))
    expect(await screen.findByRole('status')).toHaveTextContent('更新しました')
    expect(
      screen.getByRole('link', { name: '物件の詳細を見る' }),
    ).toHaveAttribute('href', '/listings/trc-001')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/listings/trc-001',
      expect.objectContaining({ method: 'PUT' }),
    )
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string,
    )
    expect(body.name).toBe('更新後の名前')
    expect(body.images).toEqual(['data:image/jpeg;base64,two'])
    expect(body.thumbnail).toBe('data:image/jpeg;base64,thumbtwo')
  })

  it('adds resized pictures, previews them, and submits them with a thumbnail', async () => {
    resizeImage.mockImplementation(async (_file: File, maxSide: number) =>
      maxSide > 500
        ? 'data:image/jpeg;base64,full'
        : 'data:image/jpeg;base64,thumb',
    )
    const fetchMock = vi.fn(async () =>
      Response.json(
        { id: 'r1', receivedAt: '2026-09-13T00:00:00.000Z' },
        { status: 201 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup({ name: '掲載者デモ', email: 'seller@example.com' })
    const file = new File(['x'], 'tractor.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('写真（5枚まで）'), [file, file])
    expect(await screen.findAllByRole('img', { name: /写真/ })).toHaveLength(2)
    await user.click(screen.getAllByRole('button', { name: '削除' })[1])
    expect(screen.getAllByRole('img', { name: /写真/ })).toHaveLength(1)

    await user.type(screen.getByLabelText('物件名'), 'クボタ マンション')
    await user.selectOptions(screen.getByLabelText('カテゴリ'), 'マンション')
    await user.type(screen.getByLabelText('間取り・区画'), 'クボタ')
    await user.type(screen.getByLabelText('築年（西暦）'), '2018')
    await user.type(screen.getByLabelText('専有・土地面積（㎡）'), '500')
    await user.selectOptions(screen.getByLabelText('状態'), '使用感あり')
    await user.type(screen.getByLabelText('都道府県'), '新潟県')
    await user.type(screen.getByLabelText('市区町村'), '長岡市')
    await user.type(screen.getByLabelText('売買価格'), '1500000')
    await user.type(screen.getByLabelText('月額賃料（円）'), '12000')
    await user.type(screen.getByLabelText('交通アクセス'), '駅 徒歩8分')
    await user.type(screen.getByLabelText('説明'), 'キャビン付き。')
    await user.selectOptions(
      screen.getByLabelText('掲載者の区分'),
      '不動産会社',
    )
    await user.click(screen.getByRole('button', { name: '掲載を申し込む' }))
    await screen.findByRole('status')
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string,
    )
    expect(body.images).toEqual(['data:image/jpeg;base64,full'])
    expect(body.thumbnail).toBe('data:image/jpeg;base64,thumb')
  })

  it('prefills the seller from the signed-in user', () => {
    setup({ name: '掲載者デモ', email: 'seller@example.com' })
    expect(screen.getByLabelText('掲載者名')).toHaveValue('掲載者デモ')
    expect(screen.getByLabelText('メールアドレス')).toHaveValue(
      'seller@example.com',
    )
  })

  it('uses monthly rent without daily rental purchase controls', () => {
    setup()
    expect(screen.getByLabelText('月額賃料（円）')).toBeInTheDocument()
    expect(screen.queryByLabelText('レンタル購入を受け付ける')).toBeNull()
  })

  it('only asks for prices of the selected deals', async () => {
    const user = setup()
    expect(screen.getByLabelText('売買価格')).toBeInTheDocument()
    expect(screen.getByLabelText('月額賃料（円）')).toBeInTheDocument()
    await user.click(screen.getByLabelText('売買'))
    expect(screen.queryByLabelText('売買価格')).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('レンタル購入を受け付ける'),
    ).not.toBeInTheDocument()
  })

  it('submits the listing with numbers as entered', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        { id: 'r1', receivedAt: '2026-09-13T00:00:00.000Z' },
        { status: 201 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup()
    await user.type(screen.getByLabelText('物件名'), 'クボタ マンション')
    await user.selectOptions(screen.getByLabelText('カテゴリ'), 'マンション')
    await user.type(screen.getByLabelText('間取り・区画'), 'クボタ')
    await user.type(screen.getByLabelText('築年（西暦）'), '2018')
    await user.type(screen.getByLabelText('専有・土地面積（㎡）'), '500')
    await user.selectOptions(screen.getByLabelText('状態'), '使用感あり')
    await user.type(screen.getByLabelText('都道府県'), '新潟県')
    await user.type(screen.getByLabelText('市区町村'), '長岡市')
    await user.type(screen.getByLabelText('売買価格'), '1500000')
    await user.type(screen.getByLabelText('月額賃料（円）'), '12000')
    await user.type(screen.getByLabelText('交通アクセス'), '駅 徒歩8分')
    await user.type(screen.getByLabelText('説明'), 'キャビン付き。')
    await user.type(screen.getByLabelText('掲載者名'), 'テスト農園')
    await user.selectOptions(
      screen.getByLabelText('掲載者の区分'),
      '不動産会社',
    )
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'seller@example.com',
    )
    await user.click(screen.getByRole('button', { name: '掲載を申し込む' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      '受け付けました',
    )
    expect(
      screen.getByRole('link', { name: '掲載中の物件を見る' }),
    ).toHaveAttribute('href', '/listings')
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string,
    )
    expect(body).toMatchObject({
      name: 'クボタ マンション',
      deals: ['sale', 'rent'],
      salePrice: '1500000',
      rentToOwn: false,
      sellerName: 'テスト農園',
      sellerKind: '不動産会社',
    })
  })
})
