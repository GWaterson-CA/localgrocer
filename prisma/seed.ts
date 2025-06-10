import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Sample recipes
  const recipes = [
    {
      name: 'Mac & Cheese',
      isOnePot: true,
      prepMinutes: 15,
      directions: 'Cook pasta, make cheese sauce, combine and bake.',
      ingredients: {
        items: [
          { name: 'Macaroni', amount: '500g', store: 'Save-On-Foods' },
          { name: 'Cheddar Cheese', amount: '250g', store: 'Independent' },
          { name: 'Milk', amount: '2 cups', store: 'Nesters' }
        ]
      },
      nutrition: {
        calories: 450,
        protein: 15,
        carbs: 45,
        fat: 25
      }
    },
    {
      name: 'Spaghetti Bolognese',
      isOnePot: false,
      prepMinutes: 25,
      directions: 'Cook pasta, make sauce with ground beef and tomatoes.',
      ingredients: {
        items: [
          { name: 'Spaghetti', amount: '500g', store: 'Save-On-Foods' },
          { name: 'Ground Beef', amount: '500g', store: 'Independent' },
          { name: 'Tomato Sauce', amount: '2 cans', store: 'Nesters' }
        ]
      },
      nutrition: {
        calories: 550,
        protein: 25,
        carbs: 60,
        fat: 20
      }
    },
    {
      name: 'Chicken Casserole',
      isOnePot: true,
      prepMinutes: 20,
      directions: 'Layer chicken, vegetables, and sauce, then bake.',
      ingredients: {
        items: [
          { name: 'Chicken Breast', amount: '600g', store: 'Save-On-Foods' },
          { name: 'Mixed Vegetables', amount: '400g', store: 'Independent' },
          { name: 'Cream of Mushroom Soup', amount: '2 cans', store: 'Nesters' }
        ]
      },
      nutrition: {
        calories: 400,
        protein: 30,
        carbs: 25,
        fat: 20
      }
    },
    {
      name: 'Sheet-Pan Chicken & Potato',
      isOnePot: true,
      prepMinutes: 15,
      directions: 'Season chicken and potatoes, roast together.',
      ingredients: {
        items: [
          { name: 'Chicken Thighs', amount: '800g', store: 'Save-On-Foods' },
          { name: 'Potatoes', amount: '1kg', store: 'Independent' },
          { name: 'Olive Oil', amount: '1/4 cup', store: 'Nesters' }
        ]
      },
      nutrition: {
        calories: 500,
        protein: 35,
        carbs: 40,
        fat: 25
      }
    },
    {
      name: 'Japanese Curry',
      isOnePot: true,
      prepMinutes: 30,
      directions: 'Cook vegetables and meat, add curry roux.',
      ingredients: {
        items: [
          { name: 'Curry Roux', amount: '1 box', store: 'Save-On-Foods' },
          { name: 'Beef Chuck', amount: '500g', store: 'Independent' },
          { name: 'Carrots', amount: '300g', store: 'Nesters' }
        ]
      },
      nutrition: {
        calories: 600,
        protein: 25,
        carbs: 70,
        fat: 30
      }
    },
    {
      name: 'Pulled Pork Tacos',
      isOnePot: true,
      prepMinutes: 20,
      directions: 'Slow cook pork, shred, serve in tortillas.',
      ingredients: {
        items: [
          { name: 'Pork Shoulder', amount: '1kg', store: 'Save-On-Foods' },
          { name: 'Tortillas', amount: '12 pack', store: 'Independent' },
          { name: 'BBQ Sauce', amount: '1 bottle', store: 'Nesters' }
        ]
      },
      nutrition: {
        calories: 450,
        protein: 30,
        carbs: 35,
        fat: 25
      }
    },
    {
      name: 'Steelhead Trout Bake',
      isOnePot: true,
      prepMinutes: 15,
      directions: 'Season fish, bake with vegetables.',
      ingredients: {
        items: [
          { name: 'Steelhead Trout', amount: '600g', store: 'Save-On-Foods' },
          { name: 'Lemon', amount: '2', store: 'Independent' },
          { name: 'Asparagus', amount: '1 bunch', store: 'Nesters' }
        ]
      },
      nutrition: {
        calories: 350,
        protein: 40,
        carbs: 10,
        fat: 20
      }
    },
    {
      name: 'Beef Chili',
      isOnePot: true,
      prepMinutes: 25,
      directions: 'Brown beef, add beans and spices, simmer.',
      ingredients: {
        items: [
          { name: 'Ground Beef', amount: '500g', store: 'Save-On-Foods' },
          { name: 'Kidney Beans', amount: '2 cans', store: 'Independent' },
          { name: 'Chili Powder', amount: '2 tbsp', store: 'Nesters' }
        ]
      },
      nutrition: {
        calories: 400,
        protein: 30,
        carbs: 35,
        fat: 20
      }
    }
  ];

  // Create recipes
  for (const recipe of recipes) {
    await prisma.recipe.create({
      data: recipe
    });
  }

  // Sample flyer items for each store
  const stores = ['Save-On-Foods', 'Independent', 'Nesters'];
  const flyerItems = [
    {
      name: 'Chicken Breast',
      sku: 'CHK001',
      price: 8.99,
      wasPrice: 12.99,
      saleEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Ground Beef',
      sku: 'BEEF001',
      price: 6.99,
      wasPrice: 9.99,
      saleEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Pasta',
      sku: 'PASTA001',
      price: 2.99,
      wasPrice: 3.99,
      saleEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Cheese',
      sku: 'CHEESE001',
      price: 4.99,
      wasPrice: 6.99,
      saleEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Tomato Sauce',
      sku: 'SAUCE001',
      price: 1.99,
      wasPrice: 2.99,
      saleEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Vegetables',
      sku: 'VEG001',
      price: 3.99,
      wasPrice: 4.99,
      saleEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  ];

  // Create flyer items for each store
  for (const store of stores) {
    for (const item of flyerItems) {
      await prisma.flyerItem.create({
        data: {
          ...item,
          store,
          sku: `${store}-${item.sku}`
        }
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 