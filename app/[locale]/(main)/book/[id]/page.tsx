import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { Book } from '@/app/types/bookmaking'
import BookHeader from './components/book-header'
import BookTabs from './components/book-tabs'
import EventsTab from './components/events-tab'
import MyBetsTab from './components/my-bets-tab'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  params: { id: string }
}

interface UserBet {
  id: string
  amount: number
  potentialWin: number
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'CANCELLED'
  odds: number
  createdAt: Date
  settledAt?: Date | null
  outcome: {
    name: string
    id: string
  }
  event: {
    name: string
    id: string
  }
  book?: {
    id: string
    title: string
    date: Date
    category: string
    status: string
    isLive?: boolean
    isUpcoming?: boolean
    displayStatus?: string
  }
}

async function getBookData(bookId: string) {
  const book = await db.book.findUnique({
    where: { 
      id: bookId,
      status: 'ACTIVE'
    },
    include: {
      teams: true,
      events: {
        where: {
          status: {
            in: ['UPCOMING', 'LIVE']
          }
        },
        include: {
          outcomes: {
            where: {
              result: 'PENDING'
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
          homeTeam: true,
          awayTeam: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  })

  if (!book) {
    return null
  }

  const now = new Date()
  const bookDate = new Date(book.date)
  const isLive = book.status === 'ACTIVE' && now >= bookDate
  const isUpcoming = book.status === 'ACTIVE' && now < bookDate
  const isAcceptingBets = book.status === 'ACTIVE' && now < bookDate

  return {
    ...book,
    date: book.date.toISOString(),
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
    isLive,
    isUpcoming,
    isAcceptingBets,
    displayStatus: book.status === 'ACTIVE' 
      ? (now >= bookDate ? 'LIVE' : 'UPCOMING')
      : book.status,
    teams: book.teams.map(team => ({
      ...team,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString()
    })),
    events: book.events.map(event => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      homeTeam: event.homeTeam ? {
        ...event.homeTeam,
        createdAt: event.homeTeam.createdAt.toISOString(),
        updatedAt: event.homeTeam.updatedAt.toISOString()
      } : null,
      awayTeam: event.awayTeam ? {
        ...event.awayTeam,
        createdAt: event.awayTeam.createdAt.toISOString(),
        updatedAt: event.awayTeam.updatedAt.toISOString()
      } : null,
      outcomes: event.outcomes.map(outcome => ({
        ...outcome,
        createdAt: outcome.createdAt.toISOString(),
        updatedAt: outcome.updatedAt.toISOString()
      }))
    }))
  } as Book & { isLive: boolean; isUpcoming: boolean; displayStatus: string }
}

async function getUserBets(bookId: string): Promise<UserBet[]> {
  const user = await currentUser()
  if (!user?.id) return []

  const bets = await db.bet.findMany({
    where: {
      userId: user.id,
      bookId
    },
    include: {
      outcome: {
        select: {
          name: true,
          id: true
        }
      },
      event: {
        select: {
          name: true,
          id: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return bets.map(bet => ({
    ...bet,
    settledAt: bet.settledAt || undefined
  }))
}

export default async function BookPage({ params }: PageProps) {
  const book = await getBookData(params.id)
  
  if (!book) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6 space-y-3 lg:space-y-6 px-4 sm:px-6 pb-[70px] lg:pb-0">
      <Suspense fallback={<BookHeaderSkeleton />}>
        <BookHeader book={book} />
      </Suspense>

      <BookTabs>
        <Suspense fallback={<EventsTabSkeleton />}>
          <EventsTabContent book={book} />
        </Suspense>
        
        <Suspense fallback={<MyBetsTabSkeleton />}>
          <MyBetsTabContent bookId={params.id} />
        </Suspense>
      </BookTabs>
    </div>
  )
}

async function EventsTabContent({ book }: { book: Book & { isLive: boolean; isUpcoming: boolean; displayStatus: string } }) {
  const user = await currentUser()
  const userBets: Array<{ outcomeId: string; amount: number }> = []

  if (user?.id) {
    const bets = await db.bet.findMany({
      where: {
        userId: user.id,
        bookId: book.id,
        status: 'PENDING'
      },
      select: {
        outcomeId: true,
        amount: true
      }
    })
    userBets.push(...bets)
  }

  return <EventsTab book={book} userBets={userBets} />
}

async function MyBetsTabContent({ bookId }: { bookId: string }) {
  const userBets = await getUserBets(bookId)
  return <MyBetsTab initialBets={userBets} bookId={bookId} />
}

function BookHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-96" />
      </div>
    </div>
  )
}

function EventsTabSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MyBetsTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="rounded-md border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}