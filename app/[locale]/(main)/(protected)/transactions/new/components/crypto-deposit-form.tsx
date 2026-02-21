'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Copy, IndianRupee, Loader2, QrCode, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

const currencyOptions = [
  { 
    value: 'usdttrc20', 
    display: 'USDT TRC20', 
    tokenImage: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    networkImage: 'https://cryptologos.cc/logos/tron-trx-logo.png'
  },
  { 
    value: 'usdterc20', 
    display: 'USDT ERC20', 
    tokenImage: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    networkImage: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  { 
    value: 'usdcerc20', 
    display: 'USDC ERC20', 
    tokenImage: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    networkImage: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  { 
    value: 'usdcsol', 
    display: 'USDC SOL', 
    tokenImage: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    networkImage: 'https://cryptologos.cc/logos/solana-sol-logo.png'
  },
  { 
    value: 'eth', 
    display: 'ETH', 
    tokenImage: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  { 
    value: 'btc', 
    display: 'BTC', 
    tokenImage: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
  },
  { 
    value: 'sol', 
    display: 'SOL', 
    tokenImage: 'https://cryptologos.cc/logos/solana-sol-logo.png'
  },
  { 
    value: 'ltc', 
    display: 'LTC', 
    tokenImage: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png'
  },
];

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

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

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
  
  const generatePaymentURI = (info: PaymentInfo): string => {
    const { address, amount, currency } = info;
    
    switch (currency.toLowerCase()) {
      case 'btc':
        return `bitcoin:${address}?amount=${amount}`;
        
      case 'eth':
        const weiAmount = Math.floor(amount * 1e18);
        return `ethereum:${address}?value=${weiAmount}`;
        
      case 'sol':
        return `solana:${address}?amount=${amount}`;
        
      case 'usdttrc20':
        const tronAmount = Math.floor(amount * 1e6);
        return `tron:${address}?value=${tronAmount}&req-asset=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`;
        
      case 'usdterc20':
        const erc20Amount = Math.floor(amount * 1e6);
        return `ethereum:${address}?value=${erc20Amount}&req-asset=0xdac17f958d2ee523a2206206994597c13d831ec7`;
        
      case 'usdcerc20':
        const usdcAmount = Math.floor(amount * 1e6);
        return `ethereum:${address}?value=${usdcAmount}&req-asset=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`;
        
      case 'usdcsol':
        return `solana:${address}?amount=${amount}&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`;
        
      case 'ltc':
        return `litecoin:${address}?amount=${amount}`;
        
      default:
        return address;
    }
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
            <QRCodeSVG
              value={generatePaymentURI(paymentInfo)}
              size={200}
              level="H"
              className="border rounded-lg"
            />
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                    min={1000}
                    max={100000}
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
                        <img
                          src={option.tokenImage}
                          alt={option.display}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'https://cryptologos.cc/logos/placeholder.png';
                          }}
                        />
                        {option.networkImage && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full border border-border">
                            <img
                              src={option.networkImage}
                              alt="network"
                              className="w-full h-full object-contain bg-white rounded-full p-0.5"
                              onError={(e) => {
                                e.currentTarget.src = 'https://cryptologos.cc/logos/placeholder.png';
                              }}
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
          <p>{t('serviceFee')}</p>
          <p className="text-xs mt-2">{t('exchangeRateNote')}</p>
        </div>
      </form>
    </Form>
  );
}