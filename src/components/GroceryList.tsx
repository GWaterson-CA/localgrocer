'use client';

import { motion } from 'framer-motion';

type GroceryItem = {
  id: string;
  name: string;
  store: string;
  price: number;
  wasPrice?: number;
};

interface GroceryListProps {
  items: GroceryItem[];
}

export default function GroceryList({ items }: GroceryListProps) {
  const stores = ['Save-On-Foods', 'Independent', 'Nesters'];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {stores.map((store) => (
        <motion.div
          key={store}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-700 p-6"
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {store}
          </h3>
          <div className="space-y-4">
            {items
              .filter((item) => item.store === store)
              .map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {item.name}
                  </span>
                  <div className="flex items-center space-x-4">
                    {item.wasPrice && (
                      <span className="text-gray-500 dark:text-gray-400 line-through text-sm">
                        ${item.wasPrice.toFixed(2)}
                      </span>
                    )}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ${item.price.toFixed(2)}
                    </span>
                    {item.wasPrice && (
                      <span className="bg-[#E7F7EC] text-[#1D7B3A] px-2 py-1 rounded-full text-xs font-medium">
                        Save ${(item.wasPrice - item.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
} 