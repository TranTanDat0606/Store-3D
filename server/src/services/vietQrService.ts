import QRCode from 'qrcode';

interface VietQrBank {
  bin: string;
  accountNumber: string;
  accountName: string;
}

const BANK_NAMES: Record<string, string> = {
  '970418': 'Vietcombank',
  '970415': 'Sacombank',
  '970421': 'VietinBank',
  '970422': 'BIDV',
  '970436': 'VPBank',
  '970448': 'OCB',
  '970454': 'TPBank',
  '970462': 'Eximbank',
  '970443': 'SHB',
  '970489': 'MSB',
};

export function getBankName(bin: string): string {
  return BANK_NAMES[bin] ?? `Ngân hàng (${bin})`;
}

function tlv(tag: string, value: string): string {
  const len = Buffer.byteLength(value, 'utf8');
  return `${tag}${String(len).padStart(2, '0')}${value}`;
}

/** CRC-16/CCITT (poly 0x1021, init 0xFFFF, non-reflected). */
export function crc16(data: string): number {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc & 0xffff;
}

export function buildVietQrPayload(bank: VietQrBank, amount: number, content: string): string {
  const merchantAccount =
    tlv('00', 'A000000727') + tlv('01', bank.bin) + tlv('02', bank.accountNumber);
  const billInfo = tlv('01', content);
  const withoutCrc =
    '000201010212' +
    tlv('26', merchantAccount) +
    tlv('52', '0000') +
    tlv('53', '704') +
    tlv('54', String(amount)) +
    tlv('58', 'VN') +
    tlv('59', bank.accountName) +
    tlv('62', billInfo);
  const crcHex = crc16(withoutCrc + '6304').toString(16).toUpperCase().padStart(4, '0');
  return `${withoutCrc}6304${crcHex}`;
}

export async function renderQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { width: 480, margin: 2, errorCorrectionLevel: 'M' });
}
