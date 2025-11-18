import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { BalanceCache } from '@/lib/cached-balance';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const balanceCache = BalanceCache.getInstance();
    const balance = await balanceCache.getBalance(user.id);
    
    return NextResponse.json({ balance });
  } catch (error) {
    console.error('Error calculating balance:', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}