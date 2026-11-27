export const PAID_APP_ACCOUNT = {
  bank: "BIDV",
  accountNumber: "96247193979",
  accountName: "TRAN NGOC HOANG ANH",
} as const;

export function buildVietQrUrl(amount: number, transferCode: string): string {
  return `https://img.vietqr.io/image/bidv-${PAID_APP_ACCOUNT.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    transferCode
  )}&accountName=${encodeURIComponent(PAID_APP_ACCOUNT.accountName)}`;
}

export function isPaidAppRecipient(gateway?: string, subAccount?: string | null): boolean {
  return gateway?.trim().toUpperCase() === PAID_APP_ACCOUNT.bank &&
    subAccount?.trim() === PAID_APP_ACCOUNT.accountNumber;
}
