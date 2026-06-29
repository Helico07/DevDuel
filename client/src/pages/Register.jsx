import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';

// ─── Register Page ─────────────────────────────────────────────────────────────
// Interview notes:
//   - Controlled inputs: same pattern as Login — all field values live in React
//     state, giving us a single source of truth for validation.
//   - Password visibility toggle: a single boolean useState flips the input type
//     between "password" and "text". Much simpler than DOM manipulation.
//   - Terms checkbox: stored in state and validated before submit — we never
//     trust the DOM to tell us if it's checked.
//   - After registration the backend creates the user AND logs them in (returns
//     the cookie). We call login(user) and redirect to /dashboard immediately.

export default function Register() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    userName: '',
    email:    '',
    password: '',
  });
  const [terms,    setTerms]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]   = useState('');
  const [loading,  setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!terms) {
      setError('You must accept the Combat Protocol to continue.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/users/register', formData);
      // After register, log the user in directly — no need for a second login step.
      // Backend sets the HTTP-only cookie; we just need to store user in state.
      login(res.data.data.user ?? res.data.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md overflow-x-hidden">

      {/* Dot-grid background pattern (defined in index.css) */}
      <div className="fixed inset-0 z-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* ── Navbar (minimal, focused on registration action) ──────────────── */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_0_20px_rgba(208,188,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">terminal</span>
            <span className="font-display text-2xl font-extrabold text-primary tracking-tighter">DevDuel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant text-xs font-semibold mr-4">Already a master?</span>
            <Link to="/login" className="text-primary font-bold hover:text-primary-container transition-colors">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main form canvas ─────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-6 py-32">
        <div className="w-full max-w-md">

          {/* Registration card */}
          <div className="glass-card p-8 rounded-xl border border-outline-variant/30 relative overflow-hidden">

            {/* Glow accent — decorative only */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              {/* Card header */}
              <div className="mb-8">
                <h2 className="font-display text-3xl font-bold text-on-surface mb-2">
                  Initialize Profile
                </h2>
                <p className="text-on-surface-variant font-body-md">
                  Forge your digital identity and prepare for technical combat.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Username */}
                <div className="space-y-2">
                  <label
                    htmlFor="userName"
                    className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-widest"
                  >
                    <span className="material-symbols-outlined text-sm">alternate_email</span>
                    Codename
                  </label>
                  <input
                    id="userName"
                    name="userName"
                    type="text"
                    required
                    placeholder="e.g. stack_overflow_king"
                    value={formData.userName}
                    onChange={handleChange}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-4 py-3 font-label-mono text-label-mono text-primary focus:border-primary focus:outline-none transition-all duration-200 placeholder:text-outline-variant/60"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-widest"
                  >
                    <span className="material-symbols-outlined text-sm">mail</span>
                    Network Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="dev@duel.io"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-4 py-3 font-label-mono text-label-mono text-primary focus:border-primary focus:outline-none transition-all duration-200 placeholder:text-outline-variant/60"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-widest"
                  >
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Encryption Key
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-4 py-3 pr-12 font-label-mono text-label-mono text-primary focus:border-primary focus:outline-none transition-all duration-200 placeholder:text-outline-variant/60"
                    />
                    {/* Password visibility toggle — flips type via useState */}
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">
                        {showPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="mt-1 rounded border-outline-variant/40 bg-surface-container-lowest text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="terms" className="text-label-sm font-body-md text-on-surface-variant cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="text-primary hover:underline">Combat Protocol</a>
                    {' '}and{' '}
                    <a href="#" className="text-primary hover:underline">Privacy Logic</a>.
                  </label>
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-error text-sm text-center bg-error-container/20 rounded-lg py-2 px-4">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-on-primary font-display font-bold text-lg py-4 rounded-lg electric-glow active:scale-[0.98] transition-all duration-200 uppercase tracking-widest flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <span
                          className="material-symbols-outlined transition-transform group-hover:translate-x-1"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          bolt
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Social connect (OAuth placeholder) */}
              <div className="mt-10">
                <div className="relative flex items-center justify-center mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant/20" />
                  </div>
                  <span className="relative px-4 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-tighter">
                    Fast Connect
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-2 py-3 border border-outline-variant/30 rounded-lg hover:bg-surface-variant transition-colors group active:scale-95 duration-200">
                    <img
                      className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWWXZBRH0ZRe94pP2qFpzu0hTq3U4zEpnmQzZ-22-0RF1UoPELQxsNr5xd7K0HpTkVt6vDkXwBw6wNl9M898Zrhoj5okSjr7ejEdCd25FipnuQqzZyRs17F4targyzZ7pzHbrvDBMWBBxwWeyhLNV3VDbOVTJefqSw-4dz6dSYQMp_eEa36kBsliB3lERChcJFaFNQ7D0x9mf3TIdo-GHh1B7xU_MYD42Qgt6Hyg0wZuy56LBdaExSwyD1_tiF4e91dAuMnPH8aPh9"
                      alt="GitHub"
                    />
                    <span className="text-xs font-semibold text-on-surface">GitHub</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 border border-outline-variant/30 rounded-lg hover:bg-surface-variant transition-colors group active:scale-95 duration-200">
                    <img
                      className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhDxmOiJI_6vtQiWzq040T86HpVN9biWeCThgKDbIO5RDoQsIdDqpCK3306ndtEBoxhHTuNibzUZudalZ-XTTx9EL9SscwJ5qB1HUAoejriisY7nLZ9BX98eIwRiahalLobsCltX4CNjh1Ayl39qGiooy9unJAVaTOw5W3r61UCDV5GtbuMjfAvNs2GcUjTGHBjA-Bc22m8IxkxT9nG2on9L0OqVWKxNZNZfRZzGyduj-BkFf8NLTA2L8pSdSbiKxmis1Ss8jlnVZg"
                      alt="Google"
                    />
                    <span className="text-xs font-semibold text-on-surface">Google</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Version label */}
          <div className="mt-8 text-center">
            <p className="text-on-surface-variant text-xs font-semibold flex items-center justify-center gap-2 uppercase tracking-widest opacity-60">
              <span className="material-symbols-outlined text-[10px]">code</span>
              System Version: v2.4.0-STABLE
              <span className="material-symbols-outlined text-[10px]">code</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-outline-variant/10 bg-background relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-semibold text-on-surface-variant">
            © 2024 DevDuel. Prove your CS knowledge.
          </p>
          <div className="flex gap-4 items-center">
            <a href="#" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">GitHub</a>
            <span className="text-outline-variant/50">•</span>
            <a href="#" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">Terms</a>
            <span className="text-outline-variant/50">•</span>
            <a href="#" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
