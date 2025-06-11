import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import OpenAI from 'openai';

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

      // Fetch all grocery items (regular and sale)
      const allGroceryItems = await ctx.prisma.flyerItem.findMany({
        where: {
          store: {
            in: householdProfile.storePrefs.map(pref => pref.store)
          }
        }
      });

      // Fetch past meal plans for this household
      const pastMealPlans = await ctx.prisma.mealPlan.findMany({
        where: { householdId: householdProfile.id },
        include: { meals: { include: { recipe: true } } }
      });

      // Prepare data for OpenAI
      const openAIData = {
        household: householdProfile,
        ratingsHistory,
        groceryStores: householdProfile.storePrefs.map(pref => pref.store),
        groceryItems: allGroceryItems,
        pastMealPlans: pastMealPlans.map((plan: any) => ({
          weekStart: plan.weekStart,
          meals: plan.meals.map((m: any) => ({
            day: m.day,
            recipeName: m.recipe.name
          }))
        }))
      };

      // Compose the prompt
      const prompt = `You are an expert family meal planner. Using the following household profile, grocery store data (including both sale and regular items), and meal history, generate a 7-day dinner meal plan that:
- Maximizes use of sale items and best prices at local stores
- Respects all dietary restrictions, dislikes, and household preferences
- Includes family favorite meals at their preferred frequency (e.g., once every 2 weeks, once a month), but only if it's time for them, and prioritizes them when ingredients are on sale
- Avoids repeating meals too often, and provides fresh, inspiring suggestions (mix new and existing meals)
- For each meal, suggest a real recipe (research if needed), and list the main ingredients, which store to buy them at, and the price (prioritize sales)
- Return the plan as a JSON array, with each day containing: day, meal name, description, main ingredients (with store and price), estimated prep time, number of pots, estimated total cost
- Do not repeat meals from the last 2 weeks unless they are a family favorite and due
- Here is the data to use:\n${JSON.stringify(openAIData, null, 2)}\n\nReturn only the JSON array, no extra commentary.`;

      // Call OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful meal planning assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      // Parse the response
      let mealPlan;
      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('OpenAI response content is null or undefined.');
      }
      try {
        mealPlan = JSON.parse(content);
      } catch (e) {
        throw new Error('Failed to parse OpenAI response as JSON.');
      }

      // Optionally: Save the meal plan to the DB, or just return it
      return mealPlan;
    })
}); 