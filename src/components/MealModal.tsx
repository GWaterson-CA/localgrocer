"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";

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

interface MealModalProps {
  meal: Meal;
  onClose: () => void;
}

export default function MealModal({ meal, onClose }: MealModalProps) {
  if (!meal) return null;
  return (
    <Transition.Root show={!!meal} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel as={motion.div} className="w-full max-w-xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-0 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700">
                {/* Image */}
                <div className="relative">
                  <img
                    src={meal.imageUrl || "/fallback-meal.jpg"}
                    alt={meal.name}
                    className="w-full h-56 object-cover rounded-t-xl"
                    onError={e => (e.currentTarget.src = "/fallback-meal.jpg")}
                  />
                  <div className="absolute top-3 right-3 bg-[#E7F7EC]/90 text-[#1D7B3A] text-xs px-3 py-1 rounded-full shadow-md font-medium">
                    Save ${meal.savings.toFixed(2)}
                  </div>
                </div>
                {/* Content */}
                <div className="p-6 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{meal.name}</h2>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span>Prep Time: {meal.prepTime} min</span>
                    <span>Pots: {meal.pots}</span>
                  </div>
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
                      {meal.mainIngredients.map((ing: { name: string; quantity: number; unit: string }, i: number) => (
                        <li key={i}>
                          {ing.name} ({ing.quantity} {ing.unit})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 