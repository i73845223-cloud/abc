import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardSkeleton() {
  return (
    <div className="max-w-[800px] mx-auto px-1 px:px-4 py-6 space-y-6">
      <Skeleton className="h-10 w-full rounded-md" />

      <div className="flex gap-2 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-20 rounded-full shrink-0" />
        ))}
      </div>

      {[...Array(3)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-0 bg-black">
            <div className="px-4 py-3">
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="p-4 space-y-4">
              {[...Array(2)].map((_, j) => (
                <Skeleton key={j} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}