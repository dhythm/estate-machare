'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

/** The agreed agent reports that the machine is loaded and on its way. */
export function StartIntroductionButton({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const start = async () => {
    setBusy(true)
    setError(undefined)
    try {
      const response = await fetch(`/api/transport/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: '運搬中' }),
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

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={() => void start()}
      >
        運搬を開始
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  )
}
