import SlotsHeader from './slots-main-header'
import SlotsCarousel from './slots-main-carousel'

export default async function SlotsServer() {
  return (
    <div className="mt-5 space-y-2 pb-[70px] lg:pb-0">
      <SlotsHeader />
      <SlotsCarousel />
    </div>
  )
}