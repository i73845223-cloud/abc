import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export default async function getConversations() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return [];
    }

    const conversations = await db.conversation.findMany({
      where: {
        userId: user.id, // Only get conversations for the current user
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            body: true,
            createdAt: true,
            isReadByAdmin: true,
            isReadByUser: true,
            userId: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    return conversations;
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}