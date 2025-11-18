import SlotsHeader from './slots-main-header'
import SlotsCarousel from './slots-main-carousel'

export default async function SlotsMainServer() {
  return (
    <div className="mt-5 space-y-2">
      <SlotsHeader />
      <SlotsCarousel />
    </div>
  )
}