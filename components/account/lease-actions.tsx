'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { LeaseStatus } from '@/lib/lease'

type Action = { status: LeaseStatus; label: string; destructive?: boolean }

function actionsFor(
  status: LeaseStatus,
  party: 'owner' | 'tenant',
  canConvert: boolean,
): Action[] {
  if (party === 'owner') {
    if (status === 'requested')
      return [
        { status: 'active', label: '承認する' },
        { status: 'cancelled', label: '辞退する', destructive: true },
      ]
    if (status === 'active')
      return [{ status: 'completed', label: '返却を確認' }]
    return []
  }
  if (status === 'requested')
    return [{ status: 'cancelled', label: 'キャンセル', destructive: true }]
  if (status === 'active' && canConvert)
    return [{ status: 'converted', label: '購入に切り替える' }]
  return []
}

export function LeaseActions({
  leaseId,
  status,
  party,
  canConvert,
}: {
  leaseId: string
  status: LeaseStatus
  party: 'owner' | 'tenant'
  canConvert: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const actions = actionsFor(status, party, canConvert)
  if (actions.length === 0) return null

  const apply = async (next: LeaseStatus) => {
    setBusy(true)
    setError(undefined)
    try {
      const response = await fetch(`/api/leases/${leaseId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!response.ok) {
        const body = (await response.json()) as { error?: string }
        setError(body.error ?? '更新できませんでした。')
        return
      }
      router.refresh()
    } catch {
      setError('更新できませんでした。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.status}
          type="button"
          size="sm"
          variant={action.destructive ? 'destructive' : 'default'}
          className="min-h-9 px-3"
          disabled={busy}
          onClick={() => void apply(action.status)}
        >
          {action.label}
        </Button>
      ))}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
