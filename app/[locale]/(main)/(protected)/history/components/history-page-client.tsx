'use client';

import { ImageUploadWrapper } from '../../_components/image-upload-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SlotsListClient } from './history-list-client';
import { SlotTransactionColumn } from './columns';

interface UserImageType {
  id: string;
  userId: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HistoryPageClientProps {
  showAuthRequired?: boolean;
  showVerificationPending?: boolean;
  showVerificationRequired?: boolean;
  showHistory?: boolean;
  userImage?: UserImageType | null;
  userId?: string;
  isBlocked?: boolean;
  slotTransactions?: SlotTransactionColumn[];
}

export function HistoryPageClient({
  showAuthRequired,
  showVerificationPending,
  showVerificationRequired,
  showHistory,
  userImage,
  userId,
  isBlocked = false,
  slotTransactions = []
}: HistoryPageClientProps) {
  const t = useTranslations('SlotTransactions');

  if (showAuthRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('loginRequired')}</CardTitle>
            <CardDescription>{t('pleaseLogin')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/signin">{t('signIn')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showVerificationPending) {
    return (
      <div className="flex flex-col items-center justify-center text-center mt-[-110px] h-screen">
        <div className="p-6 shadow-md rounded-lg">
          <h2 className="text-3xl font-semibold mb-4">{t('waitForApproval')}</h2>
          <p className="text-gray-300 text-xl mb-8">
            {t('approvalTime')}
          </p>
        </div>
      </div>
    );
  }

  if (showVerificationRequired) {
    return (
      <div className="flex flex-col items-center justify-center text-center mt-[-110px] h-screen">
        <div className="p-6 shadow-md rounded-lg">
          <h2 className="text-3xl font-semibold mb-4">{t('uploadPassport')}</h2>
          <p className="text-gray-300 text-xl mb-8">
            {t('uploadInstructions')}
          </p>
          <ImageUploadWrapper userImage={userImage} userId={userId} />
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <SlotsListClient 
        isBlocked={isBlocked} 
        slotTransactions={slotTransactions}
      />
    );
  }

  return null;
}