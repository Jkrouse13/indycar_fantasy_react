import { Routes, Route, Link, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import SeasonLeaderboard from './pages/SeasonLeaderboard'
import RaceLeaderboard from './pages/RaceLeaderboard'
import Races from './pages/Races'
import SubmitPicks from './pages/SubmitPicks'
import Participants from './pages/Participants'
import ParticipantDetail from './pages/ParticipantDetail'
import QualifyingPicksPage from './pages/QualifyingPicksPage'
import QualifyingLeaderboardPage from './pages/QualifyingLeaderboardPage'
import DriverPoolPage from './pages/DriverPoolPage'
import AddPoolEntryPage from './pages/AddPoolEntryPage'
import AdminTiersPage from './pages/AdminTiersPage'

const Navbar = () => {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: '🏆 Season Standings' },
    { to: '/races', label: '🏁 Races' },
    { to: '/picks', label: '🎯 Submit Picks' },
    { to: '/participants', label: '👀 View Picks' },
    // { to: '/qualifying', label: '⚡ Qual Picks' },
    // { to: '/qualifying/leaderboard', label: '⚡ Qual Standings' },
    // { to: '/pool', label: '🎰 Driver Pool' },
    { to: '/admin/tiers', label: '⚙️ Manage Tiers' },
  ]

  return (
    <nav className="bg-[#071428] border-b-4 border-red-700">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏎️</span>
          <span className="text-yellow-400 font-black text-xl tracking-tight uppercase">
            Krouse IndyCar Fantasy
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-6">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-bold text-sm uppercase tracking-wide transition-colors ${
                location.pathname === link.to
                  ? 'text-red-400'
                  : 'text-blue-200 hover:text-red-400'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white text-2xl"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0e2040] border-t border-red-900 px-4 py-2">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`block py-3 font-bold text-sm uppercase tracking-wide transition-colors ${
                location.pathname === link.to
                  ? 'text-red-400'
                  : 'text-blue-200 hover:text-red-400'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}

const AppLayout = () => (
  <div className="min-h-screen bg-[#071428] text-white">
    <Navbar />
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Outlet />
    </main>
  </div>
)

const QualifyingLayout = () => {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#071428] text-white">
      <nav className="bg-[#071428] border-b-4 border-red-700">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏎️</span>
            <span className="text-yellow-400 font-black text-xl tracking-tight uppercase">
              IndyCar Fantasy — Qualifying
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/qualifying"
              className={`font-bold text-sm uppercase tracking-wide transition-colors ${
                location.pathname === '/qualifying'
                  ? 'text-red-400'
                  : 'text-blue-200 hover:text-red-400'
              }`}
            >
              ⚡ Picks
            </Link>
            <Link
              to="/qualifying/leaderboard"
              className={`font-bold text-sm uppercase tracking-wide transition-colors ${
                location.pathname === '/qualifying/leaderboard'
                  ? 'text-red-400'
                  : 'text-blue-200 hover:text-red-400'
              }`}
            >
              🏆 Leaderboard
            </Link>
            <Link
              to="/"
              className="text-blue-400 hover:text-blue-200 text-sm transition-colors"
            >
              ← Full App
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

const App = () => {
  return (
    <Routes>
      <Route element={<QualifyingLayout />}>
        <Route path="/qualifying" element={<QualifyingPicksPage />} />
        <Route path="/qualifying/leaderboard" element={<QualifyingLeaderboardPage />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="/" element={<SeasonLeaderboard />} />
        <Route path="/races" element={<Races />} />
        <Route path="/races/:id" element={<RaceLeaderboard />} />
        <Route path="/picks" element={<SubmitPicks />} />
        <Route path="/participants" element={<Participants />} />
        <Route path="/participants/:id" element={<ParticipantDetail />} />
        <Route path="/pool" element={<DriverPoolPage />} />
        <Route path="/pool/add" element={<AddPoolEntryPage />} />
        <Route path="/admin/tiers" element={<AdminTiersPage />} />
      </Route>
    </Routes>
  )
}

export default App