import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Transfer() {
  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pendingUuid, setPendingUuid] = useState('');
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const generateIdempotencyKey = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  };

  const handleInitiate = async () => {
    const amt = parseFloat(amount);
    if (!recipient) { toast.error('Enter recipient email or phone'); return; }
    if (!amt || amt < 1) { toast.error('Minimum transfer is 1.00 Bs'); return; }
    if (amt > 5000) { toast.error('Maximum transfer is 5,000.00 Bs'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/transfers', {
        destinatario: recipient,
        monto: amt,
        descripcion: description || undefined,
      }, {
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
      });
      setPendingUuid(data.transaction_uuid);
      setRequiresTotp(data.requires_totp || false);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transfer initiation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (requiresTotp && (!totpCode || totpCode.length !== 6)) {
      toast.error('Enter a valid 6-digit TOTP code');
      return;
    }
    setSubmitting(true);
    try {
      const body: any = {};
      if (requiresTotp) body.totp_code = totpCode;
      await api.post(`/transfers/${pendingUuid}/confirm`, body);
      toast.success('Transfer completed successfully');
      setStep(1);
      setRecipient('');
      setAmount('');
      setDescription('');
      setPendingUuid('');
      setRequiresTotp(false);
      setTotpCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transfer confirmation failed');
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
            Transfer Details
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
                placeholder="email@example.com or 70123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Bs)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                max="5000"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-400 mt-1">Min: 1.00 Bs — Max: 5,000.00 Bs</p>
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
              onClick={handleInitiate}
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Processing...' : 'Continue'}
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
            <span className="font-medium">{recipient}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-medium text-indigo-600">{parseFloat(amount).toFixed(2)} Bs</span>
          </div>
          {description && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Description</span>
              <span className="font-medium">{description}</span>
            </div>
          )}
        </div>
        {requiresTotp && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TOTP Code (required for transfers over 500 Bs)
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