import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getSeasonLeaderboard } from '../api/client'

const TrendIndicator = ({ trend, amount }) => {
  if (trend === 'new') return <span className="text-blue-400 text-xs font-bold">NEW</span>
  if (trend === 'up') return (
    <span className="text-green-400 font-bold flex items-center gap-1">
      ▲ <span className="text-xs">{amount}</span>
    </span>
  )
  if (trend === 'down') return (
    <span className="text-red-400 font-bold flex items-center gap-1">
      ▼ <span className="text-xs">{amount}</span>
    </span>
  )
  return <span className="text-gray-500">—</span>
}

const PositionBadge = ({ position }) => {
  if (position === 1) return <span className="text-2xl">🥇</span>
  if (position === 2) return <span className="text-2xl">🥈</span>
  if (position === 3) return <span className="text-2xl">🥉</span>
  return <span className="text-gray-400 font-bold text-lg w-8 text-center">{position}</span>
}

const SeasonLeaderboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['seasonLeaderboard', 2026],
    queryFn: () => getSeasonLeaderboard(2026).then(res => res.data),
    refetchInterval: 30000
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-yellow-400 text-xl animate-pulse">🏎️ Loading standings...</div>
    </div>
  )

  if (isError) return (
    <div className="text-red-400 text-center py-20">Failed to load standings.</div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight text-yellow-400">
          2026 Season Standings
        </h1>
        <p className="text-gray-400 mt-1">
          {data.races_counted} race{data.races_counted !== 1 ? 's' : ''} completed · Lowest score wins
        </p>
      </div>

      {data.leaderboard.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No picks submitted yet. <Link to="/picks" className="text-yellow-400 hover:underline">Be the first!</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.leaderboard.map((entry) => (
            <Link
              key={entry.participant.id}
              to={`/participants/${entry.participant.id}`}
              className={`flex items-start justify-between p-4 rounded-lg border ${
                entry.position === 1
                  ? 'bg-yellow-400/10 border-yellow-400/50'
                  : 'bg-gray-900 border-gray-800'
              } hover:border-yellow-400/40 transition-colors`}
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="mt-1 shrink-0"><PositionBadge position={entry.position} /></div>
                <div className="min-w-0">
                  <div className="font-bold text-lg">{entry.participant.name}</div>
                  <div className="text-gray-500 text-sm leading-snug">
                    <div>{entry.races_entered} race{entry.races_entered !== 1 ? 's' : ''} entered</div>
                    {entry.best_finish && entry.best_finish < 999 && <div>Best race: {entry.best_finish}</div>}
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex items-center self-center mr-3">
                <TrendIndicator trend={entry.trend} amount={entry.trend_amount} />
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-black text-yellow-400">{entry.total_score}</div>
                <div className="text-gray-500 text-xs uppercase tracking-wide">pts</div>
                {entry.missed_races > 0 && (
                  <div className="text-gray-600 text-xs mt-1">
                    +{entry.penalty_score} ({entry.missed_races} missed)
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default SeasonLeaderboard