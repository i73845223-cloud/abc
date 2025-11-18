import getConversations from "@/actions/get-conversations";
import { currentUser } from "@/lib/auth";
import SupportClient from "./support-client";

const Support = async () => {
  const user = await currentUser();
  const conversations = await getConversations();
  
  return (
    <SupportClient 
      initialConversations={conversations} 
      currentUserId={user?.id}
      isChatBlocked={user?.isChatBlocked}
    />
  );
};

export default Support;