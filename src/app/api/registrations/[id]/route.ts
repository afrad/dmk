import { NextRequest, NextResponse } from 'next/server';
import { updateRegistration, cancelRegistration, getRegistration } from '@/lib/prayers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { people } = body;

    if (typeof people !== 'number' || people < 1 || people > 5) {
      return NextResponse.json(
        { error: 'Invalid people count' },
        { status: 400 }
      );
    }

    await updateRegistration(id, people);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating registration:', error);

    if (error instanceof Error) {
      if (error.message === 'Registration not found') {
        return NextResponse.json(
          { error: 'Registration not found' },
          { status: 404 }
        );
      }
      if (error.message === 'Not enough capacity') {
        return NextResponse.json(
          { error: 'Not enough capacity' },
          { status: 409 }
        );
      }
      if (error.message === 'Registration is not active') {
        return NextResponse.json(
          { error: 'Registration is not active' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await cancelRegistration(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error cancelling registration:', error);

    return NextResponse.json(
      { error: 'Failed to cancel registration' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const registration = await getRegistration(id);

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: registration.id,
      prayer: {
        id: registration.prayer.id,
        title: registration.prayer.title,
        datetime: registration.prayer.datetime.toISOString(),
        location: registration.prayer.location
      },
      people: registration.people,
      status: registration.status,
      qr_payload: JSON.parse(registration.qr_payload_text),
      created_at: registration.created_at.toISOString()
    });
  } catch (error) {
    console.error('Error fetching registration:', error);

    return NextResponse.json(
      { error: 'Failed to fetch registration' },
      { status: 500 }
    );
  }
}