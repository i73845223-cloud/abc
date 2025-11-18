'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatter } from '@/lib/utils'
import { useBalanceContext } from '@/contexts/balance-context'
import { useTranslations } from 'next-intl'

interface SelectedOutcome {
  id: string
  name: string
  odds: number
  eventName: string
  bookTitle: string
}

export interface BettingSlipProps {
  isOpen: boolean
  onClose: () => void
  outcome: SelectedOutcome | null
  onBetPlaced: () => void
}

const QUICK_BET_AMOUNTS = [100, 500, 1000, 5000]

const safeParseNumber = (value: string, t: (key: string) => string): { success: boolean; value: number; error?: string } => {
  if (!value || value.trim() === '') {
    return { success: false, value: 0, error: t('enterBetAmount') }
  }

  const cleanValue = value.replace(/[^\d.]/g, '')
  
  if (cleanValue === '' || cleanValue === '.') {
    return { success: false, value: 0, error: t('enterValidNumber') }
  }

  const numberValue = parseFloat(cleanValue)
  
  if (isNaN(numberValue)) {
    return { success: false, value: 0, error: t('enterValidNumber') }
  }

  if (numberValue <= 0) {
    return { success: false, value: 0, error: t('amountGreaterThanZero') }
  }

  if (numberValue < 1) {
    return { success: false, value: 0, error: t('minimumBetAmount') }
  }

  return { success: true, value: Math.round(numberValue * 100) / 100 }
}

export default function BettingSlip({ isOpen, onClose, outcome, onBetPlaced }: BettingSlipProps) {
  const [betAmount, setBetAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [userBalance, setUserBalance] = useState(0)
  const { refreshBalance } = useBalanceContext();
  const t = useTranslations('BettingSlip')

  useEffect(() => {
    if (isOpen) {
      fetchUserBalance()
      setBetAmount('')
      setError('')
    }
  }, [isOpen])

  const fetchUserBalance = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setUserBalance(data.balance.available)
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const handleQuickBet = (amount: number) => {
    setBetAmount(amount.toString())
    setError('')
  }

  const handleMaxBet = () => {
    const maxAmount = Math.floor(userBalance)
    setBetAmount(maxAmount.toString())
    setError('')
  }

  const handleBetAmountChange = (value: string) => {
    const sanitizedValue = value
      .replace(/[^\d.]/g, '')
      .replace(/(\..*)\./g, '$1')
    
    setBetAmount(sanitizedValue)
    setError('')
  }

  const getCalculatedValues = () => {
    const parseResult = safeParseNumber(betAmount, t)
    
    if (!parseResult.success) {
      return {
        isValid: false,
        amount: 0,
        potentialWin: 0,
        netProfit: 0,
        error: parseResult.error
      }
    }

    const amount = parseResult.value
    const potentialWin = amount * (outcome?.odds || 0)
    const netProfit = potentialWin - amount

    return {
      isValid: true,
      amount,
      potentialWin,
      netProfit,
      error: undefined
    }
  }

  const placeBet = async () => {
    try {
      setError('')
      setIsSubmitting(true)

      const calculated = getCalculatedValues()
      
      if (!calculated.isValid) {
        setError(calculated.error || t('invalidBetAmount'))
        setIsSubmitting(false)
        return
      }

      if (calculated.amount > userBalance) {
        setError(t('insufficientBalance', { balance: userBalance.toFixed(2) }))
        setIsSubmitting(false)
        return
      }

      if (!outcome?.id) {
        setError(t('invalidOutcome'))
        setIsSubmitting(false)
        return
      }

      console.log('🎯 Placing bet with:', {
        outcomeId: outcome.id,
        amount: calculated.amount,
        odds: outcome.odds
      })

      const betData = {
        outcomeId: outcome.id,
        amount: calculated.amount,
        odds: outcome.odds
      }

      const response = await fetch('/api/bookmaking/client/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(betData),
      })

      if (response.ok) {
        const betResult = await response.json()
        await refreshBalance();
        onBetPlaced()
        onClose()
        setBetAmount('')
      } else {
        const errorText = await response.text()
        let errorMessage = t('failedToPlaceBet', { status: response.status })
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        setError(errorMessage)
      }
    } catch (error: any) {
      console.error('💥 Unexpected error:', error)
      setError(t('unexpectedError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!outcome) return null

  const calculated = getCalculatedValues()
  const canPlaceBet = calculated.isValid && calculated.amount <= userBalance && !isSubmitting

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('placeBet')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('event')}</span>
                  <span className="text-sm font-medium text-right">{outcome.eventName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('selection')}</span>
                  <span className="text-sm font-medium text-right">{outcome.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('odds')}</span>
                  <Badge variant="default" className="text-sm">
                    {outcome.odds.toFixed(2)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center text-sm p-3 bg-blue-50 rounded-lg">
            <span className="text-muted-foreground">{t('yourBalance')}:</span>
            <span className="font-medium text-blue-700">
              {formatter.format(Number(userBalance))}
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="betAmount">{t('betAmount')}</Label>
              <Input
                id="betAmount"
                type="text"
                inputMode="decimal"
                value={betAmount}
                onChange={(e) => handleBetAmountChange(e.target.value)}
                placeholder={t('enterAmount')}
                className="bg-background text-lg font-medium"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t('quickBet')}</Label>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_BET_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickBet(amount)}
                    className="bg-background hover:bg-accent"
                    disabled={isSubmitting || amount > userBalance}
                  >
                    ₹ {amount}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMaxBet}
                className="w-full bg-background hover:bg-accent"
                disabled={isSubmitting || userBalance <= 0}
              >
                {t('max')}
              </Button>
            </div>
          </div>

          {calculated.isValid && (
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('potentialWin')}:</span>
                    <span className={`text-lg font-bold ${calculated.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatter.format(Number(calculated.potentialWin.toFixed(2)))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={placeBet}
              disabled={!canPlaceBet}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('placingBet')}
                </>
              ) : (
                t('placeBetButton')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}