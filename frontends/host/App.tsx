import React, {Suspense, useState, useEffect} from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import {AuthProvider, useAuth} from './context/AuthContext';
import { FederalPlanProvider } from './context/FederalPlanContext';
import { AlertProvider } from './context/AlertContext';
import LoginPage from './pages/auth/LoginPage';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ApplicationsListPage from './pages/management/ApplicationsListPage';
import ApplicationDetailPage from './pages/management/ApplicationDetailPage';
import MyProfilePage from './pages/profile/MyProfilePage';
import FederalPlanCreatePage from './pages/federal-plan/FederalPlanCreatePage';
import FederalPlanEditPage from './pages/federal-plan/FederalPlanEditPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ReportsPage from './pages/reporting/ReportsPage';
import DeputiesListPage from './pages/deputies/DeputiesListPage';
import DeputyProfilePage from './pages/deputies/DeputyProfilePage';
import {User} from "@/types";
import { api } from './services/api';
import './index.css'  // Импорт Tailwind CSS
const AutumnReport = React.lazy(() => import('reports/App'));

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <FederalPlanProvider>
          <AlertProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route 
                  path="federal-plan/create" 
                  element={
                    <ProtectedRoute roles={['admin', 'employee']}>
                      <FederalPlanCreatePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="federal-plan/edit/:date" 
                  element={
                    <ProtectedRoute roles={['admin', 'employee']}>
                      <FederalPlanEditPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="applications" 
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <ApplicationsListPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="applications/:id" 
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <ApplicationDetailPage />
                    </ProtectedRoute>
                  } 
                />
                 <Route 
                  path="deputies" 
                  element={
                    <ProtectedRoute roles={['admin', 'coordinator']}>
                      <DeputiesListPage />
                    </ProtectedRoute>
                  } 
                />
                 <Route 
                  path="deputies/:userId" 
                  element={
                    <ProtectedRoute roles={['admin', 'coordinator']}>
                      <DeputyProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="reports" 
                  element={
                    <ProtectedRoute roles={['admin', 'coordinator', 'employee']}>
                      <ReportsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="my-profile" 
                  element={
                    <ProtectedRoute roles={['deputy', 'coordinator']}>
                      <MyProfilePage />
                    </ProtectedRoute>
                  } 
                />
              </Route>
<Route 
  path="/autumn-report" 
  element={
    <ProtectedRoute roles={['admin', 'coordinator', 'employee', 'deputy']}>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <AutumnReportWrapper />
      </Suspense>
    </ProtectedRoute>
  } 
/>
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AlertProvider>
        </FederalPlanProvider>
      </AuthProvider>
    </HashRouter>
  );
};

const AutumnReportWrapper: React.FC = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.user_id) {
        try {
          const data = await api.getUserById(user.user_id);
          setUserData(data);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <AutumnReport userData={userData} />;
};
export default App;