import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
  const { userId, household, members } = await req.json();
  if (!userId || !household || !members) {
    return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
  }
  try {
    const created = await prisma.household.create({
      data: {
        name: household.name,
        potsPref: household.potsPref,
        prepTimePref: household.prepTimePref,
        familyFavoriteMeals: household.familyFavoriteMeals as any,
        storePrefs: {
          create: household.storePrefs.map((store: string) => ({ store }))
        },
        members: {
          create: members.map((m: any) => ({
            name: m.name,
            age: m.age ? parseInt(m.age) : null,
            gender: m.gender || null,
            dietTags: m.dietTags,
            likedIngredients: m.likedIngredients,
            dislikedIngredients: m.dislikedIngredients,
            favoriteMeals: m.favoriteMeals
          }))
        },
        users: {
          create: {
            userId,
            role: 'OWNER'
          }
        }
      }
    });
    return NextResponse.json({ success: true, householdId: created.id });
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Failed to create household.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url!);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Missing userId.' }, { status: 400 });
  }
  try {
    const householdUser = await prisma.householdUser.findFirst({
      where: { userId },
      include: {
        household: {
          include: {
            members: true,
            storePrefs: true,
            plans: true
          }
        }
      }
    });
    if (!householdUser) {
      return NextResponse.json({ success: false, message: 'No household found for user.' }, { status: 404 });
    }
    // Optionally fetch ratings for this user
    const ratings = await prisma.rating.findMany({ where: { userId } });
    return NextResponse.json({
      success: true,
      household: householdUser.household,
      ratings
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Failed to fetch household.' }, { status: 500 });
  }
} 