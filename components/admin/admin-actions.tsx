'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

function useAction(url: string, body: Record<string, unknown>) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const run = async () => {
    setBusy(true)
    setError(undefined)
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        setError(payload.error ?? '更新できませんでした。')
        return
      }
      router.refresh()
    } catch {
      setError('更新できませんでした。')
    } finally {
      setBusy(false)
    }
  }
  return { run, busy, error }
}

function ActionButton({
  label,
  action,
}: {
  label: string
  action: ReturnType<typeof useAction>
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={action.busy}
        onClick={() => void action.run()}
      >
        {label}
      </Button>
      {action.error && (
        <span className="text-xs text-destructive">{action.error}</span>
      )}
    </span>
  )
}

/** Marks a thread declined so both sides see it is closed. */
export function ThreadCloseButton({ threadId }: { threadId: string }) {
  const action = useAction(`/api/threads/${threadId}`, { status: 'declined' })
  return <ActionButton label="終了する" action={action} />
}

export function LeaseCancelButton({ leaseId }: { leaseId: string }) {
  const action = useAction(`/api/leases/${leaseId}`, { status: 'cancelled' })
  return <ActionButton label="取り消す" action={action} />
}

export function OrderCancelButton({ orderId }: { orderId: string }) {
  const action = useAction(`/api/orders/${orderId}`, { status: 'cancelled' })
  return <ActionButton label="取り消す" action={action} />
}
