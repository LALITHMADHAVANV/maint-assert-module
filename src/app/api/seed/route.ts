import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    const result = await seedDatabase(true);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await seedDatabase(true);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
