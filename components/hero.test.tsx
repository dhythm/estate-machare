// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Hero } from './hero'

describe('Hero search', () => {
  it('submits the selected deal, category and keyword to the existing listing search', async () => {
    const user = userEvent.setup()
    render(<Hero />)
    const form = screen.getByRole('search', { name: '物件を探す' })
    expect(form).toHaveAttribute('action', '/listings')
    expect(form).toHaveAttribute('method', 'get')
    await user.click(screen.getByRole('button', { name: '借りる' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: '物件種別' }),
      'マンション',
    )
    await user.type(
      screen.getByRole('searchbox', { name: 'エリア・キーワード' }),
      '世田谷',
    )
    const data = new FormData(form as HTMLFormElement)
    expect(Object.fromEntries(data)).toEqual({
      deal: 'rent',
      category: 'マンション',
      q: '世田谷',
    })
    await user.click(screen.getByRole('button', { name: '借りてから買う' }))
    expect(new FormData(form as HTMLFormElement).get('deal')).toBe(
      'purchaseOption',
    )
  })

  it('keeps property requests and listings reachable from the first screen', () => {
    render(<Hero />)
    expect(
      screen.getByRole('link', { name: /希望条件を登録する/ }),
    ).toHaveAttribute('href', '/requests/new')
    expect(
      screen.getByRole('link', { name: /物件リクエストを探す/ }),
    ).toHaveAttribute('href', '/requests')
  })
})
