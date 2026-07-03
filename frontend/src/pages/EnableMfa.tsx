import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';

export default function EnableMfa() {
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.post('/auth/mfa/generate')
      .then(({ data }) => {
        setSecret(data.secret);
        setQrUrl(data.qr_url);
      })
      .catch(() => toast.error('Failed to generate MFA secret'));
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Enter a 6-digit code');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/mfa/verify', { secret, totp_code: code });
      toast.success('MFA enabled successfully');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-indigo-700">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-indigo-900 mb-2">Enable MFA</h2>
        <p className="text-gray-500 mb-6">
          Scan this QR code with Google Authenticator
        </p>
        {qrUrl && (
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 inline-block">
              <QRCodeSVG value={qrUrl} size={200} />
            </div>
          </div>
        )}
        {secret && (
          <p className="text-xs text-gray-400 mb-6 break-all">
            Secret: <span className="font-mono">{secret}</span>
          </p>
        )}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter 6-digit code from app
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center text-lg tracking-widest"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !secret}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition-colors"
          >
            {submitting ? 'Verifying...' : 'Verify & Enable'}
          </button>
        </form>
      </div>
    </div>
  );
}
