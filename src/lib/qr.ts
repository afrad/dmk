import QRCode from 'qrcode';
import { QRPayload } from '@/types';

export async function generateQRCode(payload: QRPayload): Promise<string> {
  const jsonString = JSON.stringify(payload);

  try {
    const qrDataURL = await QRCode.toDataURL(jsonString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}