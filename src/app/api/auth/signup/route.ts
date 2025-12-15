import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

// GET /api/auth/signup
// Returns options for signup form (stores, ZBM, ZSM)
export async function GET() {
  try {
    const [stores, zbms, zsms] = await Promise.all([
      prisma.store.findMany({ orderBy: { name: 'asc' } }),
      prisma.zBM.findMany({ orderBy: { fullName: 'asc' } }),
      prisma.zSM.findMany({ orderBy: { fullName: 'asc' } }),
    ]);

    return NextResponse.json({
      stores: stores.map((s) => ({
        id: s.id,
        name: s.name,
        city: s.city,
      })),
      zbms: zbms.map((z) => ({
        id: z.id,
        fullName: z.fullName,
        phone: z.phone,
        region: z.region,
      })),
      zsms: zsms.map((z) => ({
        id: z.id,
        fullName: z.fullName,
        phone: z.phone,
        region: z.region,
      })),
    });
  } catch (error) {
    console.error('Error in GET /api/auth/signup', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/auth/signup
// Creates a new user with validation=PENDING and all extra form fields in metadata
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      username,
      password,
      role,
      // everything else (fullName, phoneNumber, storeIds, managerId, ...)
      ...rest
    } = body ?? {};

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'username, password and role are required' },
        { status: 400 },
      );
    }

    // Ensure username is unique
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 },
      );
    }

    // Hash the password before saving
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        validation: 'PENDING',
        // all other signup fields go into metadata
        metadata: rest,
      },
    });

    // Never return the password
    const { password: _pw, ...safeUser } = user as any;

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/auth/signup', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}


