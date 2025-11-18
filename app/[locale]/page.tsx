import { Suspense } from "react";
import Banners from "./(main)/_components/banners";
import UpcomingMatches from "./(main)/_components/upcoming-matches/upcoming-matches";
import SlotsMainServer from "./(main)/_components/slots-main/slots-main-server";
import Loading from "../loading";
import Header from "./(main)/_components/header";
import LowerNav from "./(main)/_components/lower-nav";
import Footer from "./(main)/_components/footer";

function HomeContent() {
  return (
    <>
      <Header />
      <div className="pb-[45px] sm:pb-0 pt-[66px]">
        <Banners />
        <div className="sm:px-8 px-3 mb-8">
          <Suspense fallback={
            <div className="mt-5 space-y-2">
              <div className="h-8 w-64 bg-muted/20 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 bg-muted/20 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          }>
            <UpcomingMatches />
          </Suspense>
          
          <SlotsMainServer />
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