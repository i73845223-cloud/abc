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
import { useRef } from 'react';

export default function QuickLinks() {
  const t = useTranslations('Home');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: '/promo', label: t('promo'), icon: SPORT_ICONS.promo },
    { href: '/book', label: t('national'), icon: SPORT_ICONS.india },
    { href: '/book/category/cricket', label: t('cricket'), icon: SPORT_ICONS.cricket },
    { href: '/book/category/football', label: t('football'), icon: SPORT_ICONS.football },
    { href: '/book/category/basketball', label: t('basketball'), icon: SPORT_ICONS.basketball },
    { href: '/book/category/tennis', label: t('tennis'), icon: SPORT_ICONS.tennis },
    { href: '/book/category/table-tennis', label: t('table-tennis'), icon: SPORT_ICONS.tabletennis },
    { href: '/book/category/horse-racing', label: t('horse-racing'), icon: SPORT_ICONS.horse },
    { href: '/book/category/e-sports', label: t('e-sports'), icon: SPORT_ICONS.gaming },
    { href: '/book/category/kabaddi', label: t('kabaddi'), icon: SPORT_ICONS.kabaddi },
    { href: '/book/category/badminton', label: t('badminton'), icon: SPORT_ICONS.badminton },
    { href: '/book/category/volleyball', label: t('volleyball'), icon: SPORT_ICONS.volleyball },
    { href: '/book/category/boxing', label: t('boxing'), icon: SPORT_ICONS.boxing },
    { href: '/book/category/mma', label: t('mma'), icon: SPORT_ICONS.mma },
    { href: '/book/category/ufc', label: t('ufc'), icon: SPORT_ICONS.ufc },
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
}

  return (
    <div className="mt-3 mb-1 sm:mt-6 sm:mb-3 px-1">
      <div className="relative hidden sm:block">
        <Carousel
          opts={{
            align: 'start',
            loop: false,
          }}
          className="w-full group/carousel"
        >
          <CarouselContent className="-ml-2">
            {links.map((item) => (
              <CarouselItem key={item.href} className="pl-2 basis-auto">
                <Link
                  href={item.href}
                  className="flex flex-col items-center gap-1 min-w-[72px] group"
                >
                  <div className="w-16 h-16 rounded-full border-gray-500 border flex items-center justify-center">
                    {item.icon && (
                      <Image
                        src={item.icon}
                        alt={item.label}
                        width={32}
                        height={32}
                        className="object-contain transition-transform group-hover:scale-105"
                      />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-center">
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
      
      <div className="relative group/carousel sm:hidden">
        <div
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth pb-2"
        >
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 min-w-[56px] snap-start group"
            >
              <div className="w-12 h-12 rounded-full border-gray-500 border flex items-center justify-center">
                {item.icon && (
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={24}
                    height={24}
                    className="object-contain transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <span className="text-xs font-medium text-center">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}