import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getGeneralSettings } from '@/lib/db/queries/settings';

/**
 * GET /api/test/default-language
 * Test endpoint to check what default_language is stored in database
 */
export async function GET() {
  try {
    const db = getDB();
    const settings = await getGeneralSettings(db);
    
    return NextResponse.json({
      success: true,
      settings: settings,
      default_language: settings?.default_language || 'not set',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      stack: error?.stack,
    }, { status: 500 });
  }
}

