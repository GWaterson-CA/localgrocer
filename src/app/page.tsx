import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to LocalGrocer
        </h1>
        <p className="text-xl mb-8 text-center">
          Your smart meal planning assistant that helps you save money by finding the best deals at local grocery stores.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}
