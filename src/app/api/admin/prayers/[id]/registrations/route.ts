import { NextRequest, NextResponse } from 'next/server';
import { getRegistrationsByPrayer } from '@/lib/prayers';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request);

    const { id } = await params;
    const registrations = await getRegistrationsByPrayer(id);

    return NextResponse.json(registrations.map(reg => ({
      id: reg.id,
      people: reg.people,
      lang: reg.lang,
      status: reg.status,
      created_at: reg.created_at.toISOString(),
      updated_at: reg.updated_at.toISOString()
    })));
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}