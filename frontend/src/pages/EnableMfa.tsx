import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';

export default function EnableMfa() {
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEnable = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/mfa/enable');
      setSecret(data.secret);
      setQrUrl(data.qr_code_url);
      toast.success(data.message || 'MFA enabled successfully');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enable MFA');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-indigo-700">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-indigo-900 mb-2">Enable MFA</h2>
        {!qrUrl ? (
          <>
            <p className="text-gray-500 mb-6">
              Click the button below to generate your MFA secret and QR code.
            </p>
            <button
              onClick={handleEnable}
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Generating...' : 'Enable MFA'}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-500 mb-6">
              Scan this QR code with Google Authenticator
            </p>
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-xl border border-gray-200 inline-block">
                <QRCodeSVG value={qrUrl} size={200} />
              </div>
            </div>
            {secret && (
              <p className="text-xs text-gray-400 mb-6 break-all">
                Secret: <span className="font-mono">{secret}</span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
