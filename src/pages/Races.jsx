import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getRaces } from '../api/client'

const statusBadge = (status) => {
  if (status === 'live') return <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded uppercase animate-pulse">● Live</span>
  if (status === 'final') return <span className="bg-gray-700 text-gray-300 text-xs font-bold px-2 py-1 rounded uppercase">Final</span>
  return <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded uppercase">Upcoming</span>
}

const Races = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['races'],
    queryFn: () => getRaces().then(res => res.data)
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-yellow-400 text-xl animate-pulse">🏎️ Loading races...</div>
    </div>
  )

  if (isError) return (
    <div className="text-red-400 text-center py-20">Failed to load races.</div>
  )

  const completed = data.filter(r => r.status === 'final')
  const live = data.filter(r => r.status === 'live')
  const upcoming = data.filter(r => r.status === 'upcoming')

  const RaceCard = ({ race }) => (
    <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-yellow-400/50 transition-colors">
      <div>
        <div className="font-bold text-lg">{race.name}</div>
        <div className="text-gray-400 text-sm mt-1">🏟️ {race.track}</div>
        <div className="text-gray-500 text-sm">
          📅 {new Date(race.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        {statusBadge(race.status)}
        {race.status === 'final' && (
          <Link
            to={`/races/${race.id}`}
            className="text-yellow-400 text-sm font-bold hover:underline"
          >
            View Results →
          </Link>
        )}
        {race.status === 'upcoming' && (
          <Link
            to="/picks"
            className="text-yellow-400 text-sm font-bold hover:underline"
          >
            Make Picks →
          </Link>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight text-yellow-400 mb-8">
        2026 Race Schedule
      </h1>

      {live.length > 0 && (
        <div className="mb-8">
          <h2 className="text-red-400 font-bold uppercase tracking-wide mb-3">🔴 Live Now</h2>
          <div className="space-y-3">
            {live.map(race => <RaceCard key={race.id} race={race} />)}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-gray-400 font-bold uppercase tracking-wide mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map(race => <RaceCard key={race.id} race={race} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-gray-400 font-bold uppercase tracking-wide mb-3">Completed</h2>
          <div className="space-y-3">
            {completed.map(race => <RaceCard key={race.id} race={race} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export default Races