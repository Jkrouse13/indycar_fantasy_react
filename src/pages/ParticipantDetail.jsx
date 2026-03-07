import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { getParticipant } from '../api/client'
import CarImage from '../components/CarImage'

const ParticipantDetail = () => {
  const { id } = useParams()
  const [expandedRaces, setExpandedRaces] = useState({})

  const { data: participant, isLoading } = useQuery({
    queryKey: ['participant', id],
    queryFn: () => getParticipant(id).then(res => res.data)
  })

  const toggleRace = (raceId) => {
    setExpandedRaces(prev => ({
      ...prev,
      [raceId]: !prev[raceId]
    }))
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-yellow-400 text-xl animate-pulse">🏎️ Loading...</div>
    </div>
  )

  return (
    <div>
      <Link to="/participants" className="text-gray-400 hover:text-yellow-400 text-sm uppercase tracking-wide">
        ← Back to View Picks
      </Link>

      <h1 className="text-3xl font-black uppercase tracking-tight text-yellow-400 mt-4 mb-2">
        {participant?.name || participant?.email}
      </h1>
      {participant?.name && (
        <p className="text-gray-500 mb-6">{participant?.email}</p>
      )}

      {!participant?.races?.length ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">🤷</div>
          <div className="text-gray-400">No picks submitted yet</div>
        </div>
      ) : (
        <div className="space-y-4">
          {participant.races.map(({ race, picks, total_score }) => (
            <div key={race.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleRace(race.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl">{expandedRaces[race.id] ? '▼' : '▶'}</span>
                  <div className="text-left">
                    <div className="font-black text-lg">{race.name}</div>
                    <div className="text-gray-500 text-sm">
                      {new Date(race.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {race.status === 'final' && (
                    <div className="text-right">
                      <div className="text-xl font-black text-yellow-400">{total_score}</div>
                      <div className="text-gray-500 text-xs">score</div>
                    </div>
                  )}
                  <div className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    race.status === 'final' ? 'bg-green-900 text-green-400' :
                    race.status === 'live' ? 'bg-yellow-900 text-yellow-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {race.status}
                  </div>
                </div>
              </button>

              {expandedRaces[race.id] && (
                <div className="px-4 pb-4 space-y-2">
                  {picks.map(pick => (
                    <div
                      key={pick.id}
                      className="bg-gray-800 rounded p-2 flex items-center justify-between"
                      style={{ borderLeft: `4px solid ${pick.driver.primary_color}` }}
                    >
                      <div className="flex items-center gap-3">
                        <CarImage carNumber={pick.driver.car_number} className="w-16 h-10 object-contain" />
                        <div>
                          <div className="text-gray-500 text-xs uppercase">Tier {pick.tier}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pick.driver.primary_color }} />
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pick.driver.secondary_color }} />
                            <div className="font-bold text-sm">{pick.driver.name}</div>
                          </div>
                          <div className="text-gray-400 text-xs">#{pick.driver.car_number} • {pick.driver.team_name}</div>
                        </div>
                      </div>
                      {race.status === 'final' && pick.finishing_position && (
                        <div className={`text-xl font-black ${
                          pick.finishing_position <= 5 ? 'text-green-400' :
                          pick.finishing_position <= 10 ? 'text-yellow-400' :
                          pick.finishing_position <= 15 ? 'text-orange-400' : 'text-red-400'
                        }`}>
                          P{pick.finishing_position}
                        </div>
                      )}
                    </div>
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