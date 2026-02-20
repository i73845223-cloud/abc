'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Banknote, Loader2, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';

const withdrawalSchema = z.object({
  amountInr: z.string()
    .min(1, 'amountRequired')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'amountInvalid')
    .refine((val) => parseFloat(val) >= 100, 'minimumAmount'),
  currency: z.string().min(1, 'currencyRequired'),
  address: z.string().min(1, 'addressRequired'),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

interface WithdrawalFormProps {
  userBalance: number;
  minimumWithdrawal?: number;
}

export function CryptoWithdrawalForm({ 
  userBalance, 
  minimumWithdrawal = 100 
}: WithdrawalFormProps) {
  const t = useTranslations('Withdrawal');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amountInr: '',
      currency: '',
      address: '',
    },
  });

  const cryptoCurrencies = [
    { value: 'btc', label: 'Bitcoin (BTC)' },
    { value: 'eth', label: 'Ethereum (ETH)' },
    { value: 'usdttrc20', label: 'USDT (TRC20)' },
    { value: 'ltc', label: 'Litecoin (LTC)' },
    { value: 'sol', label: 'Solana (SOL)' },
  ];

  const handleAmountSuggestion = (percentage: number) => {
    const suggestedAmount = (userBalance * percentage) / 100;
    form.setValue('amountInr', suggestedAmount.toFixed(2));
  };

  const onSubmit = async (data: WithdrawalFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/crypto/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInr: parseFloat(data.amountInr),
          currency: data.currency,
          address: data.address,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      setTransactionId(result.withdrawalId);
      setSuccess(true);
      form.reset();
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('withdrawalError'),
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
              ₹{userBalance.toLocaleString('en-IN')}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t('minimumWithdrawal')}: ₹{minimumWithdrawal}
            </p>
          </CardContent>
        </Card>

        {userBalance > minimumWithdrawal && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('quickAmounts')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {[25, 50, 75, 100].map((percentage) => (
                  <Button
                    key={percentage}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAmountSuggestion(percentage)}
                    disabled={userBalance * (percentage / 100) < minimumWithdrawal}
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('withdrawalDetails')}</CardTitle>
            <CardDescription>
              {t('enterCryptoDetails')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="amountInr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('amount')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="0.00"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cryptoCurrency')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectCurrency')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cryptoCurrencies.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
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

            <p className="text-xs text-muted-foreground text-center">
              {t('withdrawalTerms')}
            </p>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}