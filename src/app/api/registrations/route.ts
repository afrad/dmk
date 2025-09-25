import { NextRequest, NextResponse } from 'next/server';
import { registerForPrayer } from '@/lib/prayers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prayer_id, people, device_key, lang } = body;

    // Validate input
    if (!prayer_id || !people || !device_key || !lang) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (typeof people !== 'number' || people < 1 || people > 5) {
      return NextResponse.json(
        { error: 'Invalid people count' },
        { status: 400 }
      );
    }

    const result = await registerForPrayer({
      prayer_id,
      people,
      device_key,
      lang
    });

    return NextResponse.json({
      id: result.id,
      qr: result.qr
    });
  } catch (error) {
    console.error('Error creating registration:', error);

    if (error instanceof Error) {
      if (error.message === 'Prayer not found') {
        return NextResponse.json(
          { error: 'Prayer not found' },
          { status: 404 }
        );
      }
      if (error.message === 'Not enough capacity') {
        return NextResponse.json(
          { error: 'Not enough capacity' },
          { status: 409 }
        );
      }
      if (error.message === 'Device already registered') {
        return NextResponse.json(
          { error: 'Device already registered for this prayer' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}