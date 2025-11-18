'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/lib/i18n/navigation'
import { useTransition } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const UKFlag = () => (
  <div className="w-[35px] h-[25px] overflow-hidden flex items-center justify-center rounded-sm">
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 60 30" 
      className="h-[25px] w-[50px] scale-[1.3]"
      preserveAspectRatio="xMidYMid meet"
    >
      <clipPath id="uk-t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#00247d"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-t)" stroke="#cf142b" strokeWidth="4"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#cf142b" strokeWidth="6"/>
    </svg>
  </div>
)

const IndiaFlag = () => (
  <div className="w-[35px] h-[25px] overflow-hidden flex items-center justify-center rounded-sm">
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 225 150" 
      className="h-[25px] w-[37.5px]"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="225" height="150" fill="#f93"/>
      <rect width="225" height="50" y="50" fill="#fff"/>
      <rect width="225" height="50" y="100" fill="#128807"/>
      <g transform="translate(112.5,75)">
        <circle r="20" fill="#008"/>
        <circle r="17.5" fill="#fff"/>
        <circle r="3.5" fill="#008"/>
        <g id="india-d">
          <g id="india-c">
            <g id="india-b">
              <g id="india-a">
                <circle r="0.875" fill="#008" transform="rotate(7.5) translate(17.5)"/>
                <path fill="#008" d="M 0,17.5 0.6,7 C 0.6,7 0,2 0,2 0,2 -0.6,7 -0.6,7 L 0,17.5 z"/>
              </g>
              <use xlinkHref="#india-a" transform="rotate(15)"/>
            </g>
            <use xlinkHref="#india-b" transform="rotate(30)"/>
          </g>
          <use xlinkHref="#india-c" transform="rotate(60)"/>
        </g>
        <use xlinkHref="#india-d" transform="rotate(120)"/>
        <use xlinkHref="#india-d" transform="rotate(-120)"/>
      </g>
    </svg>
  </div>
)

const languages = [
  {
    value: 'hi',
    label: 'HI',
    nativeName: 'हिन्दी',
    flag: <IndiaFlag />
  },
  {
    value: 'en',
    label: 'EN',
    nativeName: 'English',
    flag: <UKFlag />
  }
] as const

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()

  const currentLanguage = languages.find(lang => lang.value === locale)

  const onSelectChange = (nextLocale: string) => {
    startTransition(() => {
      const newPath = `/${nextLocale}${pathname}`
      
      window.location.href = newPath
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <button
          className={cn(
            "flex items-center gap-2 focus:outline-none",
            isPending && "opacity-50 cursor-not-allowed"
          )}
        >
          {currentLanguage && (
            <>
              {currentLanguage.flag}
              <span className="font-medium text-lg text-white uppercase sm:block hidden">
                {currentLanguage.label}
              </span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-48 rounded-lg border border-gray-600 bg-black shadow-2xl"
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.value}
            onClick={() => onSelectChange(language.value)}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer transition-colors duration-150",
              "hover:bg-gray-800 focus:bg-gray-800",
              locale === language.value && "bg-gray-800"
            )}
          >
            {language.flag}
            <div className="flex flex-col items-start flex-1">
              <span className="font-medium text-sm text-white">
                {language.nativeName}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}