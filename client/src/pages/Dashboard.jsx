import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ShaderCanvas from '../components/ShaderCanvas';
import api from '../utils/axios';

// Helper to determine rank name based on ELO
function getRankName(rating) {
  if (rating < 1200) return 'Bronze';
  if (rating < 1500) return 'Silver';
  if (rating < 1800) return 'Gold';
  if (rating < 2000) return 'Platinum';
  if (rating < 2200) return 'Diamond';
  return 'Master';
}

// ─── Reusable GlassPanel with Mouse Hover Glow ───────────────────────────────
// Implements the micro-interaction defined in the Stitch specs
function GlassPanel({ children, className = '', ...props }) {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      className={`glass-panel ${className}`}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  
  const username = user?.userName || 'developer';
  const displayRating = user?.rating || 1000;
  const rankName = getRankName(displayRating);
  
  const contestsPlayed = user?.contestsPlayed || 0;
  const contestsWon = user?.contestsWon || 0;
  const winRate = contestsPlayed > 0 ? Math.round((contestsWon / contestsPlayed) * 100) : 0;

  // Fetch real category stats from the $facet analytics endpoint
  useEffect(() => {
    if (!user?.userName) return;
    const fetchStats = async () => {
      try {
        const res = await api.get(`/leaderboard/profile/${user.userName}/stats`);
        setStats(res.data.data);
      } catch (err) {
        console.error("Failed to load category stats", err);
      }
    };
    fetchStats();
  }, [user?.userName]);

  // Compute rating history bars
  const history = user?.ratingHistory || [];
  // Grab up to last 8 elements, if empty, just use a default flat line
  const displayHistory = history.length > 0 ? history.slice(-8) : [{ elo: displayRating }];
  const minElo = Math.min(...displayHistory.map(h => h.elo)) - 50;
  const maxElo = Math.max(...displayHistory.map(h => h.elo)) + 50;
  const range = maxElo - minElo;

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen overflow-x-hidden selection:bg-primary selection:text-on-primary">
      <div className="flex">
        
        {/* ─── Sidebar (Desktop) ───────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col p-2 gap-2 h-screen w-64 fixed left-0 top-0 bg-surface-container border-r border-outline-variant/20 z-40">
          <div className="mb-12 px-4 pt-4">
            <Link to="/" className="font-display text-2xl font-bold text-primary">DevDuel</Link>
          </div>
          
          <nav className="flex flex-col gap-2">
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-primary-container text-on-primary-container font-bold rounded-lg transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
              <span>Dashboard</span>
            </Link>
            <Link to="/leaderboard" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors active:scale-[0.98]">
              <span className="material-symbols-outlined">leaderboard</span>
              <span>Leaderboard</span>
            </Link>
            <Link to={`/profile/${username}`} className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors active:scale-[0.98]">
              <span className="material-symbols-outlined">person</span>
              <span>Profile</span>
            </Link>
          </nav>

          <div className="mt-auto pt-4 flex flex-col gap-2">
            <GlassPanel className="p-4 rounded-xl mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-outline-variant">
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6oE1u7xKjrsNLcgZ8L7QGntoHbHqVZ4w-rYTxA7p0V7fxeSdZxpa8-ilAK-WedWfUHhtwcya2ke_y0s2dY05w7pAoUVpJVkVx6YynNZbuSTfy4ZVjWULBL451L7qVGea0k27w2dCFBJdb6-yOeOorNSt7z-JPvdHe2KOpGCBJmkrSbKBa8lDcwxXLD6-5mYBnBIQXpTCbO5ve8r3gAxxrOBj7sxfvTms8ESiA-LqwjyZEHbHeovzQSxSeapDfZZERbEGx4ain5kof"
                    alt="User avatar"
                  />
                </div>
                <div>
                  <p className="font-bold text-on-surface text-xs">@{username}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{rankName} Tier</p>
                </div>
              </div>
              <Link to="/battle" className="block w-full py-2 bg-primary text-on-primary font-bold uppercase text-xs text-center rounded-lg violet-glow transition-all active:scale-95">
                Start Duel
              </Link>
            </GlassPanel>
            
            <button className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors w-full">
              <span className="material-symbols-outlined">settings</span>
              <span className="text-xs font-semibold">Settings</span>
            </button>
            <button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors w-full">
              <span className="material-symbols-outlined">logout</span>
              <span className="text-xs font-semibold">Logout</span>
            </button>
          </div>
        </aside>

        {/* ─── Main Content Area ───────────────────────────────────────────── */}
        <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
          
          {/* Top Navbar */}
          <header className="fixed top-0 right-0 left-0 md:left-64 z-50 bg-background/80 nav-blur border-b border-outline-variant/30">
            <div className="max-w-7xl mx-auto px-6 md:px-8 flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <span className="md:hidden font-display text-2xl font-extrabold text-primary tracking-tighter">DD</span>
                <div className="hidden sm:flex items-center bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant/30">
                  <span className="material-symbols-outlined text-outline text-lg">search</span>
                  <input
                    className="bg-transparent border-none focus:ring-0 outline-none text-base text-on-surface placeholder:text-outline-variant w-48 ml-2"
                    placeholder="Search opponents..."
                    type="text"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-1 rounded-full border border-outline-variant/50">
                  <span className="w-2 h-2 rounded-full bg-[#C0C0C0] shadow-[0_0_8px_#C0C0C0]"></span>
                  <span className="font-label-mono text-xs font-semibold text-[#C0C0C0] uppercase">{rankName} • {displayRating}</span>
                </div>
                <div className="w-10 h-10 rounded-full border border-primary/30 p-0.5">
                  <img
                    className="w-full h-full rounded-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLQZglYidmA26dqpbhQlT1AqRyi1LPqslsSf1Qrdh2I-lWmj0Zoqxckh2b4ikGZIsPbdxOjrr_A5-leMfy_EPdo7k7e5SCTw_b7oaqZkLWRjCsJKmKdTIkKUEwHJYLK1ayFpqEXTeB94VFHXiWY7Kxddsv_sxpdDV1norn9qrGdakX_3Iys5w_G9FsViZGwMnzfcl9F-preh7Q7p8g8Bk8KT7RzMFXCJ42wYbaaaAh1vKDDb89y2ieC4cDyZJER-SPpYcaGWqM-npj"
                    alt="Avatar"
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="mt-16 p-6 md:p-8 max-w-7xl mx-auto w-full flex-grow">
            
            {/* Hero Header */}
            <GlassPanel className="mb-12 relative overflow-hidden rounded-xl p-8 border border-primary/20">
              <ShaderCanvas className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="font-display text-3xl font-bold text-on-background mb-2">
                    Welcome back, <span className="text-primary">@{username}</span>
                  </h1>
                  <p className="text-on-surface-variant font-body-md max-w-md leading-relaxed">
                    Your coding prowess is sharp. Ready for the next duel?
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-outline mb-1">Current Rating</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[56px] leading-none font-extrabold text-white drop-shadow-lg">{displayRating}</span>
                    <span className="text-secondary font-bold text-2xl uppercase">{rankName}</span>
                  </div>
                </div>
              </div>
            </GlassPanel>

            {/* Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <GlassPanel className="p-6 rounded-xl flex flex-col gap-1 hover:border-primary/40 transition-colors group">
                <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">trending_up</span>
                <span className="text-on-surface-variant text-xs uppercase font-bold tracking-wider">Rating</span>
                <span className="text-2xl font-bold text-on-surface">{displayRating}</span>
              </GlassPanel>
              <GlassPanel className="p-6 rounded-xl flex flex-col gap-1 hover:border-primary/40 transition-colors group">
                <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">sports_esports</span>
                <span className="text-on-surface-variant text-xs uppercase font-bold tracking-wider">Duels</span>
                <span className="text-2xl font-bold text-on-surface">{contestsPlayed}</span>
              </GlassPanel>
              <GlassPanel className="p-6 rounded-xl flex flex-col gap-1 hover:border-primary/40 transition-colors group">
                <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">military_tech</span>
                <span className="text-on-surface-variant text-xs uppercase font-bold tracking-wider">Victories</span>
                <span className="text-2xl font-bold text-on-surface">{contestsWon}</span>
              </GlassPanel>
              <GlassPanel className="p-6 rounded-xl flex flex-col gap-1 hover:border-primary/40 transition-colors group">
                <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">percent</span>
                <span className="text-on-surface-variant text-xs uppercase font-bold tracking-wider">Win Rate</span>
                <span className="text-2xl font-bold text-on-surface">{winRate}%</span>
                <div className="w-full bg-surface-variant h-1 rounded-full mt-1">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${winRate}%` }}></div>
                </div>
              </GlassPanel>
            </section>

            {/* Actions & Trends */}
            <section className="grid lg:grid-cols-3 gap-6 mb-12">
              <div className="lg:col-span-1 flex flex-col gap-6">
                <h2 className="text-2xl font-display font-bold text-on-surface">Quick Actions</h2>
                <Link to="/battle" className="block w-full group relative overflow-hidden flex items-center justify-between p-6 bg-primary text-on-primary rounded-xl violet-glow transition-all active:scale-[0.97]">
                  <div className="flex flex-col items-start relative z-10">
                    <span className="font-display text-2xl font-extrabold uppercase italic">1v1 Battle</span>
                    <span className="text-xs font-semibold opacity-80">Ranked Matchmaking</span>
                  </div>
                  <span className="material-symbols-outlined text-4xl relative z-10 group-hover:translate-x-2 transition-transform">bolt</span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
                <Link to="/solo" className="block w-full flex items-center justify-between p-6 border border-secondary/30 bg-secondary/5 text-secondary rounded-xl hover:bg-secondary/10 transition-all active:scale-[0.97]">
                  <div className="flex flex-col items-start">
                    <span className="font-display text-2xl font-extrabold uppercase">Solo Practice</span>
                    <span className="text-xs font-semibold opacity-80">Refine Your Skills</span>
                  </div>
                  <span className="material-symbols-outlined text-4xl">terminal</span>
                </Link>
              </div>

              {/* Trend Chart (Placeholder) */}
              <GlassPanel className="lg:col-span-2 p-6 rounded-xl relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">Elo Performance Trend</h2>
                  <div className="flex gap-4">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Current</span>
                    <span className="text-xs font-semibold text-outline flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-outline"></span> Previous</span>
                  </div>
                </div>
                <div className="flex-1 w-full relative flex items-end gap-1 min-h-[160px]">
                  <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                    <div className="border-t border-white w-full"></div>
                    <div className="border-t border-white w-full"></div>
                    <div className="border-t border-white w-full"></div>
                    <div className="border-t border-white w-full"></div>
                  </div>
                  {displayHistory.map((h, i) => {
                    const heightPercent = Math.max(10, ((h.elo - minElo) / range) * 100);
                    const isLast = i === displayHistory.length - 1;
                    return (
                      <div
                        key={i}
                        title={`Elo: ${h.elo}`}
                        className={`flex-1 hover:bg-primary/60 transition-colors rounded-t-sm z-10 relative ${
                          isLast ? 'bg-primary/50 border-t-2 border-primary shadow-[0_-4px_12px_rgba(208,188,255,0.3)]' : 'bg-primary/20'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-4 text-[10px] text-outline-variant font-label-mono">
                  <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span><span>TODAY</span>
                </div>
              </GlassPanel>
            </section>

            {/* Category Grid (Bento Style) */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-on-surface">Knowledge Matrix</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {['DSA', 'OS', 'DBMS', 'CN', 'OOP'].map(category => {
                  const catStat = stats?.[category] || { accuracy: 0 };
                  const acc = Math.round(catStat.accuracy || 0);
                  // Quick color mapping based on category with explicit tailwind classes
                  const colorMap = {
                    'DSA':  { text: 'text-primary', border: 'border-primary/40', bg: 'bg-primary' },
                    'OS':   { text: 'text-secondary', border: 'border-secondary/40', bg: 'bg-secondary' },
                    'DBMS': { text: 'text-tertiary', border: 'border-tertiary/40', bg: 'bg-tertiary' },
                    'CN':   { text: 'text-error', border: 'border-error/40', bg: 'bg-error' },
                    'OOP':  { text: 'text-green-400', border: 'border-green-400/40', bg: 'bg-green-400' }
                  };
                  const colors = colorMap[category];
                  
                  return (
                    <GlassPanel key={category} className={`p-6 rounded-xl flex flex-col items-center justify-center text-center border-b-2 ${colors.border}`}>
                      <span className={`${colors.text} font-label-mono text-xl font-bold mb-1`}>{acc}%</span>
                      <span className="text-on-surface-variant text-xs font-bold uppercase">{category}</span>
                      <div className="w-12 h-1 bg-surface-variant mt-3 rounded-full overflow-hidden">
                        <div className={`${colors.bg} h-full`} style={{ width: `${acc}%` }}></div>
                      </div>
                    </GlassPanel>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Footer */}
          <footer className="w-full py-12 border-t border-outline-variant/10 mt-auto">
            <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col items-center md:items-start">
                <span className="font-display text-lg font-bold text-primary">DevDuel</span>
                <p className="font-label-sm text-xs font-semibold text-on-surface-variant">© 2024 DevDuel. Prove your CS knowledge.</p>
              </div>
              <div className="flex gap-6">
                <a href="#" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">GitHub</a>
                <a href="#" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">Terms</a>
                <a href="#" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">Privacy</a>
              </div>
            </div>
          </footer>
        </main>

        {/* ─── Mobile Navigation (Fixed Bottom) ────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container/90 backdrop-blur-xl border-t border-outline-variant/20 flex items-center justify-around z-50 px-6">
          <Link to="/dashboard" className="flex flex-col items-center gap-1 text-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="text-[10px] font-bold uppercase">Home</span>
          </Link>
          <Link to="/leaderboard" className="flex flex-col items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined">leaderboard</span>
            <span className="text-[10px] font-bold uppercase">Rank</span>
          </Link>
          <div className="relative -top-6">
            <Link to="/battle" className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg violet-glow active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-3xl">bolt</span>
            </Link>
          </div>
          <Link to="/solo" className="flex flex-col items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined">code</span>
            <span className="text-[10px] font-bold uppercase">Duel</span>
          </Link>
          <Link to={`/profile/${username}`} className="flex flex-col items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-bold uppercase">User</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
