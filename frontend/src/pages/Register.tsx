import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    ci: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [captcha, setCaptcha] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!captcha) {
      toast.error('Please confirm you are not a robot');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/register', {
        name: form.name,
        ci: form.ci,
        email: form.email,
        phone: form.phone,
        password: form.password,
        captcha_token: 'test-captcha',
      });
      toast.success('Registration successful! Please log in.');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      const errors = err.response?.data?.errors;
      if (errors) {
        const details = Object.entries(errors).map(([, msgs]) => (msgs as string[]).join(', ')).join(' | ');
        toast.error(details || msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-indigo-700 py-10">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-indigo-900 mb-2">
          Create Account
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Join SecureWallet today
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={form.name} onChange={update('name')} className={inputClass} placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CI / ID Number</label>
            <input type="text" required value={form.ci} onChange={update('ci')} className={inputClass} placeholder="12345678" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={update('email')} className={inputClass} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" required value={form.phone} onChange={update('phone')} className={inputClass} placeholder="+591 70000000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={form.password} onChange={update('password')} className={inputClass} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" required value={form.confirmPassword} onChange={update('confirmPassword')} className={inputClass} placeholder="••••••••" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={captcha} onChange={(e) => setCaptcha(e.target.checked)} className="rounded" />
            I am not a robot
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition-colors"
          >
            {submitting ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/" className="text-indigo-600 hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
