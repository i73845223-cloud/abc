"use client";

import { useSupportUnread } from '@/hooks/use-support-unread';

export function SupportNotificationIndicator() {
  const { unreadCount, isLoading } = useSupportUnread();

  if (isLoading || unreadCount === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="absolute">
        <div className="relative">
          <div className="h-2 w-2 bg-red-500 rounded-full animate-ping absolute" />
          <div className="h-2 w-2 bg-red-600 rounded-full relative" />
        </div>
      </div>
      
      {unreadCount > 1 && (
        <div className="absolute">
          <div className="h-3 w-3 bg-red-600 text-white text-[8px] rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        </div>
      )}
    </div>
  );
}