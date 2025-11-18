'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslations, useLocale } from 'next-intl'

interface Bet {
  id: string
  amount: number
  potentialWin: number
  status: string
  odds: number
  createdAt: string
  settledAt: string | null
  outcome: {
    name: string
    result: string | null
    event: {
      name: string
      status: string
      book: {
        title: string
      }
    }
  }
}

export default function MyBets() {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations('MyBets')
  const locale = useLocale()

  useEffect(() => {
    fetchMyBets()
  }, [])

  const fetchMyBets = async () => {
    try {
      const response = await fetch('/api/bookmaking/client/my-bets')
      if (response.ok) {
        const betsData: Bet[] = await response.json()
        setBets(betsData)
      }
    } catch (error) {
      console.error('Error fetching bets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary'
      case 'WON': return 'default'
      case 'LOST': return 'destructive'
      case 'VOID': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return t('status.pending')
      case 'WON': return t('status.won')
      case 'LOST': return t('status.lost')
      case 'VOID': return t('status.void')
      default: return status.toLowerCase()
    }
  }

  const getPayoutDisplay = (bet: Bet) => {
    if (bet.status === 'WON') {
      return t('payout.won', { amount: bet.potentialWin.toFixed(2) })
    } else if (bet.status === 'LOST') {
      return t('payout.lost', { amount: bet.amount.toFixed(2) })
    } else {
      return t('payout.potential', { amount: bet.potentialWin.toFixed(2) })
    }
  }

  const getPayoutColor = (bet: Bet) => {
    if (bet.status === 'WON') return 'text-green-600'
    if (bet.status === 'LOST') return 'text-red-600'
    return 'text-foreground'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>
  }

  return (
    <div className="space-y-4">
      {bets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('noBets')}</p>
              <p className="text-sm text-muted-foreground">{t('noBetsDescription')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        bets.map((bet) => (
          <Card key={bet.id} className="bg-card">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">
                    {bet.outcome.event.book.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {bet.outcome.event.name} - {bet.outcome.name}
                  </p>
                  {bet.outcome.result && (
                    <p className="text-xs text-muted-foreground">
                      {t('result')}: {bet.outcome.result}
                    </p>
                  )}
                </div>
                <Badge variant={getStatusVariant(bet.status)}>
                  {getStatusText(bet.status)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <span className="text-muted-foreground">{t('stake')}:</span>
                  <div className="font-medium">₹{bet.amount.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('odds')}:</span>
                  <div className="font-medium">{bet.odds.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('payout')}:</span>
                  <div className={`font-medium ${getPayoutColor(bet)}`}>
                    {getPayoutDisplay(bet)}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {t('placedOn')} {formatDate(bet.createdAt)}
                {bet.settledAt && (
                  <span> • {t('settledOn')} {formatDate(bet.settledAt)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}