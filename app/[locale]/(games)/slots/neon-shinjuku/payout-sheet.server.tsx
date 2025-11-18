import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import { Info } from "lucide-react";
import { PAYOUTS } from "./slot-machine.data";

export function PayoutsSheet() {
  return (
    <Sheet>
      <SheetTrigger>
        <div className="text-white hover:text-purple-300 transition-colors fixed top-4 md:top-16 md:left-2 left-14 xl:ml-8 xl:pt-3 z-10 cursor-pointer">
          <Info size={36} />
        </div>
      </SheetTrigger>
      <SheetContent side="left" className="bg-black">
        <div className="xl:p-6 h-full overflow-y-auto">
          <h2 className="text-3xl font-bold text-purple-500 mb-6">Payouts</h2>
          
          <div className="space-y-6">
            {PAYOUTS.map((item, index) => (
              <div key={index} className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="xl:w-12 xl:h-12 w-8 h-8 mr-3 flex-shrink-0">
                    <Image 
                      src={item.symbol} 
                      alt="symbol"
                      width={48} 
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  {item.combinations.map((combo, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center">
                        {Array.from({ length: combo.count }).map((_, j) => (
                          <div key={j} className="xl:w-8 w-6 xl:h-8 h-6 mx-0.5">
                            <Image 
                              src={item.symbol} 
                              alt="symbol"
                              width={32} 
                              height={32}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ))}
                      </div>
                      <span className="text-purple-400 font-bold text-lg">
                        {combo.multiplier}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}