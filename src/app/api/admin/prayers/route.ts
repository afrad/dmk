import { NextRequest, NextResponse } from 'next/server';
import { getPrayers, createPrayer } from '@/lib/prayers';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    const prayers = await getPrayers();

    return NextResponse.json(prayers.map(prayer => ({
      ...prayer,
      datetime: prayer.datetime.toISOString(),
      created_at: prayer.created_at.toISOString(),
      updated_at: prayer.updated_at.toISOString(),
      registrationCount: prayer.registrations.length,
      totalPeople: prayer.registrations.reduce((sum, reg) => sum + reg.people, 0)
    })));
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching prayers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prayers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const body = await request.json();
    const { title, datetime, capacity, location, notes, active, auto_activation } = body;

    if (!title || !datetime || !capacity) {
      return NextResponse.json(
        { error: 'Title, datetime, and capacity are required' },
        { status: 400 }
      );
    }

    if (typeof capacity !== 'number' || capacity < 1) {
      return NextResponse.json(
        { error: 'Capacity must be a positive number' },
        { status: 400 }
      );
    }

    const prayer = await createPrayer({
      title,
      datetime,
      capacity,
      location: location || '',
      notes: notes || '',
      active: Boolean(active),
      auto_activation: Boolean(auto_activation)
    });

    return NextResponse.json({
      ...prayer,
      datetime: prayer.datetime.toISOString(),
      created_at: prayer.created_at.toISOString(),
      updated_at: prayer.updated_at.toISOString()
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error creating prayer:', error);
    return NextResponse.json(
      { error: 'Failed to create prayer' },
      { status: 500 }
    );
  }
}