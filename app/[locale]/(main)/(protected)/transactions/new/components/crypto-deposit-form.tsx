'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Copy, IndianRupee, Loader2, QrCode, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

const depositSchema = z.object({
  amountInr: z.string()
    .min(1, 'amountRequired')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'amountInvalid')
    .refine((val) => parseFloat(val) >= 100, 'minimumAmount'),
  currency: z.string().min(1, 'currencyRequired'),
});

type DepositFormValues = z.infer<typeof depositSchema>;

interface PaymentInfo {
  paymentId: string;
  address: string;
  qrCode: string;
  amount: number;
  currency: string;
  amountInr: number;
  expiresAt: string;
}

export function CryptoDepositForm() {
  const t = useTranslations('Deposit');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amountInr: '',
      currency: '',
    },
  });

  const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];
  const cryptoCurrencies = [
    { value: 'btc', label: 'Bitcoin (BTC)' },
    { value: 'eth', label: 'Ethereum (ETH)' },
    { value: 'usdttrc20', label: 'USDT (TRC20)' },
    { value: 'ltc', label: 'Litecoin (LTC)' },
    { value: 'sol', label: 'Solana (SOL)' },
  ];

  const handleAmountSuggestion = (amount: number) => {
    form.setValue('amountInr', amount.toString());
  };

  const onSubmit = async (data: DepositFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/crypto/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInr: parseFloat(data.amountInr),
          currency: data.currency,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      setPaymentInfo({
        paymentId: result.paymentId,
        address: result.address,
        qrCode: result.qrCode,
        amount: result.amount,
        currency: result.currency,
        amountInr: result.amountInr,
        expiresAt: result.expiresAt,
      });
      setStep('payment');
    } catch (error) {
      console.error('Deposit error:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('depositError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('copied'),
      description: t('addressCopied'),
    });
  };

  if (step === 'payment' && paymentInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t('completePayment')}
          </CardTitle>
          <CardDescription>
            {t('sendExactAmount')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t('amountToSend')}</p>
            <p className="text-3xl font-bold">
              {paymentInfo.amount} {paymentInfo.currency.toUpperCase()}
            </p>
            <p className="text-sm text-muted-foreground">
              ≈ ₹{paymentInfo.amountInr.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex justify-center">
            {paymentInfo.qrCode && (
              <Image
                src={paymentInfo.qrCode}
                alt="Payment QR Code"
                width={200}
                height={200}
                className="border rounded-lg"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('depositAddress')}</Label>
            <div className="flex">
              <Input
                value={paymentInfo.address}
                readOnly
                className="rounded-r-none font-mono text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                className="rounded-l-none"
                onClick={() => copyToClipboard(paymentInfo.address)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('paymentInstructions')}
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t('expires')}: {new Date(paymentInfo.expiresAt).toLocaleString()}</span>
            <Button variant="outline" onClick={() => setStep('form')}>
              {t('newDeposit')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="amountInr"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold">{t('amount')}</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant={field.value === amt.toString() ? 'default' : 'outline'}
                      className="h-12"
                      onClick={() => handleAmountSuggestion(amt)}
                    >
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {amt.toLocaleString('en-IN')}
                    </Button>
                  ))}
                </div>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('enterAmount')}
                    className="pl-10 h-12 text-lg"
                    {...field}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('minAmount')}: ₹100 | {t('maxAmount')}: ₹50,000
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12">
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
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-lg font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('processing')}
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              {t('generatePayment')}
            </>
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <p>{t('serviceFee')} 0.5%</p>
          <p className="text-xs mt-2">{t('exchangeRateNote')}</p>
        </div>
      </form>
    </Form>
  );
}