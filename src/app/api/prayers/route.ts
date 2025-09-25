import { NextRequest, NextResponse } from 'next/server';
import { getPrayers } from '@/lib/prayers';

export async function GET() {
  try {
    const prayers = await getPrayers();

    const publicPrayers = prayers.map(prayer => ({
      id: prayer.id,
      title: prayer.title,
      datetime: prayer.datetime.toISOString(),
      location: prayer.location,
      capacity: prayer.capacity,
      remaining: prayer.remaining,
      status: prayer.status
    }));

    return NextResponse.json(publicPrayers);
  } catch (error) {
    console.error('Error fetching prayers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prayers' },
      { status: 500 }
    );
  }
}