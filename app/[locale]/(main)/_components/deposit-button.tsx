'use client'

import { CirclePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

const DepositButton = () => {
    const t = useTranslations('Deposit');

    return (
        <Link href="/transactions/new/deposit" className="flex items-center font-medium bg-white text-black px-3 py-1 rounded-full text-lg">
            <CirclePlus className="mr-2" width={18} height={18} />
            {t('button')}
        </Link>
    );
}
 
export default DepositButton;