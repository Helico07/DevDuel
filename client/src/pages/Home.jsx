import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ShaderCanvas from '../components/ShaderCanvas';

const CATEGORIES = [
  { id: 'DSA',  label: 'DSA',  icon: 'account_tree' },
  { id: 'OS',   label: 'OS',   icon: 'memory'        },
  { id: 'DBMS', label: 'DBMS', icon: 'database'      },
  { id: 'CN',   label: 'CN',   icon: 'router'        },
  { id: 'OOP',  label: 'OOP',  icon: 'category'      },
];

// ─── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_0_20px_rgba(208,188,255,0.1)]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex justify-between items-center h-16">
        <Link to="/" className="font-display text-2xl font-extrabold text-primary tracking-tighter">
          DevDuel
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/leaderboard" className="text-base text-on-surface-variant hover:text-on-surface transition-colors font-medium">
            Leaderboard
          </Link>
          <Link to="/login" className="text-base text-on-surface-variant hover:text-on-surface transition-colors font-medium">
            Login
          </Link>
          <Link
            to="/register"
            className="bg-primary text-on-primary font-bold px-6 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all shadow-[0_0_15px_rgba(208,188,255,0.3)]"
          >
            Register
          </Link>
        </div>
        <button className="md:hidden text-on-surface">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </nav>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ onStartBattling, onViewLeaderboard }) {
  return (
    <header className="relative min-h-[921px] flex items-center justify-center pt-16 overflow-hidden">
      <ShaderCanvas className="absolute inset-0 w-full h-full opacity-40" />
      <div className="absolute inset-0 hero-gradient" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold mb-6 animate-pulse">
          <span className="material-symbols-outlined text-[14px]">bolt</span>
          SEASON 1 IS LIVE
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
          Prove Your CS Knowledge. <br />
          <span className="text-primary italic">One Battle at a Time.</span>
        </h1>

        <p className="text-lg text-on-surface-variant mb-10 max-w-2xl mx-auto leading-relaxed">
          The high-stakes 1v1 competitive arena for developers. Duel in real-time,
          climb the Master Tier, and showcase your technical dominance.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onStartBattling}
            className="w-full sm:w-auto bg-primary text-on-primary px-8 py-4 rounded-xl font-bold text-lg glow-violet transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">stadium</span>
            Start Battling
          </button>
          <button
            onClick={onViewLeaderboard}
            className="w-full sm:w-auto border border-outline text-on-surface px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-variant/30 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">leaderboard</span>
            View Leaderboard
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar() {
  return (
    <section className="relative z-20 -mt-12 max-w-5xl mx-auto px-6 md:px-10">
      <div className="glass-card rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div>
          <p className="text-primary font-display text-4xl font-extrabold">12.4k</p>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mt-2">Total Players</p>
        </div>
        <div className="md:border-x border-outline-variant/30">
          <p className="text-primary font-display text-4xl font-extrabold">3.1k</p>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mt-2">Matches Today</p>
        </div>
        <div>
          <p className="text-primary font-display text-4xl font-extrabold">50k+</p>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mt-2">Questions in Pool</p>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ──────────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    icon: 'person_add', num: '01',
    title: '1. Join Queue',
    desc: 'Select your preferred CS categories and enter the competitive matchmaking lobby.',
  },
  {
    icon: 'group', num: '02',
    title: '2. Get Matched',
    desc: 'Our ELO system finds a perfect opponent for a balanced, high-stakes knowledge battle.',
  },
  {
    icon: 'swords', num: '03',
    title: '3. Battle Live',
    desc: 'Answer technical questions against the clock to outsmart your opponent and gain rank.',
  },
];

function HowItWorks() {
  return (
    <section className="py-20 max-w-7xl mx-auto px-6 md:px-10">
      <div className="text-center mb-16">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
        <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {HOW_STEPS.map((step) => (
          <div
            key={step.num}
            className="relative p-8 rounded-2xl bg-surface-container-low border border-outline-variant/20 hover:border-primary/40 transition-all group"
          >
            <div className="mb-6 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined !text-4xl">{step.icon}</span>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">{step.title}</h3>
            <p className="text-on-surface-variant leading-relaxed">{step.desc}</p>
            <div className="absolute top-8 right-8 text-surface-bright font-display text-6xl font-black opacity-10 select-none">
              {step.num}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CS Disciplines ────────────────────────────────────────────────────────────
function CsDisciplines() {
  const [active, setActive] = useState('DSA');

  return (
    <section className="py-20 bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">CS Disciplines</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Master these core pillars of computer science to dominate the leaderboard
              and prove your technical depth.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all cursor-pointer text-sm font-medium ${
                  active === cat.id
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/30 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Featured card */}
          <div className="glass-card rounded-2xl overflow-hidden group">
            <div className="h-64 relative overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBeLuCtF1oq1SgVEhVjoYb6m25cmJCfjJIXutHP3AIpN70kaxK29BlSghUC4Fk6kTTbHWFXKK3VhF8SxAYU_Xw25-zkCCUEy8w4GXZa-HzeP2qtNE1HXB44dOkyon_VBnIYJI_HkrTfawwUZYbCV68CVKR8bvvyjGExWUN18tc8wNpsDDE973zhdVgep-VH6MN-oiUIkUZSOvgve_k0aRsm6ezbYOf_Ta0bcD4MZiY4KvlRKp1CUSrPvco5CnnSoyQzk0Ly7jeJR02Y')` }}
                aria-label="Abstract data structure visualization"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              <div className="absolute bottom-6 left-6">
                <span className="bg-primary text-on-primary px-3 py-1 rounded text-xs font-bold mb-2 inline-block">
                  HOT DISCIPLINE
                </span>
                <h3 className="text-white text-2xl font-bold font-display">
                  Data Structures &amp; Algorithms
                </h3>
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-rows-2 gap-6">
            <div className="glass-card rounded-2xl p-8 flex items-center gap-6 group">
              <div className="w-16 h-16 rounded-full bg-surface-bright flex items-center justify-center border border-outline-variant/20 group-hover:border-primary/50 transition-colors flex-shrink-0">
                <span className="material-symbols-outlined !text-3xl text-primary">analytics</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-lg mb-2">Real-Time Analytics</h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Get detailed breakdowns of your performance across all categories post-duel.
                </p>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-8 flex items-center gap-6 group">
              <div className="w-16 h-16 rounded-full bg-surface-bright flex items-center justify-center border border-outline-variant/20 group-hover:border-primary/50 transition-colors flex-shrink-0">
                <span className="material-symbols-outlined !text-3xl text-primary">workspace_premium</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-lg mb-2">Skill-Based Matchmaking</h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Advanced ELO algorithms ensure you&apos;re always fighting for your rank.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features Bento ────────────────────────────────────────────────────────────
function FeaturesBento({ onRankUp }) {
  return (
    <section className="py-20 max-w-7xl mx-auto px-6 md:px-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left card — spans 2 columns */}
        <div className="md:col-span-2 glass-card p-10 rounded-2xl flex flex-col justify-between min-h-[420px] border border-primary/20">
          <div>
            <h3 className="text-white font-display text-4xl font-bold mb-6">
              Built for the Technical Elite.
            </h3>
            <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
              Our arena is designed by engineers, for engineers. Every question is vetted
              for clarity, difficulty, and relevance to modern computer science foundations.
            </p>
          </div>
          <div className="flex gap-4 items-center mt-8">
            <div className="flex -space-x-4">
              {[
                'https://lh3.googleusercontent.com/aida-public/AB6AXuC4eiFTq2-U1bQMyQcdoSxJph5Px7aCsDXRgiIBKISQzpJRGW2qouY-1F4QLFGkBHxQO8UKEmkPA4LhBO-nhx2UO6RxHkLsYPVlGRQ3G58zoVSfsYsnZoFAREj7NGZY50si8O4HrqVddc4bbehLF4_5656GUmWzBkiMo4BYi-flFClX1VDAGJA1knxqJDPXJR30FMsB3ID2w8IdtSEC0P_OMjKZmABVLWqfa_gUVWhFbyb-PHIu1-ByPw5lyndQiC1bDHU0WN6snw-D',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuC5CI1yiI9uBfeAltajPS39p37xFVQKjiWgTI2T9PksVUpOS-LX-FgPvBnuoe4zJg1sxqGqlKdFvz0dhIQe1GqrpUnqJi3l2831_vTZMugp3BLeByZm6PdeomaAHAJRL-DwGlTcCIPyVUBbw2B6iWyO1apukQn4MxvipgCdXbauZ0-D1Xl2RHTXrsidAYVVn9ng2NjXWcdqBEoinckHCSg1gSyhoWyCkE3VyW46eigXj8tuTIe6JZ_VeK6b_i455zxXk45Bjmn2c1zH',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCE6XGTCglVAA2JoDeM6vnGZFsdBbKNfBtIvWXUKn-gMWpEWZ6KR4p364EXRd5Ue3wMv5YiG6b48miMBJosNszwaQILpVw0CIo7rOudtlvmtr0cHG5VE8RD96-akVgNU80qxLF7qnmZ092CNmEbYEPcQZQyiXQmd4My7Y_Cs-3HpjaJbv2_A_hW-nBrv41JkprAx7H1XkbX8ghXGhWqYZftNfnW6VVSAvXrwn7WIAYjRVG8Ph1RUK2IR_v1Q61A2FeS2q6s-4GMZfT9',
              ].map((src, i) => (
                <img key={i} className="w-12 h-12 rounded-full border-2 border-background object-cover" src={src} alt="Community member" />
              ))}
            </div>
            <span className="text-on-surface-variant text-sm font-semibold">Join 12k+ other masters</span>
          </div>
        </div>

        {/* Right — purple CTA */}
        <div
          onClick={onRankUp}
          className="bg-primary p-10 rounded-2xl flex flex-col justify-between group cursor-pointer overflow-hidden relative min-h-[420px]"
        >
          <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:rotate-12 transition-transform duration-500 select-none">
            <span className="material-symbols-outlined !text-[200px]">military_tech</span>
          </div>
          <h3 className="text-on-primary font-display text-3xl font-bold">
            Rise to the Master Tier.
          </h3>
          <div>
            <p className="text-on-primary/80 mb-6 leading-relaxed">
              Compete in seasonal tournaments and earn exclusive profile badges and discord roles.
            </p>
            <button className="bg-on-primary text-primary px-6 py-2 rounded-lg font-bold flex items-center gap-2">
              Rank Up <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="w-full py-16 border-t border-outline-variant/10 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <Link to="/" className="font-display text-lg font-bold text-primary">DevDuel</Link>
          <p className="text-on-surface-variant text-xs font-semibold mt-2">
            © 2026 DevDuel. Prove your CS knowledge.
          </p>
        </div>
        <div className="flex items-center gap-8">
          <a
            href="https://github.com/Helico07"
            target="_blank"
            rel="noopener noreferrer"
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">code</span>
            GitHub
          </a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-sm">Terms</a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-sm">Privacy</a>
        </div>
      </div>
    </footer>
  );
}

// ─── Home ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const handleStartBattling   = () => navigate(user ? '/dashboard' : '/register');
  const handleViewLeaderboard = () => navigate('/leaderboard');
  const handleRankUp          = () => navigate(user ? '/dashboard' : '/register');

  return (
    <div className="bg-background text-on-background overflow-x-hidden">
      <Navbar />
      <Hero onStartBattling={handleStartBattling} onViewLeaderboard={handleViewLeaderboard} />
      <StatsBar />
      <HowItWorks />
      <CsDisciplines />
      <FeaturesBento onRankUp={handleRankUp} />
      <Footer />
    </div>
  );
}
