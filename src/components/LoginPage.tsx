// src/components/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { CiputraLogo } from './CiputraLogo';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import {
  loginUser,
  getLockoutState,
  AuthUser,
  AuthSession,
} from '../services/authService';

interface Props {
  onLoginSuccess: (user: AuthUser, session: AuthSession) => void;
  customLogoUrl: string | null;
}

export const LoginPage: React.FC<Props> = ({ onLoginSuccess, customLogoUrl }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lockout state
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Check lockout on email change or mount
  useEffect(() => {
    if (!email) {
      setLockoutSeconds(0);
      return;
    }
    const state = getLockoutState(email);
    if (state.isLocked) {
      setLockoutSeconds(state.remainingSeconds);
    } else {
      setLockoutSeconds(0);
    }
  }, [email]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await loginUser(email, password, rememberMe);

      // Sensitive data purging in memory
      setPassword('');

      if (res.success && res.user && res.session) {
        onLoginSuccess(res.user, res.session);
      } else {
        if (res.isLocked && res.remainingSeconds) {
          setLockoutSeconds(res.remainingSeconds);
        }
        setErrorMessage(res.error || 'Email atau password salah.');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      <div className="w-full flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="h-12 w-36 mx-auto bg-white/95 rounded-xl p-2 flex items-center justify-center border border-white/20 shadow-md mb-3">
              <CiputraLogo size="fit" customLogoUrl={customLogoUrl} />
            </div>
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">
              Hotel Ciputra Jakarta
            </h1>
          </div>

          {/* Lockout Warning */}
          {lockoutSeconds > 0 && (
            <div className="mb-4 p-3 bg-red-950/70 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Terkunci. Tunggu {lockoutSeconds} detik.</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && lockoutSeconds <= 0 && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  disabled={isLoading || lockoutSeconds > 0}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Email"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition disabled:opacity-50"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading || lockoutSeconds > 0}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition disabled:opacity-50 font-mono"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading || lockoutSeconds > 0}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                <span className="text-xs text-slate-300">
                  Ingat Saya
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-3"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Login</span>
                </>
              ) : lockoutSeconds > 0 ? (
                <span>Terkunci ({lockoutSeconds}s)</span>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="text-center py-3 text-[11px] text-slate-500">
        Hotel Ciputra Jakarta &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};
