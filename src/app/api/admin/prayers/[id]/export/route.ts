import { NextRequest, NextResponse } from 'next/server';
import { getRegistrationsByPrayer, getPrayerById } from '@/lib/prayers';
import { requireAuth } from '@/lib/auth';

export async function POST(
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

    const registrations = await getRegistrationsByPrayer(id);

    // Generate CSV
    const headers = ['ID', 'People', 'Language', 'Status', 'Created At', 'Updated At'];
    const csvRows = [
      headers.join(','),
      ...registrations.map(reg => [
        reg.id,
        reg.people.toString(),
        reg.lang,
        reg.status,
        reg.created_at.toISOString(),
        reg.updated_at.toISOString()
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="prayer-${id}-registrations.csv"`
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error exporting registrations:', error);
    return NextResponse.json(
      { error: 'Failed to export registrations' },
      { status: 500 }
    );
  }
}