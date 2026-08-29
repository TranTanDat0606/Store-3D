import { useState } from 'react'
import { Copy, Check, Gift } from 'lucide-react'
import { formatDateTime } from '@/lib'
import type { GameReward } from '@/services/rewardApi'

interface RewardCouponCardProps {
  reward: GameReward
}

export function RewardCouponCard({ reward }: RewardCouponCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reward.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // silent fail
    }
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-6 text-center dark:border-emerald-700 dark:bg-emerald-950/50">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
        <Gift className="size-6 text-emerald-600" />
      </div>
      <p className="text-sm text-muted-foreground">Bạn nhận được</p>
      <p className="mt-1 text-3xl font-bold text-emerald-600">{reward.discount}% GIẢM</p>
      <p className="mt-1 text-xs text-muted-foreground">
        HSD: {formatDateTime(reward.expiresAt)}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
      >
        {copied ? (
          <>
            <Check className="size-4" />
            Đã sao chép
          </>
        ) : (
          <>
            <Copy className="size-4" />
            Sao chép mã: {reward.code}
          </>
        )}
      </button>
    </div>
  )
}
