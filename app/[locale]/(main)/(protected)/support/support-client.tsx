"use client";

import * as z from "zod";
import { Button } from "@/components/ui/button";
import { PlusIcon, Mail, MailOpen, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';

const formSchema = z.object({
  topic: z
    .string()
    .min(1, "Topic is required")
    .max(1000, "Topic must not exceed 1000 characters"),
});

type ChatValues = z.infer<typeof formSchema>;

interface SupportClientProps {
  initialConversations: any[];
  currentUserId?: string;
  isChatBlocked?: boolean;
}

const SupportClient = ({ initialConversations, currentUserId, isChatBlocked }: SupportClientProps) => {
    const router = useRouter();
    const [isOtherOptionSelected, setIsOtherOptionSelected] = useState(false);
    const [customTopic, setCustomTopic] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("");
    const [conversations, setConversations] = useState(initialConversations);
    const [refreshing, setRefreshing] = useState(false);
    const t = useTranslations('Support');

    const getUnreadMessagesCount = (messages: any[]) => {
      if (!messages || !currentUserId) return 0;
      
      return messages.filter(message => 
        message.userId !== currentUserId &&
        !message.isReadByUser
      ).length;
    };

    const getTotalUnreadCount = () => {
      if (!conversations || !currentUserId) return 0;
      
      return conversations.reduce((total, conversation) => {
        return total + getUnreadMessagesCount(conversation.messages || []);
      }, 0);
    };

    const refreshConversations = async () => {
        try {
            setRefreshing(true);
            const response = await fetch('/api/conversations');
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Error refreshing conversations:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const onCreate = async (data: ChatValues) => {
        try {
            const response = await axios.post(`/api/conversations`, data);
            const createdChat = response.data;
            
            router.refresh();
            router.push(`/support/${createdChat.id}`);
        } catch (error) {
            console.error("Error creating chat:", error);
        }
    };

    const onSubmit = (data: ChatValues) => {
        const topic = isOtherOptionSelected && customTopic.length > 0 ? customTopic : selectedTopic;
        if (topic) {
            onCreate({ topic });
        } else {
            console.error("Topic is required");
        }
    };

    const handleSelectChange = (value: string) => {
        setIsOtherOptionSelected(value === "other");
        if (value === "other") {
            setCustomTopic("");
        }
        setSelectedTopic(value);
    };

    const handleCustomTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomTopic(e.target.value);
    };

    const isSubmitEnabled = (
        (!isOtherOptionSelected && selectedTopic.length > 0) ||
        (isOtherOptionSelected && customTopic.length > 3)
    );

    const totalUnreadCount = getTotalUnreadCount();

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                refreshConversations();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return (
        <>
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <Dialog>
                        {isChatBlocked ? (
                            <button
                                className="py-3 px-5 bg-primary text-primary-foreground shadow inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium opacity-50"
                                disabled
                            >
                                <PlusIcon className="mr-2 h-4 w-4" />
                                {t('newChat')}
                            </button>
                        ) : (
                            <DialogTrigger asChild>
                            <button
                                className="py-3 px-5 bg-primary text-primary-foreground shadow hover:bg-primary/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <PlusIcon className="mr-2 h-4 w-4" />
                                {t('newChat')}
                            </button>
                            </DialogTrigger>
                        )}
                        <DialogContent className="bg-black">
                            <DialogHeader className="text-xl"><DialogTitle>{t('startNewChat')}</DialogTitle></DialogHeader>
                            <form onSubmit={(e) => { e.preventDefault(); onSubmit({ topic: selectedTopic }); }}>
                                <div>
                                    <label htmlFor="topic">{t('topic')}</label>
                                    <Select onValueChange={handleSelectChange}>
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder={t('selectTopic')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem className="cursor-pointer hover:bg-gray-900 transition duration-300 ease-in-out" value="Deposit">{t('topics.deposit')}</SelectItem>
                                            <SelectItem className="cursor-pointer hover:bg-gray-900 transition duration-300 ease-in-out" value="Withdrawal">{t('topics.withdrawal')}</SelectItem>
                                            <SelectItem className="cursor-pointer hover:bg-gray-900 transition duration-300 ease-in-out" value="Technical">{t('topics.technical')}</SelectItem>
                                            <SelectItem className="cursor-pointer hover:bg-gray-900 transition duration-300 ease-in-out" value="Offer">{t('topics.offer')}</SelectItem>
                                            <SelectItem className="cursor-pointer hover:bg-gray-900 transition duration-300 ease-in-out" value="Other">{t('topics.other')}</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {isOtherOptionSelected && (
                                        <div className="mt-2">
                                            <label htmlFor="customTopic" className="text-sm">{t('writeTopic')}</label>
                                            <Input
                                                id="customTopic"
                                                value={customTopic}
                                                onChange={handleCustomTopicChange}
                                                placeholder={t('enterCustomTopic')}
                                                minLength={1}
                                                maxLength={1000}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="mt-4">
                                    <Button type="submit" variant="default" className="px-8 py-4 text-lg" disabled={!isSubmitEnabled}>{t('start')}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {totalUnreadCount > 0 && (
                    <Badge variant="destructive" className="animate-pulse">
                        <Mail className="h-3 w-3 mr-1" />
                        {t('unreadMessages', { count: totalUnreadCount })}
                    </Badge>
                )}
            </div>

            <ConversationsListWithUnread 
                conversations={conversations} 
                currentUserId={currentUserId} 
                onRefresh={refreshConversations}
                refreshing={refreshing}
            />
        </>
    );
};

const ConversationsListWithUnread = ({ 
    conversations, 
    currentUserId, 
    onRefresh,
    refreshing 
}: { 
    conversations: any[], 
    currentUserId?: string,
    onRefresh?: () => void,
    refreshing?: boolean
}) => {
  const router = useRouter();
  const t = useTranslations('Support');

  const getUnreadMessagesCount = (messages: any[]) => {
    if (!messages || !currentUserId) return 0;
    
    return messages.filter(message => 
      message.userId !== currentUserId && 
      !message.isReadByUser
    ).length;
  };

  const hasUnreadMessages = (messages: any[]) => {
    return getUnreadMessagesCount(messages) > 0;
  };

  const getLastMessagePreview = (messages: any[]) => {
    if (!messages || messages.length === 0) return t('noMessages');
    const lastMessage = messages[0];
    return lastMessage.body?.length > 100 
      ? lastMessage.body.substring(0, 100) + "..." 
      : lastMessage.body || t('noMessageContent');
  };

  const handleConversationClick = (conversationId: string) => {
    if (onRefresh) {
        sessionStorage.setItem('shouldRefreshConversations', 'true');
    }
    router.push(`/support/${conversationId}`);
  };

  useEffect(() => {
    const shouldRefresh = sessionStorage.getItem('shouldRefreshConversations');
    if (shouldRefresh === 'true' && onRefresh) {
        setTimeout(() => {
            onRefresh();
            sessionStorage.removeItem('shouldRefreshConversations');
        }, 500);
    }
  }, [onRefresh]);

  if (refreshing) {
    return <div className="text-gray-600 flex items-center gap-2 px-4"><RefreshCw className="h-4 w-4 animate-spin" /> {t('refreshing')}</div>;
  }

  if (!conversations || conversations.length === 0) {
    return <div className="text-gray-600">{t('noConversations')}</div>;
  }

  return (
    <div className="space-y-3 px-2 pb-[60px] lg:pb-0">
      {conversations.map((conversation) => {
        const unreadCount = getUnreadMessagesCount(conversation.messages || []);
        const hasUnread = hasUnreadMessages(conversation.messages || []);
        const lastMessage = getLastMessagePreview(conversation.messages || []);

        return (
          <div
            key={conversation.id}
            className="p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-950"
            onClick={() => handleConversationClick(conversation.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    {conversation.topic || t('untitledConversation')}
                  </h3>
                  {hasUnread && (
                    <Badge variant="destructive" className="animate-pulse">
                      <Mail className="h-3 w-3 mr-1" />
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-sm mt-1 text-gray-300">
                  {lastMessage}
                </p>
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
                {new Date(conversation.lastMessageAt || conversation.updatedAt).toLocaleDateString([], {
                  timeZone: 'Asia/Kolkata',
                  month: '2-digit',
                  day: '2-digit'
                })}
                <br />
                {new Date(conversation.lastMessageAt || conversation.updatedAt).toLocaleTimeString([], { 
                  timeZone: 'Asia/Kolkata',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SupportClient;