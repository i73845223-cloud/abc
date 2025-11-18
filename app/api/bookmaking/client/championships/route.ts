import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const whereCondition: any = {
      status: 'ACTIVE',
      championship: { not: null }
    }

    if (category && category !== 'all') {
      whereCondition.category = {
        equals: category,
        mode: 'insensitive'
      }
    }

    const books = await db.book.findMany({
      where: whereCondition,
      select: { 
        championship: true
      },
      distinct: ['championship']
    })

    const championships = books
      .map(book => book.championship)
      .filter(Boolean) as string[]

    return NextResponse.json(championships)
  } catch (error) {
    console.error('Error fetching championships:', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}