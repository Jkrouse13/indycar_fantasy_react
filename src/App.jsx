import { Routes, Route, Link, useLocation } from 'react-router-dom'
import SeasonLeaderboard from './pages/SeasonLeaderboard'
import RaceLeaderboard from './pages/RaceLeaderboard'
import Races from './pages/Races'
import SubmitPicks from './pages/SubmitPicks'

const Navbar = () => {
  const location = useLocation()

  const navLinks = [
    { to: '/', label: '🏆 Season Standings' },
    { to: '/races', label: '🏁 Races' },
    { to: '/picks', label: '🎯 Submit Picks' },
  ]

  return (
    <nav className="bg-black border-b-4 border-yellow-400">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏎️</span>
          <span className="text-yellow-400 font-black text-xl tracking-tight uppercase">
            Krouse IndyCar Fantasy
          </span>
        </div>
        <div className="flex gap-6">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-bold text-sm uppercase tracking-wide transition-colors ${
                location.pathname === link.to
                  ? 'text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

const App = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<SeasonLeaderboard />} />
          <Route path="/races" element={<Races />} />
          <Route path="/races/:id" element={<RaceLeaderboard />} />
          <Route path="/picks" element={<SubmitPicks />} />
        </Routes>
      </main>
    </div>
  )
}

export default App