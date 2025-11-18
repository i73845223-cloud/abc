import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const bets = await db.bet.findMany({
      where: {
        userId: user.id
      },
      include: {
        outcome: {
          include: {
            event: {
              include: {
                book: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(bets)
  } catch (error) {
    console.log('[MY_BETS_GET]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}