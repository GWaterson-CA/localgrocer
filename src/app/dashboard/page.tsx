'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import MealCard from '@/components/MealCard';
import GroceryList from '@/components/GroceryList';
import Tabs from '@/components/ui/tabs';
import MealModal from '@/components/MealModal';

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

const tabs = [
  { id: 'meal-plan', label: 'Meal Plan' },
  { id: 'grocery-list', label: 'Grocery List' },
];

export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('meal-plan');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(true);
  const [swappingMealId, setSwappingMealId] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const householdProfile = {
    id: 'demo-household',
    name: 'Demo Household',
    potsPref: 1,
    prepTimePref: 30,
    members: [],
    storePrefs: [],
    pots: 1,
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
      const plan = await res.json();

      if (plan) {
        setMeals(formatMeals(plan));
      } else {
        await generateAndFetchPlan();
      }
    } catch (err) {
      console.error('Meal plan fetch error', err);
      // fallback to generating a new plan
      await generateAndFetchPlan();
    } finally {
      setLoadingPlan(false);
    }
  };
  
  const generateAndFetchPlan = async () => {
    setLoadingPlan(true);
    try {
      // First, generate the plan
      const genRes = await fetch('/api/trpc/plan.generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdProfile, ratingsHistory: [] }),
      });

      if (!genRes.ok) throw new Error('plan generation failed');
      
      const newPlan = await genRes.json();

      if (newPlan && newPlan.meals && newPlan.meals.length > 0) {
        setMeals(formatMeals(newPlan));
      } else {
        throw new Error('No meals in response');
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800"
    >
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Your personalized meal planning experience
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={generateAndFetchPlan}
              disabled={loadingPlan}
              className="bg-[#1D7B3A] hover:bg-[#166B30] text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPlan ? 'Generating...' : 'Generate New Meal Plan'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Content */}
        {activeTab === 'meal-plan' ? (
          loadingPlan ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D7B3A] mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">Generating your meal plan...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
              {meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  isSwapping={swappingMealId === meal.id}
                  onRating={handleRating}
                  onSwap={handleSwap}
                  onSelect={() => setSelectedMeal(meal)}
                />
              ))}
            </div>
          )
        ) : (
          <GroceryList items={groceryItems} />
        )}
        {selectedMeal && (
          <MealModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
        )}
      </div>
    </motion.div>
  );
} 