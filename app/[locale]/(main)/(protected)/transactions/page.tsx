import { currentUser } from '@/lib/auth';
import { ImageUploadWrapper } from '../_components/image-upload-wrapper';
import { TransactionsPageClient } from './components/transactions-page-client';
import { TransactionsServerWrapper } from './components/transactions-server-wrapper';

const TransactionsPage = async () => {
  const user = await currentUser();
  const userId = user?.id;
  const isBlocked = user?.isBlocked ?? false;

  let userImage = null;
  userImage = user?.image as any;

  if (!user) {
    return <TransactionsPageClient showAuthRequired isBlocked={false} />;
  }

  // if (user?.isImageApproved === "pending") {
  //   return <TransactionsPageClient showVerificationPending isBlocked={isBlocked} />;
  // }

  // if (user?.isImageApproved !== "success") {
  //   return (
  //     <TransactionsPageClient 
  //       showVerificationRequired 
  //       userImage={userImage}
  //       userId={user.id}
  //       isBlocked={isBlocked}
  //     />
  //   );
  // }

  return <TransactionsServerWrapper userId={userId} isBlocked={isBlocked} />;
};

export default TransactionsPage;