'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Banknote, Loader2, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import Balance from '@/components/balance';
import Image from 'next/image';
import { CRYPTO_IMAGES } from '@/lib/crypto-images';

interface WithdrawalFormProps {
  userBalance: number;
  minimumWithdrawal?: number;
}

const currencyOptions = [
  { 
    value: 'usdttrc20', 
    display: 'USDT TRC20', 
    tokenImage: CRYPTO_IMAGES['tether-usdt'],
    networkImage: CRYPTO_IMAGES['tron-network']
  },
  { 
    value: 'usdterc20', 
    display: 'USDT ERC20', 
    tokenImage: CRYPTO_IMAGES['tether-usdt'],
    networkImage: CRYPTO_IMAGES['ethereum-network']
  },
  { 
    value: 'usdcerc20', 
    display: 'USDC ERC20', 
    tokenImage: CRYPTO_IMAGES['usd-coin-usdc'],
    networkImage: CRYPTO_IMAGES['ethereum-network']
  },
  { 
    value: 'usdcsol', 
    display: 'USDC SOL', 
    tokenImage: CRYPTO_IMAGES['usd-coin-usdc'],
    networkImage: CRYPTO_IMAGES['solana-network']
  },
  { 
    value: 'eth', 
    display: 'ETH', 
    tokenImage: CRYPTO_IMAGES['ethereum-eth']
  },
  { 
    value: 'btc', 
    display: 'BTC', 
    tokenImage: CRYPTO_IMAGES['bitcoin-btc']
  },
  { 
    value: 'sol', 
    display: 'SOL', 
    tokenImage: CRYPTO_IMAGES['solana-sol']
  },
  { 
    value: 'trx', 
    display: 'TRX', 
    tokenImage: CRYPTO_IMAGES['tron-trx']
  },
];

export function CryptoWithdrawalForm({ 
  userBalance, 
  minimumWithdrawal = 1000
}: WithdrawalFormProps) {
  const t = useTranslations('Withdrawal');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const withdrawalSchema = useMemo(
    () =>
      z.object({
        amountInr: z
          .string()
          .min(1, t('amountRequired'))
          .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, t('amountInvalid'))
          .refine((val) => parseFloat(val) >= minimumWithdrawal, {
            message: t('minimumAmount', { amount: minimumWithdrawal }),
          })
          .refine((val) => parseFloat(val) <= userBalance, {
            message: t('insufficientBalance'),
          }),
        currency: z.string().min(1, t('currencyRequired')),
        address: z.string().min(1, t('addressRequired')),
      }),
    [userBalance, minimumWithdrawal, t]
  );

  type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amountInr: '',
      currency: '',
      address: '',
    },
  });

  const handleAmountSuggestion = (percentage: number) => {
    const suggestedAmount = (userBalance * percentage) / 100;
    const finalAmount = Math.min(suggestedAmount, userBalance);
    form.setValue('amountInr', finalAmount.toFixed(2));
    form.trigger('amountInr');
  };

  const handleImageError = (optionValue: string, isNetwork = false) => {
    const key = isNetwork ? `${optionValue}-network` : optionValue;
    setImageErrors(prev => ({ ...prev, [key]: true }));
  };

  const onSubmit = async (data: WithdrawalFormValues) => {
    setSubmitError(null);
    const amount = parseFloat(data.amountInr);
    
    if (amount > userBalance) {
      const errorMsg = t('insufficientBalance');
      setSubmitError(errorMsg);
      toast({ variant: 'destructive', title: t('error'), description: errorMsg });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/crypto/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInr: amount,
          currency: data.currency,
          address: data.address,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Request failed');
      }

      const result = await response.json();
      setTransactionId(result.withdrawalId);
      setSuccess(true);
      form.reset();
    } catch (error) {
      console.error('Withdrawal error caught:', error);

      let errorMessage = t('contactSupport');
      if (error instanceof Error && error.message.includes('Insufficient funds')) {
        errorMessage = t('insufficientBalance');
      }

      setSubmitError(errorMessage);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">{t('withdrawalSuccess')}</CardTitle>
          <CardDescription>
            {t('withdrawalSuccessDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('transactionId')}</p>
            <p className="font-mono text-lg font-bold">{transactionId}</p>
          </div>
          <Button onClick={() => setSuccess(false)}>
            {t('newWithdrawal')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {t('availableBalance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              <Balance />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t('minimumWithdrawal')}: ₹ 1,000
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="amountInr"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold">{t('amount')}</FormLabel>
                {userBalance >= minimumWithdrawal && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    {[25, 50, 75, 100].map((percentage) => {
                      const suggestedAmount = (userBalance * percentage) / 100;
                      const isDisabled = suggestedAmount < minimumWithdrawal;
                      return (
                        <Button
                          key={percentage}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9"
                          onClick={() => handleAmountSuggestion(percentage)}
                          disabled={isDisabled}
                        >
                          {percentage}%
                        </Button>
                      );
                    })}
                  </div>
                )}
                <div className="relative">
                  <Banknote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="0.00"
                    className="pl-10 h-12 text-lg"
                    {...field}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('minAmount')}: ₹ 1,000 | {t('maxAmount')}: ₹ 1,00,000
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold">{t('cryptoCurrency')}</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {currencyOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={field.value === option.value ? 'default' : 'outline'}
                      className="h-auto py-3 flex flex-col items-center gap-1 px-2"
                      onClick={() => field.onChange(option.value)}
                    >
                      <div className="relative w-10 h-10">
                        {option.tokenImage && !imageErrors[option.value] ? (
                          <Image
                            src={option.tokenImage}
                            alt={option.display}
                            width={40}
                            height={40}
                            className="w-full h-full object-contain"
                            onError={() => handleImageError(option.value)}
                            unoptimized // Add if images are from external domains or blob
                          />
                        ) : (
                          <div className="w-full h-full bg-muted rounded-full flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">?</span>
                          </div>
                        )}
                        
                        {option.networkImage && !imageErrors[`${option.value}-network`] && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full border border-border">
                            <Image
                              src={option.networkImage}
                              alt="network"
                              width={20}
                              height={20}
                              className="w-full h-full object-contain bg-white rounded-full p-0.5"
                              onError={() => handleImageError(option.value, true)}
                              unoptimized
                            />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium">{option.display}</span>
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('withdrawalAddress')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('enterCryptoAddress')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t('addressDescription')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-lg font-semibold"
          disabled={isSubmitting || !form.formState.isValid}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('processing')}
            </>
          ) : (
            <>
              <Banknote className="mr-2 h-4 w-4" />
              {t('requestWithdrawal')}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {t('withdrawalTerms')}
        </p>
      </form>
    </Form>
  );
}