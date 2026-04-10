'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { SPORT_ICONS } from '@/lib/images';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useRef, useEffect, useState } from 'react';
import { Flame, Globe } from 'lucide-react';

const categoryIconMap: Record<string, string> = {
  cricket: SPORT_ICONS.cricket,
  football: SPORT_ICONS.football,
  basketball: SPORT_ICONS.basketball,
  tennis: SPORT_ICONS.tennis,
  'table-tennis': SPORT_ICONS.tabletennis,
  'horse-racing': SPORT_ICONS.horse,
  'e-sports': SPORT_ICONS.gaming,
  kabaddi: SPORT_ICONS.kabaddi,
  badminton: SPORT_ICONS.badminton,
  volleyball: SPORT_ICONS.volleyball,
  boxing: SPORT_ICONS.boxing,
  mma: SPORT_ICONS.mma,
  ufc: SPORT_ICONS.ufc,
};

export default function QuickLinks() {
  const t = useTranslations('Home');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const fireIcon = SPORT_ICONS.fire || null;
  const nationalIcon = SPORT_ICONS.india;

  useEffect(() => {
    fetch('/api/bookmaking/client/categories')
      .then((res) => res.json())
      .then((data) => {
        const cats = Array.isArray(data) ? data : data.categories || [];
        setCategories(cats);
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  const formatCategoryForDisplay = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  const items = [
    {
      href: '/promo',
      label: t('promo'),
      icon: SPORT_ICONS.promo,
    },
    {
      href: '/book?filter=national',
      label: t('national'),
      icon: nationalIcon,
    },
    ...categories.map((slug) => ({
      href: `/book/category/${slug}`,
      label: formatCategoryForDisplay(slug),
      icon: categoryIconMap[slug] || null,
    })),
  ];

  return (
    <div className="mt-3 mb-1 sm:mt-6 sm:mb-3 px-3">
      <div className="relative hidden sm:block">
        <Carousel
          opts={{ align: 'start', loop: false }}
          className="w-full group/carousel"
        >
          <CarouselContent className="-ml-2">
            {items.map((item) => (
              <CarouselItem key={item.href} className="pl-2 basis-auto">
                <Link
                  href={item.href}
                  className="flex flex-col items-center gap-1 min-w-[72px] group"
                >
                  <div className="w-16 h-16 rounded-full border-gray-500 border flex items-center justify-center">
                    {item.icon ? (
                      <Image
                        src={item.icon}
                        alt={item.label}
                        width={32}
                        height={32}
                        className="object-contain transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <Flame className="h-8 w-8 text-orange-500" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-center block w-full min-w-0 truncate">
                    {item.label}
                  </span>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:disabled:opacity-0 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm border-2 disabled:opacity-0 h-8 w-8" />
          <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:disabled:opacity-0 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm border-2 disabled:opacity-0 h-8 w-8" />
        </Carousel>
      </div>

      <div className="relative sm:hidden">
        <div
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth pb-2"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 min-w-[56px] snap-start group"
            >
              <div className="w-16 h-16 rounded-full border-gray-500 border flex items-center justify-center">
                {item.icon ? (
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={32}
                    height={32}
                    className="object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <Flame className="h-6 w-6 text-orange-500" />
                )}
              </div>
              <span className="text-xs font-medium text-center block w-full min-w-0 truncate">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}