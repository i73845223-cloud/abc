'use client'

import { Book } from '@/app/types/bookmaking'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trophy } from 'lucide-react'
import { formatter } from '@/lib/utils'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BettingSlipWrapper from '@/components/bookmaking/betting-slip-wrapper'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface EventsTabProps {
  book: Book & { isLive: boolean; isUpcoming: boolean }
  userBets: Array<{ outcomeId: string; amount: number }>
}

interface SelectedOutcome {
  id: string
  name: string
  odds: number
  eventName: string
  bookTitle: string
}

interface EventOutcome {
  id: string
  name: string
  odds: number
  result: 'PENDING' | 'WON' | 'LOST' | 'VOID'
  order: number
  eventId: string
  createdAt: string
  updatedAt: string
  probability: number
  stake: number
  userStake?: number
}

interface EventTeam {
  id: string
  name: string
  image?: string | null
  bookId?: string | null
  createdAt: string
  updatedAt: string
}

interface Event {
  id: string
  name: string
  description?: string | null
  status: string
  isFirstFastOption: boolean
  isSecondFastOption: boolean
  bookId: string
  homeTeam?: EventTeam | null
  awayTeam?: EventTeam | null
  homeTeamId?: string | null
  awayTeamId?: string | null
  createdAt: string
  updatedAt: string
  outcomes: EventOutcome[]
}

interface EventWithUserStake extends Omit<Event, 'outcomes'> {
  outcomes: (EventOutcome & { userStake: number })[]
}

export default function EventsTab({ book, userBets }: EventsTabProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedOutcome, setSelectedOutcome] = useState<SelectedOutcome | null>(null)
  const [isSlipOpen, setIsSlipOpen] = useState(false)
  const t = useTranslations('Book')

  const handleOutcomeClick = (outcome: EventOutcome & { userStake: number }, event: EventWithUserStake) => {
    if (!session) {
      router.push(`/login?callbackUrl=/book/${book.id}`)
      return
    }

    if (!book.isUpcoming) {
      toast.error(t('betsNoLongerAccepted'))
      return
    }

    setSelectedOutcome({
      id: outcome.id,
      name: outcome.name,
      odds: outcome.odds,
      eventName: event.name,
      bookTitle: book.title
    })
    setIsSlipOpen(true)
  }

  const handleBetPlaced = () => {
    setIsSlipOpen(false)
    setSelectedOutcome(null)
    window.location.reload()
  }

  const eventsWithUserStake: EventWithUserStake[] = ((book.events || []) as unknown as Event[]).map(event => ({
    ...event,
    outcomes: (event.outcomes || []).map(outcome => ({
      ...outcome,
      userStake: userBets
        .filter(bet => bet.outcomeId === outcome.id)
        .reduce((total, bet) => total + bet.amount, 0)
    }))
  }))

  const getOutcomeGridClass = (outcomesCount: number) => {
    if (outcomesCount <= 4) {
      return "grid grid-cols-2 lg:flex lg:flex-row lg:gap-4 gap-1"
    } else {
      return "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
    }
  }

  const getTextClassName = (isUpcoming: boolean, isUserLoggedIn: boolean) => {
    if (!isUpcoming) return 'text-muted-foreground'
    if (!isUserLoggedIn) return 'text-foreground group-hover:text-primary'
    return 'text-foreground group-hover:text-primary'
  }

  const getOddsClassName = (isUpcoming: boolean, isUserLoggedIn: boolean) => {
    if (!isUpcoming) return 'text-muted-foreground bg-muted'
    if (!isUserLoggedIn) return 'text-primary bg-primary/10'
    return 'text-primary bg-primary/10'
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('eventsAndBettingOptions')}</CardTitle>
          <CardDescription>
            {book.isUpcoming 
              ? session 
                ? t('chooseEventDescription')
                : t('chooseEventLogin')
              : book.isLive 
                ? t('eventLive')
                : t('betsNoLongerAccepted')
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-8 p-2 lg:p-6 -mt-4 lg:mt-0">
          {eventsWithUserStake.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Trophy className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">{t('noActiveEvents')}</p>
            </div>
          ) : (
            eventsWithUserStake.map((event, index) => (
              <div key={event.id} className="space-y-4">
                {index > 0 && <Separator />}
                
                <div className="space-y-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                        <h3 className="font-semibold text-base sm:text-lg break-words text-center lg:text-left">{event.name}</h3>
                      </div>
                      {event.description && (
                        <p className="text-muted-foreground text-sm sm:text-base">{event.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {event.homeTeam && event.awayTeam && (
                    <div className="flex items-center justify-center gap-4 sm:gap-6 py-3 sm:py-4">
                      <div className="flex flex-col items-center gap-2">
                        {event.homeTeam.image && (
                          <img 
                            src={event.homeTeam.image} 
                            alt={event.homeTeam.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-muted"
                          />
                        )}
                        <span className="font-medium text-center text-xs sm:text-sm max-w-[80px] sm:max-w-[100px] break-words">
                          {event.homeTeam.name}
                        </span>
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-muted-foreground">vs</span>
                      <div className="flex flex-col items-center gap-2">
                        {event.awayTeam.image && (
                          <img 
                            src={event.awayTeam.image} 
                            alt={event.awayTeam.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-muted"
                          />
                        )}
                        <span className="font-medium text-center text-xs sm:text-sm max-w-[80px] sm:max-w-[100px] break-words">
                          {event.awayTeam.name}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className={getOutcomeGridClass(event.outcomes.length)}>
                    {event.outcomes.map((outcome) => (
                      <Button
                        key={outcome.id}
                        variant="outline"
                        className={`h-auto py-4 sm:py-6 px-3 sm:px-4 flex flex-col items-center justify-center gap-2 transition-all duration-200 group ${
                          book.isUpcoming 
                            ? 'hover:bg-primary/5 hover:border-primary/20 cursor-pointer' 
                            : 'cursor-not-allowed opacity-60'
                        } ${event.outcomes.length <= 4 ? 'lg:flex-1' : ''}`}
                        onClick={() => book.isUpcoming && handleOutcomeClick(outcome, event)}
                        disabled={!book.isUpcoming}
                      >
                        <div className={`font-semibold text-sm sm:text-base text-center break-words ${getTextClassName(book.isUpcoming, !!session)}`}>
                          {outcome.name}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className={`text-xl sm:text-2xl font-bold px-2 sm:px-3 py-1 rounded-md ${getOddsClassName(book.isUpcoming, !!session)}`}>
                            {outcome.odds.toFixed(2)}
                          </span>
                        </div>
                        {outcome.userStake > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            {t('yourStake')}: {formatter.format(outcome.userStake)}
                          </div>
                        )}
                      </Button>
                    ))}
                  </div>
                  {!book.isUpcoming && (
                    <div className="text-center text-xs sm:text-sm text-muted-foreground italic">
                      {book.isLive ? t('eventLiveBetsClosed') : t('betsNoLongerAcceptedEvent')}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <BettingSlipWrapper
        isOpen={isSlipOpen}
        onClose={() => {
          setIsSlipOpen(false)
          setSelectedOutcome(null)
        }}
        outcome={selectedOutcome}
        onBetPlaced={handleBetPlaced}
      />
    </>
  )
}