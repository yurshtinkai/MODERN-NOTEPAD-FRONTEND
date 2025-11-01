// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // <-- IMPORT REGISTER PAGE
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// This component wraps public routes (like login)
const PublicRouteWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading app...</div>;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

// This component handles the root "/" redirect
const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading app...</div>;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

// This is your main App component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route: /login */}
          <Route
            path="/login"
            element={
              <PublicRouteWrapper>
                <LoginPage />
              </PublicRouteWrapper>
            }
          />
          
          {/* --- ADD THIS NEW ROUTE --- */}
          <Route
            path="/register"
            element={
              <PublicRouteWrapper>
                <RegisterPage />
              </PublicRouteWrapper>
            }
          />
          {/* --- END OF NEW ROUTE --- */}

          {/* Protected Route: /dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute />}>
            <Route index element={<DashboardPage />} />
          </Route>
          
          {/* Root path "/" redirects to login or dashboard */}
          <Route
            path="/"
            element={<RootRedirect />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;