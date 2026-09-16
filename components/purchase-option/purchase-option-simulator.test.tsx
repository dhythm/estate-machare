// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PurchaseOptionSimulator } from './purchase-option-simulator'

describe('PurchaseOptionSimulator', () => {
  it('recalculates the credit from the contract term', async () => {
    render(
      <PurchaseOptionSimulator
        terms={{
          rentPerMonth: 268_000,
          salePrice: 88_000_000,
          creditRate: 50,
          creditCap: 5_000_000,
        }}
      />,
    )
    const months = screen.getByLabelText('契約期間')
    expect(months).toHaveValue(24)
    expect(screen.getByText('¥6,432,000')).toBeInTheDocument()
    expect(screen.getByText('¥3,216,000')).toBeInTheDocument()
    expect(screen.getByText('¥84,784,000')).toBeInTheDocument()
    const user = userEvent.setup()
    await user.clear(months)
    await user.type(months, '120')
    expect(screen.getByText('¥5,000,000')).toBeInTheDocument()
    expect(screen.getByText('¥83,000,000')).toBeInTheDocument()
  })
})
