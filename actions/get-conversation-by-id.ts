import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

const getConversationById = async (conversationId: string) => {
    try {
        const user = await currentUser();
        if (!user?.id) {
            return null
        }
        
        const conversation = await db.conversation.findUnique({
            where: {
                id: conversationId
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
            }
        });

        return conversation
    } catch (error: any) {
        console.error('Error fetching conversation:', error);
        return null
    }
}

export default getConversationById