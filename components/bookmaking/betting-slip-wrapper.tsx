'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import BettingSlip, { BettingSlipProps } from './betting-slip'
import { useTranslations } from 'next-intl'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class BettingSlipErrorBoundary extends Component<{ children: ReactNode; t: (key: string) => string }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; t: (key: string) => string }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('BettingSlip Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 rounded-lg bg-red-50">
          <h3 className="text-red-800 font-bold mb-2">{this.props.t('errorTitle')}</h3>
          <p className="text-red-600 text-sm mb-3">
            {this.props.t('errorDescription')}
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false })}
            variant="outline"
            size="sm"
          >
            {this.props.t('tryAgain')}
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default function BettingSlipWrapper(props: BettingSlipProps) {
  const t = useTranslations('BettingSlip')

  return (
    <BettingSlipErrorBoundary t={t}>
      <BettingSlip {...props} />
    </BettingSlipErrorBoundary>
  )
}