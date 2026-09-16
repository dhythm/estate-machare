'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function CloseRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const complete = async () => {
    setBusy(true)
    setError(undefined)
    try {
      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: '成約' }),
      })
      if (!response.ok) {
        setError('更新できませんでした。')
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
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => void complete()}
      >
        成約にする
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
