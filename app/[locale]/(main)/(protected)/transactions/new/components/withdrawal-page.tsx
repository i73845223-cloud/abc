'use client';

import { ImageUploadWrapper } from '../../../_components/image-upload-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, Upload, User, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { WithdrawalForm } from './withdrawal-form';
import { useRouter } from 'next/navigation';

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

interface WithdrawalPageProps {
  showAuthRequired?: boolean;
  userImage?: UserImageType | null;
  userImageStatus?: string;
  userId?: string;
  userProfile?: UserProfileType;
  isBlocked?: boolean;
}

export function WithdrawalPage({
  showAuthRequired,
  userImage,
  userImageStatus,
  userId,
  userProfile,
  isBlocked = false
}: WithdrawalPageProps) {
  const router = useRouter();
  const t = useTranslations('Withdrawal');

  if (showAuthRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('authRequired')}</CardTitle>
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

  const isProfileComplete = userProfile?.name && 
                           userProfile?.surname && 
                           userProfile?.birth && 
                           userProfile?.city && 
                           userProfile?.email &&
                           userProfile.name.trim() !== '' &&
                           userProfile.surname.trim() !== '' &&
                           userProfile.birth.trim() !== '' &&
                           userProfile.city.trim() !== '' &&
                           userProfile.email.trim() !== '';

  const isImageApproved = userImageStatus === 'success';

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

  if (!isProfileComplete) {
    const missingFields = [];
    if (!userProfile?.name || userProfile.name.trim() === '') missingFields.push(t('name'));
    if (!userProfile?.surname || userProfile.surname.trim() === '') missingFields.push(t('surname'));
    if (!userProfile?.birth || userProfile.birth.trim() === '') missingFields.push(t('birthDate'));
    if (!userProfile?.city || userProfile.city.trim() === '') missingFields.push(t('city'));
    if (!userProfile?.email || userProfile.email.trim() === '') missingFields.push(t('email'));

    return (
      <div className="container max-w-2xl pb-[60px] lg:pb-0">
        <Button onClick={() => router.back()} variant="ghost" className="lg:mb-6 mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToTransactions')}
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">{t('profileIncomplete')}</CardTitle>
            <CardDescription className="text-lg">
              {t('completeProfileToWithdraw')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('missingFields')}: {missingFields.join(', ')}
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <Button asChild size="lg">
                <Link href="/settings">
                  <User className="h-4 w-4 mr-2" />
                  {t('completeProfile')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userImage || !isImageApproved) {
    if (userImage && userImageStatus === 'pending') {
      return (
      <div className="container max-w-2xl pb-[60px] lg:pb-0">
        <Button onClick={() => router.back()} variant="ghost" className="lg:mb-6 mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToTransactions')}
        </Button>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">{t('verificationInProgress')}</CardTitle>
              <CardDescription className="text-lg">
                {t('documentsUnderReview')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                {t('approvalTime')}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-yellow-600">
                <Clock className="h-4 w-4" />
                <span>{t('statusPending')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="container max-w-2xl pb-[60px] lg:pb-0">
        <Button onClick={() => router.back()} variant="ghost" className="lg:mb-6 mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToTransactions')}
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">{t('verificationRequired')}</CardTitle>
            <CardDescription className="text-lg">
              {userImageStatus === 'rejected' 
                ? t('verificationRejected') 
                : t('verifyIdentityToWithdraw')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant={userImageStatus === 'rejected' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {userImageStatus === 'rejected' 
                  ? t('verificationRejectedInstructions')
                  : t('verificationInstructions')}
              </AlertDescription>
            </Alert>
            <div className="text-center flex justify-center">
              <ImageUploadWrapper 
                userImage={userImage} 
                userId={userId} 
                userImageStatus={userImageStatus}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl pb-[60px] lg:pb-0 px-1">
      <Button onClick={() => router.back()} variant="ghost" className="lg:mb-6 mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('backToTransactions')}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('createWithdrawal')}</CardTitle>
          <CardDescription>
            {t('withdrawalDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WithdrawalForm />
        </CardContent>
      </Card>
    </div>
  );
}