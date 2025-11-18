"use client"

import { MinusIcon, PlusIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { TransactionColumn, useTransactionColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useTranslations } from 'next-intl'

interface TransactionsProps {
  data: TransactionColumn[];
  isBlocked: boolean;
}

export const Transactions = ({ data, isBlocked }: TransactionsProps) => {
  const router = useRouter()
  const t = useTranslations('Transactions')
  const columns = useTransactionColumns()

  const handleClick = (path: string) => {
    if (!isBlocked) {
      router.push(path);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>{t('transactionHistory')}</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={() => handleClick('/transactions/new/deposit')}
              disabled={isBlocked}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              {t('deposit')}
            </Button>
            <Button 
              onClick={() => handleClick('/transactions/new/withdrawal')}
              disabled={isBlocked}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MinusIcon className="h-4 w-4" />
              {t('withdraw')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-1 sm:p-6">
        {isBlocked && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('accountBlocked')}
            </AlertDescription>
          </Alert>
        )}
        
        <DataTable
          columns={columns} 
          data={data}
        />
      </CardContent>
    </Card>
  )
}