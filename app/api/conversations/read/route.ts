import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      console.log('No user ID found - unauthorized');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      console.log('No conversationId found in search params');
      return new NextResponse("Conversation id is required", { status: 400 });
    }

    const existingMessages = await db.message.findMany({
      where: {
        conversatioId: conversationId,
      },
      select: {
        id: true,
        userId: true,
        isReadByUser: true,
        body: true,
      }
    });

    const updatedMessages = await db.message.updateMany({
      where: {
        conversatioId: conversationId,
        userId: { not: user.id },
        isReadByUser: false
      },
      data: {
        isReadByUser: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      updatedCount: updatedMessages.count,
      existingMessagesCount: existingMessages.length
    });
  } catch (error) {
    console.log('[MARK_MESSAGES_READ_BY_USER] ERROR:', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}