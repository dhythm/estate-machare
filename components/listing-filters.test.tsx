// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchRefinements } from './listing-filters'

describe('SearchRefinements', () => {
  it('applies prefecture, price range, sort, and dates', async () => {
    const onChange = vi.fn()
    render(
      <SearchRefinements
        value={{ category: 'すべて', deal: 'rent', keyword: '' }}
        onChange={onChange}
      />,
    )
    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('都道府県'), '新潟県')
    expect(onChange).toHaveBeenLastCalledWith({ prefecture: '新潟県' })
    await user.selectOptions(
      screen.getByLabelText('並び替え'),
      '月額賃料が安い順',
    )
    expect(onChange).toHaveBeenLastCalledWith({ sort: 'rentAsc' })
    await user.type(screen.getByLabelText('日額の下限'), '10000')
    await user.type(screen.getByLabelText('日額の上限'), '30000')
    await user.click(screen.getByRole('button', { name: '価格で絞り込む' }))
    expect(onChange).toHaveBeenLastCalledWith({
      priceMin: 10_000,
      priceMax: 30_000,
    })
    await user.type(screen.getByLabelText('利用開始日'), '2026-10-01')
    await user.type(screen.getByLabelText('利用終了日'), '2026-10-07')
    expect(onChange).toHaveBeenLastCalledWith({
      availableFrom: '2026-10-01',
      availableTo: '2026-10-07',
    })
  })

  it('labels the price by sale when the deal is not rent and clears refinements', async () => {
    const onChange = vi.fn()
    render(
      <SearchRefinements
        value={{
          category: 'すべて',
          deal: 'sale',
          keyword: '',
          prefecture: '新潟県',
          priceMax: 500_000,
          sort: 'priceAsc',
        }}
        onChange={onChange}
      />,
    )
    expect(screen.getByLabelText('販売価格の上限')).toHaveValue('500000')
    expect(screen.getByLabelText('都道府県')).toHaveValue('新潟県')
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '絞り込みを解除' }))
    expect(onChange).toHaveBeenLastCalledWith({
      prefecture: undefined,
      priceMin: undefined,
      priceMax: undefined,
      sort: undefined,
      availableFrom: undefined,
      availableTo: undefined,
    })
  })
})
