'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

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

interface MealCardProps {
  meal: Meal;
  isSwapping: boolean;
  isExpanded: boolean;
  onRating: (mealId: string, rating: number) => void;
  onSwap: (mealId: string) => void;
  onToggleExpand: (mealId: string) => void;
}

export default function MealCard({
  meal,
  isSwapping,
  isExpanded,
  onRating,
  onSwap,
  onToggleExpand,
}: MealCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden ${
        isSwapping ? 'opacity-50' : ''
      }`}
    >
      {/* Image Container */}
      <div className="relative">
        <img
          src={imageError ? '/fallback-meal.jpg' : meal.imageUrl}
          onError={() => setImageError(true)}
          alt={meal.name}
          className="w-full h-48 object-cover"
        />
        {/* Savings Pill */}
        <div className="absolute top-3 right-3 bg-[#E7F7EC]/90 text-[#1D7B3A] text-xs px-3 py-1 rounded-full shadow-md font-medium">
          Save ${meal.savings.toFixed(2)}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100 text-lg">
          {meal.name}
        </h3>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          {/* Rating Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onRating(meal.id, 1)}
              className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1"
            >
              👍
            </button>
            <button
              onClick={() => onRating(meal.id, -1)}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
            >
              👎
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button className="bg-[#1D7B3A] hover:bg-[#166B30] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
              Approve
            </button>
            <button
              onClick={() => onSwap(meal.id)}
              disabled={isSwapping}
              className="bg-yellow-500/80 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSwapping ? 'Swapping...' : 'Regenerate'}
            </button>
            <button
              onClick={() => onToggleExpand(meal.id)}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3"
          >
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Primary Dish Details:</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{meal.primaryDishDetails}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Optional Extras:</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{meal.optionalExtras}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Reasoning:</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{meal.reasoning}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Nutrition:</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{meal.nutritionDetails}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Main Ingredients:</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 text-sm mt-1 space-y-1">
                {meal.mainIngredients.map((ing, i) => (
                  <li key={i}>
                    {ing.name} ({ing.quantity} {ing.unit})
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center space-x-4">
              <span>Prep Time: {meal.prepTime} min</span>
              <span>Pots: {meal.pots}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Loading Overlay */}
      {isSwapping && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/75 dark:bg-gray-800/75 rounded-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D7B3A] mx-auto mb-2"></div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Swapping...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
} 