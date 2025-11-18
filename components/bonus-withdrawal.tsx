"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatter } from '@/lib/utils';
import { Wallet, ArrowUpRight, CheckCircle } from 'lucide-react';

interface BonusWithdrawalProps {
  bonus: {
    id: string;
    remainingAmount: any;
    isWithdrawable: boolean;
    wageringRequirement: number;
    completedWagering: any;
    promoCode?: {
      code: string;
      description: string;
    };
  };
  onWithdrawSuccess: () => void;
}

export function BonusWithdrawal({ bonus, onWithdrawSuccess }: BonusWithdrawalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const remainingAmount = parseFloat(bonus.remainingAmount.toString());
  const completedWagering = parseFloat(bonus.completedWagering.toString());
  const wageringProgress = (completedWagering / bonus.wageringRequirement) * 100;

  const handleWithdraw = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bonuses/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bonusId: bonus.id,
          amount: parseFloat(amount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setAmount('');
      onWithdrawSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxAmount = () => {
    setAmount(remainingAmount.toString());
  };

  return (
    <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Wallet className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">Withdraw Bonus</CardTitle>
              <CardDescription className="text-gray-400">
                {bonus.promoCode?.code || 'Bonus Funds'}
              </CardDescription>
            </div>
          </div>
          <Badge className={bonus.isWithdrawable ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}>
            {bonus.isWithdrawable ? "Ready to Withdraw" : "Wagering Required"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!bonus.isWithdrawable && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">Wagering Progress</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">{completedWagering.toFixed(2)} / {bonus.wageringRequirement.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(wageringProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-yellow-300">
                {bonus.wageringRequirement - completedWagering > 0 
                  ? `Wager ${formatter.format(bonus.wageringRequirement - completedWagering)} more to withdraw`
                  : 'Ready to withdraw!'
                }
              </p>
            </div>
          </div>
        )}

        {bonus.isWithdrawable && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Withdrawal Available</span>
              </div>
              <p className="text-sm text-green-300">
                You can now withdraw up to {formatter.format(remainingAmount)} from your bonus funds.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="amount" className="text-sm font-medium text-gray-300">
                  Withdrawal Amount
                </label>
                <button
                  type="button"
                  onClick={setMaxAmount}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Max: {formatter.format(remainingAmount)}
                </button>
              </div>
              
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-gray-800 border-gray-600 text-white pr-16"
                  min="0"
                  max={remainingAmount}
                  step="0.01"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  USD
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <Button
                onClick={handleWithdraw}
                disabled={isLoading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > remainingAmount}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                {isLoading ? 'Processing...' : 'Withdraw Funds'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}