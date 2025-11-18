'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'

interface SlotGame {
  name: string
  image: string
  href: string
  demoHref: string
}

interface SlotGameCardProps {
  game: SlotGame
}

export default function SlotGameCard({ game }: SlotGameCardProps) {
  const t = useTranslations('Slots')

  return (
    <div className="relative group rounded-xl overflow-hidden">
      <Image
        className="rounded-xl transition-opacity group-hover:opacity-75"
        src={game.image}
        width={400}
        height={400}
        alt='preview'
      />
      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl border-2 border-red-600">
        <h3 className="absolute top-4 left-4 text-white text-xl font-bold">
          {game.name}
        </h3>
        <Link
          href={game.href}
          className="flex justify-center items-center p-10 bg-red-600 rounded-full hover:bg-red-700 group/play transition-colors relative scale-125"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            className="absolute transition-opacity group-hover/play:opacity-0"
            style={{ color: "var(--accent_color_6)" }}
          >
            <path d="M27.538 13.625 13.45 5.545a4.987 4.987 0 0 0-7.48 4.376v16.216a4.988 4.988 0 0 0 7.48 4.317l14.088-8.079a4.988 4.988 0 0 0 0-8.633v-.117Z" fill="white" />
          </svg>
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute opacity-0 transition-opacity group-hover/play:opacity-100"
            style={{ color: "var(--accent_color_6)" }}
          >
            <path d="M27.538 13.625 13.45 5.545a4.987 4.987 0 0 0-7.48 4.376v16.216a4.988 4.988 0 0 0 7.48 4.317l14.088-8.079a4.988 4.988 0 0 0 0-8.633v-.117Z" fill="white" />
          </svg>
        </Link>
        <Link
          href={game.demoHref}
          className="text-white rounded-md transition-colors text-center hover:text-red-600 mt-2 absolute bottom-5 text-xl"
        >
          {t('demo')}
        </Link>
      </div>
    </div>
  )
}