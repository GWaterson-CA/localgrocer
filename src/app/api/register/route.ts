import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { hash } from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Email already in use.' },
        { status: 400 }
      );
    }

    const hashed = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
      },
    });

    return NextResponse.json(
      { success: true, userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during registration.' },
      { status: 500 }
    );
  }
} 