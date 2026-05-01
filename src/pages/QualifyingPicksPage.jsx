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
  const [fastTwelve, setFastTwelve] = useState(new Set())
  const [lastRow, setLastRow] = useState(new Set())
  const [polePick, setPolePick] = useState('')
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
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        if (polePick === id) setPolePick('')
      } else if (next.size < 12 && !lastRow.has(id)) {
        next.add(id)
      }
      return next
    })
  }

  const toggleLastRow = (id) => {
    if (locked) return
    setLastRow(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) }
      else if (next.size < 3 && !fastTwelve.has(id)) { next.add(id) }
      return next
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
      setFastTwelve(new Set(pred.fast_twelve_driver_ids))
      setLastRow(new Set(pred.last_row_driver_ids))
      setPolePick(pred.pole_pick_driver_id || '')
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
          pole_pick_driver_id: polePick || null,
          saturday_wreck: satWreck,
          sunday_wreck: sunWreck,
          fast_twelve_driver_ids: Array.from(fastTwelve),
          last_row_driver_ids: Array.from(lastRow),
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
    fastTwelve.size === 12 &&
    lastRow.size === 3 &&
    polePick &&
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

  const fastTwelveDrivers = drivers.filter(d => fastTwelve.has(d.id))

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight text-yellow-400 mb-2">
        Indy 500 Qualifying Predictions
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        {YEAR} · Saturday Fast 12 &amp; Last Row · Sunday Pole
      </p>

      <CountdownBanner />

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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black uppercase tracking-tight">Fast 12 — Saturday</h2>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${fastTwelve.size === 12 ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-300'}`}>
            {fastTwelve.size} / 12
          </span>
        </div>
        <p className="text-gray-500 text-xs mb-3">
          Pick the 12 drivers who will advance to the Fast 12 shootout on Saturday
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {drivers.map(driver => {
            const inLastRow = lastRow.has(driver.id)
            const selected = fastTwelve.has(driver.id)
            const dimmed = !selected && (fastTwelve.size >= 12 || inLastRow || locked)
            return (
              <div key={driver.id} className={dimmed ? 'opacity-40' : ''}>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black uppercase tracking-tight">Last Row — Saturday</h2>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${lastRow.size === 3 ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-300'}`}>
            {lastRow.size} / 3
          </span>
        </div>
        <p className="text-gray-500 text-xs mb-3">
          Pick the 3 drivers who will start from the last row (P28–30) on Saturday
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {drivers.filter(d => !fastTwelve.has(d.id)).map(driver => {
            const selected = lastRow.has(driver.id)
            const dimmed = !selected && (lastRow.size >= 3 || locked)
            return (
              <div key={driver.id} className={dimmed ? 'opacity-40' : ''}>
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

      {/* Pole Pick */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black uppercase tracking-tight">Pole Winner — Sunday</h2>
          {polePick && (
            <span className="text-sm font-bold px-3 py-1 rounded-full bg-green-900 text-green-300">
              1 / 1
            </span>
          )}
        </div>
        <p className="text-gray-500 text-xs mb-3">
          Who wins pole? Must be one of your Fast 12 picks.
        </p>
        {fastTwelveDrivers.length === 0 ? (
          <p className="text-gray-600 text-sm italic">Select your Fast 12 first</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {fastTwelveDrivers.map(driver => (
              <DriverCard
                key={driver.id}
                driver={driver}
                selected={polePick === driver.id}
                showPosition={false}
                onClick={() => !locked && setPolePick(polePick === driver.id ? '' : driver.id)}
              />
            ))}
          </div>
        )}
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
