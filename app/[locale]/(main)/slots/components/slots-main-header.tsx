'use client'

import { useTranslations } from 'next-intl'

export default function SlotsHeader() {
  const t = useTranslations('Slots')

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">{t('slotGamesDevelopedByAlt')}</h2>
      </div>
    </div>
  )
}