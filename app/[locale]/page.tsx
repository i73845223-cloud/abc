import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Banners from "./(main)/_components/banners";
import UpcomingMatches from "./(main)/_components/upcoming-matches/upcoming-matches";
import SlotsMainServer from "./(main)/_components/slots-main/slots-main-server";
import Loading from "../loading";
import Header from "./(main)/_components/header";
import LowerNav from "./(main)/_components/lower-nav";
import Footer from "./(main)/_components/footer";
import FootballMatches from "./(main)/_components/sport-matches/football-matches";
import CricketMatches from "./(main)/_components/sport-matches/cricket-matches";
import BasketballMatches from "./(main)/_components/sport-matches/basketball-matches";

function HomeContent() {
  return (
    <>
      <Header />
      <div className="pb-[45px] sm:pb-0 pt-[66px]">
        <Banners />
        <div className="sm:px-8 px-3 mb-8">
          <Suspense fallback={
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          }>
            <UpcomingMatches />
          </Suspense>
          
          <SlotsMainServer />
          <Suspense fallback={
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          }>
            <CricketMatches />
          </Suspense>
          <Suspense fallback={
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          }>
            <FootballMatches />
          </Suspense>
          <Suspense fallback={
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          }>
            <BasketballMatches />
          </Suspense>
        </div>
        <Footer />
      </div>
      <LowerNav />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}