'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreateDealForm } from '@/components/deals/CreateDealForm'

export default function CreateDealPage() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/deals"
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-[11px] tracking-widest uppercase"
        >
          <ArrowLeft size={14} />
          BACK TO DEALS
        </Link>
      </div>
      <h1 className="font-heading font-bold text-2xl tracking-widest text-text-primary mb-8">
        CREATE DEAL
      </h1>
      <CreateDealForm />
    </div>
  )
}
