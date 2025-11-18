"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Gift, AlertCircle, Loader2, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatter } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface PromoCodeFormProps {
  hasUsedPromoCode: boolean;
  currentPromoCode?: string;
}

export function PromoCodeForm({ hasUsedPromoCode, currentPromoCode }: PromoCodeFormProps) {
  const [code, setCode] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [promoDetails, setPromoDetails] = useState<any>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const t = useTranslations('PromoCodeForm');

  const validateCode = async () => {
    if (!code.trim()) {
      setError(t('errors.enterCode'));
      return;
    }
    
    setIsLoading(true);
    setError('');
    setIsValid(null);
    setPromoDetails(null);
    
    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (response.ok) {
        setIsValid(true);
        setPromoDetails(data.promoCode);
        setError('');
      } else {
        setIsValid(false);
        setError(data.error || t('errors.invalidCode'));
        setPromoDetails(null);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setIsValid(false);
      setError(t('errors.validationFailed'));
      setPromoDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const applyCode = async () => {
    if (!isValid || !promoDetails) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/promo-codes/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (response.ok) {
        router.refresh();
      } else {
        setError(data.error || t('errors.applyFailed'));
        setIsValid(false);
      }
    } catch (error) {
      console.error('Apply error:', error);
      setError(t('errors.applyFailed'));
      setIsValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateCode();
    }
  };

  if (hasUsedPromoCode) {
    return (
      <div className="text-center space-y-4 p-4">
        <div className="flex items-center justify-center gap-2 text-green-400">
          <div className="p-2 bg-green-500/20 rounded-full">
            <CheckCircle className="h-6 w-6" />
          </div>
          <span className="font-semibold text-lg">{t('applied.title')}</span>
        </div>
        <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-2xl font-mono font-bold text-green-400">{currentPromoCode}</p>
        </div>
        <p className="text-sm text-gray-400">
          {t('applied.description')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={t('placeholders.enterCode')}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setIsValid(null);
            setError('');
          }}
          onKeyPress={handleKeyPress}
          className="uppercase flex-1 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          disabled={isLoading}
        />
        <Button 
          onClick={validateCode} 
          disabled={!code.trim() || isLoading}
          className="whitespace-nowrap min-w-20 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('buttons.validate')}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isValid && promoDetails && (
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400 mb-3">
              <div className="p-1 bg-green-500/20 rounded">
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="font-semibold">{t('valid.title')}</span>
            </div>
            <p className="text-sm text-green-300 mb-4">{promoDetails.description}</p>
            
            <div className="space-y-3 text-sm mb-4 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 font-semibold text-green-400 mb-2">
                <Sparkles className="h-4 w-4" />
                {t('valid.youllGet')}
              </div>
              
              {promoDetails.type === 'DEPOSIT_BONUS' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-green-300">{t('labels.bonusPercentage')}</span>
                    <span className="font-semibold text-white text-lg">{promoDetails.bonusPercentage}%</span>
                  </div>
                  {promoDetails.maxBonusAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-300">{t('labels.maxBonus')}</span>
                      <span className="font-semibold text-white">
                          {formatter.format(promoDetails.maxBonusAmount)}
                      </span>
                    </div>
                  )}
                  {promoDetails.minDepositAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-300">{t('labels.minDeposit')}</span>
                      <span className="font-semibold text-white">
                        {formatter.format(promoDetails.minDepositAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-green-300">{t('labels.wageringRequirement')}</span>
                    <span>{promoDetails.wageringRequirement}x</span>
                  </div>
                </>
              )}
              
              {promoDetails.type === 'FREE_SPINS' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-green-300">{t('labels.freeSpins')}</span>
                    <span className="font-semibold text-white text-lg">{promoDetails.freeSpins}</span>
                  </div>
                  {promoDetails.game && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-300">{t('labels.game')}</span>
                      <span className="font-semibold text-white">{promoDetails.game}</span>
                    </div>
                  )}
                </>
              )}
              
              {promoDetails.type === 'CASHBACK' && (
                <div className="flex justify-between items-center">
                  <span className="text-green-300">{t('labels.cashback')}</span>
                  <span className="font-semibold text-white text-lg">{promoDetails.cashbackPercentage}%</span>
                </div>
              )}
              
              {promoDetails.type === 'FREE_BET' && (
                <div className="flex justify-between items-center">
                  <span className="text-green-300">{t('labels.freeBetAmount')}</span>
                  <span className="font-semibold text-white text-lg">
                    {formatter.format(promoDetails.freeBetAmount)}
                  </span>
                </div>
              )}
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 shadow-lg"
              onClick={applyCode}
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('buttons.applying')}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  {t('buttons.claimBonus')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {isValid === false && !error && (
        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-red-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="h-5 w-5" />
              <span>{t('invalid.title')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-500/20 rounded mt-0.5">
              <Gift className="h-3 w-3 text-blue-400" />
            </div>
            <div className="text-xs text-blue-300">
              <p className="font-medium text-white">{t('disclaimer.title')}</p>
              <p>{t('disclaimer.description')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}