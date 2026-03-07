import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { getRaceLeaderboard } from '../api/client'
import CarImage from '../components/CarImage'

const PositionBadge = ({ position }) => {
  if (position === 1) return <span className="text-2xl">🥇</span>
  if (position === 2) return <span className="text-2xl">🥈</span>
  if (position === 3) return <span className="text-2xl">🥉</span>
  return <span className="text-gray-400 font-bold text-lg w-8 text-center">{position}</span>
}

const statusBadge = (status) => {
  if (status === 'live') return <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded uppercase animate-pulse">● Live</span>
  if (status === 'final') return <span className="bg-gray-700 text-gray-300 text-xs font-bold px-2 py-1 rounded uppercase">Final</span>
  return <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded uppercase">Upcoming</span>
}

const RaceLeaderboard = () => {
  const { id } = useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['raceLeaderboard', id],
    queryFn: () => getRaceLeaderboard(id).then(res => res.data),
    refetchInterval: (data) => data?.race?.status === 'live' ? 120000 : false
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-yellow-400 text-xl animate-pulse">🏎️ Loading results...</div>
    </div>
  )

  if (isError) return (
    <div className="text-red-400 text-center py-20">Failed to load race results.</div>
  )

  const { race, leaderboard } = data

  return (
    <div>
      <Link to="/races" className="text-gray-400 hover:text-yellow-400 text-sm font-bold uppercase tracking-wide mb-6 inline-block">
        ← Back to Races
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-yellow-400">
            {race.name}
          </h1>
          {statusBadge(race.status)}
        </div>
        <p className="text-gray-400">🏟️ {race.track}</p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No picks submitted for this race yet.
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.participant.id}
              className={`p-4 rounded-lg border ${
                index === 0
                  ? 'bg-yellow-400/10 border-yellow-400/50'
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <PositionBadge position={index + 1} />
                  <div className="font-bold text-lg">{entry.participant.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-yellow-400">{entry.total_score}</div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">total</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                {entry.picks.map(pick => (
                  <div
                    key={pick.tier}
                    className="bg-gray-800 rounded p-2 flex items-center justify-between"
                    style={{ borderLeft: `4px solid ${pick.driver.primary_color}` }}
                  >
                    <div className="flex items-center gap-3">
                      <CarImage carNumber={pick.driver.car_number} className="w-16 h-10 object-contain" />
                      <div>
                        <div className="text-gray-500 text-xs uppercase">Tier {pick.tier}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pick.driver.primary_color }} />
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pick.driver.secondary_color }} />
                          <div className="font-bold text-sm">{pick.driver.name}</div>
                        </div>
                        <div className="text-gray-400 text-xs">#{pick.driver.car_number}</div>
                      </div>
                    </div>
                    <div className={`text-xl font-black ${
                      pick.finishing_position <= 5 ? 'text-green-400' :
                      pick.finishing_position <= 10 ? 'text-yellow-400' :
                      pick.finishing_position <= 15 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {pick.finishing_position ?? '–'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RaceLeaderboard