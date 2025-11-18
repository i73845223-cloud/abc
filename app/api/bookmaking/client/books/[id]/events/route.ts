import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = params

    const events = await db.event.findMany({
      where: {
        bookId: id,
        status: { in: ['UPCOMING', 'LIVE'] }
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        outcomes: {
          where: {
            result: 'PENDING'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.log('[BOOK_EVENTS_GET]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}