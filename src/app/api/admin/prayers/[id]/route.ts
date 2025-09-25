import { NextRequest, NextResponse } from 'next/server';
import { getPrayerById, updatePrayer, deletePrayer } from '@/lib/prayers';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request);

    const { id } = await params;
    const prayer = await getPrayerById(id);
    if (!prayer) {
      return NextResponse.json(
        { error: 'Prayer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...prayer,
      datetime: prayer.datetime.toISOString(),
      created_at: prayer.created_at.toISOString(),
      updated_at: prayer.updated_at.toISOString(),
      registrationCount: prayer.registrations.length,
      totalPeople: prayer.registrations.reduce((sum, reg) => sum + reg.people, 0)
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching prayer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prayer' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request);

    const { id } = await params;
    const body = await request.json();
    const { title, datetime, capacity, location, notes, active, auto_activation } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (datetime !== undefined) updateData.datetime = datetime;
    if (capacity !== undefined) {
      if (typeof capacity !== 'number' || capacity < 1) {
        return NextResponse.json(
          { error: 'Capacity must be a positive number' },
          { status: 400 }
        );
      }
      updateData.capacity = capacity;
    }
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;
    if (active !== undefined) updateData.active = Boolean(active);
    if (auto_activation !== undefined) updateData.auto_activation = Boolean(auto_activation);

    const prayer = await updatePrayer(id, updateData);

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

    console.error('Error updating prayer:', error);
    return NextResponse.json(
      { error: 'Failed to update prayer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request);

    const { id } = await params;
    await deletePrayer(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error deleting prayer:', error);
    return NextResponse.json(
      { error: 'Failed to delete prayer' },
      { status: 500 }
    );
  }
}