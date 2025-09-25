import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    script: `
      // Clear all Friday registration localStorage entries
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('fridayReg:') || key.startsWith('prayer_') || key.startsWith('device_key')) {
          localStorage.removeItem(key);
        }
      });
      console.log('LocalStorage cleared for Friday Prayer Registration');
    `
  });
}