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
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Trophy,
  ArrowRight,
  Star,
  Flame,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Globe,
} from 'lucide-react';
import BettingSlipWrapper from './betting-slip-wrapper';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  // initialPagination: PaginationInfo;
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
  // initialPagination,
  initialCategories,
  initialChampionships,
  categoryParam,
  filterParam,
  searchParam,
}: ClientBookmakingDashboardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('Events');
  const locale = useLocale();
  const [selectedOutcome, setSelectedOutcome] = useState<SelectedOutcome | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState(searchParam || '');
  const [championships, setChampionships] = useState<string[]>(initialChampionships);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filterFromUrl = searchParams.get('filter') || 'all';
    setActiveFilter(filterFromUrl);
  }, [searchParams]);

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
  }, [debouncedSearch, activeFilter, router, pathname]);

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
  // const pagination = initialPagination || {
  //   currentPage: 1,
  //   totalPages: 0,
  //   hasNext: false,
  //   hasPrev: false,
  // };

  const hasHotEvents = books.some((book) => book.isHotEvent);
  const hasNationalEvents = books.some((book) => book.isNationalSport);
  const currentCategoryDisplay = categoryParam ? formatCategoryForDisplay(categoryParam) : t('allSports');
  const hasActiveSearchOrFilter = Boolean(searchQuery || activeFilter !== 'all');
  const isMainPage = !categoryParam;
  const showAccordionView = activeFilter === 'all' && !searchQuery;

  const sortBooksByHot = (booksArray: Book[]) => {
    return [...booksArray].sort((a, b) => {
      if (a.isHotEvent && !b.isHotEvent) return -1;
      if (!a.isHotEvent && b.isHotEvent) return 1;
      return 0;
    });
  };

  const filteredBooks = (() => {
    if (activeFilter === 'all') return books;
    if (activeFilter === 'hot') return books.filter((b) => b.isHotEvent);
    if (activeFilter === 'national') return books.filter((b) => b.isNationalSport);
    return books.filter((b) => b.championship === activeFilter);
  })();

  const getGroupedData = () => {
    if (isMainPage) {
      // Main page: group by category, then by championship
      const groupedByCategory: Record<
        string,
        {
          championships: Record<string, Book[]>;
          noChampionship: Book[];
        }
      > = {};

      filteredBooks.forEach((book) => {
        const cat = book.category.toLowerCase();
        if (!groupedByCategory[cat]) {
          groupedByCategory[cat] = { championships: {}, noChampionship: [] };
        }
        if (book.championship) {
          if (!groupedByCategory[cat].championships[book.championship]) {
            groupedByCategory[cat].championships[book.championship] = [];
          }
          groupedByCategory[cat].championships[book.championship].push(book);
        } else {
          groupedByCategory[cat].noChampionship.push(book);
        }
      });

      const sortedCategories = CATEGORY_ORDER.filter((cat) => groupedByCategory[cat]);
      const result = sortedCategories.map((cat) => {
        const catData = groupedByCategory[cat];

        // Determine which championships have hot events
        const championshipHasHot = Object.entries(catData.championships).reduce(
          (acc, [champ, champBooks]) => {
            acc[champ] = champBooks.some((b) => b.isHotEvent);
            return acc;
          },
          {} as Record<string, boolean>
        );

        const sortedChampionships = Object.keys(catData.championships).sort((a, b) => {
          if (championshipHasHot[a] && !championshipHasHot[b]) return -1;
          if (!championshipHasHot[a] && championshipHasHot[b]) return 1;
          return a.localeCompare(b);
        });

        return {
          category: cat,
          championships: sortedChampionships.map((champ) => ({
            name: champ,
            books: sortBooksByHot(catData.championships[champ]),
          })),
          noChampionshipBooks: sortBooksByHot(catData.noChampionship),
        };
      });

      return { type: 'main' as const, data: result };
    } else {
      // Category page: group by championship
      const withChampionship: Record<string, Book[]> = {};
      const withoutChampionship: Book[] = [];
      filteredBooks.forEach((book) => {
        if (book.championship) {
          if (!withChampionship[book.championship]) withChampionship[book.championship] = [];
          withChampionship[book.championship].push(book);
        } else {
          withoutChampionship.push(book);
        }
      });
      const championshipHasHot = Object.entries(withChampionship).reduce(
        (acc, [champ, champBooks]) => {
          acc[champ] = champBooks.some((b) => b.isHotEvent);
          return acc;
        },
        {} as Record<string, boolean>
      );
      const sortedChampionships = Object.keys(withChampionship).sort((a, b) => {
        if (championshipHasHot[a] && !championshipHasHot[b]) return -1;
        if (!championshipHasHot[a] && championshipHasHot[b]) return 1;
        return a.localeCompare(b);
      });
      return {
        type: 'category' as const,
        data: {
          championships: sortedChampionships.map((champ) => ({
            name: champ,
            books: sortBooksByHot(withChampionship[champ]),
          })),
          noChampionshipBooks: sortBooksByHot(withoutChampionship),
        },
      };
    }
  };

  const groupedData = showAccordionView ? getGroupedData() : null;

  const fireIcon = SPORT_ICONS.fire || null;
  const nationalIcon = SPORT_ICONS.india;

  return (
    <div className="container mx-auto px-1 px:px-4 py-6 lg:space-y-6 space-y-3 pb-[70px] lg:pb-0 max-w-[800px]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8 pr-2"
        />
      </div>

      {initialCategories.length > 0 && (
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
                <CarouselItem className="pl-2 basis-auto">
                  <Link
                    href="/book"
                    className="flex flex-col items-center gap-1 min-w-[72px] group"
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                        !categoryParam && activeFilter === 'all'
                          ? 'border-primary border-2'
                          : 'border-gray-500 border'
                      }`}
                    >
                      {fireIcon ? (
                        <Image
                          src={fireIcon}
                          alt={t('allSports')}
                          width={32}
                          height={32}
                          className="object-contain transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <Flame className="h-8 w-8 text-orange-500" />
                      )}
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-medium text-center ${
                        !categoryParam && activeFilter === 'all' ? 'text-primary' : ''
                      }`}
                    >
                      {t('allSports')}
                    </span>
                  </Link>
                </CarouselItem>

                <CarouselItem className="pl-2 basis-auto">
                  <Link
                    href="/book?filter=national"
                    className="flex flex-col items-center gap-1 min-w-[72px] group"
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                        !categoryParam && activeFilter === 'national'
                          ? 'border-primary border-2'
                          : 'border-gray-500 border'
                      }`}
                    >
                      {nationalIcon ? (
                        <Image
                          src={nationalIcon}
                          alt={t('national')}
                          width={32}
                          height={32}
                          className="object-contain transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <Globe className="h-8 w-8 text-blue-500" />
                      )}
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-medium text-center ${
                        !categoryParam && activeFilter === 'national' ? 'text-primary' : ''
                      }`}
                    >
                      {t('national')}
                    </span>
                  </Link>
                </CarouselItem>

                {initialCategories.map((categorySlug) => {
                  const normalizedSlug = categorySlug.toLowerCase();
                  const icon = categoryIconMap[normalizedSlug];
                  const displayName = formatCategoryForDisplay(categorySlug);
                  const href = `/book/category/${formatCategoryForURL(categorySlug)}`;
                  const isActive = categoryParam?.toLowerCase() === normalizedSlug;

                  return (
                    <CarouselItem key={categorySlug} className="pl-2 basis-auto">
                      <Link
                        href={href}
                        className="flex flex-col items-center gap-1 min-w-[72px] group"
                      >
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                            isActive
                              ? 'border-primary border-2'
                              : 'border-gray-500 border'
                          }`}
                        >
                          {icon ? (
                            <Image
                              src={icon}
                              alt={displayName}
                              width={32}
                              height={32}
                              className="object-contain transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <Trophy className="h-8 w-8 text-white" />
                          )}
                        </div>
                        <span
                          className={`text-xs sm:text-sm font-medium text-center ${
                            isActive ? 'text-primary' : ''
                          }`}
                        >
                          {displayName}
                        </span>
                      </Link>
                    </CarouselItem>
                  );
                })}
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
              <Link
                href="/book"
                className="flex flex-col items-center gap-1 min-w-[56px] snap-start group"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    !categoryParam && activeFilter === 'all'
                      ? 'border-primary border-2'
                      : 'border-gray-500 border'
                  }`}
                >
                  {fireIcon ? (
                    <Image
                      src={fireIcon}
                      alt={t('allSports')}
                      width={24}
                      height={24}
                      className="object-contain transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <Flame className="h-6 w-6 text-orange-500" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium text-center ${
                    !categoryParam && activeFilter === 'all' ? 'text-primary' : ''
                  }`}
                >
                  {t('allSports')}
                </span>
              </Link>

              <Link
                href="/book?filter=national"
                className="flex flex-col items-center gap-1 min-w-[56px] snap-start group"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    !categoryParam && activeFilter === 'national'
                      ? 'border-primary border-2'
                      : 'border-gray-500 border'
                  }`}
                >
                  {nationalIcon ? (
                    <Image
                      src={nationalIcon}
                      alt={t('national')}
                      width={24}
                      height={24}
                      className="object-contain transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <Globe className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium text-center ${
                    !categoryParam && activeFilter === 'national' ? 'text-primary' : ''
                  }`}
                >
                  {t('national')}
                </span>
              </Link>

              {initialCategories.map((categorySlug) => {
                const normalizedSlug = categorySlug.toLowerCase();
                const icon = categoryIconMap[normalizedSlug];
                const displayName = formatCategoryForDisplay(categorySlug);
                const href = `/book/category/${formatCategoryForURL(categorySlug)}`;
                const isActive = categoryParam?.toLowerCase() === normalizedSlug;

                return (
                  <Link
                    key={categorySlug}
                    href={href}
                    className="flex flex-col items-center gap-1 min-w-[56px] snap-start group"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'border-primary border-2'
                          : 'border-gray-500 border'
                      }`}
                    >
                      {icon ? (
                        <Image
                          src={icon}
                          alt={displayName}
                          width={24}
                          height={24}
                          className="object-contain transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <Trophy className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium text-center ${
                        isActive ? 'text-primary' : ''
                      }`}
                    >
                      {displayName}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {filteredBooks.length === 0 ? (
        <NoBooksCard
          category={categoryParam}
          filter={activeFilter}
          searchQuery={searchQuery}
          hasActiveSearchOrFilter={hasActiveSearchOrFilter}
        />
      ) : (
        <>
          {showAccordionView && groupedData ? (
            <div className="space-y-4">
              {groupedData.type === 'main' ? (
                (() => {
                  const categoriesCount = groupedData.data.length;
                  const defaultOpenCategories =
                    categoriesCount <= 2 ? groupedData.data.map((item) => item.category) : [];

                  return groupedData.data.map(
                    ({ category, championships, noChampionshipBooks }) => {
                      const icon = categoryIconMap[category];
                      const displayName = formatCategoryForDisplay(category);

                      const championshipsCount = championships.length;
                      const defaultOpenChampionships =
                        championshipsCount <= 2 ? championships.map((c) => c.name) : [];

                      const totalBooks =
                        championships.reduce((acc, c) => acc + c.books.length, 0) +
                        noChampionshipBooks.length;

                      return (
                        <Accordion
                          key={category}
                          type="single"
                          collapsible
                          defaultValue={
                            defaultOpenCategories.includes(category) ? category : undefined
                          }
                          className="border rounded-xl overflow-hidden"
                        >
                          <AccordionItem value={category} className="border-none">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30 hover:bg-muted/50">
                              <div className="flex items-center gap-3">
                                {icon && (
                                  <Image
                                    src={icon}
                                    alt={displayName}
                                    width={24}
                                    height={24}
                                    className="object-contain"
                                  />
                                )}
                                <span className="font-semibold text-base">{displayName}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              <div className="space-y-3 py-2">
                                {championships.map(({ name, books }) => (
                                  <Accordion
                                    key={name}
                                    type="single"
                                    collapsible
                                    defaultValue={
                                      defaultOpenChampionships.includes(name) ? name : undefined
                                    }
                                    className="border rounded-lg overflow-hidden ml-2"
                                  >
                                    <AccordionItem value={name} className="border-none">
                                      <AccordionTrigger className="px-3 py-2 hover:no-underline bg-muted/20 hover:bg-muted/40">
                                        <div className="flex items-center gap-2">
                                          <Trophy className="h-4 w-4 text-yellow-500" />
                                          <span className="font-medium text-sm">{name}</span>
                                          <Badge variant="secondary" className="ml-2 text-xs">
                                            {books.length}
                                          </Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="pb-0">
                                        <div className="space-y-2 pt-1">
                                          {books.map((book) => (
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
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                ))}

                                {noChampionshipBooks.length > 0 && (
                                  <div className="space-y-2 ml-2">
                                    <div className="flex items-center gap-2 px-1">
                                      <Trophy className="h-3 w-3 text-muted-foreground" />
                                      <h4 className="font-medium text-xs text-muted-foreground">
                                        {t('otherEvents')}
                                      </h4>
                                    </div>
                                    {noChampionshipBooks.map((book) => (
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
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      );
                    }
                  );
                })()
              ) : (
                // Category page rendering
                (() => {
                  const championshipsCount = groupedData.data.championships.length;
                  const defaultOpenChampionships =
                    championshipsCount <= 2
                      ? groupedData.data.championships.map((item) => item.name)
                      : [];

                  return (
                    <>
                      {groupedData.data.championships.map(({ name, books }) => (
                        <Accordion
                          key={name}
                          type="single"
                          collapsible
                          defaultValue={
                            defaultOpenChampionships.includes(name) ? name : undefined
                          }
                          className="border rounded-xl overflow-hidden"
                        >
                          <AccordionItem value={name} className="border-none">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30 hover:bg-muted/50">
                              <div className="flex items-center gap-3">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                <span className="font-semibold text-base">{name}</span>
                                <Badge variant="secondary" className="ml-2">
                                  {books.length}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              <div className="space-y-3">
                                {books.map((book) => (
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
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))}
                      {groupedData.data.noChampionshipBooks.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 px-1">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium text-sm text-muted-foreground">
                              {t('otherEvents')}
                            </h3>
                          </div>
                          {groupedData.data.noChampionshipBooks.map((book) => (
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
                      )}
                    </>
                  );
                })()
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBooks.map((book) => (
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

          {/* Pagination (commented out in original) */}
          {/* {pagination.totalPages > 1 && (
            <ShadcnPagination pagination={pagination} onPageChange={handlePageChange} />
          )} */}
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
  const now = new Date();
  const bookDate = new Date(book.date);
  const isAcceptingBets = now < bookDate;
  const sportName = book.category.charAt(0).toUpperCase() + book.category.slice(1).toLowerCase();

  const formattedDate = new Date(book.date).toLocaleString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
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

  const handleChampionshipClick = (e: React.MouseEvent, championship: string) => {
    e.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set('filter', championship);
    url.searchParams.delete('page');
    router.push(url.toString());
  };

  const handleOutcomeClickWrapper = (e: React.MouseEvent, outcome: any, event: any, book: any) => {
    e.stopPropagation();
    if (!isAcceptingBets) return;
    onOutcomeClick(outcome, event, book);
  };

  const handleCardClick = () => {
    router.push(`/book/${book.id}`);
  };

  const getOutcomeLabel = (outcome: any, index: number, total: number): string => {
    if (total === 3) {
      if (index === 0) return '1';
      if (index === 1) return 'X';
      return '2';
    }
    if (total === 2) {
      if (index === 0) return '1';
      return '2';
    }
    const name = outcome.name.trim().toLowerCase();
    if (name.includes('home') || name.includes('team 1')) return '1';
    if (name.includes('away') || name.includes('team 2')) return '2';
    if (name.includes('draw') || name.includes('tie')) return 'X';
    return outcome.name.length > 3 ? outcome.name.slice(0, 3) : outcome.name;
  };

  const renderFastBetOutcomes = (event: any) => {
    if (!event || !event.outcomes || event.outcomes.length === 0) return null;

    // Sort outcomes by order
    const outcomes = event.outcomes;
    const sortedOutcomes = [...outcomes].sort((a: any, b: any) => a.order - b.order);
    const gridCols = sortedOutcomes.length === 2 ? 'grid-cols-2' : sortedOutcomes.length === 3 ? 'grid-cols-3' : 'grid-cols-1';

    return (
      <div className="mt-3 px-2 pb-2">
        <div className="text-sm font-medium text-foreground truncate mb-2 text-center">
          {searchQuery ? highlightText(event.name, searchQuery) : event.name}
        </div>
        <div className={`grid ${gridCols} gap-2`}>
          {sortedOutcomes.map((outcome: any, idx: number) => (
            <div
              key={outcome.id}
              className={`flex flex-col items-center justify-center p-2 min-h-[50px] bg-background rounded-lg border border-border transition-all duration-200 group/outcome ${
                isAcceptingBets && isUserLoggedIn
                  ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/30'
                  : isAcceptingBets && !isUserLoggedIn
                  ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/30 border-primary/30'
                  : 'cursor-not-allowed opacity-60'
              }`}
              onClick={(e) => handleOutcomeClickWrapper(e, outcome, event, book)}
            >
              <span
                className={`text-xl font-extrabold text-sky-400 ${
                  isAcceptingBets ? 'group-hover/outcome:text-sky-300' : ''
                }`}
              >
                {outcome.odds.toFixed(2)}
              </span>
              <span
                className={`text-[10px] text-center font-medium ${
                  isAcceptingBets ? 'group-hover/outcome:text-primary' : ''
                }`}
              >
                {getOutcomeLabel(outcome, idx, sortedOutcomes.length)}
              </span>
            </div>
          ))}
        </div>
        {!isAcceptingBets && (
          <div className="text-xs text-muted-foreground text-center mt-1">{t('betsClosed')}</div>
        )}
      </div>
    );
  };

  const mainDisplayText = book.championship
    ? book.championship
    : mainTeams.length >= 2
    ? `${mainTeams[0].name} vs ${mainTeams[1].name}`
    : book.title;

  return (
    <Card
      className="hover:shadow-md transition-shadow bg-black border-border cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="pb-1 mb-3 border-b border-border pt-2">
        <div className="flex items-center gap-2 px-4">
          <span className="text-xs font-medium text-muted-foreground truncate">
            {sportName}. {mainDisplayText}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-3 px-4">
        {mainTeams.map((team) => (
          <div key={team.id} className="flex items-center gap-2">
            {team.image && (
              <img
                src={team.image}
                alt={team.name}
                className="w-6 h-6 rounded-full object-cover border border-border shrink-0"
              />
            )}
            <span className="text-sm font-medium text-foreground truncate">
              {searchQuery ? highlightText(team.name, searchQuery) : team.name}
            </span>
          </div>
        ))}
        {book.teams && book.teams.length > 2 && (
          <Badge variant="outline" className="text-xs bg-muted w-fit px-2 py-0">
            {t('moreTeams', { count: book.teams.length - 2 })}
          </Badge>
        )}
      </div>

      <div className="text-xs text-muted-foreground mb-1 px-4">{formattedDate}</div>

      {firstFastBet && renderFastBetOutcomes(firstFastBet)}
      {secondFastBet && renderFastBetOutcomes(secondFastBet)}

      {(firstFastBet || secondFastBet) && (
        <div className="px-2 pb-2 mt-1">
          <Link
            href={`/book/${book.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block w-full"
          >
            <Button variant="outline" size="sm" className="w-full text-xs h-8">
              {t('viewAllOptions')}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {!firstFastBet && !secondFastBet && (
        <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg">
          <Trophy className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t('noFastBets')}</p>
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
    message = t('noBooksAvailable');
    description = `${t('noBooksAvailableDescription')} "${searchQuery}".`;
  } else if (category) {
    message = t('noBooksInCategory', { category });
    description = t('noBooksInCategoryDescription');
  } else if (filter === 'hot') {
    message = t('noBooksAvailable');
    description = t('noBooksAvailableDescription');
  } else if (filter === 'national') {
    message = t('noBooksAvailable');
    description = t('noBooksAvailableDescription');
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
                {t('clearAll')}
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
  const t = useTranslations('Events');
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