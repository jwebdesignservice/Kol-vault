'use client'

import { useState } from 'react'
import { Textarea, Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'

interface ApplyModalProps {
  dealId: string
  dealTitle: string
  onSubmit: (dealId: string) => void
  onCancel: () => void
}

export function ApplyModal({ dealId, dealTitle, onSubmit, onCancel }: ApplyModalProps) {
  const { addToast } = useToast()
  const [pitch, setPitch] = useState('')
  const [proposedRate, setProposedRate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const MIN_CHARS = 50
  const remaining = MIN_CHARS - pitch.length

  const handleSubmit = async () => {
    if (pitch.length < MIN_CHARS) {
      addToast('error', `Pitch must be at least ${MIN_CHARS} characters.`)
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    addToast('success', `Application submitted for "${dealTitle}"`)
    onSubmit(dealId)
    setSubmitting(false)
  }

  return (
    <div className="bg-bg border border-border border-t-2 border-t-accent p-6">
      <div className="max-w-2xl">
        <h3 className="text-[11px] tracking-widest uppercase text-text-muted mb-4">
          Apply · {dealTitle}
        </h3>
        <div className="flex flex-col gap-4">
          <div>
            <Textarea
              label="Your Pitch"
              placeholder="Describe why you're the right KOL for this deal, your audience, and how you'll hit the KPI targets..."
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              rows={5}
            />
            <div className="flex justify-end mt-1">
              <span className={`mono text-[11px] ${remaining > 0 ? 'text-text-muted' : 'positive'}`}>
                {pitch.length} / {MIN_CHARS} min chars
              </span>
            </div>
          </div>
          <Input
            label="Proposed Rate (USDC) — Optional"
            type="number"
            placeholder="Leave blank to use deal budget"
            value={proposedRate}
            onChange={(e) => setProposedRate(e.target.value)}
            prefix="$"
          />
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting || pitch.length < MIN_CHARS}
            >
              {submitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              CANCEL
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
