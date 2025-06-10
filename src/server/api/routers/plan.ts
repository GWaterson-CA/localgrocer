import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';

const householdProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  potsPref: z.number(),
  prepTimePref: z.number(),
  members: z.array(z.object({
    id: z.string(),
    age: z.number(),
    name: z.string().optional(),
    dietTags: z.array(z.string())
  })),
  storePrefs: z.array(z.object({
    id: z.string(),
    store: z.string()
  }))
});

const ratingSchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  userId: z.string(),
  score: z.number(),
  comment: z.string().optional()
});

export const planRouter = createTRPCRouter({
  generate: publicProcedure
    .input(z.object({
      householdProfile: householdProfileSchema,
      ratingsHistory: z.array(ratingSchema)
    }))
    .mutation(async ({ ctx, input }) => {
      const { householdProfile, ratingsHistory } = input;

      // Get all recipes that match preferences
      const recipes = await ctx.db.recipe.findMany({
        where: {
          isOnePot: householdProfile.potsPref === 0,
          prepMinutes: {
            lte: householdProfile.prepTimePref
          }
        },
        include: {
          ratings: true
        }
      });

      // Get current flyer items
      const flyerItems = await ctx.db.flyerItem.findMany({
        where: {
          store: {
            in: householdProfile.storePrefs.map(pref => pref.store)
          },
          saleEnds: {
            gt: new Date()
          }
        }
      });

      // Calculate recipe scores based on ratings and flyer savings
      const scoredRecipes = recipes.map(recipe => {
        const recipeRatings = ratingsHistory.filter(r => r.recipeId === recipe.id);
        const avgRating = recipeRatings.length > 0
          ? recipeRatings.reduce((sum, r) => sum + r.score, 0) / recipeRatings.length
          : 0;

        // Calculate potential savings based on ingredients
        const ingredients = recipe.ingredients as { items: Array<{ name: string, store: string }> };
        const savings = ingredients.items.reduce((total, item) => {
          const flyerItem = flyerItems.find(f => 
            f.name.toLowerCase().includes(item.name.toLowerCase()) &&
            f.store === item.store
          );
          return total + (flyerItem?.wasPrice ? flyerItem.wasPrice - flyerItem.price : 0);
        }, 0);

        return {
          ...recipe,
          score: avgRating + (savings * 0.1) // Weight savings less than ratings
        };
      });

      // Sort by score and select top 7 recipes
      const selectedRecipes = scoredRecipes
        .sort((a, b) => b.score - a.score)
        .slice(0, 7);

      // Create meal plan
      const mealPlan = await ctx.db.mealPlan.create({
        data: {
          householdId: householdProfile.id,
          weekStart: new Date(),
          savings: selectedRecipes.reduce((total, recipe) => {
            const ingredients = recipe.ingredients as { items: Array<{ name: string, store: string }> };
            return total + ingredients.items.reduce((sum, item) => {
              const flyerItem = flyerItems.find(f => 
                f.name.toLowerCase().includes(item.name.toLowerCase()) &&
                f.store === item.store
              );
              return sum + (flyerItem?.wasPrice ? flyerItem.wasPrice - flyerItem.price : 0);
            }, 0);
          }, 0),
          meals: {
            create: selectedRecipes.map((recipe, index) => ({
              day: index + 1,
              recipeId: recipe.id
            }))
          }
        },
        include: {
          meals: {
            include: {
              recipe: true
            }
          }
        }
      });

      return mealPlan;
    })
}); 