import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Transfer() {
  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLookup = async () => {
    if (!recipient) {
      toast.error('Enter recipient email or phone');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/transfer/lookup', { identifier: recipient });
      setRecipientName(data.name);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Recipient not found');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (amt > 500 && !totpCode) {
      toast.error('TOTP code is required for transfers over $500');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/transfer', {
        recipient_identifier: recipient,
        amount: amt,
        description,
        totp_code: amt > 500 ? totpCode : undefined,
      });
      toast.success('Transfer completed successfully');
      setStep(1);
      setRecipient('');
      setAmount('');
      setDescription('');
      setRecipientName('');
      setTotpCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Transfer</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            Step 1: Recipient Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email or Phone</label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="email@example.com or +591 70000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="What is this for?"
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Looking up...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Confirm Transfer</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Recipient</span>
            <span className="font-medium">{recipientName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-medium text-indigo-600">${parseFloat(amount).toFixed(2)}</span>
          </div>
          {description && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Description</span>
              <span className="font-medium">{description}</span>
            </div>
          )}
        </div>
        {parseFloat(amount) > 500 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TOTP Code (required for transfers over $500)
            </label>
            <input
              type="text"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center text-lg tracking-widest"
              placeholder="000000"
            />
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setStep(1)}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition-colors"
          >
            {submitting ? 'Processing...' : 'Confirm & Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
