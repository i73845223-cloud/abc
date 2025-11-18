'use client';

import { ImageUploadWrapper } from '../../_components/image-upload-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, Upload } from 'lucide-react';
import TransactionsList from './transactions-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface UserImageType {
  id: string;
  userId: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionsPageClientProps {
  showAuthRequired?: boolean;
  showVerificationPending?: boolean;
  showVerificationRequired?: boolean;
  showTransactions?: boolean;
  userImage?: UserImageType | null;
  userId?: string;
  isBlocked?: boolean;
}

export function TransactionsPageClient({
  showAuthRequired,
  showVerificationPending,
  showVerificationRequired,
  showTransactions,
  userImage,
  userId,
  isBlocked = false
}: TransactionsPageClientProps) {
  const t = useTranslations('Transactions');

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

  if (showVerificationPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
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

  if (showVerificationRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">{t('verificationRequired')}</CardTitle>
            <CardDescription className="text-lg">
              {t('verifyIdentity')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('verificationInstructions')}
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <ImageUploadWrapper userImage={userImage} userId={userId} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showTransactions) {
    return <TransactionsList isBlocked={isBlocked} />;
  }

  return null;
}