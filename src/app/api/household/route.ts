import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { userId, household, members } = await req.json();
    
    // Validate required fields
    if (!userId || !household || !members) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields.' },
        { status: 400 }
      );
    }

    // Validate household data
    if (!household.name) {
      return NextResponse.json(
        { success: false, message: 'Household name is required.' },
        { status: 400 }
      );
    }

    // Validate members data
    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one household member is required.' },
        { status: 400 }
      );
    }

    // Create household with all related data
    const created = await prisma.household.create({
      data: {
        name: household.name,
        potsPref: household.potsPref || 1,
        prepTimePref: household.prepTimePref || 20,
        familyFavoriteMeals: household.familyFavoriteMeals ? JSON.parse(JSON.stringify(household.familyFavoriteMeals)) : [],
        storePrefs: {
          create: (household.storePrefs || []).map((store: string) => ({ store }))
        },
        members: {
          create: members.map((m: any) => ({
            name: m.name || '',
            age: m.age ? Number(m.age) : 0,
            gender: m.gender || 'PREFER_NOT_TO_SAY',
            dietTags: m.dietTags || [],
            likedIngredients: m.likedIngredients || [],
            dislikedIngredients: m.dislikedIngredients || [],
            favoriteMeals: m.favoriteMeals || []
          }))
        },
        users: {
          create: {
            userId,
            role: 'OWNER'
          }
        }
      },
      include: {
        members: true,
        storePrefs: true,
        users: true
      }
    });

    return NextResponse.json(
      { success: true, householdId: created.id, household: created },
      { status: 201 }
    );
  } catch (error) {
    console.error('Household creation error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, message: 'A household with this name already exists.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, message: 'Failed to create household. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url!);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Missing userId.' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { success: false, message: 'No household found for user.' },
        { status: 404 }
      );
    }

    const ratings = await prisma.rating.findMany({ where: { userId } });
    
    return NextResponse.json({
      success: true,
      household: householdUser.household,
      ratings
    });
  } catch (error) {
    console.error('Household fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch household.' },
      { status: 500 }
    );
  }
} 