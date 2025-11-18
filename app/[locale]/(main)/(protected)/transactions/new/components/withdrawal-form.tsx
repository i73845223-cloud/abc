'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Banknote, Wallet, CreditCard, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const withdrawalSchema = z.object({
  amount: z.string()
    .min(1, 'amountRequired')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'amountInvalid')
    .refine((val) => parseFloat(val) >= 100, 'minimumAmount'),
  paymentMethod: z.string().min(1, 'paymentMethodRequired'),
  accountNumber: z.string().optional(),
  upiId: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
}).refine((data) => {
  if (data.paymentMethod === 'bank') {
    return data.accountNumber && data.bankName && data.ifscCode;
  }
  if (data.paymentMethod === 'upi') {
    return data.upiId;
  }
  return true;
}, 'paymentDetailsRequired');

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

interface WithdrawalFormProps {
  userBalance?: number;
  minimumWithdrawal?: number;
}

export function WithdrawalForm({ 
  userBalance = 0, 
  minimumWithdrawal = 100 
}: WithdrawalFormProps) {
  const t = useTranslations('Withdrawal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');

  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: '',
      paymentMethod: '',
      accountNumber: '',
      upiId: '',
      bankName: '',
      ifscCode: '',
    },
  });

  const selectedPaymentMethod = form.watch('paymentMethod');
  const amountValue = form.watch('amount');

  const handleAmountSuggestion = (percentage: number) => {
    const suggestedAmount = (userBalance * percentage) / 100;
    form.setValue('amount', suggestedAmount.toFixed(2));
  };

  const onSubmit = async (data: WithdrawalFormValues) => {
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockTransactionId = 'TXN' + Date.now();
      setTransactionId(mockTransactionId);
      setWithdrawalSuccess(true);
      
      form.reset();
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (withdrawalSuccess) {
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
          <Button onClick={() => setWithdrawalSuccess(false)}>
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
              {t('enterWithdrawalDetails')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
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
                  <FormDescription>
                    {t('enterAmount')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('paymentMethod')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectPaymentMethod')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          {t('bankTransfer')}
                        </div>
                      </SelectItem>
                      <SelectItem value="upi">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          {t('upi')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPaymentMethod === 'bank' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bankName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('enterBankName')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('accountNumber')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('enterAccountNumber')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ifscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ifscCode')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('enterIFSC')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {selectedPaymentMethod === 'upi' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <FormField
                  control={form.control}
                  name="upiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('upiId')}</FormLabel>
                      <FormControl>
                        <Input placeholder="yourname@upi" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('upiDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t(form.formState.errors.root.message || 'unknownError')}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
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

            <p className="text-xs text-muted-foreground text-center">
              {t('withdrawalTerms')}
            </p>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}