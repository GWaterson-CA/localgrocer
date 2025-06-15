'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface Meal {
  id: string;
  day: string;
  name: string;
  savings: number;
  rating: number;
  imageUrl: string;
  primaryDishDetails: string;
  optionalExtras: string;
  reasoning: string;
  nutritionDetails: string;
  mainIngredients: { name: string; quantity: number; unit: string }[];
  prepTime: number;
  pots: number;
}

type GroceryItem = {
  id: string;
  name: string;
  store: string;
  price: number;
  wasPrice?: number;
};

// Helper: generate a deterministic Unsplash source URL based on the meal name.
// We include the "food" term to improve relevance.
const getImageUrl = (mealName: string) =>
  `https://source.unsplash.com/featured/?${encodeURIComponent(`${mealName} food`)}&auto=format&fit=crop&w=600&q=80`;

export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'meal-plan' | 'grocery-list'>('meal-plan');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(true);
  const [swappingMealId, setSwappingMealId] = useState<string | null>(null);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  const householdProfile = {
    id: 'demo-household',
    name: 'Demo Household',
    potsPref: 1,
    prepTimePref: 30,
    members: [],
    storePrefs: [],
  };

  const groceryItems: GroceryItem[] = [
    { id: '1', name: 'Chicken Breast', store: 'Save-On-Foods', price: 8.99, wasPrice: 12.99 },
    { id: '2', name: 'Ground Beef', store: 'Independent', price: 6.99, wasPrice: 9.99 },
    { id: '3', name: 'Pasta', store: 'Nesters', price: 2.99, wasPrice: 3.99 },
    { id: '4', name: 'Cheese', store: 'Save-On-Foods', price: 4.99, wasPrice: 6.99 },
    { id: '5', name: 'Tomato Sauce', store: 'Independent', price: 1.99, wasPrice: 2.99 },
    { id: '6', name: 'Vegetables', store: 'Nesters', price: 3.99, wasPrice: 4.99 },
  ];

  const formatMeals = (data: any) => {
    return data.meals.map((m: any) => ({
      id: m.id,
      day: m.day,
      name: m.recipe.name,
      savings: m.recipe.estimatedSavings ?? 0,
      rating: 0,
      imageUrl: m.recipe.imageUrl ?? getImageUrl(m.recipe.name),
      primaryDishDetails: m.recipe.primaryDishDetails ?? '',
      optionalExtras: m.recipe.optionalExtras ?? '',
      reasoning: m.recipe.reasoning ?? '',
      nutritionDetails: m.recipe.nutritionDetails ?? '',
      mainIngredients: m.recipe.mainIngredients ?? [],
      prepTime: m.recipe.prepTime ?? 0,
      pots: m.recipe.pots ?? 0,
    }));
  };

  const fetchPlan = async () => {
    setLoadingPlan(true);
    try {
      const res = await fetch(`/api/trpc/plan.get?householdId=${householdProfile.id}`);
      const existingPlan = await res.json();

      if (existingPlan) {
        setMeals(formatMeals(existingPlan));
      } else {
        await generateNewPlan();
      }
    } catch (err) {
      console.error('Meal plan fetch error', err);
      // fallback to generating a new plan
      await generateNewPlan();
    } finally {
      setLoadingPlan(false);
    }
  };
  
  const generateNewPlan = async () => {
    setLoadingPlan(true);
    try {
      const res = await fetch('/api/trpc/plan.generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdProfile, ratingsHistory: [] }),
      });

      if (!res.ok) throw new Error('plan generation failed');

      const newPlan = await res.json();
      if (newPlan) {
        setMeals(formatMeals(newPlan));
      }
    } catch (err) {
      console.error('New meal plan generation error', err);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate a new meal plan.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleRating = (mealId: string, rating: number) => {
    toast({
      title: 'Rating Updated',
      description: 'Your rating has been saved.',
    });
  };

  const handleSwap = async (mealId: string) => {
    setSwappingMealId(mealId);
    try {
      const mealToSwap = meals.find((m) => m.id === mealId);
      if (!mealToSwap) return;

      const res = await fetch('/api/trpc/plan.swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdProfile,
          currentMeals: meals,
          mealToSwap,
        }),
      });

      if (!res.ok) {
        throw new Error('Meal swap failed');
      }

      const json = await res.json();
      const newMealData = json?.result?.data;

      if (newMealData) {
        setMeals((currentMeals) =>
          currentMeals.map((m) => (m.id === mealId ? formatMeals({ meals: [newMealData]})[0] : m))
        );
        toast({
          title: 'Meal Swapped',
          description: `"${mealToSwap.name}" was replaced with "${newMealData.mealName}".`,
        });
      } else {
        throw new Error('No meal data in response');
      }
    } catch (err) {
      console.error('Meal swap error', err);
      toast({
        title: 'Swap Failed',
        description: 'Could not swap the meal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSwappingMealId(null);
    }
  };

  const handleToggleExpand = (mealId: string) => {
    setExpandedMealId((prev) => (prev === mealId ? null : mealId));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={generateNewPlan}
              disabled={loadingPlan}
              className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            >
              Generate New Meal Plan
            </button>
            <button
              onClick={() => setActiveTab('meal-plan')}
              className={`px-4 py-2 rounded ${
                activeTab === 'meal-plan'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Meal Plan
            </button>
            <button
              onClick={() => setActiveTab('grocery-list')}
              className={`px-4 py-2 rounded ${
                activeTab === 'grocery-list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Grocery List
            </button>
          </div>
        </div>

        {activeTab === 'meal-plan' ? (
          loadingPlan ? (
            <p className="text-center text-gray-500">Generating meal plan…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meals.map((meal) => {
                const isSwapping = swappingMealId === meal.id;
                return (
                  <div
                    key={meal.id}
                    className={`bg-white rounded-lg shadow p-6 space-y-4 relative ${
                      isSwapping ? 'opacity-50' : ''
                    }`}
                  >
                    {isSwapping && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                        <p className="text-lg font-semibold">Swapping...</p>
                      </div>
                    )}
                    <img
                      src={meal.imageUrl}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/fallback-meal.jpg';
                      }}
                      alt={meal.name}
                      className="w-full h-40 object-cover rounded-md mb-4"
                    />
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold">{meal.name}</h3>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                        Save ${meal.savings.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                      <button className="text-2xl">👍</button>
                      <button className="text-2xl">👎</button>
                      <button className="bg-green-500 text-white px-4 py-2 rounded-lg">Approve</button>
                      <button
                        onClick={() => handleSwap(meal.id)}
                        disabled={!!swappingMealId}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg disabled:bg-yellow-300"
                      >
                        {swappingMealId === meal.id ? 'Swapping...' : 'Regenerate'}
                      </button>
                      <button
                        onClick={() => handleToggleExpand(meal.id)}
                        className="text-blue-500 border border-blue-500 px-4 py-2 rounded-lg"
                      >
                        {expandedMealId === meal.id ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                    {expandedMealId === meal.id && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-bold">Primary Dish Details:</h4>
                        <p>{meal.primaryDishDetails}</p>
                        <h4 className="font-bold mt-2">Optional Extras:</h4>
                        <p>{meal.optionalExtras}</p>
                        <h4 className="font-bold mt-2">Reasoning:</h4>
                        <p>{meal.reasoning}</p>
                        <h4 className="font-bold mt-2">Nutrition:</h4>
                        <p>{meal.nutritionDetails}</p>
                        <h4 className="font-bold mt-2">Main Ingredients:</h4>
                        <ul className="list-disc list-inside">
                          {meal.mainIngredients.map((ing, i) => (
                            <li key={i}>
                              {ing.name} ({ing.quantity} {ing.unit})
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 text-sm text-gray-600">
                          <span>Prep Time: {meal.prepTime} min</span> | <span>Pots: {meal.pots}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="space-y-6">
            {['Save-On-Foods', 'Independent', 'Nesters'].map((store) => (
              <div key={store} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">{store}</h3>
                <div className="space-y-4">
                  {groceryItems
                    .filter((item) => item.store === store)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center"
                      >
                        <span>{item.name}</span>
                        <div className="flex items-center space-x-4">
                          {item.wasPrice && (
                            <span className="text-gray-500 line-through">
                              ${item.wasPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="font-semibold">
                            ${item.price.toFixed(2)}
                          </span>
                          {item.wasPrice && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                              Save ${(item.wasPrice - item.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 