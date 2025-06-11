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
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        {
          role: "user",
          content: `Generate a meal plan for a household with the following profile:
            - Household Name: ${householdProfile.name}
            - Pots Preference: ${householdProfile.potsPref}
            - Prep Time Preference: ${householdProfile.prepTimePref}
            - Members: ${householdProfile.members.map((m: any) => `${m.name} (${m.age} years old, Diet: ${m.dietTags.join(', ')})`).join(', ')}
            - Store Preferences: ${householdProfile.storePrefs.map((s: any) => s.store).join(', ')}
            
            Previous Ratings: ${ratingsHistory.map((r: any) => `${r.mealName}: ${r.rating}`).join(', ')}
            
            Please provide the response in JSON format as specified.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const parsedResponse = JSON.parse(response);
    return NextResponse.json({ result: { data: parsedResponse.meals } });
  } catch (error) {
    console.error('Meal plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
} 