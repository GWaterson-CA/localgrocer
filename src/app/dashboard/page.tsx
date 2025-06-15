'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

type Meal = {
  id: string;
  name: string;
  savings: number;
  rating: number;
  imageUrl: string;
};

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
  const defaultMeals: Meal[] = [
    { id: '1', name: 'Mac & Cheese', savings: 5.99, rating: 0, imageUrl: getImageUrl('Mac & Cheese') },
    { id: '2', name: 'Spaghetti Bolognese', savings: 3.5, rating: 0, imageUrl: getImageUrl('Spaghetti Bolognese') },
    { id: '3', name: 'Chicken Casserole', savings: 4.25, rating: 0, imageUrl: getImageUrl('Chicken Casserole') },
  ];

  const [meals, setMeals] = useState<Meal[]>(defaultMeals);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(true);
  const [swappingMealId, setSwappingMealId] = useState<string | null>(null);

  const groceryItems: GroceryItem[] = [
    { id: '1', name: 'Chicken Breast', store: 'Save-On-Foods', price: 8.99, wasPrice: 12.99 },
    { id: '2', name: 'Ground Beef', store: 'Independent', price: 6.99, wasPrice: 9.99 },
    { id: '3', name: 'Pasta', store: 'Nesters', price: 2.99, wasPrice: 3.99 },
    { id: '4', name: 'Cheese', store: 'Save-On-Foods', price: 4.99, wasPrice: 6.99 },
    { id: '5', name: 'Tomato Sauce', store: 'Independent', price: 1.99, wasPrice: 2.99 },
    { id: '6', name: 'Vegetables', store: 'Nesters', price: 3.99, wasPrice: 4.99 },
  ];

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        // Minimal household profile (replace once real profile exists)
        const householdProfile = {
          id: 'demo-household',
          name: 'Demo Household',
          potsPref: 1,
          prepTimePref: 30,
          members: [],
          storePrefs: [],
        };

        const res = await fetch('/api/trpc/plan.generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ householdProfile, ratingsHistory: [] }),
        });

        if (!res.ok) throw new Error('plan generation failed');

        const json = await res.json();
        console.log('plan.generate response', json);
        const apiMeals = json?.result?.data as any[] | undefined;

        if (apiMeals && apiMeals.length) {
          const formatted = apiMeals.map((m, idx) => ({
            id: `${idx}`,
            name: m.mealName,
            savings: m.estimatedSavings ?? 0,
            rating: 0,
            imageUrl: m.imageUrl ? m.imageUrl : getImageUrl(m.mealName),
          }));
          setMeals(formatted);
        }
      } catch (err) {
        console.error('Meal plan fetch error', err);
        // fall back to defaults (already set)
      } finally {
        setLoadingPlan(false);
      }
    };

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

      const householdProfile = {
        id: 'demo-household',
        name: 'Demo Household',
        potsPref: 1,
        prepTimePref: 30,
        members: [],
        storePrefs: [],
      };

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
        const newMeal: Meal = {
          id: mealId,
          name: newMealData.mealName,
          savings: newMealData.estimatedSavings ?? 0,
          rating: 0,
          imageUrl: newMealData.imageUrl
            ? newMealData.imageUrl
            : getImageUrl(newMealData.mealName),
        };

        setMeals((currentMeals) =>
          currentMeals.map((m) => (m.id === mealId ? newMeal : m))
        );
        toast({
          title: 'Meal Swapped',
          description: `"${mealToSwap.name}" was replaced with "${newMeal.name}".`,
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex space-x-4">
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
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRating(meal.id, 1)}
                          className="text-2xl hover:text-blue-500"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => handleRating(meal.id, -1)}
                          className="text-2xl hover:text-red-500"
                        >
                          👎
                        </button>
                      </div>
                      <button
                        onClick={() => handleSwap(meal.id)}
                        disabled={isSwapping || loadingPlan}
                        className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                      >
                        Swap
                      </button>
                    </div>
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