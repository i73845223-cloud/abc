"use client";

import { useEffect } from "react";

interface MarkAsReadUserProps {
    conversationId: string;
}

const MarkAsReadUser = ({ conversationId }: MarkAsReadUserProps) => {
    useEffect(() => {
        const markMessagesAsRead = async () => {
            try {
                
                const response = await fetch(`/api/conversations/read?conversationId=${conversationId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.log('MarkAsReadUser: Error response:', errorText);
                    throw new Error(`Failed to mark messages as read: ${response.status} - ${errorText}`);
                }

                const result = await response.json();
                
            } catch (error) {
                console.error('MarkAsReadUser: Error marking messages as read:', error);
            }
        };

        markMessagesAsRead();
    }, [conversationId]);

    return null;
};

export default MarkAsReadUser;