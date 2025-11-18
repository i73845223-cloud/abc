import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'hi'];

export default getRequestConfig(async ({ locale }) => {
  if (!locale || !locales.includes(locale)) {
    locale = 'hi';
  }

  return {
    locale: locale,
    messages: (await import(`../app/[locale]/messages/${locale}.json`)).default
  };
});