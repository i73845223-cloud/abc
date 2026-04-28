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
            loop: false,
          }}
          className="w-full group/carousel"
        >
          <CarouselContent className="-ml-2">
            {books.map((book) => (
              <CarouselItem key={book.id} className="pl-1 md:pl-2 basis-4/5 sm:basis-1/2">
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
  const router = useRouter()
  const mainTeams = book.teams?.slice(0, 2) || []
  const firstEvent = book.events?.[0]
  const sportName = book.category?.charAt(0).toUpperCase() + book.category?.slice(1).toLowerCase() || ''
  const now = new Date()
  const bookDate = new Date(book.date)
  const isAcceptingBets = now < bookDate

  const mainDisplayText = book.championship 
    ? book.championship 
    : mainTeams.length >= 2 
      ? `${mainTeams[0].name} vs ${mainTeams[1].name}`
      : book.title

  const handleOutcomeClickWrapper = (e: React.MouseEvent, outcome: Outcome, event: Event, book: Book) => {
    e.stopPropagation()
    if (!isUserLoggedIn) return
    onOutcomeClick(outcome, event, book)
  }

  const handleCardClick = () => {
    router.push(`/book/${book.id}`)
  }

  const getOutcomeLabel = (outcome: Outcome, index: number, total: number): string => {
    if (total === 3) {
      if (index === 0) return '1'
      if (index === 1) return 'X'
      return '2'
    }
    if (total === 2) {
      if (index === 0) return '1'
      return '2'
    }

    const name = outcome.name.trim()
    if (name.toLowerCase().includes('home') || name.toLowerCase().includes('team 1')) return '1'
    if (name.toLowerCase().includes('away') || name.toLowerCase().includes('team 2')) return '2'
    if (name.toLowerCase().includes('draw') || name.toLowerCase().includes('tie')) return 'X'
    return name.length > 3 ? name.slice(0, 3) : name
  }

  const outcomes = firstEvent?.outcomes || []
  const sortedOutcomes = [...outcomes].sort((a, b) => a.order - b.order)
  const gridCols = sortedOutcomes.length === 2 ? 'grid-cols-2' : sortedOutcomes.length === 3 ? 'grid-cols-3' : 'grid-cols-1'

  return (
    <div className="h-full">
      <div 
        className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer border-border group mx-1 rounded-lg border"
        onClick={handleCardClick}
      >
        <div className="h-full flex flex-col pt-2">
          <div className="pb-1 mb-3 border-b border-border px-4">
            <span className="text-xs font-medium text-muted-foreground truncate block">
              {sportName}. {mainDisplayText}
            </span>
            <span>
              
            </span>
          </div>

          <div className="space-y-2 mb-3 flex-1 px-4">
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

          <div className="text-xs text-muted-foreground mb-2 px-4">
            {bookDate.toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </div>

          {sortedOutcomes.length > 0 && (
            <div className='px-2 pb-2'>
              <div className="text-sm font-medium text-foreground truncate mb-2 text-center">
                {firstEvent.name}
              </div>
              <div className={`grid ${gridCols} gap-2`}>
                {sortedOutcomes.map((outcome, idx) => (
                  <div
                    key={outcome.id}
                    className={`flex flex-col items-center justify-center p-2 min-h-[50px] bg-background rounded-lg border border-border transition-all duration-200 group/outcome ${
                      isAcceptingBets && isUserLoggedIn
                        ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/30' 
                        : isAcceptingBets && !isUserLoggedIn
                        ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/30'
                        : 'cursor-not-allowed opacity-60'
                    }`}
                    onClick={(e) => {
                      if (!isAcceptingBets) {
                        e.stopPropagation()
                        return
                      }
                      handleOutcomeClickWrapper(e, outcome, firstEvent, book)
                    }}
                  >
                    <span className={`text-xl font-extrabold text-sky-400 ${
                      isAcceptingBets ? 'group-hover/outcome:text-sky-300' : ''
                    }`}>
                      {outcome.odds.toFixed(2)}
                    </span>
                    <span className={`text-[8px] text-center font-medium ${
                      isAcceptingBets ? 'group-hover/outcome:text-primary' : ''
                    }`}>
                      {getOutcomeLabel(outcome, idx, sortedOutcomes.length)}
                    </span>
                  </div>
                ))}
              </div>
              {!isAcceptingBets && (
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {t('betsClosed')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}