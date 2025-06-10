import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          {/* Logo Icon Placeholder */}
          <span className="text-green-600 text-2xl font-bold">🥗</span>
          <span className="text-2xl font-bold text-gray-800">Grocerly <span className="text-green-600 font-normal">Meals</span></span>
        </div>
        <Link href="/login">
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded shadow">
            Sign In
          </button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center flex-1 px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-center mt-12 mb-4 text-gray-900">
          Smart Meal Planning for <span className="text-green-600">Busy Families</span>
        </h1>
        <p className="text-lg sm:text-xl text-center text-gray-700 max-w-2xl mb-8">
          Generate personalized weekly meal plans optimized for your family's preferences and local grocery store sales. Save time, money, and reduce food waste.
        </p>
        <Link href="/signup">
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-lg text-lg shadow mb-12">
            Get Started Free
          </button>
        </Link>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl mb-16">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
            <span className="text-3xl mb-2">🍽️</span>
            <h3 className="font-bold text-lg mb-2">Smart Meal Planning</h3>
            <p className="text-gray-600">AI-powered meal suggestions based on your family's preferences, dietary restrictions, and cooking skill level.</p>
          </div>
          {/* Feature 2 */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
            <span className="text-3xl mb-2">🛒</span>
            <h3 className="font-bold text-lg mb-2">Optimized Shopping Lists</h3>
            <p className="text-gray-600">Automatically generated grocery lists organized by store, with real-time sale prices and deals.</p>
          </div>
          {/* Feature 3 */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
            <span className="text-3xl mb-2">💵</span>
            <h3 className="font-bold text-lg mb-2">Save Money</h3>
            <p className="text-gray-600">Take advantage of local grocery store sales and seasonal ingredients to reduce your grocery bill.</p>
          </div>
          {/* Feature 4 */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
            <span className="text-3xl mb-2">👨‍👩‍👧‍👦</span>
            <h3 className="font-bold text-lg mb-2">Family-Friendly</h3>
            <p className="text-gray-600">Kid-approved recipes with customizable portions for different age groups and dietary needs.</p>
          </div>
          {/* Feature 5 */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
            <span className="text-3xl mb-2">⏰</span>
            <h3 className="font-bold text-lg mb-2">Save Time</h3>
            <p className="text-gray-600">No more wondering "what's for dinner?" Get a complete weekly meal plan in seconds.</p>
          </div>
          {/* Feature 6 */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
            <span className="text-3xl mb-2">⭐</span>
            <h3 className="font-bold text-lg mb-2">Learn & Improve</h3>
            <p className="text-gray-600">Rate recipes and get better suggestions over time. Build your family's perfect meal rotation.</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Ready to Transform Your Meal Planning?</h2>
          <p className="text-gray-700 mb-4">Join thousands of families who have simplified their weekly meal planning.</p>
          <Link href="/signup">
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg text-lg shadow">
              Start Planning Meals
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
