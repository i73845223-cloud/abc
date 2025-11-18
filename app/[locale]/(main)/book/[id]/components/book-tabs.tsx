'use client'

import { Button } from '@/components/ui/button'
import { ReactNode, useState } from 'react'
import { useTranslations } from 'next-intl'

interface BookTabsProps {
  children: ReactNode[]
}

export default function BookTabs({ children }: BookTabsProps) {
  const t = useTranslations('Book')
  const [activeTab, setActiveTab] = useState<'events' | 'my-bets'>('events')

  return (
    <>
      <div className="flex border-b">
        <Button
          variant="ghost"
          className={`rounded-none border-b-2 ${activeTab === 'events' ? 'border-primary' : 'border-transparent'}`}
          onClick={() => setActiveTab('events')}
        >
          {t('eventsAndBetting')}
        </Button>
        <Button
          variant="ghost"
          className={`rounded-none border-b-2 ${activeTab === 'my-bets' ? 'border-primary' : 'border-transparent'}`}
          onClick={() => setActiveTab('my-bets')}
        >
          {t('myBets')}
        </Button>
      </div>

      {activeTab === 'events' ? children[0] : children[1]}
    </>
  )
}