import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { getUser } from '../lib/auth';

interface Wallet {
  balance: number;
  currency: string;
}

export default function Dashboard() {
  const user = getUser();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/me').catch(() => null),
      api.get('/wallet').catch(() => null),
    ])
      .then(([, walletRes]) => {
        if (walletRes) setWallet(walletRes.data);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Profile
          </h3>
          <div className="mt-4 space-y-3">
            <div>
              <span className="text-xs text-gray-400">Name</span>
              <p className="text-gray-800 font-medium">{user?.name}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">Email</span>
              <p className="text-gray-800 font-medium">{user?.email}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">CI</span>
              <p className="text-gray-800 font-medium">{user?.ci}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">Phone</span>
              <p className="text-gray-800 font-medium">{user?.phone}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">Role</span>
              <p className="text-gray-800 font-medium capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Wallet Balance
          </h3>
          <div className="mt-4">
            {wallet ? (
              <p className="text-4xl font-bold text-indigo-600">
                {wallet.currency} {Number(wallet.balance).toFixed(2)}
              </p>
            ) : (
              <p className="text-gray-400">No wallet found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
