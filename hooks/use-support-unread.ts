import { useState, useEffect } from 'react';

export function useSupportUnread() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        const totalUnread = data.reduce((total: number, conversation: any) => {
          const unreadInConversation = conversation.messages?.filter((message: any) => 
            message.userId !== conversation.userId && !message.isReadByUser
          ).length || 0;
          return total + unreadInConversation;
        }, 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  return { unreadCount, isLoading };
}