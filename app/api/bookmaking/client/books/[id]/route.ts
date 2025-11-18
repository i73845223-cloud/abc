import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = params

    const book = await db.book.findUnique({
      where: {
        id,
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
        }
      }
    })

    if (!book) {
      return new NextResponse("Book not found", { status: 404 })
    }

    return NextResponse.json(book)
  } catch (error) {
    console.log('[BOOK_GET]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}