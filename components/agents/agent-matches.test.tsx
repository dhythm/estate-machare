// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AgentMatches } from './agent-matches'

describe('AgentMatches', () => {
  it('lists matching agents with their categories and areas', () => {
    render(
      <AgentMatches
        matches={[
          {
            score: 2,
            profile: {
              id: 'demo-user',
              name: '高橋不動産',
              kind: '宅建業者',
              prefecture: '東京都',
              handledCategories: ['マンション', '戸建'],
              serviceAreas: ['東京都', '神奈川県'],
              createdAt: '2026-09-13T00:00:00.000Z',
              updatedAt: '2026-09-13T00:00:00.000Z',
            },
          },
        ]}
      />,
    )
    expect(screen.getByText('高橋不動産')).toBeInTheDocument()
    expect(screen.getByText('マンション・戸建')).toBeInTheDocument()
    expect(screen.getByText('東京都・神奈川県')).toBeInTheDocument()
    expect(screen.getByText('希望エリアが拠点')).toBeInTheDocument()
  })

  it('shows an empty state', () => {
    render(<AgentMatches matches={[]} />)
    expect(
      screen.getByText('対応地域が合う担当者はまだいません'),
    ).toBeInTheDocument()
  })
})
