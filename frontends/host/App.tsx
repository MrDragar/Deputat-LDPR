
import React, { lazy, Suspense } from 'react';
import LoadingSpinner from './components/LoadingSpinner';

// Dynamically import the remote App component from the 'auth' micro-frontend.
// 'auth' is the name configured in vite.config.ts, and '/App' is the exposed module.
const RemoteAuthApp = lazy(() => import('auth/App'));

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8 border-b-2 border-indigo-500 pb-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Host Application Shell
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            This application is loading a remote micro-frontend using Vite Module Federation.
          </p>
        </header>

        <main className="bg-gray-800 rounded-xl shadow-2xl shadow-indigo-500/20 ring-1 ring-white/10">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-semibold text-indigo-400">Remote Authentication App</h2>
            <p className="text-gray-400 mt-1">The component below is loaded from <code className="bg-gray-700 text-pink-400 rounded px-2 py-1 text-sm">http://localhost:85</code></p>
          </div>
          <div className="p-6 min-h-[300px] flex justify-center items-center">
            <Suspense fallback={<LoadingSpinner />}>
              <RemoteAuthApp />
            </Suspense>
          </div>
        </main>

        <footer className="text-center mt-12 text-gray-500">
            <p>Powered by Vite & React with Module Federation</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
