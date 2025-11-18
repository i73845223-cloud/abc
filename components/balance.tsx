"use client";

import { useBalanceContext } from "@/contexts/balance-context";
import { Skeleton } from "@/components/ui/skeleton";

const Balance = () => {
  const { formattedBalance, isLoading } = useBalanceContext();

  if (isLoading) {
    return <Skeleton className="h-6 w-20" />;
  }

  return (
    <span>{formattedBalance}</span>
  );
};

export default Balance;