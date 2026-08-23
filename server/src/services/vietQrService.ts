const BANK_NAMES: Record<string, string> = {
  '970418': 'Vietcombank',
  '970415': 'Sacombank',
  '970421': 'VietinBank',
  '970422': 'BIDV',
  '970436': 'VPBank',
  '970448': 'OCB',
  '970423': 'TPBank – Tiên Phong Bank',
  '970462': 'Eximbank',
  '970443': 'SHB',
  '970489': 'MSB',
};

export function getBankName(bin: string): string {
  return BANK_NAMES[bin] ?? `Ngân hàng (${bin})`;
}

export interface VietQrQuickLinkParams {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  content: string;
}

/**
 * Official VietQR Quick Link URL. The QR image is rendered by the VietQR
 * service (img.vietqr.io) from the official VietQR standard — no manual
 * EMV payload assembly, no local CRC computation.
 */
export function buildVietQrQuickLink({
  bin,
  accountNumber,
  accountName,
  amount,
  content,
}: VietQrQuickLinkParams): string {
  const base = `https://img.vietqr.io/image/${bin}-${accountNumber}-qr_only.png`;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: content,
    accountName,
  });
  return `${base}?${params.toString()}`;
}
