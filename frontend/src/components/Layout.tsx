import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getUser, clearTokens, clearUser } from '../lib/auth';
import api from '../lib/api';
import { useState, useEffect } from 'react';

interface WalletInfo {
  balance: number;
  currency: string;
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);

  useEffect(() => {
    api.get('/wallet').then(({ data }) => setWallet(data)).catch(() => {});
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    clearTokens();
    clearUser();
    toast.success('Logged out');
    navigate('/');
  };

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-indigo-700 hover:text-white transition-colors"
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-indigo-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-indigo-700">
          <h1 className="text-2xl font-bold tracking-tight">SecureWallet</h1>
          {user && (
            <p className="text-indigo-300 text-sm mt-1 truncate">{user.name}</p>
          )}
          {wallet !== null && (
            <p className="text-indigo-200 text-xs mt-1">
              Balance: {wallet.currency} {Number(wallet.balance).toFixed(2)}
            </p>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/wallet', 'Wallet')}
          {navLink('/transfer', 'Transfer')}
          {navLink('/transactions', 'Transactions')}
          {navLink('/mfa/enable', 'MFA Setup')}
          {user?.role === 'admin' && (
            <>
              <div className="text-indigo-400 text-xs uppercase tracking-wider px-4 pt-4 pb-1 font-semibold">
                Admin
              </div>
              {navLink('/admin/users', 'Users')}
              {navLink('/admin/audit-logs', 'Audit Logs')}
            </>
          )}
        </nav>
        <div className="p-4 border-t border-indigo-700">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-indigo-800 hover:bg-indigo-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
