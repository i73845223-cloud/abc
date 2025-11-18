'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { ArrowRight } from 'lucide-react'
import BettingSlipWrapper from '@/components/bookmaking/betting-slip-wrapper'
import { Book, Event, Outcome } from '@/app/types/bookmaking'
import { useTranslations } from 'next-intl'

interface SelectedOutcome {
  id: string
  name: string
  odds: number
  eventName: string
  bookTitle: string
}

interface UpcomingMatchesClientProps {
  books: Book[]
}

export default function UpcomingMatchesClient({ books = [] }: UpcomingMatchesClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedOutcome, setSelectedOutcome] = useState<SelectedOutcome | null>(null)
  const [isSlipOpen, setIsSlipOpen] = useState(false)
  const t = useTranslations('Home')

  const handleOutcomeClick = (outcome: Outcome, event: Event, book: Book) => {
    if (!session) {
      router.push(`/login?callbackUrl=/book/${book.id}`)
      return
    }

    const now = new Date()
    const bookDate = new Date(book.date)
    
    if (now >= bookDate) {
      alert(t('betsClosed'))
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
    router.refresh()
  }

  if (!books || books.length === 0) {
    return null
  }

  return (
    <>
      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full group/carousel"
        >
          <CarouselContent className="-ml-2">
            {books.map((book) => (
              <CarouselItem key={book.id} className="pl-1 md:pl-2 basis-4/5 sm:basis-1/2 lg:basis-1/3">
                <MatchCard 
                  book={book} 
                  onOutcomeClick={handleOutcomeClick}
                  isUserLoggedIn={!!session}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          
          <CarouselPrevious className="absolute left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:disabled:opacity-0 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm border-2 disabled:opacity-0" />
          <CarouselNext className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:disabled:opacity-0 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm border-2 disabled:opacity-0" />
        </Carousel>
      </div>

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

interface MatchCardProps {
  book: Book
  onOutcomeClick: (outcome: Outcome, event: Event, book: Book) => void
  isUserLoggedIn: boolean
}

function MatchCard({ book, onOutcomeClick, isUserLoggedIn }: MatchCardProps) {
  const t = useTranslations('Home')
  const mainTeams = book.teams?.slice(0, 2) || []
  const firstEvent = book.events?.[0]
  const displayCategory = book.category?.charAt(0).toUpperCase() + book.category?.slice(1).toLowerCase() || ''
  const now = new Date()
  const bookDate = new Date(book.date)
  const isAcceptingBets = now < bookDate

  const handleOutcomeClickWrapper = (outcome: Outcome, event: Event, book: Book) => {
    if (!isUserLoggedIn) {
      return
    }
    onOutcomeClick(outcome, event, book)
  }

  return (
    <div className="h-full">
      <div className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer bg-card border-border group mx-1 rounded-lg border">
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex gap-2 min-w-0">
              <h3 className="font-semibold text-sm truncate text-foreground mb-1 group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              <Badge variant="secondary" className="text-xs bg-muted px-2 py-0">
                {displayCategory}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 mb-3 flex-1">
            {mainTeams.map((team) => (
              <div key={team.id} className="flex items-center gap-2">
                {team.image && (
                  <img 
                    src={team.image} 
                    alt={team.name}
                    className="w-6 h-6 rounded-full object-cover border border-border shrink-0"
                  />
                )}
                <span className="text-sm font-medium text-foreground truncate flex-1">
                  {team.name}
                </span>
              </div>
            ))}
            {book.teams && book.teams.length > 2 && (
              <Badge variant="outline" className="text-xs bg-muted w-fit px-2 py-0">
                {t('moreTeams', { count: book.teams.length - 2 })}
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground mb-3">
            {bookDate.toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </div>

          {firstEvent && firstEvent.outcomes && firstEvent.outcomes.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground truncate">
                {firstEvent.name}
              </div>
              <div className="sm:grid grid-cols-2 gap-2 flex flex-col">
                {firstEvent.outcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    className={`flex items-center justify-between p-2 bg-background rounded-lg border border-border transition-all duration-200 group/outcome ${
                      isAcceptingBets && isUserLoggedIn
                        ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/30' 
                        : isAcceptingBets && !isUserLoggedIn
                        ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/30'
                        : 'cursor-not-allowed opacity-60'
                    }`}
                    onClick={() => {
                      if (!isAcceptingBets) return
                      
                      if (!isUserLoggedIn) {
                        onOutcomeClick(outcome, firstEvent, book)
                        return
                      }
                      
                      handleOutcomeClickWrapper(outcome, firstEvent, book)
                    }}
                  >
                    <span className={`text-xs font-medium truncate mr-2 flex-1 ${
                      isAcceptingBets ? 'group-hover/outcome:text-primary' : ''
                    }`}>
                      {outcome.name}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs shrink-0 min-w-12 text-center ${
                        isAcceptingBets 
                          ? 'bg-primary/20 group-hover/outcome:bg-primary/30' 
                          : 'bg-muted'
                      }`}
                    >
                      {outcome.odds.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
              {!isAcceptingBets && (
                <div className="text-xs text-muted-foreground text-center">
                  {t('betsClosed')}
                </div>
              )}
            </div>
          )}

          <Link href={`/book/${book.id}`} className="w-full mt-3">
            <Button size="sm" variant="outline" className="w-full text-xs h-8">
              {t('viewAllOptions')}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}