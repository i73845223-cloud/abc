import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const filter = searchParams.get('filter')

    const whereCondition: any = {
      status: 'ACTIVE'
    }

    if (category) {
      whereCondition.category = { equals: category, mode: 'insensitive' }
    }

    if (filter === 'hot') {
      whereCondition.isHotEvent = true
    } else if (filter && filter !== 'all') {
      whereCondition.championship = { equals: filter, mode: 'insensitive' }
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
              where: {
                result: 'PENDING'
              },
              orderBy: {
                order: 'asc'
              }
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

    const booksWithBetInfo = books.map(book => {
      const now = new Date()
      const bookDate = new Date(book.date)
      
      const isLive = book.status === 'ACTIVE' && now >= bookDate
      const isUpcoming = book.status === 'ACTIVE' && now < bookDate
      
      return {
        ...book,
        isLive,
        isUpcoming,
        isAcceptingBets: now < bookDate,
        displayStatus: book.status === 'ACTIVE' 
          ? (now >= bookDate ? 'LIVE' : 'UPCOMING')
          : book.status
      }
    })

    return NextResponse.json(booksWithBetInfo)
  } catch (error) {
    console.error('Error fetching books:', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}