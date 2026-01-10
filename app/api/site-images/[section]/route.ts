import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';

interface SiteImage {
  id: string;
  section: string;
  url: string;
  alt_text_en: string | null;
  alt_text_sv: string | null;
  active: number;
  created_at: number;
  updated_at: number;
}

// GET - Fetch a specific site image by section (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  try {
    const { section } = await params;
    const db = getDB();

    const image = await db
      .prepare('SELECT * FROM site_images WHERE section = ? AND active = 1')
      .bind(section)
      .first<SiteImage>();

    if (!image) {
      return NextResponse.json({ image: null });
    }

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Error fetching site image:', error);
    // Return null image instead of error for public endpoint
    return NextResponse.json({ image: null });
  }
}

