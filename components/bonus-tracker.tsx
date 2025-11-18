"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, RotateCcw, Coins, Sparkles, ArrowRight, Crown, Zap, AlertCircle, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatter } from '@/lib/utils';
import { BonusWithdrawal } from './bonus-withdrawal';
import { useTranslations } from 'next-intl';

interface Bonus {
  id: string;
  type: string;
  amount: number;
  bonusAmount: any;
  remainingAmount: any;
  wageringRequirement: number;
  completedWagering: any;
  totalWagered: any;
  withdrawnAmount: any;
  status: string;
  freeSpinsCount?: number;
  freeSpinsUsed?: number;
  freeSpinsWinnings?: any;
  expiresAt: string;
  promoCode?: {
    code: string;
    description: string;
    type: string;
    bonusPercentage?: number;
    maxBonusAmount?: any;
    minDepositAmount?: any;
    freeSpinsCount?: number;
    freeSpinsGame?: string;
    cashbackPercentage?: number;
    wageringRequirement?: number;
  };
}

interface UserPromoCode {
  id: string;
  promoCode: {
    id: string;
    code: string;
    type: string;
    description: string;
    bonusPercentage?: number;
    maxBonusAmount?: any;
    minDepositAmount?: any;
    freeSpinsCount?: number;
    freeSpinsGame?: string;
    cashbackPercentage?: number;
    wageringRequirement?: number;
  };
}

export function BonusTracker() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [userPromoCodes, setUserPromoCodes] = useState<UserPromoCode[]>([]);
  const [summary, setSummary] = useState({ 
    totalRemaining: 0, 
    activeCount: 0
  });
  const router = useRouter();
  const t = useTranslations('BonusTracker');

  useEffect(() => {
    fetchBonuses();
    fetchUserPromoCodes();
  }, []);

  const fetchBonuses = async () => {
    try {
      const response = await fetch('/api/bonuses');
      if (response.ok) {
        const data = await response.json();
        setBonuses(data.bonuses);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch bonuses:', error);
    }
  };

  const fetchUserPromoCodes = async () => {
    try {
      const response = await fetch('/api/user-promo-codes');
      if (response.ok) {
        const data = await response.json();
        setUserPromoCodes(data);
      }
    } catch (error) {
      console.error('Failed to fetch user promo codes:', error);
    }
  };

  const toNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    return Number(value) || 0;
  };

  const handleActivateBonus = () => {
    router.push('/transactions/new/deposit');
  };

  const handleWithdrawBonus = async (bonusId: string) => {
    try {
      const response = await fetch('/api/bonuses/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bonusId: bonusId,
          amount: 'full'
        })
      });

      const data = await response.json();

      if (response.ok) {
        fetchBonuses();
      } else {
        console.error('Withdrawal failed:', data.error);
      }
    } catch (error) {
      console.error('Failed to withdraw bonus:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_WAGERING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'COMPLETED': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'FORFEITED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PENDING_ACTIVATION': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'FREE_SPINS': return <RotateCcw className="h-4 w-4 text-purple-400" />;
      case 'DEPOSIT_BONUS': return <Coins className="h-4 w-4 text-blue-400" />;
      case 'CASHBACK': return <Sparkles className="h-4 w-4 text-green-400" />;
      default: return <Gift className="h-4 w-4 text-orange-400" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'PENDING_WAGERING': t('status.pendingWagering'),
      'COMPLETED': t('status.completed'),
      'FORFEITED': t('status.forfeited'),
      'PENDING_ACTIVATION': t('status.pendingActivation')
    };
    return statusMap[status] || status.replace('_', ' ');
  };

  const realTotalRemaining = bonuses.reduce((total, bonus) => {
    const remaining = toNumber(bonus.remainingAmount);
    const winnings = toNumber(bonus.freeSpinsWinnings);
    return total + remaining + winnings;
  }, 0);

  const pendingActivationBonuses = bonuses.filter(bonus => 
    bonus.status === 'PENDING_ACTIVATION' && 
    (bonus.type === 'DEPOSIT_BONUS' || bonus.type === 'COMBINED')
  );

  const activeBonuses = bonuses.filter(bonus => 
    bonus.status === 'PENDING_WAGERING' || bonus.status === 'COMPLETED'
  );

  const hasActiveContent = activeBonuses.length > 0 || pendingActivationBonuses.length > 0;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">{t('summary.title')}</CardTitle>
                <CardDescription className="text-gray-400">
                  {t('summary.stats', { 
                    active: activeBonuses.length, 
                    pending: pendingActivationBonuses.length 
                  })}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                {formatter.format(realTotalRemaining)}
              </div>
              <div className="text-xs text-gray-400">{t('summary.availableBalance')}</div>
            </div>
          </div>
        </CardHeader>
        
        {pendingActivationBonuses.length > 0 && (
          <CardContent className="pt-0">
            <Button 
              onClick={handleActivateBonus}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg"
              size="lg"
            >
              <Zap className="h-4 w-4 mr-2" />
              {t('buttons.activateWithDeposit', { count: pendingActivationBonuses.length })}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        )}
      </Card>

      {pendingActivationBonuses.map((bonus) => {
        const promoCode = bonus.promoCode;
        const minDepositAmount = promoCode?.minDepositAmount ? toNumber(promoCode.minDepositAmount) : 0;
        const maxBonusAmount = promoCode?.maxBonusAmount ? toNumber(promoCode.maxBonusAmount) : 0;

        return (
          <Card key={bonus.id} className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg mt-1">
                    <Coins className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      {promoCode?.code}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {promoCode?.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {t('status.readyToActivate')}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-2 text-lg">{t('activation.depositBonusReady')}</h4>
                <p className="text-sm text-blue-300 mb-4 leading-relaxed">
                  {t('activation.getBonus', { percentage: promoCode?.bonusPercentage || 0 })}
                  {maxBonusAmount > 0 && (
                    <span className="block">{t('activation.upTo', { amount: formatter.format(maxBonusAmount) })}</span>
                  )}
                </p>
                <Button 
                  onClick={handleActivateBonus}
                  size="lg"
                >
                  {t('buttons.depositToActivate')}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">{t('labels.bonusRate')}</div>
                  <div className="font-semibold text-white text-lg">{promoCode?.bonusPercentage}%</div>
                </div>
                {maxBonusAmount > 0 && (
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">{t('labels.maxBonus')}</div>
                    <div className="font-semibold text-white text-lg">{formatter.format(maxBonusAmount)}</div>
                  </div>
                )}
                {minDepositAmount > 0 && (
                  <div className="bg-gray-800/50 rounded-lg p-3 sm:col-span-2">
                    <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">{t('labels.minDeposit')}</div>
                    <div className="font-semibold text-white">{formatter.format(minDepositAmount)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {activeBonuses.map((bonus) => {
        const bonusAmount = toNumber(bonus.bonusAmount);
        const remainingAmount = toNumber(bonus.remainingAmount);
        const completedWagering = toNumber(bonus.completedWagering);
        const freeSpinsWinnings = toNumber(bonus.freeSpinsWinnings);
        const freeSpinsCount = bonus.promoCode?.freeSpinsCount || bonus.freeSpinsCount;
        const freeSpinsGame = bonus.promoCode?.freeSpinsGame;
        const requiredWagering = bonusAmount * bonus.wageringRequirement;
        const isWageringComplete = completedWagering >= requiredWagering;
        const canWithdraw = bonus.status === 'COMPLETED' || (bonus.status === 'PENDING_WAGERING' && isWageringComplete && remainingAmount > 0);
        
        const getCardGradient = (type: string) => {
          switch (type) {
            case 'FREE_SPINS': return 'from-purple-500/5 to-purple-600/5 border-purple-500/20';
            case 'CASHBACK': return 'from-green-500/5 to-green-600/5 border-green-500/20';
            case 'FREE_BET': return 'from-orange-500/5 to-orange-600/5 border-orange-500/20';
            default: return 'from-gray-800 to-gray-900 border-gray-700';
          }
        };

        return (
          <div key={bonus.id} className="space-y-4">
            <Card className={`bg-gradient-to-br ${getCardGradient(bonus.type)}`}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-1 ${
                      bonus.type === 'FREE_SPINS' ? 'bg-purple-500/20' :
                      bonus.type === 'CASHBACK' ? 'bg-green-500/20' :
                      bonus.type === 'FREE_BET' ? 'bg-orange-500/20' : 'bg-blue-500/20'
                    }`}>
                      {getTypeIcon(bonus.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base text-white flex items-center gap-2 truncate">
                        {bonus.promoCode?.code || t('labels.bonus')}
                      </CardTitle>
                      <CardDescription className="text-gray-400 truncate">
                        {bonus.promoCode?.description || t('labels.bonusOffer')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className={getStatusColor(bonus.status)}>
                    {getStatusText(bonus.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {bonus.wageringRequirement > 0 && bonus.status === 'PENDING_WAGERING' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">{t('progress.wagering')}</span>
                      <span className="text-white font-medium">
                        {formatter.format(completedWagering / requiredWagering)}
                      </span>
                    </div>
                    <Progress 
                      value={(completedWagering / requiredWagering) * 100} 
                      className="h-2 bg-gray-700"
                    />
                    <div className="text-xs text-gray-400">
                      {t('progress.wagerAmount', { amount: formatter.format(requiredWagering) })}
                    </div>
                  </div>
                )}

                {bonus.status === 'PENDING_ACTIVATION' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm font-medium">{t('status.waitingForDeposit')}</span>
                    </div>
                    <p className="text-xs text-yellow-300">
                      {t('activation.makeDeposit', { 
                        percentage: bonus.promoCode?.bonusPercentage || 0,
                        amount: bonus.promoCode?.minDepositAmount && toNumber(bonus.promoCode.minDepositAmount) > 0 ? 
                          ` (${t('labels.min')} ${formatter.format(toNumber(bonus.promoCode.minDepositAmount))})` : ''
                      })}
                    </p>
                  </div>
                )}

                {freeSpinsCount && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">{t('labels.freeSpins')}</span>
                      <span className="text-white font-medium">
                        {t('progress.spinsUsed', { 
                          used: bonus.freeSpinsUsed || 0, 
                          total: freeSpinsCount 
                        })}
                      </span>
                    </div>
                    <Progress 
                      value={(((bonus.freeSpinsUsed || 0) / freeSpinsCount) * 100)} 
                      className="h-2 bg-gray-700"
                    />
                    {freeSpinsGame && (
                      <div className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded text-center">
                        {t('labels.game')}: {freeSpinsGame}
                      </div>
                    )}
                  </div>
                )}

                {(bonusAmount > 0 || remainingAmount > 0) && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {bonusAmount > 0 && (
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">{t('labels.bonusAmount')}</div>
                        <div className="font-semibold text-white text-lg">{formatter.format(bonusAmount)}</div>
                      </div>
                    )}
                    {remainingAmount > 0 && (
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">{t('labels.remaining')}</div>
                        <div className="font-semibold text-green-400 text-lg">{formatter.format(remainingAmount)}</div>
                      </div>
                    )}
                  </div>
                )}

                {freeSpinsWinnings > 0 && (
                  <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">{t('labels.freeSpinsWinnings')}</div>
                    <div className="font-semibold text-green-400 text-lg">{formatter.format(freeSpinsWinnings)}</div>
                  </div>
                )}

                {canWithdraw && (
                  <Button 
                    onClick={() => handleWithdrawBonus(bonus.id)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    size="lg"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    {t('buttons.withdraw', { amount: formatter.format(remainingAmount) })}
                  </Button>
                )}

                <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                  <span>{t('labels.expires')}: {new Date(bonus.expiresAt).toLocaleDateString()}</span>
                  <span>{bonus.type.replace('_', ' ')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}

      {!hasActiveContent && (
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{t('emptyState.title')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('emptyState.description')}
            </p>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}