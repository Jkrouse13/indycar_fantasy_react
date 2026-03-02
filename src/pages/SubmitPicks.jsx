import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getRaces, getRaceTiers, submitPicks, createParticipant } from '../api/client'

const SubmitPicks = () => {
  const [email, setEmail] = useState('')
  const [picks, setPicks] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const { data: races, isLoading: racesLoading } = useQuery({
    queryKey: ['races'],
    queryFn: () => getRaces().then(res => res.data)
  })

  const nextRace = races?.filter(r => r.status === 'upcoming')
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0]

  console.log('Next race:', nextRace)

  const { data: tiersData, isLoading: tiersLoading } = useQuery({
    queryKey: ['raceTiers', nextRace?.id],
    queryFn: () => getRaceTiers(nextRace.id).then(res => res.data),
    enabled: !!nextRace?.id
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const participant = await createParticipant(email)
      const participantId = participant.data.id

      const pickPromises = Object.entries(picks).map(([tierNumber, driverId]) => {
        const tier = tiersData.find(t => t.tier_number === parseInt(tierNumber))
        return submitPicks({
          pick: {
            participant_id: participantId,
            race_id: nextRace.id,
            race_tier_id: tier.id,
            driver_id: driverId
          }
        })
      })

      await Promise.all(pickPromises)
    },
    onSuccess: () => setSubmitted(true)
  })

  const allTiersPicked = tiersData?.length > 0 && Object.keys(picks).length === tiersData.length
  const canSubmit = email && allTiersPicked

  if (racesLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-yellow-400 text-xl animate-pulse">🏎️ Loading...</div>
    </div>
  )

  if (!nextRace) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🏁</div>
      <h2 className="text-2xl font-black text-gray-400 uppercase">No Upcoming Races</h2>
      <p className="text-gray-500 mt-2">Check back soon!</p>
    </div>
  )

  if (submitted) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🏁</div>
      <h2 className="text-3xl font-black text-yellow-400 uppercase mb-2">Picks Submitted!</h2>
      <p className="text-gray-400">Good luck at {nextRace.name}!</p>
    </div>
  )

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight text-yellow-400 mb-2">
        🎯 Submit Your Picks
      </h1>

      {/* Race Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <div className="font-black text-xl">{nextRace.name}</div>
        <div className="text-gray-400 text-sm mt-1">🏟️ {nextRace.track}</div>
        <div className="text-gray-500 text-sm">
          📅 {new Date(nextRace.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Email */}
      <div className="mb-8">
        <h2 className="text-lg font-bold uppercase tracking-wide text-gray-300 mb-3">
          Your Email
        </h2>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full md:w-96 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-400"
        />
      </div>

      {/* Tiers */}
      <div className="mb-8">
        <h2 className="text-lg font-bold uppercase tracking-wide text-gray-300 mb-3">
          Pick Your Drivers
        </h2>

        {tiersLoading ? (
          <div className="text-yellow-400 animate-pulse">Loading tiers...</div>
        ) : !tiersData || tiersData.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <div className="text-4xl mb-3">⏳</div>
            <div className="text-gray-300 font-bold text-lg">Tiers Not Set Up Yet</div>
            <div className="text-gray-500 mt-2">The commissioner hasn't set up the driver tiers for this race yet. Check back soon!</div>
          </div>
        ) : (
          <div className="space-y-6">
            {tiersData.sort((a, b) => a.tier_number - b.tier_number).map(tier => (
              <div key={tier.id}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-yellow-400 uppercase">Tier {tier.tier_number}</h3>
                  {!picks[tier.tier_number] && (
                    <span className="text-red-400 text-xs uppercase font-bold">Required</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {tier.drivers?.map(driver => (
                    <button
                      key={driver.id}
                      onClick={() => setPicks(prev => ({ ...prev, [tier.tier_number]: driver.id }))}
                      style={
                        picks[tier.tier_number] === driver.id
                          ? { backgroundColor: driver.primary_color + '33', borderColor: driver.primary_color }
                          : {}
                      }
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        picks[tier.tier_number] === driver.id
                          ? 'text-white'
                          : 'bg-gray-900 border-gray-800 hover:border-gray-600 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: driver.primary_color }}
                        />
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: driver.secondary_color }}
                        />
                      </div>
                      <div className="font-bold text-sm">{driver.name}</div>
                      <div className="text-gray-400 text-xs">#{driver.car_number}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      {tiersData?.length > 0 && (
        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
          className="w-full bg-yellow-400 text-black font-black text-lg uppercase py-4 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? '🏎️ Submitting...' : '🏁 Submit Picks'}
        </button>
      )}

      {mutation.isError && (
        <div className="mt-4 text-red-400 text-center">
          Something went wrong. Please try again.
        </div>
      )}
    </div>
  )
}

export default SubmitPicks