'use client';

import { useState } from 'react';
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

export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'meal-plan' | 'grocery-list'>('meal-plan');

  // Mock data - replace with real data from API
  const meals: Meal[] = [
    { id: '1', name: 'Mac & Cheese', savings: 5.99, rating: 0 },
    { id: '2', name: 'Spaghetti Bolognese', savings: 3.50, rating: 0 },
    { id: '3', name: 'Chicken Casserole', savings: 4.25, rating: 0 },
    { id: '4', name: 'Sheet-Pan Chicken & Potato', savings: 2.75, rating: 0 },
    { id: '5', name: 'Japanese Curry', savings: 6.50, rating: 0 },
    { id: '6', name: 'Pulled Pork Tacos', savings: 5.25, rating: 0 },
    { id: '7', name: 'Steelhead Trout Bake', savings: 7.99, rating: 0 },
  ];

  const groceryItems: GroceryItem[] = [
    { id: '1', name: 'Chicken Breast', store: 'Save-On-Foods', price: 8.99, wasPrice: 12.99 },
    { id: '2', name: 'Ground Beef', store: 'Independent', price: 6.99, wasPrice: 9.99 },
    { id: '3', name: 'Pasta', store: 'Nesters', price: 2.99, wasPrice: 3.99 },
    { id: '4', name: 'Cheese', store: 'Save-On-Foods', price: 4.99, wasPrice: 6.99 },
    { id: '5', name: 'Tomato Sauce', store: 'Independent', price: 1.99, wasPrice: 2.99 },
    { id: '6', name: 'Vegetables', store: 'Nesters', price: 3.99, wasPrice: 4.99 },
  ];

  const handleRating = (mealId: string, rating: number) => {
    toast({
      title: 'Rating Updated',
      description: 'Your rating has been saved.',
    });
  };

  const handleSwap = (mealId: string) => {
    toast({
      title: 'Meal Swapped',
      description: 'A new meal has been suggested.',
    });
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="bg-white rounded-lg shadow p-6 space-y-4"
              >
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
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Swap
                  </button>
                </div>
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