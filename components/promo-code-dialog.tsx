"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Gift, XCircle } from 'lucide-react';

interface PromoCodeDialogProps {
  depositAmount?: number;
  onApply?: (bonus: any) => void;
}

export function PromoCodeDialog({ depositAmount, onApply }: PromoCodeDialogProps) {
  const [code, setCode] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [promoDetails, setPromoDetails] = useState<any>(null);

  const validateCode = async () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, depositAmount })
      });

      if (response.ok) {
        const data = await response.json();
        setIsValid(true);
        setPromoDetails(data.promoCode);
      } else {
        setIsValid(false);
        setPromoDetails(null);
      }
    } catch (error) {
      setIsValid(false);
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
        body: JSON.stringify({ 
          code, 
          depositAmount 
        })
      });

      if (response.ok) {
        const data = await response.json();
        onApply?.(data.bonus);
        // Close dialog or show success message
      }
    } catch (error) {
      console.error('Failed to apply promo code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Gift className="h-4 w-4" />
          Apply Promo Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Promo Code</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter promo code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setIsValid(null);
              }}
              className="uppercase"
            />
            <Button 
              onClick={validateCode} 
              disabled={!code.trim() || isLoading}
            >
              Validate
            </Button>
          </div>

          {isValid !== null && (
            <div className="space-y-3">
              {isValid ? (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Valid Promo Code!</span>
                    </div>
                    <p className="text-sm text-green-600">{promoDetails?.description}</p>
                    
                    {promoDetails?.bonusAmount && (
                      <p className="text-sm font-medium mt-2">
                        Bonus: +{promoDetails.bonusAmount}
                      </p>
                    )}
                    
                    {promoDetails?.freeSpins && (
                      <p className="text-sm font-medium mt-2">
                        Free Spins: {promoDetails.freeSpins}
                      </p>
                    )}
                    
                    {promoDetails?.wageringRequirement && (
                      <p className="text-xs text-green-600 mt-1">
                        Wagering: {promoDetails.wageringRequirement}x
                      </p>
                    )}
                    
                    <Button 
                      className="w-full mt-3" 
                      onClick={applyCode}
                      disabled={isLoading}
                    >
                      Apply Promo Code
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      <span>Invalid promo code</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}