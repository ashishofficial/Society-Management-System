import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  BarChart3,
  FileText,
  Users,
  Shield,
  MessageSquare,
  CalendarDays,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import societyConfig from '../config/society';

const isLiveMode = import.meta.env.VITE_APP_MODE === 'live';
const adminCreds = societyConfig.demoCredentials.admin;
const memberCreds = societyConfig.demoCredentials.member;
const canQuickLoginAdmin = Boolean(adminCreds.username && adminCreds.password);
const canQuickLoginMember = Boolean(memberCreds.username && memberCreds.password);

const features = [
  { icon: BarChart3, title: 'Real-time Dashboard', desc: 'Track collections, expenses & financials at a glance' },
  { icon: FileText, title: 'Smart Invoicing', desc: 'Auto-generate & send professional maintenance invoices' },
  { icon: Users, title: 'Visitor Management', desc: 'Track visitors, deliveries & domestic help in real-time' },
  { icon: Shield, title: 'Complaint Tracking', desc: 'Raise, assign & resolve complaints seamlessly' },
  { icon: MessageSquare, title: 'Notice Board', desc: 'Broadcast announcements & updates to all residents' },
  { icon: CalendarDays, title: 'Facility Booking', desc: 'Book amenities like clubhouse, gym & guest rooms' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    setLoading(false);
  };

  const handleQuickLogin = async (role) => {
    const creds = societyConfig.demoCredentials[role];
    if (!creds?.username || !creds?.password) {
      setError('Set login credentials in .env (VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD)');
      return;
    }
    setUsername(creds.username);
    setPassword(creds.password);
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const result = await login(creds.username, creds.password);
    if (result.success) {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* LEFT: Hero panel */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-900 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-sm" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-white/5 rounded-full blur-sm" />
        <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-white/5 rounded-full" />
        <div className="absolute bottom-10 left-20 w-20 h-20 bg-white/10 rounded-full" />
        <div className="absolute top-20 right-1/4 w-16 h-16 bg-white/10 rounded-full" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          {/* Product branding */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">{societyConfig.productName}</span>
          </div>
          <p className="text-blue-200 text-base mb-10">{societyConfig.productTagline}</p>

          <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white/8 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/12 transition-colors"
              >
                <Icon className="w-7 h-7 text-blue-300 mb-2" />
                <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
                <p className="text-blue-300/80 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Company branding */}
          <p className="mt-10 text-blue-300/60 text-xs">
            Powered by <span className="font-semibold text-blue-200/80">{societyConfig.companyName}</span>
          </p>
        </div>
      </div>

      {/* RIGHT: Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">
            Welcome to {societyConfig.productName}
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Sign in to manage {societyConfig.name}
          </p>

          {(canQuickLoginAdmin || canQuickLoginMember) && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {canQuickLoginAdmin && (
                <button
                  onClick={() => handleQuickLogin('admin')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70 shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Login as Admin
                </button>
              )}
              {canQuickLoginMember && (
                <button
                  onClick={() => handleQuickLogin('member')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-70 border border-gray-200 shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Login as Member
                </button>
              )}
            </div>
          )}

          {(canQuickLoginAdmin || canQuickLoginMember) && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-gray-50 text-gray-400">or sign in manually</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className={`space-y-4 ${shake ? 'animate-shake' : ''}`}
          >
            <div>
              <label htmlFor="login-identity" className="block text-sm font-medium text-gray-700 mb-1.5">
                {isLiveMode ? 'Email' : 'Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="login-identity"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isLiveMode ? 'admin@clave.demo' : 'Enter your username'}
                  autoComplete={isLiveMode ? 'email' : 'username'}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            {societyConfig.productName} by{' '}
            <a href={societyConfig.companyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {societyConfig.companyName}
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
