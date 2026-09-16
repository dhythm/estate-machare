// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PurchaseOptionSimulator } from './purchase-option-simulator'

describe('PurchaseOptionSimulator', () => {
  it('recalculates the credit from the number of days', async () => {
    render(
      <PurchaseOptionSimulator
        terms={{
          rentPerMonth: 22_000,
          salePrice: 18_800_000,
          creditRate: 50,
          creditCap: 5_000_000,
        }}
      />,
    )
    const days = screen.getByLabelText('レンタル日数')
    expect(days).toHaveValue(30)
    expect(screen.getByText('¥660,000')).toBeInTheDocument()
    expect(screen.getByText('¥330,000')).toBeInTheDocument()
    expect(screen.getByText('¥18,470,000')).toBeInTheDocument()
    const user = userEvent.setup()
    await user.clear(days)
    await user.type(days, '1000')
    expect(screen.getByText('¥5,000,000')).toBeInTheDocument()
    expect(screen.getByText('¥13,800,000')).toBeInTheDocument()
  })
})
