import React, { useEffect, useState } from 'react';
import { api, APIError } from '../services/api';
import { RegistrationForm } from '../types';
import FormCard from './FormCard';
import { useAuth } from '../App';
import Spinner from './Spinner';
import EmptyStatePlaceholder from './ui/EmptyStatePlaceholder';

const Header: React.FC = () => {
    const { logout } = useAuth();
    return (
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <h1 className="text-xl font-bold text-gray-900">Unprocessed Applications</h1>
                    <button
                        onClick={logout}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};


const DashboardPage: React.FC = () => {
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const data = await api.getForms();
        // Filter out forms that might be missing a user ID
        setForms(data.filter(form => form.user));
      } catch (err) {
        if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
          logout();
        } else {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchForms();
  }, [logout]);

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Spinner />
        </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500 text-xl">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            {forms.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                    <EmptyStatePlaceholder imageUrl="https://illustrations.popsy.co/gray/in-no-time.svg" />
                    <h2 className="text-2xl font-semibold text-gray-700 mt-8">No applications found.</h2>
                    <p className="text-gray-500 mt-2">Check back later for new submissions.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {forms.map((form) => (
                        <FormCard key={form.user} form={form} />
                    ))}
                </div>
            )}
        </main>
    </div>
  );
};

export default DashboardPage;