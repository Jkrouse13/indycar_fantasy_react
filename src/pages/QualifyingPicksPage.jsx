import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  getDrivers,
  getParticipants,
  createParticipant,
  getQualifyingPrediction,
  submitQualifyingPrediction,
  updateQualifyingPrediction,
} from '../api/client'
import DriverCard from '../components/DriverCard'

const LOCKOUT = new Date('2026-05-16T11:00:00-04:00')
const YEAR = 2026

const CountdownBanner = () => {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const tick = () => {
      const diff = LOCKOUT - Date.now()
      if (diff <= 0) { setTimeLeft('LOCKED'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const locked = Date.now() >= LOCKOUT
  return (
    <div className="mb-6">
      <div className={`text-center py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wide ${locked ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-yellow-400'}`}>
        {locked ? 'Picks Locked — Qualifying has started' : `Locks in ${timeLeft} (11:00 AM ET Sat May 16)`}
      </div>
      {locked && (
        <div className="text-center mt-3">
          <Link
            to="/qualifying/leaderboard"
            className="inline-block px-6 py-2 bg-yellow-400 text-black font-black uppercase rounded-lg hover:bg-yellow-300 text-sm tracking-wide"
          >
            🏆 View Qualifying Standings
          </Link>
        </div>
      )}
    </div>
  )
}

const QualifyingPicksPage = () => {
  const [email, setEmail] = useState('')
  const [fastTwelve, setFastTwelve] = useState([])
  const [lastRow, setLastRow] = useState([])
  const [satWreck, setSatWreck] = useState(null)
  const [sunWreck, setSunWreck] = useState(null)
  const [existingId, setExistingId] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const locked = Date.now() >= LOCKOUT

  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => getDrivers().then(r => r.data),
  })

  const drivers = (driversData || []).map(d => ({ ...d, team_name: d.team?.name }))

  const toggleFastTwelve = (id) => {
    if (locked) return
    setFastTwelve(prev => {
      if (prev.includes(id)) {
        if (polePick === id) setPolePick('')
        return prev.filter(d => d !== id)
      }
      if (prev.length < 12 && !lastRow.includes(id)) return [...prev, id]
      return prev
    })
  }

  const toggleLastRow = (id) => {
    if (locked) return
    setLastRow(prev => {
      if (prev.includes(id)) return prev.filter(d => d !== id)
      if (prev.length < 3 && !fastTwelve.includes(id)) return [...prev, id]
      return prev
    })
  }

  const lookupPicks = async () => {
    if (!email.trim()) return
    try {
      const participants = await getParticipants().then(r => r.data)
      const match = participants.find(p => p.email?.toLowerCase() === email.toLowerCase())
      if (!match) return
      const pred = await getQualifyingPrediction(match.id, YEAR).then(r => r.data)
      setExistingId(pred.id)
      setFastTwelve(pred.fast_twelve_driver_ids || [])
      setLastRow(pred.last_row_driver_ids || [])
      setSatWreck(pred.saturday_wreck)
      setSunWreck(pred.sunday_wreck)
    } catch {
      // no existing prediction
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const participants = await getParticipants().then(r => r.data)
      const match = participants.find(p => p.email?.toLowerCase() === email.toLowerCase())
      const participantId = match
        ? match.id
        : await createParticipant(email).then(r => r.data.id)

      const payload = {
        qualifying_prediction: {
          participant_id: participantId,
          year: YEAR,
          saturday_wreck: satWreck,
          sunday_wreck: sunWreck,
          fast_twelve_driver_ids: fastTwelve,
          last_row_driver_ids: lastRow,
        },
      }

      return existingId
        ? updateQualifyingPrediction(existingId, payload)
        : submitQualifyingPrediction(payload)
    },
    onSuccess: (res) => {
      setExistingId(res.data.id)
      setSubmitted(true)
    },
  })

  const canSubmit =
    !locked &&
    email.trim() &&
    fastTwelve.length === 12 &&
    lastRow.length === 3 &&
    satWreck !== null &&
    sunWreck !== null

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🏁</div>
        <h2 className="text-3xl font-black uppercase text-yellow-400 mb-2">Picks Saved!</h2>
        <p className="text-gray-400">Your Indy 500 qualifying predictions are locked in.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 px-6 py-2 bg-gray-800 rounded text-sm font-bold uppercase hover:bg-gray-700"
        >
          Edit Picks
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight text-yellow-400 mb-2">
        Indy 500 Qualifying Predictions
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        {YEAR} · Saturday Fast 12 &amp; Last Row · Sunday Pole
      </p>

      <CountdownBanner />

      {/* Sticky pick counter */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 flex gap-6">
        <span className={`text-sm font-bold ${fastTwelve.length === 12 ? 'text-green-400' : 'text-yellow-400'}`}>
          Fast 12: {fastTwelve.length}/12
        </span>
        <span className={`text-sm font-bold ${lastRow.length === 3 ? 'text-green-400' : 'text-yellow-400'}`}>
          Last Row: {lastRow.length}/3
        </span>
      </div>

      {/* Email */}
      <div className="mb-8">
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
          Your Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={lookupPicks}
          placeholder="you@example.com"
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-400 w-full md:w-96"
        />
        {existingId && (
          <p className="text-green-400 text-xs mt-1">Existing picks loaded — saving will update them.</p>
        )}
      </div>

      {/* Fast 12 */}
      <div className="mb-8 mt-6">
        <h2 className="text-xl font-black uppercase tracking-tight mb-1">Fast 12 — Saturday</h2>
        <p className="text-gray-500 text-xs mb-3">
          Pick the 12 drivers in the order you think they'll qualify. Pick order = starting position.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {drivers.map(driver => {
            const inLastRow = lastRow.includes(driver.id)
            const selected = fastTwelve.includes(driver.id)
            const position = selected ? fastTwelve.indexOf(driver.id) + 1 : null
            const dimmed = !selected && (fastTwelve.length >= 12 || inLastRow || locked)
            return (
              <div key={driver.id} className={`relative ${dimmed ? 'opacity-40' : ''}`}>
                {selected && (
                  <div className="absolute top-1 right-1 z-10 bg-yellow-400 text-black text-xs font-black rounded px-1.5 py-0.5 leading-none">
                    P{position}
                  </div>
                )}
                <DriverCard
                  driver={driver}
                  selected={selected}
                  showPosition={false}
                  onClick={() => toggleFastTwelve(driver.id)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Last Row */}
      <div className="mb-8">
        <h2 className="text-xl font-black uppercase tracking-tight mb-1">Last Row — Saturday</h2>
        <p className="text-gray-500 text-xs mb-3">
          Pick the 3 drivers who will start P31–P33. Pick order = starting position.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {drivers.filter(d => !fastTwelve.includes(d.id)).map(driver => {
            const selected = lastRow.includes(driver.id)
            const position = selected ? 31 + lastRow.indexOf(driver.id) : null
            const dimmed = !selected && (lastRow.length >= 3 || locked)
            return (
              <div key={driver.id} className={`relative ${dimmed ? 'opacity-40' : ''}`}>
                {selected && (
                  <div className="absolute top-1 right-1 z-10 bg-red-500 text-white text-xs font-black rounded px-1.5 py-0.5 leading-none">
                    P{position}
                  </div>
                )}
                <DriverCard
                  driver={driver}
                  selected={selected}
                  showPosition={false}
                  onClick={() => toggleLastRow(driver.id)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Wreck Picks */}
      <div className="mb-10">
        <h2 className="text-xl font-black uppercase tracking-tight mb-4">Wreck Predictions</h2>
        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
          {[
            { label: 'Wreck on Saturday?', value: satWreck, set: setSatWreck },
            { label: 'Wreck on Sunday?', value: sunWreck, set: setSunWreck },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <p className="text-sm font-bold uppercase tracking-wide text-gray-300 mb-2">{label}</p>
              <div className="flex gap-2">
                {[true, false].map(opt => (
                  <button
                    key={String(opt)}
                    onClick={() => !locked && set(opt)}
                    disabled={locked}
                    className={`px-6 py-2 rounded-lg font-bold uppercase text-sm transition-colors disabled:opacity-50 ${
                      value === opt
                        ? opt ? 'bg-red-700 text-white' : 'bg-green-800 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {opt ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {mutation.isError && (
        <p className="text-red-400 text-sm mb-4">
          {mutation.error?.response?.data?.errors?.join(', ') || 'Something went wrong'}
        </p>
      )}

      <button
        onClick={() => mutation.mutate()}
        disabled={!canSubmit || mutation.isPending}
        className="w-full md:w-auto px-10 py-4 bg-yellow-400 text-black font-black uppercase rounded-lg hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-lg tracking-wide"
      >
        {mutation.isPending ? 'Saving...' : existingId ? '✅ Update Picks' : '🏁 Submit Picks'}
      </button>
    </div>
  )
}

export default QualifyingPicksPage
