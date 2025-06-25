import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/server/db';

const systemMessage = `You are a meal planning assistant that generates a single meal replacement in JSON format. Your response must be a valid JSON object with the following structure:
{
  "day": "string",
  "mealName": "string",
  "imageUrl": "string",
  "estimatedCost": "number",
  "estimatedSavings": "number",
  "primaryDishDetails": "string",
  "optionalExtras": "string",
  "reasoning": "string",
  "nutritionDetails": "string",
  "mainIngredients": [
    {
      "name": "string",
      "quantity": "number",
      "unit": "string"
    }
  ],
  "shoppingList": [
    {
      "store": "string",
      "items": [
        {
          "name": "string",
          "price": "number",
          "quantity": "number",
          "unit": "string"
        }
      ]
    }
  ],
  "prepTime": "number",
  "pots": "number"
}

Requirements:
1. All numerical values must be actual numbers, not strings.
2. The response must be a single, valid JSON object that can be parsed directly.
3. The suggested meal must be different from the meals in the provided list.`;

export async function POST(req: Request) {
  try {
    const { householdProfile, currentMeals, mealToSwap } = await req.json();

    if (!householdProfile || !currentMeals || !mealToSwap) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const userContent = `
      Household Profile: ${JSON.stringify(householdProfile, null, 2)}
      Current Meals: ${currentMeals.map((m: any) => m.name).join(', ')}
      Meal to Swap: ${mealToSwap.name}

      Please suggest one new dinner meal to replace the "Meal to Swap". The new meal should not be one of the "Current Meals".
      Return a single meal object in the specified JSON format.
    `;

    console.log('--- Swap Meal Prompt ---');
    console.log(userContent);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content;
    console.log('--- Swap Meal Raw Response ---');
    console.log(response);

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const newMeal = JSON.parse(response);
    
    const mealToReturn = Array.isArray(newMeal.meals) ? newMeal.meals[0] : newMeal;

    // Fetch the real meal from the DB to get the correct recipeId
    const dbMeal = await prisma.meal.findUnique({ where: { id: mealToSwap.id } });
    if (!dbMeal) {
      return NextResponse.json({ error: 'Meal not found in database' }, { status: 404 });
    }

    // Update the meal's recipe
    const updatedMeal = await prisma.meal.update({
      where: { id: mealToSwap.id },
      data: {
        recipe: {
          update: {
            name: mealToReturn.mealName,
            isOnePot: mealToReturn.pots <= 1,
            prepMinutes: mealToReturn.prepTime,
            directions: mealToReturn.primaryDishDetails,
            ingredients: mealToReturn.mainIngredients,
            nutrition: {
              details: mealToReturn.nutritionDetails,
              optionalExtras: mealToReturn.optionalExtras,
            },
          },
        },
      },
      include: {
        recipe: true,
      },
    });

    return NextResponse.json({ result: { data: updatedMeal } });

  } catch (error) {
    console.error('Meal swap error:', error);
    const fallbackMeal = {
        day: 'Swapped',
        mealName: 'Surprise Skillet',
        estimatedCost: 5.0,
        estimatedSavings: 1.0,
        imageUrl: '',
    };
    return NextResponse.json({ result: { data: fallbackMeal } }, { status: 500 });
  }
} 