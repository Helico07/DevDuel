import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';

// ─── Login Page ────────────────────────────────────────────────────────────────
// Interview notes:
//   - Controlled inputs: every keystroke updates a piece of React state via
//     onChange. This gives us a single source of truth for the form values —
//     we never need to read from the DOM.
//   - Async submit: we await the API call inside onSubmit. During the request,
//     `loading` is true so the button shows a spinner and is disabled, preventing
//     double-submissions.
//   - AuthContext.login(): after a successful response we call login(user) which
//     sets the global user state. Every ProtectedRoute and Navbar reads this
//     without any prop drilling.
//   - withCredentials: true on the axios instance means the HTTP-only JWT cookie
//     returned by the server is automatically stored and sent on future requests.

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/users/login', formData);
      login(res.data.data.user ?? res.data.data);   // hydrate AuthContext
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-on-background min-h-screen flex items-center justify-center p-2 overflow-hidden bg-[#0f0d15]">

      {/* Decorative blur orbs — purely visual, pointer-events disabled */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* ── Card ─────────────────────────────────────────────────────────────── */}
      <main className="relative z-10 w-full max-w-[440px] px-2">
        <div className="glass-panel p-10 rounded-xl shadow-2xl flex flex-col gap-8 border border-outline-variant/20">

          {/* Logo */}
          <header className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-lg electric-glow">
                <span
                  className="material-symbols-outlined text-on-primary text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  terminal
                </span>
              </div>
            </div>
            <h1 className="font-display text-display text-primary tracking-tighter">DevDuel</h1>
            <p className="font-body-md text-body-md text-on-surface-variant text-center">
              Enter the arena. Outsmart the world.
            </p>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-label-sm text-label-sm text-on-surface-variant px-1 uppercase tracking-widest">
                Email Address
              </label>
              <div className="input-glow flex items-center bg-surface-container-lowest border border-outline-variant/40 rounded-lg group focus-within:border-primary transition-all duration-300">
                <div className="pl-4 pr-2 text-outline group-focus-within:text-primary">
                  <span className="material-symbols-outlined text-xl">alternate_email</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none focus:ring-0 font-label-mono text-label-mono py-4 text-on-surface placeholder:text-outline-variant/60 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="password" className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                  Password
                </label>
                <button type="button" className="font-label-sm text-label-sm text-primary hover:underline transition-all">
                  FORGOT?
                </button>
              </div>
              <div className="input-glow flex items-center bg-surface-container-lowest border border-outline-variant/40 rounded-lg group focus-within:border-primary transition-all duration-300">
                <div className="pl-4 pr-2 text-outline group-focus-within:text-primary">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none focus:ring-0 font-label-mono text-label-mono py-4 text-on-surface placeholder:text-outline-variant/60 outline-none"
                />
                {/* Toggle password visibility — useState flips input type */}
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="pr-4 text-outline hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2 px-1">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-outline-variant/40 bg-surface-container-lowest text-primary focus:ring-primary focus:ring-offset-background"
              />
              <label htmlFor="remember" className="font-body-md text-label-sm text-on-surface-variant cursor-pointer">
                Remember my session
              </label>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-error text-sm text-center bg-error-container/20 rounded-lg py-2 px-4">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="electric-glow bg-primary hover:bg-primary-container text-on-primary py-4 rounded-lg font-display text-body-md font-extrabold uppercase tracking-widest transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Logging in…
                </>
              ) : 'Login'}
            </button>
          </form>

          {/* Secondary actions */}
          <footer className="flex flex-col items-center gap-6">
            {/* Divider */}
            <div className="flex items-center w-full gap-4">
              <div className="h-px bg-outline-variant/20 flex-grow" />
              <span className="font-label-sm text-label-sm text-outline-variant">OR JOIN VIA</span>
              <div className="h-px bg-outline-variant/20 flex-grow" />
            </div>

            {/* OAuth buttons — placeholder; connect to backend OAuth when ready */}
            <div className="flex gap-4 w-full">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container border border-outline-variant/20 rounded-lg font-label-sm text-on-surface hover:bg-surface-bright transition-colors active:scale-95">
                <span className="material-symbols-outlined text-xl">code</span>
                GitHub
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container border border-outline-variant/20 rounded-lg font-label-sm text-on-surface hover:bg-surface-bright transition-colors active:scale-95">
                <span className="material-symbols-outlined text-xl">account_circle</span>
                Google
              </button>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              New contender?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline transition-all">
                Register Now
              </Link>
            </p>
          </footer>
        </div>

        {/* Tier status visual — purely decorative */}
        <div className="mt-8 flex justify-center items-center gap-6 opacity-60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
            <span className="font-label-mono text-label-sm text-on-surface-variant">GOLD TIER ELIGIBLE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#C0C0C0]" />
            <span className="font-label-mono text-label-sm text-on-surface-variant">RANKED MODE ACTIVE</span>
          </div>
        </div>
      </main>
    </div>
  );
}
