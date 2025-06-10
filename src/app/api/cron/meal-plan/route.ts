import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { validateCronRequest } from '../config';
import { type NextRequest } from 'next/server';
import { type Recipe, type Ingredient, type FlyerItem, type Rating } from '@prisma/client';

interface ScoredRecipe {
  recipe: Recipe & { ingredients: Ingredient[] };
  score: number;
}

export async function GET(req: NextRequest) {
  if (!validateCronRequest(req as any)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get all active households
    const households = await prisma.household.findMany({
      where: {
        isActive: true
      },
      include: {
        members: true,
        preferences: true,
        ratings: {
          include: {
            recipe: true
          }
        }
      }
    });

    let totalPlansGenerated = 0;

    for (const household of households) {
      // Get household preferences
      const preferences = household.preferences;
      if (!preferences) continue;

      // Get recipes that match preferences
      const recipes = await prisma.recipe.findMany({
        where: {
          AND: [
            {
              OR: preferences.dietaryPreferences.map((pref: string) => ({
                dietaryPreferences: { has: pref }
              }))
            },
            {
              prepTime: {
                lte: preferences.maxPrepTime
              }
            },
            {
              isOnePot: preferences.preferOnePot
            }
          ]
        },
        include: {
          ingredients: true
        }
      });

      // Get current flyer items
      const flyerItems = await prisma.flyerItem.findMany({
        where: {
          store: {
            in: preferences.preferredStores
          },
          saleEnds: {
            gt: new Date()
          }
        }
      });

      // Score recipes based on ratings and potential savings
      const scoredRecipes = recipes.map((recipe: Recipe & { ingredients: Ingredient[] }) => {
        const householdRating = household.ratings.find((r: Rating) => r.recipeId === recipe.id);
        const ratingScore = householdRating ? householdRating.rating : 0;

        const savingsScore = recipe.ingredients.reduce((score: number, ingredient: Ingredient) => {
          const flyerItem = flyerItems.find((item: FlyerItem) => 
            item.name.toLowerCase().includes(ingredient.name.toLowerCase())
          );
          if (flyerItem) {
            const savings = (flyerItem.wasPrice - flyerItem.price) / flyerItem.wasPrice;
            return score + savings;
          }
          return score;
        }, 0);

        return {
          recipe,
          score: ratingScore + savingsScore
        };
      });

      // Sort recipes by score and select top 7
      const selectedRecipes = scoredRecipes
        .sort((a: ScoredRecipe, b: ScoredRecipe) => b.score - a.score)
        .slice(0, 7)
        .map((sr: ScoredRecipe) => sr.recipe);

      // Create meal plan
      const mealPlan = await prisma.mealPlan.create({
        data: {
          householdId: household.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          meals: {
            create: selectedRecipes.map((recipe: Recipe) => ({
              recipeId: recipe.id,
              scheduledFor: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000)
            }))
          }
        }
      });

      if (mealPlan) {
        totalPlansGenerated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${totalPlansGenerated} meal plans`
    });
  } catch (error) {
    console.error('Error generating meal plans:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate meal plans'
      },
      { status: 500 }
    );
  }
} 