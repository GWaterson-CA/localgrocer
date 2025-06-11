'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

type Meal = {
  id: string;
  name: string;
  savings: number;
  rating: number;
};

type GroceryItem = {
  id: string;
  name: string;
  store: string;
  price: number;
  wasPrice?: number;
};

// New type for AI meal plan
interface AIMeal {
  day: string;
  mealName: string;
  imageUrl: string;
  estimatedCost: number;
  estimatedSavings?: number;
  primaryDishDetails: string;
  optionalExtras: string;
  reasoning: string;
  nutritionDetails: string;
  mainIngredients: { name: string; store: string; price: number }[];
  prepTime: number;
  pots: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'meal-plan' | 'grocery-list'>('meal-plan');
  const [meals, setMeals] = useState<AIMeal[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [household, setHousehold] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock data - replace with real data from API
  const groceryItems: GroceryItem[] = [
    { id: '1', name: 'Chicken Breast', store: 'Save-On-Foods', price: 8.99, wasPrice: 12.99 },
    { id: '2', name: 'Ground Beef', store: 'Independent', price: 6.99, wasPrice: 9.99 },
    { id: '3', name: 'Pasta', store: 'Nesters', price: 2.99, wasPrice: 3.99 },
    { id: '4', name: 'Cheese', store: 'Save-On-Foods', price: 4.99, wasPrice: 6.99 },
    { id: '5', name: 'Tomato Sauce', store: 'Independent', price: 1.99, wasPrice: 2.99 },
    { id: '6', name: 'Vegetables', store: 'Nesters', price: 3.99, wasPrice: 4.99 },
  ];

  useEffect(() => {
    // Try to get userId from localStorage (set after signup)
    const stored = localStorage.getItem('userId');
    if (stored) setUserId(stored);
  }, []);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      fetch(`/api/household?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setHousehold(data.household);
            setRatings(data.ratings);
            setError(null);
          } else {
            setError(data.message || 'No household found.');
          }
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to fetch household.');
          setLoading(false);
        });
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'meal-plan' && household && ratings) {
      setLoading(true);
      fetch('/api/trpc/plan.generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdProfile: {
            id: household.id,
            name: household.name,
            potsPref: household.potsPref,
            prepTimePref: household.prepTimePref,
            members: household.members.map((m: any) => ({
              id: m.id,
              age: m.age,
              name: m.name,
              dietTags: m.dietTags || []
            })),
            storePrefs: household.storePrefs.map((s: any) => ({ id: s.id, store: s.store }))
          },
          ratingsHistory: ratings
        })
      })
        .then(res => res.json())
        .then(data => {
          setMeals(data.result?.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [activeTab, household, ratings]);

  const handleLike = (idx: number) => toast({ title: 'Liked!', description: 'You liked this meal.' });
  const handleDislike = (idx: number) => toast({ title: 'Disliked!', description: 'You disliked this meal.' });
  const handleApprove = (idx: number) => toast({ title: 'Approved!', description: 'Added to grocery list.' });
  const handleRegenerate = (idx: number) => toast({ title: 'Regenerated!', description: 'A new meal will be suggested.' });

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

        {error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : !userId ? (
          <div className="text-center py-12">Please sign up or log in to view your dashboard.</div>
        ) : activeTab === 'meal-plan' ? (
          loading ? <div className="text-center py-12">Generating meal plan...</div> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meals.map((meal, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="flex flex-col items-center">
                  <img src={meal.imageUrl} alt={meal.mealName} className="w-full h-48 object-cover rounded mb-2" />
                  <h3 className="text-xl font-semibold text-center">{meal.mealName}</h3>
                  <div className="flex justify-between w-full mt-2">
                    <span className="text-gray-600">{meal.day}</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">${meal.estimatedCost.toFixed(2)}{meal.estimatedSavings ? ` (Save $${meal.estimatedSavings.toFixed(2)})` : ''}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex space-x-2">
                    <button onClick={() => handleLike(idx)} className="text-2xl hover:text-blue-500">👍</button>
                    <button onClick={() => handleDislike(idx)} className="text-2xl hover:text-red-500">👎</button>
                  </div>
                  <button onClick={() => handleApprove(idx)} className="bg-green-500 text-white px-3 py-1 rounded">Approve</button>
                  <button onClick={() => handleRegenerate(idx)} className="bg-yellow-500 text-white px-3 py-1 rounded">Regenerate</button>
                  <button onClick={() => setExpanded(expanded === idx ? null : idx)} className="ml-2 text-blue-600 underline">{expanded === idx ? 'Collapse' : 'Expand'}</button>
                </div>
                {expanded === idx && (
                  <div className="mt-4 border-t pt-4 space-y-2">
                    <div><strong>Primary Dish Details:</strong> {meal.primaryDishDetails}</div>
                    <div><strong>Optional Extras:</strong> {meal.optionalExtras}</div>
                    <div><strong>Reasoning:</strong> {meal.reasoning}</div>
                    <div><strong>Nutrition:</strong> {meal.nutritionDetails}</div>
                    <div>
                      <strong>Main Ingredients:</strong>
                      <ul className="list-disc ml-6">
                        {meal.mainIngredients.map((ing, i) => (
                          <li key={i}>{ing.name} ({ing.store}) - ${ing.price.toFixed(2)}</li>
                        ))}
                      </ul>
                    </div>
                    <div><strong>Prep Time:</strong> {meal.prepTime} min | <strong>Pots:</strong> {meal.pots}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
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