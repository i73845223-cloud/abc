"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import Link from "next/link"
import { useRef } from "react"
import { useLocale } from 'next-intl'
import Image from "next/image"
import { BANNER_IMAGES } from '@/lib/images'

const Banners = () => {
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  )
  const locale = useLocale()

  const banners = [
    { number: 1, href: "/promo" },
    { number: 2, href: "/book" },
    { number: 3, href: "/slots" },
    { number: 4, href: "/history" },
  ];

  return (
    <div className="flex justify-center relative">
        <Carousel
            className="w-full group/carousel"
            opts={{
                align: "start",
                loop: true,
            }}
            plugins={[plugin.current]}
          >
        <CarouselContent className="-ml-1">
            {banners.map((banner) => {
              const imageKey = `${banner.number}${locale}` as keyof typeof BANNER_IMAGES;
              const fallbackKey = `${banner.number}en` as keyof typeof BANNER_IMAGES;
              
              return (
                <CarouselItem key={banner.number} className="sm:pl-0 pl-2 basis-4/5 md:basis-1/2 lg:basis-1/3">
                  <div className="sm:p-1">
                    <Link href={banner.href} className="block" prefetch={false}>
                      <div className="relative w-full aspect-[3/2] rounded-md overflow-hidden">
                        <Image
                          src={BANNER_IMAGES[imageKey] || BANNER_IMAGES[fallbackKey]}
                          alt={`Banner ${banner.number}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 80vw, (max-width: 1024px) 50vw, 33vw"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = BANNER_IMAGES[fallbackKey];
                          }}
                        />
                      </div>
                    </Link>
                  </div>
                </CarouselItem>
              );
            })}
        </CarouselContent>

        <CarouselPrevious className="absolute left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:disabled:opacity-0 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm border-2 disabled:opacity-0" />
        <CarouselNext className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:disabled:opacity-0 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm border-2 disabled:opacity-0" />
      </Carousel>
    </div>
  )
}

export default Banners