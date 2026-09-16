import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TransportPricingPage from './page'

vi.mock('@/components/page-shell', () => ({
  PageShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

describe('moving estimate', () => {
  it('shows a valid estimate for a single-person move', () => {
    render(<TransportPricingPage />)
    expect(
      screen.getByText('例：単身引越しで 120km 移動する場合'),
    ).toBeInTheDocument()
    expect(screen.getByText('¥54,000')).toBeInTheDocument()
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })
})
