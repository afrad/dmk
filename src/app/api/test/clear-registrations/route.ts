import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE() {
  try {
    // Clear all registrations for testing
    const result = await prisma.registration.deleteMany({});

    return NextResponse.json({
      message: `Deleted ${result.count} registrations`,
      count: result.count
    });
  } catch (error) {
    console.error('Error clearing registrations:', error);
    return NextResponse.json(
      { error: 'Failed to clear registrations' },
      { status: 500 }
    );
  }
}