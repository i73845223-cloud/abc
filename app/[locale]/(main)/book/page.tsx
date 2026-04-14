import ClientBookmakingDashboard from '@/components/bookmaking/bookmaking-dashboard'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { Book, Event, Outcome, Team } from '@/app/types/bookmaking'
import { Suspense } from 'react'
import DashboardSkeleton from '@/components/bookmaking/dashboard-skeleton'

function convertBookStatus(status: any): 'ACTIVE' | 'INACTIVE' | 'COMPLETED' {
  const statusMap: { [key: string]: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' } = {
    'ACTIVE': 'ACTIVE',
    'INACTIVE': 'INACTIVE',
    'COMPLETED': 'COMPLETED',
    'SETTLED': 'COMPLETED'
  }
  return statusMap[status] || 'INACTIVE'
}

async function getBooksData(category?: string, filter?: string, search?: string) {
  try {
    const whereCondition: any = { status: 'ACTIVE' }

    if (category && category !== 'all') {
      whereCondition.category = { equals: category, mode: 'insensitive' }
    }

    if (filter === 'hot') {
      whereCondition.isHotEvent = true
    } else if (filter === 'national') {
      whereCondition.isNationalSport = true
    } else if (filter && filter !== 'all') {
      whereCondition.championship = { equals: filter, mode: 'insensitive' }
    }

    if (search && search.trim() !== '') {
      whereCondition.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          teams: {
            some: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        },
        {
          events: {
            some: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        }
      ]
    }

    const books = await db.book.findMany({
      where: whereCondition,
      include: {
        teams: true,
        events: {
          include: {
            homeTeam: true,
            awayTeam: true,
            outcomes: {
              where: { result: 'PENDING' },
              orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
            }
          },
          orderBy: [
            { isFirstFastOption: 'desc' },
            { isSecondFastOption: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      },
      orderBy: [
        { isHotEvent: 'desc' },
        { date: 'asc' }
      ]
    })

    const now = new Date()
    const serializedBooks: Book[] = books.map(book => {
      const bookDate = new Date(book.date)
      const convertedStatus = convertBookStatus(book.status)
      const isLive = convertedStatus === 'ACTIVE' && now >= bookDate
      const isUpcoming = convertedStatus === 'ACTIVE' && now < bookDate

      const serializedBook = {
        ...book,
        status: convertedStatus,
        date: book.date.toISOString(),
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
        isLive,
        isUpcoming,
        isAcceptingBets: now < bookDate,
        displayStatus: convertedStatus === 'ACTIVE'
          ? (now >= bookDate ? 'LIVE' : 'UPCOMING')
          : convertedStatus
      } as unknown as Book

      if (book.teams) {
        serializedBook.teams = book.teams.map(team => ({
          ...team,
          createdAt: team.createdAt.toISOString(),
          updatedAt: team.updatedAt.toISOString()
        } as unknown as Team))
      }

      if (book.events) {
        serializedBook.events = book.events.map(event => {
          const serializedEvent = {
            ...event,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString()
          } as unknown as Event

          if (event.homeTeam) {
            serializedEvent.homeTeam = {
              ...event.homeTeam,
              createdAt: event.homeTeam.createdAt.toISOString(),
              updatedAt: event.homeTeam.updatedAt.toISOString()
            } as unknown as Team
          }
          if (event.awayTeam) {
            serializedEvent.awayTeam = {
              ...event.awayTeam,
              createdAt: event.awayTeam.createdAt.toISOString(),
              updatedAt: event.awayTeam.updatedAt.toISOString()
            } as unknown as Team
          }
          if (event.outcomes) {
            serializedEvent.outcomes = event.outcomes.map(outcome => ({
              ...outcome,
              createdAt: outcome.createdAt.toISOString(),
              updatedAt: outcome.updatedAt.toISOString()
            } as unknown as Outcome))
          }
          return serializedEvent
        })
      }
      return serializedBook
    })

    return serializedBooks
  } catch (error) {
    console.error('Error fetching books:', error)
    return []
  }
}

async function getCategoriesData() {
  try {
    const user = await currentUser()
    if (!user?.id) return []

    const allBooks = await db.book.findMany({
      where: { status: 'ACTIVE' },
      select: { category: true }
    })
    const categories = Array.from(new Set(allBooks.map(book => book.category))).filter(Boolean)
    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

async function getChampionshipsData(category?: string) {
  try {
    const user = await currentUser()
    if (!user?.id) return []

    const whereCondition: any = {
      status: 'ACTIVE',
      championship: { not: null }
    }
    if (category && category !== 'all') {
      whereCondition.category = { equals: category, mode: 'insensitive' }
    }

    const allBooks = await db.book.findMany({
      where: whereCondition,
      select: { championship: true }
    })
    const championships = Array.from(new Set(allBooks.map(book => book.championship))).filter(Boolean) as string[]
    return championships
  } catch (error) {
    console.error('Error fetching championships:', error)
    return []
  }
}

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
  params: { category?: string }
}

export default async function BookmakingDashboard({ searchParams, params }: PageProps) {
  const filter = typeof searchParams.filter === 'string' ? searchParams.filter : undefined
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined
  const categoryParam = params.category || (typeof searchParams.category === 'string' ? searchParams.category : undefined)

  const [booksData, categories, championships] = await Promise.all([
    getBooksData(categoryParam, filter, search),
    getCategoriesData(),
    getChampionshipsData(categoryParam)
  ])

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ClientBookmakingDashboard
        initialBooks={booksData}
        initialCategories={categories}
        initialChampionships={championships}
        categoryParam={categoryParam}
        filterParam={filter}
        searchParam={search}
      />
    </Suspense>
  )
}