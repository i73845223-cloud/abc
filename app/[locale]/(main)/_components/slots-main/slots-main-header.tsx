'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function SlotsHeader() {
  const t = useTranslations('Slots')

  return (
    <div className="flex flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight ml-3">{t('slotGames')}</h2>
      </div>
      
      <Link href="/slots" className="w-auto">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center text-gray-400">
          {t('viewAll')}
          <ArrowRight className="h-4 w-4" />
        </div>
      </Link>
    </div>
  )
}