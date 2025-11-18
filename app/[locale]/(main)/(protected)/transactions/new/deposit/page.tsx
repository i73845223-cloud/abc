import { auth } from '@/auth';
import { DepositPage } from '../components/deposit-page';
import { db } from '@/lib/db';

export default async function Page() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <DepositPage showAuthRequired />;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        surname: true,
        birth: true,
        city: true,
        email: true,
        isBlocked: true,
        isImageApproved: true,
        image: {
          select: {
            id: true,
            url: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    if (!user) {
      return <DepositPage showAuthRequired />;
    }

    const userProfile = {
      name: user.name,
      surname: user.surname,
      birth: user.birth ? user.birth.toISOString().split('T')[0] : null,
      city: user.city,
      email: user.email,
    };

    const userImage = user.image ? {
      id: user.image.id,
      userId: user.id,
      url: user.image.url,
      createdAt: user.image.createdAt,
      updatedAt: user.image.updatedAt,
    } : null;

    return (
      <DepositPage
        userProfile={userProfile}
        userImage={userImage}
        userImageStatus={user.isImageApproved}
        userId={user.id}
        isBlocked={user.isBlocked}
      />
    );
  } catch (error) {
    console.error('Error fetching user data:', error);
    return <DepositPage showAuthRequired />;
  }
}

export const dynamic = 'force-dynamic';