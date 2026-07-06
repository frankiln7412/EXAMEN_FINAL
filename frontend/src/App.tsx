import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WalletPage from './pages/Wallet';
import Transfer from './pages/Transfer';
import TransactionsPage from './pages/Transactions';
import UsersList from './pages/admin/UsersList';
import AuditLogs from './pages/admin/AuditLogs';
import EnableMfa from './pages/EnableMfa';
import { isAuthenticated, getUser } from './lib/auth';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  if (adminOnly && getUser()?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/mfa/enable" element={<EnableMfa />} />
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly>
              <UsersList />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-logs" element={
            <ProtectedRoute adminOnly>
              <AuditLogs />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
