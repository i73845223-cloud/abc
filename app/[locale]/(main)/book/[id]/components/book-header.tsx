"use client"

import { Book } from '@/app/types/bookmaking'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

interface BookHeaderProps {
  book: Book & { isLive: boolean; isUpcoming: boolean }
}

export default function BookHeader({ book }: BookHeaderProps) {
  const t = useTranslations('Book')
  const locale = useLocale()
  const acceptingBets = book.isUpcoming
  const hasTeams = book.teams && book.teams.length > 0

  const bookStatus = book.displayStatus || (book.isLive ? 'LIVE' : 'UPCOMING')
  const capitalizedStatus = bookStatus.charAt(0).toUpperCase() + bookStatus.slice(1).toLowerCase()

  const formattedDate = new Date(book.date).toLocaleString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  return (
    <>
      <div className="flex items-center gap-4 sm:mb-4">
        <Link href="/book" className="flex-shrink-0">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            {t('backToBooks')}
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight break-words">
              {book.title}
            </h1>
            <div className="flex flex-wrap gap-1 sm:gap-2 justify-start sm:justify-end">
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {book.category}
              </Badge>
              <Badge variant={
                book.isLive ? 'default' : 
                book.isUpcoming ? 'secondary' : 'outline'
              } className="text-xs sm:text-sm">
                {book.isLive ? 'LIVE' : capitalizedStatus}
              </Badge>
              {!acceptingBets && (
                <Badge variant="outline" className="text-xs sm:text-sm bg-destructive/20 text-destructive">
                  {t('betsClosed')}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground mb-4 sm:mb-6">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm break-words">
              {formattedDate}
            </span>
          </div>

          <Separator className="mb-4 sm:mb-6" />

          {hasTeams && (
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('teams')}
              </h2>
              
              <div className="block sm:hidden space-y-4">
                {book.teams!.map((team, index) => (
                  <div key={team.id} className="flex flex-col items-center">
                    {team.image && (
                      <img 
                        src={team.image} 
                        alt={team.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-muted mb-2"
                      />
                    )}
                    <span className="font-medium text-center text-sm sm:text-base">{team.name}</span>
                    {index < book.teams!.length - 1 && (
                      <div className="w-full flex sm:hidden justify-center pt-2">
                        <span className="text-lg font-bold text-muted-foreground">vs</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden sm:flex flex-wrap gap-4 md:gap-6 lg:gap-8 justify-center">
                {book.teams!.map((team, index) => (
                  <div key={team.id} className="flex flex-col items-center relative">
                    {team.image && (
                      <img 
                        src={team.image} 
                        alt={team.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-muted mb-2"
                      />
                    )}
                    <span className="font-medium text-center text-sm sm:text-base max-w-[120px] break-words">
                      {team.name}
                    </span>
                    {index < book.teams!.length - 1 && (
                      <div className="sm:hidden block absolute transform translate-x-full right-0 top-1/2 -translate-y-1/2">
                        <span className="text-lg font-bold text-muted-foreground mx-2">vs</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}