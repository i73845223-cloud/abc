"use client"

import * as z from 'zod'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { useSession } from 'next-auth/react'
import InputMask from 'react-input-mask'
import { format } from 'date-fns'

import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { settings } from '@/actions/settings'
import { Form, FormField, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCurrentUser } from '@/hooks/use-current-user'
import { FormSuccess } from '@/components/form-success'
import { FormError } from '@/components/form-error'
import { LogoutButton } from '@/components/auth/logout-button'
import { ExitIcon } from '@radix-ui/react-icons'
import { reset } from '@/actions/reset'
import { SettingsSchema } from '@/schemas'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'

const SettingsPage = () => {
    const user = useCurrentUser()
    const [error, setError] = useState<string | undefined>()
    const [success, setSuccess] = useState<string | undefined>()
    const { update } = useSession()
    const [isPending, startTransition] = useTransition()
    
    const [lastResetTime, setLastResetTime] = useState<number | null>(null)
    const [isCooldown, setIsCooldown] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const t = useTranslations('Settings')

    const formatBirthDate = (date: Date | undefined): string => {
        if (!date) return ''
        try {
            return format(date, 'dd.MM.yyyy')
        } catch {
            return ''
        }
    }

    const form = useForm<z.infer<typeof SettingsSchema>>({
        resolver: zodResolver(SettingsSchema),
        defaultValues: {
            name: user?.name || undefined,
            surname: user?.surname || undefined,
            birth: user?.birth ? formatBirthDate(new Date(user.birth)) : undefined,
            country: user?.country || undefined,
            city: user?.city || undefined,
            email: user?.email || undefined,
            password: undefined,
            newPassword: undefined,
            role: user?.role || undefined,
            isTwoFactorEnabled: user?.isTwoFactorEnabled || undefined,
        }
    })

    useEffect(() => {
        if (user) {
            setIsLoading(false)
        }
    }, [user])

    const handleForgotPassword = () => {
        if (!user?.email) {
            setError(t('errors.missingEmail'));
            return;
        }

        const email = user.email as string;
        if (typeof email !== 'string') {
            setError(t('errors.invalidEmail'));
            return;
        }

        const currentTime = Date.now()
        if (lastResetTime && currentTime - lastResetTime < 180000) {
            setError(t('errors.resetCooldown'));
            return;
        }

        startTransition(() => {
            reset({ email })
                .then((data) => {
                    if (data?.error) {
                        setError(data.error);
                    } else {
                        setSuccess(t('success.resetEmailSent'));
                        setLastResetTime(currentTime)
                        setIsCooldown(true)
                    }
                })
                .catch((err) => {
                    setError(t('errors.resetFailed'));
                })
        })
    }

    useEffect(() => {
        if (isCooldown) {
            const timer = setTimeout(() => {
                setIsCooldown(false);
            }, 180000);

            return () => clearTimeout(timer);
        }
    }, [isCooldown]);

    const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
        startTransition(() => {
            settings(values)
                .then((data) => {
                    if (data.error) {
                        setError(data.error)
                    }

                    if (data.success) {
                        update()
                        setSuccess(data.success)
                    }
                })
                .catch(() => setError(t('errors.generic')))
        })
    }

    if (isLoading) {
        return (
            <div className="p-4 space-y-6">
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                </div>
                <Skeleton className="h-10 w-24" />
                <div className="mt-12 flex gap-4">
                    <Skeleton className="h-10 w-36" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 pb-[60px] sm:pb-0">
            <Form {...form}>
                <form
                    className="space-y-6"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.firstName')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder={t('placeholders.firstName')}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="surname"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.lastName')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder={t('placeholders.lastName')}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="birth"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.birthDate')}</FormLabel>
                                    <FormControl>
                                        <InputMask
                                            mask="99.99.9999"
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            disabled={isPending}
                                            placeholder={t('placeholders.birthDate')}
                                            maskChar={null}
                                        >
                                            {(inputProps: any) => (
                                                <Input
                                                    {...inputProps}
                                                    placeholder={t('placeholders.birthDate')}
                                                    className="font-mono tracking-wider"
                                                />
                                            )}
                                        </InputMask>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.country')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder={t('placeholders.country')}
                                            disabled={true}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.city')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder={t('placeholders.city')}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        {user?.isOAuth === false && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('form.email')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t('placeholders.email')}
                                                    disabled={isPending}
                                                    type="email"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}
                        {user?.isOAuth === false && (
                            <FormField
                                control={form.control}
                                name="isTwoFactorEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>{t('form.twoFactor')}</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                disabled={isPending}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                    <FormSuccess message={success} />
                    <FormError message={error} />
                    <Button
                        disabled={isPending}
                        type="submit"
                        size="lg"
                    >
                        {t('buttons.save')}
                    </Button>
                </form>
            </Form>
            <div className="mt-12 flex gap-4">
                <Button
                    variant="secondary"
                    onClick={handleForgotPassword}
                    disabled={isPending || isCooldown}
                >
                    {t('buttons.forgotPassword')}
                </Button>
                <LogoutButton>
                    <Button
                        variant="destructive"
                        className="flex"
                    >
                        <ExitIcon className="h-4 w-4 mr-2" />
                        {t('buttons.logout')}
                    </Button>
                </LogoutButton>
            </div>
        </div>
    );
}

export default SettingsPage