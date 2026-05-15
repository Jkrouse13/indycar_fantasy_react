import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { getParticipant } from '../api/client'
import DriverCard from '../components/DriverCard'
import { displayName } from '../utils/participant'

const ParticipantDetail = () => {
  const { id } = useParams()
  const [expandedRaces, setExpandedRaces] = useState({})

  const { data: participant, isLoading } = useQuery({
    queryKey: ['participant', id],
    queryFn: () => getParticipant(id).then((res) => res.data),
  })

  const toggleRace = (raceId) => {
    setExpandedRaces((prev) => ({
      ...prev,
      [raceId]: !prev[raceId],
    }))
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-yellow-400 text-xl animate-pulse">
          🏎️ Loading...
        </div>
      </div>
    )

  return (
    <div>
      <Link
        to="/participants"
        className="text-blue-300 hover:text-red-400 text-sm uppercase tracking-wide"
      >
        ← Back to View Picks
      </Link>

      <h1 className="text-3xl font-black uppercase tracking-tight text-white mt-4 mb-2">
        {displayName(participant)}
      </h1>
      {participant?.name && (
        <p className="text-blue-300/50 mb-6">{participant?.email}</p>
      )}

      {!participant?.races?.length ? (
        <div className="bg-[#0e2040] border border-red-900 rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">🤷</div>
          <div className="text-blue-300/50">No picks submitted yet</div>
        </div>
      ) : (
        <div className="space-y-4">
          {participant.races.map(({ race, picks, total_score, rank }) => (
            <div
              key={race.id}
              className="bg-[#0e2040] border border-red-900 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleRace(race.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#122550] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-red-400 text-xl">
                    {expandedRaces[race.id] ? '▼' : '▶'}
                  </span>
                  <div className="text-left">
                    <div className="font-black text-lg">{race.name}</div>
                    <div className="text-blue-300/50 text-sm">
                      {new Date(race.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {race.status === 'final' && (
                    <div className="flex items-center gap-4">
                      {rank && (
                        <div className="text-right">
                          <div className="text-xl font-black text-white">P{rank}</div>
                          <div className="text-blue-300/50 text-xs">rank</div>
                        </div>
                      )}
                      <div className="text-right">
                        <div className="text-xl font-black text-yellow-400">
                          {total_score}
                        </div>
                        <div className="text-blue-300/50 text-xs">score</div>
                      </div>
                    </div>
                  )}
                  <div
                    className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                      race.status === 'final'
                        ? 'bg-green-900 text-green-400'
                        : race.status === 'live'
                          ? 'bg-red-900 text-red-400'
                          : 'bg-[#071428] border border-red-900 text-blue-300'
                    }`}
                  >
                    {race.status}
                  </div>
                </div>
              </button>

              {expandedRaces[race.id] && (
                <div className="px-4 pb-4 space-y-2">
                  {picks.map((pick) => (
                    <DriverCard
                      key={pick.id}
                      driver={pick.driver}
                      tier={pick.tier}
                      finishingPosition={pick.finishing_position}
                      showPosition={race.status === 'final'}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ParticipantDetail
