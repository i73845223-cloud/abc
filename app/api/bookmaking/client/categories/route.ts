import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();

    const books = await db.book.findMany({
      where: {
        status: 'ACTIVE',
        date: { gt: now },
      },
      select: { category: true },
      distinct: ['category'],
    });

    const categories = books.map((book) => book.category.toLowerCase());

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}