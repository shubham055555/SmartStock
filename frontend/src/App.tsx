import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { StockOperations } from './pages/StockOperations';
import { Transactions } from './pages/Transactions';
import { SuppliersCategories } from './pages/SuppliersCategories';
import { Analytics } from './pages/Analytics';
import { AIDevOpsCenter } from './pages/AIDevOpsCenter';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-mono">
        Initializing SmartStock System...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Overview & Real-Time KPIs';
      case '/products':
        return 'Product & SKU Inventory';
      case '/stock-ops':
        return 'Stock IN / OUT Operations';
      case '/transactions':
        return 'Transaction Audit Ledger';
      case '/management':
        return 'Categories & Suppliers';
      case '/analytics':
        return 'Financial & Inventory Analytics';
      case '/devops':
        return 'AI DevOps & Reliability Center';
      default:
        return 'SmartStock Control';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100/60 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Application Routes */}
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedLayout>
              <Products />
            </ProtectedLayout>
          }
        />
        <Route
          path="/stock-ops"
          element={
            <ProtectedLayout>
              <StockOperations />
            </ProtectedLayout>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedLayout>
              <Transactions />
            </ProtectedLayout>
          }
        />
        <Route
          path="/management"
          element={
            <ProtectedLayout>
              <SuppliersCategories />
            </ProtectedLayout>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedLayout>
              <Analytics />
            </ProtectedLayout>
          }
        />
        <Route
          path="/devops"
          element={
            <ProtectedLayout>
              <AIDevOpsCenter />
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
