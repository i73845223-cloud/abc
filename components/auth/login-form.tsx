"use client";

import * as z from 'zod';
import { useState, useTransition } from 'react';
import { CardWrapper } from "./card-wrapper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { LoginSchema } from '@/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { FormError } from '../form-error';
import { FormSuccess } from '../form-success';
import { login } from '@/actions/login';
import Link from 'next/link';

interface LoginFormProps {
  refCode?: string | null;
  callbackUrl?: string;
}

export const LoginForm = ({ refCode, callbackUrl: propCallbackUrl }: LoginFormProps) => {
  const t = useTranslations('LoginForm');
  const searchParams = useSearchParams();
  const urlCallbackUrl = searchParams.get('callbackUrl');
  const urlRef = searchParams.get('ref');
  const urlError = searchParams.get('error') === 'OAuthAccountNotLinked'
    ? t('oauthAccountNotLinkedError')
    : '';

  const finalCallbackUrl = propCallbackUrl || urlCallbackUrl;
  const finalRef = refCode || urlRef;

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");
    
    startTransition(() => {
      login(values, finalCallbackUrl)
        .then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
          }

          if (data?.success) {
            form.reset();
            setSuccess(data.success);
          }

          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }
        })
        .catch(() => setError(t('somethingWentWrong')));
    });
  };

  const registerHref = finalRef 
    ? `/register?ref=${encodeURIComponent(finalRef)}` 
    : "/register";

  return (
    <CardWrapper
      headerLabel={t('headerLabel')}
      backButtonLabel={t('backButtonLabel')}
      backButtonHref={registerHref}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          <div className="space-y-4">
            {showTwoFactor && (
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('twoFactorCodeLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder={t('twoFactorCodePlaceholder')}
                        maxLength={256}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {!showTwoFactor && (
              <>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('emailLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder={t('emailPlaceholder')}
                          type='email'
                          maxLength={256}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('passwordLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder={t('passwordPlaceholder')}
                          type='password'
                          maxLength={256}
                        />
                      </FormControl>
                      <FormMessage />
                      <Button
                        size='sm'
                        variant='link'
                        asChild
                        className='px-0 font-normal'
                      >
                        <Link href='/reset'>
                          {t('forgotPassword')}
                        </Link>
                      </Button>
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          <FormError message={error || urlError} />
          <FormSuccess message={success} />
          <Button
            disabled={isPending}
            type='submit'
            className='w-full'
          >
            {showTwoFactor ? t('confirmButton') : t('loginButton')}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};