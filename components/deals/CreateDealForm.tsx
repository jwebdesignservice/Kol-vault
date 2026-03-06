'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'

type Step = 1 | 2 | 3

interface FormData {
  title: string
  description: string
  requirements: string
  budgetUsdc: string
  kpiMetric: string
  kpiTarget: string
  kpiWindowDays: string
  deadline: string
  maxApplications: string
}

const KPI_METRICS = ['views', 'holders', 'volume', 'engagement']

export function CreateDealForm() {
  const router = useRouter()
  const { addToast } = useToast()
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    requirements: '',
    budgetUsdc: '',
    kpiMetric: 'views',
    kpiTarget: '',
    kpiWindowDays: '30',
    deadline: '',
    maxApplications: '10',
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const validateStep1 = () => {
    const e: Partial<FormData> = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.description.trim() || form.description.length < 20) e.description = 'Min 20 chars'
    if (!form.requirements.trim()) e.requirements = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e: Partial<FormData> = {}
    if (!form.budgetUsdc || Number(form.budgetUsdc) < 100) e.budgetUsdc = 'Min $100 USDC'
    if (!form.kpiTarget || Number(form.kpiTarget) < 1) e.kpiTarget = 'Required'
    if (!form.deadline) e.deadline = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep((s) => (s + 1) as Step)
  }

  const back = () => setStep((s) => (s - 1) as Step)

  const handleSubmit = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1000))
    addToast('success', 'Deal created successfully.')
    router.push('/deals')
  }

  const stepLabels = ['BASIC INFO', 'ECONOMICS', 'REVIEW']

  return (
    <div className="max-w-2xl">
      {/* Step indicator */}
      <div className="flex mb-8 gap-0">
        {stepLabels.map((label, i) => {
          const n = i + 1
          const isActive = step === n
          const isDone = step > n
          return (
            <div
              key={label}
              className="flex-1 flex flex-col gap-1"
            >
              <div
                className={[
                  'h-1 transition-colors duration-200',
                  isDone || isActive ? 'bg-accent' : 'bg-border',
                ].join(' ')}
              />
              <span
                className={[
                  'text-[10px] tracking-widest uppercase pt-1',
                  isActive ? 'text-accent' : isDone ? 'text-positive' : 'text-text-muted',
                ].join(' ')}
              >
                {n}. {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <Input
            label="Deal Title"
            placeholder="e.g. Q1 Volume Campaign"
            value={form.title}
            onChange={set('title')}
            error={errors.title}
          />
          <Textarea
            label="Description"
            placeholder="Describe the campaign goals and what you're looking for..."
            value={form.description}
            onChange={set('description')}
            rows={4}
            error={errors.description}
          />
          <Textarea
            label="Requirements"
            placeholder="Minimum follower count, content types, posting schedule..."
            value={form.requirements}
            onChange={set('requirements')}
            rows={3}
            error={errors.requirements}
          />
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <Input
            label="Budget (USDC)"
            type="number"
            placeholder="5000"
            prefix="$"
            value={form.budgetUsdc}
            onChange={set('budgetUsdc')}
            error={errors.budgetUsdc}
          />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest uppercase text-text-muted font-medium">
              KPI Metric
            </label>
            <select
              value={form.kpiMetric}
              onChange={set('kpiMetric')}
              className="bg-bg-surface border border-border text-text-primary px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
            >
              {KPI_METRICS.map((m) => (
                <option key={m} value={m} className="bg-bg-surface">
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="KPI Target"
              type="number"
              placeholder="100000"
              value={form.kpiTarget}
              onChange={set('kpiTarget')}
              error={errors.kpiTarget}
            />
            <Input
              label="Window (Days)"
              type="number"
              placeholder="30"
              value={form.kpiWindowDays}
              onChange={set('kpiWindowDays')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={set('deadline')}
              error={errors.deadline}
            />
            <Input
              label="Max Applications"
              type="number"
              placeholder="10"
              value={form.maxApplications}
              onChange={set('maxApplications')}
            />
          </div>
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="bg-bg-elevated border border-border p-6 font-mono text-sm leading-relaxed">
            <div className="text-accent mb-3 text-[11px] tracking-widest">// DEAL SUMMARY</div>
            <div className="flex flex-col gap-2">
              {[
                ['title', form.title],
                ['description', form.description],
                ['requirements', form.requirements],
                ['budget_usdc', `$${Number(form.budgetUsdc).toLocaleString()}`],
                ['kpi_metric', form.kpiMetric],
                ['kpi_target', form.kpiTarget],
                ['kpi_window_days', form.kpiWindowDays],
                ['deadline', form.deadline],
                ['max_applications', form.maxApplications],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="text-text-muted w-36 shrink-0">{k}:</span>
                  <span className="text-text-primary">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <Button variant="outline" onClick={back}>
            BACK
          </Button>
        )}
        {step < 3 ? (
          <Button variant="primary" onClick={next}>
            NEXT
          </Button>
        ) : (
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'CREATING...' : 'CREATE DEAL'}
          </Button>
        )}
      </div>
    </div>
  )
}
