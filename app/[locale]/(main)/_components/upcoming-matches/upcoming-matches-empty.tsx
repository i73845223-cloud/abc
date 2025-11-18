'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock } from 'lucide-react'

export default function UpcomingMatchesEmpty() {
  const t = useTranslations('Home')
  
  return (
    <div className="mt-8">
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-muted/20 rounded-lg border border-border">
        <div className="p-3 bg-muted rounded-full mb-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t('noUpcomingMatches')}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {t('noMatchesDescription')}
        </p>
        <Link href="/book">
          <Button variant="outline" className="flex items-center gap-2">
            {t('browseAllEvents')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}