"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Image } from "lucide-react";

type Conversation = {
  id: string;
  topic: string;
  messages: Message[];
  lastMessageAt: string;
};

type Message = {
  text: string;
  createdAt: string;
  type: "text" | "image";
  body: string;
  image: string;
};

const ConversationsList = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get("/api/conversations");
        setConversations(response.data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false); 
      }
    };
    fetchConversations();
  }, []);

  const formatLastMessagePreview = (messages: Message[]) => {
    if (!messages || messages.length === 0) {
      return { time: null, messagePreview: "No messages yet" };
    }

    const sortedMessages = [...messages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const lastMessage = sortedMessages[0];
    const time = new Date(lastMessage.createdAt).toLocaleString();
    const messagePreview =
      lastMessage.image ? (
        <div className="flex gap-1 items-center">
          <Image width={16} height={16} /> Image
        </div>
      ) : (
        lastMessage.body
      );

    return { time, messagePreview };
  };

  return (
    <div className="mt-4 mb-[80px] md:mb-0">
      <ul className="flex flex-col gap-2">
        {loading ? (
          Array(5).fill(0).map((_, index) => (
            <li key={index} className="rounded-md px-4 py-2">
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </li>
          ))
        ) : (
          [...conversations]
            .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
            .map((conversation: Conversation) => {
              const { messagePreview } = formatLastMessagePreview(conversation.messages);

              return (
                <li key={conversation.id} className="border rounded-md px-4 py-2 hover:bg-gray-950 transition duration-300 ease-in-out">
                  <button onClick={() => router.push(`/support/${conversation.id}`)} className="flex flex-col w-full items-start">
                    <div className="flex justify-between w-full">
                      <div className="truncate max-w-[150px] sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl">{conversation.topic}</div>
                      <div className="text-sm">{format(new Date(conversation.lastMessageAt), "HH:mm dd/MM")}</div>
                    </div>
                    <div className="text-sm text-gray-500 text-start truncate max-w-[250px] sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl">{messagePreview}</div>
                  </button>
                </li>
              );
            })
        )}
      </ul>
    </div>
  );
};

export default ConversationsList;
