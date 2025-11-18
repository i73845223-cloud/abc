import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import UpcomingMatchesClient from './upcoming-matches-client'
import { Book as BookType } from '@/app/types/bookmaking'
import UpcomingMatchesEmpty from './upcoming-matches-empty'
import UpcomingMatchesHeader from './upcoming-matches-header'

async function getUpcomingMatches(): Promise<BookType[]> {
  try {
    const user = await currentUser()

    const now = new Date()
    
    const books = await db.book.findMany({
      where: {
        status: 'ACTIVE',
        date: { gt: now }
      },
      include: {
        teams: true,
        events: {
          include: {
            homeTeam: true,
            awayTeam: true,
            outcomes: {
              where: { result: 'PENDING' }
            }
          },
          orderBy: [
            { isFirstFastOption: 'desc' },
            { isSecondFastOption: 'desc' },
            { createdAt: 'desc' }
          ],
          take: 1
        }
      },
      orderBy: [
        { isHotEvent: 'desc' },
        { date: 'asc' }
      ],
      take: 5
    })

    if (!books || books.length === 0) return []

    return books.map(book => {
      const bookDate = new Date(book.date)
      const isUpcoming = book.status === 'ACTIVE' && now < bookDate
      
      return {
        id: book.id,
        title: book.title,
        description: book.description ?? undefined,
        category: book.category,
        status: book.status as 'ACTIVE' | 'INACTIVE' | 'COMPLETED',
        date: book.date.toISOString(),
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
        image: book.image ?? undefined,
        userId: book.userId,
        championship: book.championship ?? undefined,
        country: book.country ?? undefined,
        isHotEvent: book.isHotEvent || false,
        isNationalSport: book.isNationalSport || false,
        isLive: false,
        isUpcoming,
        isAcceptingBets: now < bookDate,
        displayStatus: 'UPCOMING',
        teams: book.teams?.map(team => ({
          id: team.id,
          name: team.name,
          image: team.image ?? undefined,
          bookId: team.bookId ?? undefined,
          createdAt: team.createdAt.toISOString(),
          updatedAt: team.updatedAt.toISOString()
        })) || [],
        events: book.events?.map(event => ({
          id: event.id,
          name: event.name,
          description: event.description ?? undefined,
          status: event.status,
          isFirstFastOption: event.isFirstFastOption || false,
          isSecondFastOption: event.isSecondFastOption || false,
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.updatedAt.toISOString(),
          bookId: event.bookId,
          homeTeamId: event.homeTeamId ?? undefined,
          awayTeamId: event.awayTeamId ?? undefined,
          homeTeam: event.homeTeam ? {
            id: event.homeTeam.id,
            name: event.homeTeam.name,
            image: event.homeTeam.image ?? undefined,
            bookId: event.homeTeam.bookId ?? undefined,
            createdAt: event.homeTeam.createdAt.toISOString(),
            updatedAt: event.homeTeam.updatedAt.toISOString()
          } : undefined,
          awayTeam: event.awayTeam ? {
            id: event.awayTeam.id,
            name: event.awayTeam.name,
            image: event.awayTeam.image ?? undefined,
            bookId: event.awayTeam.bookId ?? undefined,
            createdAt: event.awayTeam.createdAt.toISOString(),
            updatedAt: event.awayTeam.updatedAt.toISOString()
          } : undefined,
          outcomes: event.outcomes?.map(outcome => ({
            id: outcome.id,
            name: outcome.name,
            odds: outcome.odds,
            probability: outcome.probability,
            stake: outcome.stake,
            result: (outcome.result === 'WIN' ? 'WON' : 
                    outcome.result === 'LOSE' ? 'LOST' : 
                    outcome.result) as 'PENDING' | 'WON' | 'LOST' | 'VOID',
            order: outcome.order || 0,
            createdAt: outcome.createdAt.toISOString(),
            updatedAt: outcome.updatedAt.toISOString(),
            eventId: outcome.eventId
          })) || []
        })) || []
      }
    })
  } catch (error) {
    console.error('Error fetching upcoming matches:', error)
    return []
  }
}

export default async function UpcomingMatches() {
  const upcomingMatches = await getUpcomingMatches()

  if (!upcomingMatches || upcomingMatches.length === 0) {
    return <UpcomingMatchesEmpty />
  }

  return (
    <div className="mt-5 space-y-2">
      <UpcomingMatchesHeader />
      <UpcomingMatchesClient books={upcomingMatches} />
    </div>
  )
}