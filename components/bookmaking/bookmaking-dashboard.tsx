'use client';

import { useState, useEffect, useRef } from 'react';
import { Book } from '@/app/types/bookmaking';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Trophy,
  ArrowRight,
  Star,
  Flame,
  Zap,
  Calendar,
  Filter,
  Search,
  Globe,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import BettingSlipWrapper from './betting-slip-wrapper';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useDebounce } from '@/hooks/use-debounce';
import Image from 'next/image';
import { SPORT_ICONS } from '@/lib/images';

interface SelectedOutcome {
  id: string;
  name: string;
  odds: number;
  eventName: string;
  bookTitle: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  totalCount: number;
}

interface ClientBookmakingDashboardProps {
  initialBooks: Book[];
  initialPagination: PaginationInfo;
  initialCategories: string[];
  initialChampionships: string[];
  categoryParam?: string;
  filterParam?: string;
  searchParam?: string;
}

type FilterType = 'all' | 'hot' | 'national' | string;

const CATEGORY_ORDER = [
  'cricket',
  'football',
  'basketball',
  'tennis',
  'table-tennis',
  'horse-racing',
  'e-sports',
  'kabaddi',
  'badminton',
  'volleyball',
  'boxing',
  'mma',
  'ufc',
];

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

export default function ClientBookmakingDashboard({
  initialBooks,
  initialPagination,
  initialCategories,
  initialChampionships,
  categoryParam,
  filterParam,
  searchParam,
}: ClientBookmakingDashboardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedOutcome, setSelectedOutcome] = useState<SelectedOutcome | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>(filterParam || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParam || '');
  const [championships, setChampionships] = useState<string[]>(initialChampionships);
  const t = useTranslations('Events');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const fetchChampionships = async () => {
      if (categoryParam) {
        try {
          const url = new URL('/api/bookmaking/client/championships', window.location.origin);
          if (categoryParam && categoryParam !== 'all') {
            url.searchParams.set('category', categoryParam);
          }
          const response = await fetch(url.toString());
          if (response.ok) {
            const data = await response.json();
            setChampionships(data);
          }
        } catch (error) {
          console.error('Error fetching championships:', error);
        }
      } else {
        setChampionships(initialChampionships);
      }
    };
    fetchChampionships();
  }, [categoryParam, initialChampionships]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (debouncedSearch.trim()) {
      url.searchParams.set('search', debouncedSearch.trim());
    } else {
      url.searchParams.delete('search');
    }
    if (activeFilter === 'all') {
      url.searchParams.delete('filter');
    } else {
      url.searchParams.set('filter', activeFilter);
    }
    url.searchParams.delete('page');
    router.push(url.toString());
  }, [debouncedSearch, activeFilter, router]);

  const handleOutcomeClick = (outcome: any, event: any, book: any) => {
    if (!session) {
      router.push(`/login?callbackUrl=/book/${book.id}`);
      return;
    }
    const now = new Date();
    const bookDate = new Date(book.date);
    if (now >= bookDate) {
      alert(t('betsClosedAlert'));
      return;
    }
    setSelectedOutcome({
      id: outcome.id,
      name: outcome.name,
      odds: outcome.odds,
      eventName: event.name,
      bookTitle: book.title,
    });
    setIsSlipOpen(true);
  };

  const handleBetPlaced = () => {
    setIsSlipOpen(false);
    setSelectedOutcome(null);
    router.refresh();
  };

  const formatCategoryForDisplay = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  const formatCategoryForURL = (category: string) => {
    return category.toLowerCase();
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveFilter('all');
  };

  const handlePageChange = (newPage: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    router.push(url.toString());
  };

  const scrollQuickLinks = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const books = initialBooks || [];
  const categories = initialCategories || [];
  const pagination = initialPagination || {
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  const categoriesWithBooks = [...new Set(books.map((book) => book.category.toLowerCase()))];
  const sortedCategories = CATEGORY_ORDER.filter((cat) => categoriesWithBooks.includes(cat));

  const booksByCountryAndChampionship = books.reduce((acc, book) => {
    const country = book.country || 'International';
    const championship = book.championship || 'Other';

    if (!acc[country]) {
      acc[country] = {};
    }
    if (!acc[country][championship]) {
      acc[country][championship] = [];
    }
    acc[country][championship].push(book);
    return acc;
  }, {} as Record<string, Record<string, Book[]>>);

  const sortedCountries = Object.keys(booksByCountryAndChampionship).sort((a, b) =>
    a.localeCompare(b)
  );

  const hasHotEvents = books.some((book) => book.isHotEvent);
  const hasNationalEvents = books.some((book) => book.isNationalSport);
  const hasChampionships = championships.length > 0;
  const currentCategoryDisplay = categoryParam ? formatCategoryForDisplay(categoryParam) : 'All Sports';
  const hasActiveSearchOrFilter = Boolean(searchQuery || activeFilter !== 'all');

  const showAccordionView = activeFilter === 'all' && !searchQuery && !categoryParam;

  return (
    <div className="container mx-auto px-4 py-6 lg:space-y-6 space-y-3 pb-[70px] lg:pb-0">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search events, teams, or championships..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-20"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Searching for: &quot;<span className="font-medium">{searchQuery}</span>&quot;
            </p>
          )}
        </CardContent>
      </Card>

      {initialCategories.length > 0 && (
        <div className="my-4">
          <div className="relative hidden sm:block">
            <div className="relative group/carousel">
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth pb-2"
              >
                {CATEGORY_ORDER.filter(cat => initialCategories.includes(cat)).map((categorySlug) => {
                  const icon = categoryIconMap[categorySlug.toLowerCase()];
                  const displayName = formatCategoryForDisplay(categorySlug);
                  const href = `/book/category/${formatCategoryForURL(categorySlug)}`;
                  return (
                    <Link
                      key={categorySlug}
                      href={href}
                      className="flex flex-col items-center gap-1 min-w-[72px] snap-start group"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-900 flex items-center justify-center transition-transform group-hover:scale-105">
                        {icon && (
                          <Image
                            src={icon}
                            alt={displayName}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-center">
                        {displayName}
                      </span>
                    </Link>
                  );
                })}
              </div>
              <button
                onClick={() => scrollQuickLinks('left')}
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm border rounded-full h-8 w-8 items-center justify-center shadow-md"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollQuickLinks('right')}
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm border rounded-full h-8 w-8 items-center justify-center shadow-md"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative sm:hidden">
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth pb-2"
            >
              {CATEGORY_ORDER.filter(cat => initialCategories.includes(cat)).map((categorySlug) => {
                const icon = categoryIconMap[categorySlug.toLowerCase()];
                const displayName = formatCategoryForDisplay(categorySlug);
                const href = `/book/category/${formatCategoryForURL(categorySlug)}`;
                return (
                  <Link
                    key={categorySlug}
                    href={href}
                    className="flex flex-col items-center gap-1 min-w-[64px] snap-start group"
                  >
                    <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center">
                      {icon && (
                        <Image
                          src={icon}
                          alt={displayName}
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      )}
                    </div>
                    <span className="text-xs font-medium text-center">{displayName}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {categories.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <span className="font-medium text-sm sm:text-base">{t('categories')}:</span>
              <div className="flex flex-wrap gap-2">
                <Link href="/book">
                  <Button
                    variant={!categoryParam ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    {t('allEvents')}
                  </Button>
                </Link>
                {categories.map((category) => (
                  <Link key={category} href={`/book/category/${formatCategoryForURL(category)}`}>
                    <Button
                      variant={
                        categoryParam && categoryParam.toLowerCase() === category.toLowerCase()
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      {formatCategoryForDisplay(category)}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm sm:text-base">
                {currentCategoryDisplay} Filters:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('all')}
                className="text-xs sm:text-sm"
              >
                <Zap className="h-3 w-3 mr-1" />
                All Matches
              </Button>

              {hasHotEvents && (
                <Button
                  variant={activeFilter === 'hot' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('hot')}
                  className="text-xs sm:text-sm"
                >
                  <Flame className="h-3 w-3 mr-1" />
                  Hot Matches
                </Button>
              )}

              {hasNationalEvents && (
                <Button
                  variant={activeFilter === 'national' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('national')}
                  className="text-xs sm:text-sm"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  National Sports
                </Button>
              )}

              {hasChampionships &&
                championships.map((championship) => (
                  <Button
                    key={championship}
                    variant={activeFilter === championship ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange(championship)}
                    className="text-xs sm:text-sm"
                  >
                    <Trophy className="h-3 w-3 mr-1" />
                    {championship}
                  </Button>
                ))}
            </div>
          </div>

          {hasActiveSearchOrFilter && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Currently viewing:</span>

                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Search: &quot;{searchQuery}&quot;
                  </Badge>
                )}

                {activeFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {activeFilter === 'hot' ? (
                      <>
                        <Flame className="h-3 w-3" />
                        Hot Matches
                      </>
                    ) : activeFilter === 'national' ? (
                      <>
                        <Globe className="h-3 w-3" />
                        National Sports
                      </>
                    ) : (
                      <>
                        <Trophy className="h-3 w-3" />
                        {activeFilter}
                      </>
                    )}
                  </Badge>
                )}

                <span className="text-muted-foreground">in</span>
                <Badge variant="outline">{currentCategoryDisplay}</Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="h-6 text-xs ml-2"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {books.length === 0 ? (
        <NoBooksCard
          category={categoryParam}
          filter={activeFilter}
          searchQuery={searchQuery}
          hasActiveSearchOrFilter={hasActiveSearchOrFilter}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {books.length} of {pagination.totalCount} matches
              {searchQuery && ` for "${searchQuery}"`}
            </p>
            {hasActiveSearchOrFilter && (
              <Button variant="outline" size="sm" onClick={handleClearSearch} className="text-xs">
                Clear Filters
              </Button>
            )}
          </div>

          {showAccordionView ? (
            /* Accordion View: Grouped by Country → Championship */
            <div className="space-y-6">
              {sortedCountries.map((country) => {
                const championships = booksByCountryAndChampionship[country];
                const championshipNames = Object.keys(championships).sort();
                const totalBooksInCountry = championshipNames.reduce(
                  (sum, champ) => sum + championships[champ].length,
                  0
                );

                return (
                  <Accordion
                    key={country}
                    type="single"
                    collapsible
                    defaultValue={country}
                    className="border rounded-lg overflow-hidden"
                  >
                    <AccordionItem value={country} className="border-none">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30 hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                          <span className="font-semibold text-base">{country}</span>
                          <Badge variant="secondary" className="ml-2">
                            {totalBooksInCountry}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pt-2 pb-4">
                        <div className="space-y-4">
                          {championshipNames.map((championship) => {
                            const champBooks = championships[championship];
                            return (
                              <div key={championship} className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Trophy className="h-4 w-4 text-yellow-500" />
                                  <h3 className="font-medium text-sm">{championship}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {champBooks.length}
                                  </Badge>
                                </div>
                                <div className="space-y-3">
                                  {champBooks.map((book) => (
                                    <BookCard
                                      key={book.id}
                                      book={book}
                                      onOutcomeClick={handleOutcomeClick}
                                      currentCategory={categoryParam}
                                      isUserLoggedIn={!!session}
                                      showChampionshipLink={false}
                                      searchQuery={searchQuery}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                );
              })}
            </div>
          ) : (
            /* Flat List View (when filters or search are active) */
            <div className="space-y-4">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onOutcomeClick={handleOutcomeClick}
                  currentCategory={categoryParam}
                  isUserLoggedIn={!!session}
                  showChampionshipLink={activeFilter !== book.championship}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <ShadcnPagination pagination={pagination} onPageChange={handlePageChange} />
          )}
        </>
      )}

      <BettingSlipWrapper
        isOpen={isSlipOpen}
        onClose={() => {
          setIsSlipOpen(false);
          setSelectedOutcome(null);
        }}
        outcome={selectedOutcome}
        onBetPlaced={handleBetPlaced}
      />
    </div>
  );
}

function BookCard({
  book,
  onOutcomeClick,
  currentCategory,
  isUserLoggedIn,
  showChampionshipLink = true,
  searchQuery = '',
}: {
  book: Book;
  onOutcomeClick: (outcome: any, event: any, book: any) => void;
  currentCategory?: string;
  isUserLoggedIn: boolean;
  showChampionshipLink?: boolean;
  searchQuery?: string;
}) {
  const t = useTranslations('Events');
  const locale = useLocale();
  const router = useRouter();

  const bookStatus = book.displayStatus || (book.isLive ? 'LIVE' : 'UPCOMING');
  const firstFastBet = book.events?.find((event) => event.isFirstFastOption);
  const secondFastBet = book.events?.find((event) => event.isSecondFastOption);
  const mainTeams = book.teams?.slice(0, 2) || [];
  const capitalizedStatus = bookStatus.charAt(0).toUpperCase() + bookStatus.slice(1).toLowerCase();
  const now = new Date();
  const bookDate = new Date(book.date);
  const isAcceptingBets = now < bookDate;
  const displayCategory = book.category.charAt(0).toUpperCase() + book.category.slice(1).toLowerCase();

  const formattedDate = new Date(book.date).toLocaleString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleChampionshipClick = (championship: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('filter', championship);
    url.searchParams.delete('page');
    router.push(url.toString());
  };

  const renderFastBetOutcomes = (event: any, isFirst: boolean = false) => {
    if (!event || !event.outcomes || event.outcomes.length === 0) return null;

    return (
      <div
        className={`p-3 sm:p-4 rounded-lg border border-border bg-muted/20 ${
          isFirst ? 'flex-1' : 'w-full'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-yellow-500 shrink-0" />
          <span className="text-sm font-semibold truncate flex-1" title={event.name}>
            {searchQuery ? highlightText(event.name, searchQuery) : event.name}
          </span>
        </div>
        <div
          className={`gap-2 sm:gap-3 w-full justify-between ${
            isFirst
              ? 'xl:flex grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3'
              : 'lg:flex grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
          }`}
        >
          {event.outcomes.map((outcome: any) => (
            <div
              key={outcome.id}
              className={`flex items-center justify-between w-full p-2 sm:p-3 bg-background rounded-lg border border-border transition-all duration-200 group ${
                isAcceptingBets && isUserLoggedIn
                  ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/30'
                  : isAcceptingBets && !isUserLoggedIn
                  ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/30 border-primary/30'
                  : 'cursor-not-allowed opacity-60'
              }`}
              onClick={() => {
                if (!isAcceptingBets) return;
                onOutcomeClick(outcome, event, book);
              }}
            >
              <span
                className={`text-xs sm:text-sm font-medium truncate mr-2 flex-1 ${
                  isAcceptingBets ? 'group-hover:text-primary' : ''
                }`}
              >
                {searchQuery ? highlightText(outcome.name, searchQuery) : outcome.name}
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs sm:text-sm shrink-0 min-w-10 sm:min-w-12 text-center ${
                    isAcceptingBets ? 'bg-primary/20 group-hover:bg-primary/30' : 'bg-muted'
                  }`}
                >
                  {outcome.odds.toFixed(2)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        {!isAcceptingBets && (
          <div className="mt-2 text-xs text-muted-foreground text-center">{t('betsClosed')}</div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-4 sm:p-6 hover:shadow-md transition-shadow bg-card border-border relative">
      {book.isHotEvent && (
        <div className="absolute -top-2 -left-2 z-10">
          <Badge className="bg-orange-500 text-white flex items-center gap-1">
            <Flame className="h-3 w-3" />
            Hot
          </Badge>
        </div>
      )}

      {book.isNationalSport && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-blue-500 text-white flex items-center gap-1">
            <Globe className="h-3 w-3" />
            National
          </Badge>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          {book.image && (
            <img
              src={book.image}
              alt={book.title}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border border-border shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 mb-2">
              <h3 className="font-semibold text-lg sm:text-xl truncate text-foreground">
                {searchQuery ? highlightText(book.title, searchQuery) : book.title}
              </h3>
              <div className="flex gap-2 sm:flex-row flex-col">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs bg-muted w-fit">
                    {displayCategory}
                  </Badge>
                  <Badge
                    variant={
                      bookStatus === 'LIVE'
                        ? 'default'
                        : bookStatus === 'UPCOMING'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="text-xs w-fit"
                  >
                    {capitalizedStatus}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {!isAcceptingBets && (
                    <Badge variant="outline" className="text-xs bg-destructive/20 text-destructive">
                      {t('betsClosedBadge')}
                    </Badge>
                  )}
                  {book.country && (
                    <Badge variant="outline" className="text-xs">
                      {book.country}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="text-xs sm:text-sm">{formattedDate}</span>
              </div>
            </div>

            {book.championship && showChampionshipLink && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChampionshipClick(book.championship!)}
                  className="h-6 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  <Trophy className="h-3 w-3 mr-1" />
                  {searchQuery ? highlightText(book.championship, searchQuery) : book.championship}
                </Button>
              </div>
            )}
          </div>
        </div>

        <Link href={`/book/${book.id}`} className="w-full sm:w-auto">
          <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">
            {t('allOutcomes')}
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 lg:mb-4">
        {mainTeams.length > 0 && (
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 lg:mb-0 lg:w-[400px] lg:shrink-0">
            {mainTeams.map((team) => (
              <div key={team.id} className="flex items-center gap-2 sm:gap-3">
                {team.image && (
                  <img
                    src={team.image}
                    alt={team.name}
                    className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover border border-border shrink-0"
                  />
                )}
                <span className="text-sm sm:text-base font-medium text-foreground truncate">
                  {searchQuery ? highlightText(team.name, searchQuery) : team.name}
                </span>
              </div>
            ))}
            {book.teams && book.teams.length > 2 && (
              <Badge variant="outline" className="text-xs bg-muted w-fit">
                {t('moreTeams', { count: book.teams.length - 2 })}
              </Badge>
            )}
          </div>
        )}

        <div className="lg:flex-1 mb-4 lg:mb-0">
          {firstFastBet && renderFastBetOutcomes(firstFastBet, true)}
        </div>
      </div>

      <div className="w-full">{secondFastBet && renderFastBetOutcomes(secondFastBet, false)}</div>

      {!firstFastBet && !secondFastBet && (
        <div className="text-center py-6 sm:py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <Trophy className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">{t('noFastBets')}</p>
        </div>
      )}
    </Card>
  );
}

function NoBooksCard({
  category,
  filter,
  searchQuery,
  hasActiveSearchOrFilter,
}: {
  category?: string;
  filter?: string;
  searchQuery?: string;
  hasActiveSearchOrFilter?: boolean;
}) {
  const t = useTranslations('Events');

  let message = t('noBooksAvailable');
  let description = t('noBooksAvailableDescription');

  if (searchQuery) {
    message = 'No matches found';
    description = `No matches found for "${searchQuery}". Try adjusting your search terms or filters.`;
  } else if (category) {
    message = t('noBooksInCategory', { category });
    description = t('noBooksInCategoryDescription');
  } else if (filter === 'hot') {
    message = 'No Hot Matches Available';
    description = 'There are currently no hot matches. Check back later for exciting events!';
  } else if (filter === 'national') {
    message = 'No National Sports Events Available';
    description = 'There are currently no national sports events. Check back later for national competitions!';
  } else if (filter && filter !== 'all') {
    message = `No Matches in ${filter}`;
    description = `There are currently no matches in the ${filter} championship.`;
  }

  return (
    <Card className="text-center py-8 sm:py-12 bg-card border-border">
      <CardContent>
        <Trophy className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-semibold mb-2">{message}</h3>
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">{description}</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/book">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              {t('viewAllEvents')}
            </Button>
          </Link>
          {hasActiveSearchOrFilter && (
            <Link href="/book">
              <Button variant="default" size="sm" className="w-full sm:w-auto">
                Clear Filters
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ShadcnPagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations('Common');
  const { currentPage, totalPages } = pagination;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (end === totalPages) {
        start = Math.max(1, totalPages - maxVisiblePages + 1);
      }

      for (let i = start; i <= end; i++) pages.push(i);

      if (start > 1) {
        pages.unshift(1);
        if (start > 2) pages.splice(1, 0, 'ellipsis-start');
      }

      if (end < totalPages) {
        pages.push(totalPages);
        if (end < totalPages - 1) pages.splice(pages.length - 1, 0, 'ellipsis-end');
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border">
      <div className="text-sm text-muted-foreground">
        {t('pageInfo', { current: currentPage, total: totalPages })}
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) onPageChange(currentPage - 1);
              }}
              className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>

          {getPageNumbers().map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page as number);
                  }}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) onPageChange(currentPage + 1);
              }}
              className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}