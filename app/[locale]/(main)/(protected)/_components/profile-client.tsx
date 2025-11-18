'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  History, 
  HelpCircle, 
  Settings,
  Copy,
  Check,
  Mail,
  ShieldCheck,
  Ban,
  User,
  ShieldOff,
  Banknote,
  ArrowBigUp,
  ArrowBigDown,
  Gift,
  Ticket
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useBalanceContext } from '@/contexts/balance-context'
import { Skeleton } from '@/components/ui/skeleton'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface ProfileClientProps {
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
    isImageApproved: boolean
    role: string
    isTwoFactorEnabled: boolean
    isBlocked: boolean
    isChatBlocked: boolean
  }
}

const ProfileClient = ({ user }: ProfileClientProps) => {
  const [copied, setCopied] = useState(false)
  const { formattedBalance, isLoading: balanceLoading } = useBalanceContext()
  const t = useTranslations('Profile')

  const menuItems = [
    {
      title: t('promos'),
      description: t('promosDescription'),
      icon: Gift,
      href: '/promo',
      color: 'text-red-600'
    },
    {
      title: t('transactions'),
      description: t('transactionsDescription'),
      icon: CreditCard,
      href: '/transactions',
      color: 'text-blue-600'
    },
    {
      title: t('bettingHistory'),
      description: t('bettingHistoryDescription'),
      icon: History,
      href: '/history',
      color: 'text-green-600'
    },
    {
      title: t('myBets'),
      description: t('myBetsDescription'),
      icon: Ticket,
      href: '/my-bets',
      color: 'text-purple-600'
    },
    {
      title: t('support'),
      description: t('supportDescription'),
      icon: HelpCircle,
      href: '/support',
      color: 'text-orange-600'
    },
    {
      title: t('settings'),
      description: t('settingsDescription'),
      icon: Settings,
      href: '/settings',
      color: 'text-gray-600'
    }
  ]

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(t('userIdCopied'))
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error(t('copyFailed'))
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error(t('signOutFailed'))
    }
  }

  return (
    <div className="pb-[60px] lg:pb-0">
      <div className="sm:container sm:mx-auto px-1 sm:px-4 max-w-4xl">
        <div className="lg:grid gap-6 lg:grid-cols-3 space-y-1">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20rounded-full flex items-center justify-center mx-auto">
                    <User className="h-10 w-10" />
                </div>
                <CardTitle className="text-xl">
                  {user.name || t('user')}
                </CardTitle>
                <CardDescription className="text-gray-300 flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    {t('userId')}
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-800 px-3 py-2 rounded-md text-sm font-mono text-gray-200 truncate">
                      {user.id}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(user.id)}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    {t('accountBalance')}
                  </label>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    {balanceLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                          {formattedBalance}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-500 mt-1">
                          {t('availableBalance')}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className='flex gap-2'>
                    <Button className="w-full justify-start" variant="default" asChild>
                        <Link href="transactions/new/deposit" className='flex justify-center'>
                            <ArrowBigUp className="h-5 w-5 mr-1" />
                            {t('deposit')}
                        </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href="transactions/new/withdrawal" className='flex justify-center'>
                            <ArrowBigDown className="h-5 w-5 mr-1" />
                            {t('withdraw')}
                        </Link>
                    </Button>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{t('2faStatus')}</span>
                    <Badge variant={user.isTwoFactorEnabled ? "default" : "secondary"}>
                      {user.isTwoFactorEnabled ? (
                        <>
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {t('enabled')}
                        </>
                      ) : (
                        <>
                          <ShieldOff className="h-3 w-3 mr-1" />
                          {t('disabled')}
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{t('accountStatus')}</span>
                    <Badge variant={user.isBlocked ? "destructive" : "default"}>
                      {user.isBlocked ? (
                        <>
                          <Ban className="h-3 w-3 mr-1" />
                          {t('blocked')}
                        </>
                      ) : (
                        t('active')
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{t('chatStatus')}</span>
                    <Badge variant={user.isChatBlocked ? "destructive" : "secondary"}>
                      {user.isChatBlocked ? (
                        <>
                          <Ban className="h-3 w-3 mr-1" />
                          {t('blocked')}
                        </>
                      ) : (
                        t('enabled')
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {t('accountManagement')}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {t('accountManagementDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className='p-1 sm:p-6'>
                <div className="sm:grid flex flex-col gap-1 sm:gap-4 sm:grid-cols-2">
                  {menuItems.map((item, index) => {
                    const IconComponent = item.icon
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start justify-start text-left"
                        asChild
                      >
                        <Link href={item.href}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${item.color}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <span className="font-semibold">
                              {item.title}
                            </span>
                          </div>
                          <p className="sm:text-sm text-xs text-gray-300">
                            {item.description}
                          </p>
                        </Link>
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileClient