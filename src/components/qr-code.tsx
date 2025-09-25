'use client';

import { useEffect, useState } from 'react';
import { QRPayload } from '@/types';

interface QRCodeProps {
  payload: QRPayload;
  size?: number;
  className?: string;
}

export function QRCode({ payload, size = 256, className }: QRCodeProps) {
  const [qrDataURL, setQRDataURL] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateQR();
  }, [payload]);

  const generateQR = async () => {
    try {
      const QRCodeLib = await import('qrcode');
      const jsonString = JSON.stringify(payload);

      const dataURL = await QRCodeLib.default.toDataURL(jsonString, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQRDataURL(dataURL);
    } catch (err) {
      setError('Failed to generate QR code');
      console.error('QR generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-100 text-red-600 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <img
      src={qrDataURL}
      alt="QR Code"
      className={`rounded-lg ${className}`}
      style={{ width: size, height: size }}
    />
  );
}