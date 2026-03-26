'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { SPORT_ICONS } from '@/lib/images'

export default function CricketMatchesHeader() {
  const t = useTranslations('Home')

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex items-center gap-3 ml-2">
        <Image
          src={SPORT_ICONS.cricket}
          alt="Cricket"
          width={32}
          height={32}
          className="object-contain"
        />
        <h2 className="text-2xl font-bold tracking-tight">{t('cricket')}</h2>
      </div>
      
      <Link href="/book/category/cricket" className="w-full sm:w-auto">
        <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto justify-center">
          {t('viewAll')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}