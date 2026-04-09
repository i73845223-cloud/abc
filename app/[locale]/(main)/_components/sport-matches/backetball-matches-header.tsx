'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { SPORT_ICONS } from '@/lib/images'

export default function BasketballMatchesHeader() {
  const t = useTranslations('Home')

  return (
    <div className="flex flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-3 ml-2">
        <Image
          src={SPORT_ICONS.basketball}
          alt="Basketball"
          width={32}
          height={32}
          className="object-contain"
        />
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('basketball')}</h2>
      </div>
      
      <Link href="/book/category/basketball" className="w-auto">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center text-gray-400">
          {t('viewAll')}
          <ArrowRight className="h-4 w-4" />
        </div>
      </Link>
    </div>
  )
}