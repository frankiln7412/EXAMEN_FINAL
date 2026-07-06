import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';

export default function EnableMfa() {
  const [secret, setSecret] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/me').then(({ data }) => {
      if (data.mfa_enabled) setMfaEnabled(true);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleEnable = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/mfa/enable');
      setSecret(data.secret);
      setQrUrl(data.qr_code_url);
      setMfaEnabled(true);
      toast.success(data.message || 'MFA enabled successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enable MFA');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    setSubmitting(true);
    try {
      await api.post('/auth/mfa/disable');
      setMfaEnabled(false);
      setSecret('');
      setQrUrl('');
      toast.success('MFA disabled');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disable MFA');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">MFA Setup</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg">
        {mfaEnabled && qrUrl ? (
          <div className="text-center">
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
            <p className="text-sm text-green-600 font-medium mb-4">MFA is enabled</p>
            <button
              onClick={handleDisable}
              disabled={submitting}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Processing...' : 'Disable MFA'}
            </button>
          </div>
        ) : mfaEnabled ? (
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium mb-6">MFA is enabled</p>
            <button
              onClick={handleEnable}
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Generating...' : 'Show QR Code'}
            </button>
            <button
              onClick={handleDisable}
              disabled={submitting}
              className="w-full py-2.5 mt-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Processing...' : 'Disable MFA'}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 mb-6">
              Click the button below to generate your MFA secret and QR code.
              Scan the QR with Google Authenticator to enable two-factor authentication.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Once enabled, transfers over 500 Bs will require a TOTP code.
            </p>
            <button
              onClick={handleEnable}
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Generating...' : 'Enable MFA'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
