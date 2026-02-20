import { CryptoPaymentStatus, TransactionStatus } from '@prisma/client';

export function mapCryptoToTransactionStatus(
  cryptoStatus: CryptoPaymentStatus
): TransactionStatus {
  switch (cryptoStatus) {
    case CryptoPaymentStatus.FINISHED:
      return TransactionStatus.success;
    case CryptoPaymentStatus.FAILED:
    case CryptoPaymentStatus.EXPIRED:
      return TransactionStatus.fail;
    case CryptoPaymentStatus.PENDING:
    case CryptoPaymentStatus.CONFIRMING:
    case CryptoPaymentStatus.CONFIRMED:
    default:
      return TransactionStatus.pending;
  }
}