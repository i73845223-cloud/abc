'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, CreditCard, Smartphone, QrCode, Shield, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function DepositForm() {
  const t = useTranslations('Deposit');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];
  const paymentMethods = [
    { value: 'upi', label: t('upi'), icon: Smartphone, description: t('upiDescription') },
    { value: 'netbanking', label: t('netBanking'), icon: CreditCard, description: t('netBankingDescription') },
    { value: 'card', label: t('debitCard'), icon: CreditCard, description: t('cardDescription') },
    { value: 'qr', label: t('qrCode'), icon: QrCode, description: t('qrDescription') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Label htmlFor="amount" className="text-lg font-semibold">
          {t('amount')}
        </Label>
        
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((quickAmount) => (
            <Button
              key={quickAmount}
              type="button"
              variant={amount === quickAmount.toString() ? "default" : "outline"}
              className="h-12"
              onClick={() => setAmount(quickAmount.toString())}
            >
              <IndianRupee className="h-4 w-4 mr-1" />
              {quickAmount.toLocaleString('en-IN')}
            </Button>
          ))}
        </div>

        <div className="relative">
          <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="amount"
            type="number"
            placeholder={t('enterAmount')}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-10 h-12 text-lg"
            min="100"
            max="50000"
            required
          />
        </div>
        
        <p className="text-sm text-muted-foreground">
          {t('minAmount')}: ₹100 | {t('maxAmount')}: ₹50,000
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          {t('paymentMethod')}
        </Label>
        
        <div className="grid gap-3">
          {paymentMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <Card 
                key={method.value}
                className={`cursor-pointer transition-all border-2 ${
                  paymentMethod === method.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => setPaymentMethod(method.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{method.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {method.description}
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === method.value ? 'bg-primary border-primary' : 'border-muted'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>{t('secureTransaction')}</span>
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 text-lg font-semibold"
        disabled={!amount || !paymentMethod || isProcessing || parseInt(amount) < 100}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            {t('processing')}
          </>
        ) : (
          <>
            {t('depositNow')} {parseInt(amount || '0').toLocaleString('en-IN')}
          </>
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>{t('serviceFee')}</p>
      </div>
    </form>
  );
}