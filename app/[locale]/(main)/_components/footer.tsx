'use client';

import Link from "next/link";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function Footer() {
  const t = useTranslations('Footer');
  const currentYear = new Date().getFullYear();
  
  const legalLinks = [
    { href: "/terms-and-conditions", label: t('terms') },
    { href: "/privacy-policy", label: t('privacy') },
    { href: "/public-offers", label: t('publicOffers') },
    { href: "/aml-kyc-policy", label: t('amlKyc') },
  ];

  const supportLinks = [
    { href: "/support", label: t('support') },
    { href: "/transactions", label: t('transactions') },
    { href: "/history", label: t('history') },
  ];

  return (
    <footer className="bg-background border-t border-border">
      <div className="mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex gap-1 text-red-600">
                <Image
                    src="/logo.svg"
                    alt="logo"
                    width="35"
                    height="35"
                    priority
                    className="scale-75"
                />
                <div>
                    <span className="text-2xl">altbet</span>
                </div>
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('description')}
            </p>
          </div>

          <div className="grid grid-cols-2">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('legal')}</h3>
                <ul className="space-y-2 text-sm">
                {legalLinks.map((link) => (
                    <li key={link.href}>
                    <Link 
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {link.label}
                    </Link>
                    </li>
                ))}
                </ul>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('support')}</h3>
                <ul className="space-y-2 text-sm">
                {supportLinks.map((link) => (
                    <li key={link.href}>
                    <Link 
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {link.label}
                    </Link>
                    </li>
                ))}
                </ul>
            </div>
            </div>
          </div>


        <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {t('copyright', { year: currentYear })}
          </div>
        </div>
      </div>
    </footer>
  );
}