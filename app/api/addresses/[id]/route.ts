import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getAddressById, updateAddress, deleteAddress } from '@/lib/db/queries/addresses';

const updateAddressSchema = z.object({
  label: z.string().optional(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  company: z.string().optional(),
  address_line1: z.string().min(1).optional(),
  address_line2: z.string().optional(),
  city: z.string().min(1).optional(),
  state_province: z.string().optional(),
  postal_code: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  phone: z.string().optional(),
  is_default: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = getDB();
    const address = await getAddressById(db, id, session.userId);

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Get address error:', error);
    return NextResponse.json(
      { error: 'Failed to get address' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateAddressSchema.parse(body);

    const db = getDB();
    
    // Verify address belongs to user
    const address = await getAddressById(db, id, session.userId);
    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    await updateAddress(db, id, session.userId, validated);

    const updatedAddress = await getAddressById(db, id, session.userId);
    return NextResponse.json({ address: updatedAddress });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update address error:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = getDB();
    
    // Verify address belongs to user
    const address = await getAddressById(db, id, session.userId);
    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    await deleteAddress(db, id, session.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}

