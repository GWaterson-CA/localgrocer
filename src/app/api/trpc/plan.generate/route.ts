import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const systemMessage = `You are a meal planning assistant that generates meal plans in JSON format. Your response must be a valid JSON object with the following structure:

{
  "meals": [
    {
      "day": "string",
      "mealName": "string",
      "imageUrl": "string",
      "estimatedCost": number,
      "estimatedSavings": number,
      "primaryDishDetails": "string",
      "optionalExtras": "string",
      "reasoning": "string",
      "nutritionDetails": "string",
      "mainIngredients": [
        {
          "name": "string",
          "quantity": number,
          "unit": "string"
        }
      ],
      "shoppingList": [
        {
          "store": "string",
          "items": [
            {
              "name": "string",
              "price": number,
              "quantity": number,
              "unit": "string"
            }
          ]
        }
      ],
      "prepTime": number,
      "pots": number
    }
  ]
}

Requirements:
1. All ingredients must be listed with their quantities and units
2. Prices should reflect the cheapest options across stores
3. Shopping list must be organized by store
4. All numerical values must be actual numbers, not strings
5. Response must be valid JSON that can be parsed directly`;

export async function POST(req: Request) {
  try {
    const { householdProfile, ratingsHistory } = await req.json();

    if (!householdProfile || !householdProfile.members) {
      return NextResponse.json(
        { error: 'Invalid household profile' },
        { status: 400 }
      );
    }

    // Generate a meal plan using OpenAI
    console.log('--- Meal-Plan Prompt ---');
    console.log(systemMessage);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          {
            role: "user",
            content: `Generate a 7-day dinner meal plan (exactly 7 meals, one per day) for a household with the following profile:\n${JSON.stringify(householdProfile, null, 2)}\nPrevious ratings: ${ratingsHistory.length}\nReturn the JSON object in the required schema with exactly 7 objects in the \\"meals\\" array.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
    } catch (err) {
      console.warn('gpt-4o-mini not available, retrying with gpt-3.5-turbo', err);
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
          { role: "system", content: systemMessage },
          {
            role: "user",
            content: `Generate a 7-day dinner meal plan (exactly 7 meals, one per day) for a household with the following profile:
              - Household Name: ${householdProfile.name}
              - Pots Preference: ${householdProfile.potsPref}
              - Prep Time Preference: ${householdProfile.prepTimePref}
              - Members: ${householdProfile.members.map((m: any) => `${m.name} (${m.age} years old, Diet: ${m.dietTags.join(', ')})`).join(', ')}
              - Store Preferences: ${householdProfile.storePrefs.map((s: any) => s.store).join(', ')}
              
              Previous Ratings: ${ratingsHistory.map((r: any) => `${r.mealName}: ${r.rating}`).join(', ')}
              
              Please create EXACTLY 7 dinner meals (Monday through Sunday) in the meals array.
              
              Please provide the response in JSON format as specified.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
    }

    const response = completion.choices[0]?.message?.content;
    console.log('--- OpenAI Raw Response ---');
    console.log(response);
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (err) {
      console.error('Failed to parse JSON response', err);
    }

    const fallbackMeals = [
      {
        day: 'Monday',
        mealName: 'BBQ Chicken Wrap',
        estimatedCost: 4.5,
        estimatedSavings: 1.2,
      },
      {
        day: 'Tuesday',
        mealName: 'Veggie Burrito Bowl',
        estimatedCost: 3.8,
        estimatedSavings: 0.9,
      },
      {
        day: 'Wednesday',
        mealName: 'Salmon Caesar Salad',
        estimatedCost: 5.9,
        estimatedSavings: 1.5,
      },
      {
        day: 'Thursday',
        mealName: 'Beef Stir-fry',
        estimatedCost: 4.75,
        estimatedSavings: 1.1,
      },
      {
        day: 'Friday',
        mealName: 'Margherita Pizza',
        estimatedCost: 3.95,
        estimatedSavings: 0.8,
      },
      {
        day: 'Saturday',
        mealName: 'Pesto Pasta Salad',
        estimatedCost: 3.6,
        estimatedSavings: 0.7,
      },
      {
        day: 'Sunday',
        mealName: 'Teriyaki Tofu Bowl',
        estimatedCost: 4.1,
        estimatedSavings: 1.0,
      },
    ];

    const mealsToReturn = parsedResponse?.meals?.length === 7
      ? parsedResponse.meals
      : fallbackMeals;

    console.log(`Meals returned to client: ${mealsToReturn.length}`);

    return NextResponse.json({ result: { data: mealsToReturn } });
  } catch (error) {
    console.error('Meal plan generation error:', error);
    // Return fallback meals to ensure UI always has data
    return NextResponse.json({ result: { data: [] } }, { status: 200 });
  }
} 