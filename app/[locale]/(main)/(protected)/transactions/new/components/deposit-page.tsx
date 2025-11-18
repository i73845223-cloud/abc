'use client';

import { ImageUploadWrapper } from '../../../_components/image-upload-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, Upload, User, ArrowLeft, IndianRupee, CreditCard, Smartphone, QrCode } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { DepositForm } from './deposit-form';

interface UserImageType {
  id: string;
  userId: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfileType {
  name?: string | null;
  surname?: string | null;
  birth?: string | null;
  city?: string | null;
  email?: string | null;
}

interface DepositPageProps {
  showAuthRequired?: boolean;
  userImage?: UserImageType | null;
  userImageStatus?: string;
  userId?: string;
  userProfile?: UserProfileType;
  isBlocked?: boolean;
}

export function DepositPage({
  showAuthRequired,
  userImage,
  userImageStatus,
  userId,
  userProfile,
  isBlocked = false
}: DepositPageProps) {
  const router = useRouter();
  const t = useTranslations('Deposit');

  if (isBlocked) {
    return (
      <div className="container max-w-2xl pb-[60px] lg:pb-0">
        <Button onClick={() => router.back()} variant="ghost" className="lg:mb-6 mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToTransactions')}
        </Button>
        
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">{t('accountBlocked')}</CardTitle>
            <CardDescription className="text-lg">
              {t('accountBlockedDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('contactSupport')}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl pb-[60px] lg:pb-0 px-1">
      <Button onClick={() => router.back()} variant="ghost" className="lg:mb-6 mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('backToDashboard')}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <IndianRupee className="h-6 w-6" />
            {t('createDeposit')}
          </CardTitle>
          <CardDescription>
            {t('depositDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DepositForm />
        </CardContent>
      </Card>
    </div>
  );
}