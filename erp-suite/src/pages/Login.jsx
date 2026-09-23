import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2,
  PackageCheck,
  FileCheck2,
  Boxes
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // If already logged in, redirect directly to dashboard or target route
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Please enter your username');
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(username.trim(), password, rememberMe);
      toast.success(`Welcome, ${user.name || user.username}!`, {
        duration: 3000,
      });
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
      let message = error.response?.data?.message;
      if (!message) {
        if (error.response?.status === 502 || error.response?.status === 503) {
          message = 'Server or Database is currently offline. Please ensure MongoDB and Backend are running.';
        } else if (error.code === 'ERR_NETWORK') {
          message = 'Cannot connect to backend server. Please verify the server is running on port 5000.';
        } else {
          message = 'Invalid username or password';
        }
      }
      toast.error(message, {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }

  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50">
      {/* Left Column: Industrial Corporate Brand Hero */}
      <div className="hidden lg:flex lg:w-5/12 bg-linear-to-br from-[#003c82] via-[#0059bb] to-sky-600 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-300/15 blur-3xl pointer-events-none" />

        {/* Top Logo & Title */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white p-2.5 rounded-xl shadow-md">
            <img 
              src="/logo.png" 
              alt="Neeta Engineering Works" 
              className="h-9 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Neeta Engineering Works</span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4 tracking-wider uppercase">
            Enterprise ERP Suite
          </span>
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Integrated Industrial & Logistics Operations
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-8">
            Centralized platform for material inward/outward tracking, delivery challans, GST invoicing, and real-time inventory balances.
          </p>

          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-sm text-slate-200">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <PackageCheck size={17} />
              </div>
              <span>Material Inward (CR) & Delivery Challan Lifecycle</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-200">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <FileCheck2 size={17} />
              </div>
              <span>GST Compliant Invoicing & Statement Register</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-200">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <Boxes size={17} />
              </div>
              <span>Division Inventory Balances & Contractor Ledgers</span>
            </li>
          </ul>
        </div>

        {/* Bottom Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-400 relative z-10 border-t border-white/10 pt-6">
          <span>Enterprise Edition • v2.5</span>
          <span>Precision & Reliability</span>
        </div>
      </div>

      {/* Right Column: Login Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80">
          {/* Mobile branding header */}
          <div className="lg:hidden flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <img 
              src="/logo.png" 
              alt="Neeta Engineering Works" 
              className="h-8 object-contain" 
            />
            <span className="font-bold text-base text-slate-900">
              Neeta Engineering Works
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter your credentials to access your ERP workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Checkbox and Help Link */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-[#0059bb] focus:ring-[#0059bb]"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <span 
                className="text-[#0059bb] hover:underline cursor-pointer"
                onClick={() => toast('Contact your system administrator to reset credentials.', { icon: 'ℹ️' })}
              >
                Need help?
              </span>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full py-3 bg-[#0059bb] hover:bg-[#004899] text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Role Auto-Fill Pills */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-slate-700">Quick Test Roles:</span>
              <span className="text-[11px] text-slate-400">Click to autofill</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Admin', user: 'admin', pass: 'admin123', color: 'hover:border-red-500 hover:text-red-600' },
                { label: 'Owner', user: 'owner', pass: 'owner123', color: 'hover:border-amber-500 hover:text-amber-600' },
                { label: 'Accounts Mgr', user: 'manager.accounts', pass: 'accounts123', color: 'hover:border-blue-500 hover:text-blue-600' },
                { label: 'Store Mgr', user: 'manager.logistics', pass: 'logistics123', color: 'hover:border-emerald-500 hover:text-emerald-600' },
                { label: 'Production Mgr', user: 'manager.production', pass: 'production123', color: 'hover:border-indigo-500 hover:text-indigo-600' },
                { label: 'Quality Mgr', user: 'manager.quality', pass: 'quality123', color: 'hover:border-cyan-500 hover:text-cyan-600' },
                { label: 'Billing Staff', user: 'user.billing', pass: 'billing123', color: 'hover:border-blue-500 hover:text-blue-600' },
                { label: 'Store Staff', user: 'user.store', pass: 'store123', color: 'hover:border-emerald-500 hover:text-emerald-600' },
              ].map((roleItem) => (
                <button
                  key={roleItem.user}
                  type="button"
                  onClick={() => {
                    setUsername(roleItem.user);
                    setPassword(roleItem.pass);
                    toast.success(`Filled ${roleItem.label} credentials!`, { duration: 1800 });
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer ${roleItem.color}`}
                >
                  {roleItem.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} Neeta Engineering Works. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
