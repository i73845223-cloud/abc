'use client';

import { BonusTracker } from '@/components/bonus-tracker';
import { PromoCodeForm } from '@/components/promo-code-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Sparkles, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PromoPageClientProps {
  hasUsedPromoCode: boolean;
  currentPromoCode?: string;
}

export function PromoPageClient({ hasUsedPromoCode, currentPromoCode }: PromoPageClientProps) {
  const t = useTranslations('PromoCodes');

  return (
    <div className="min-h-screen sm:px-6 lg:px-8 pb-[60px] lg:pb-0">
      <div className="max-w-6xl mx-auto">
        <div className="text-center sm:mb-8 mb-4">
          <div className="flex items-center justify-center gap-3 sm:mb-4 mb-1">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
              <Gift className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400 relative z-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('title')}
            </h1>
          </div>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <div className="lg:col-span-1 xl:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">{t('enterPromoCode.title')}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {hasUsedPromoCode && currentPromoCode
                        ? t('enterPromoCode.activeCode', { code: currentPromoCode })
                        : t('enterPromoCode.claimBonus')
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PromoCodeForm 
                  hasUsedPromoCode={hasUsedPromoCode}
                  currentPromoCode={currentPromoCode}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 xl:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">{t('yourBonuses.title')}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {t('yourBonuses.description')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='sm:p-6 p-2'>
                <BonusTracker />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}