import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getParticipants, getDrivers, createPoolEntry } from '../api/client'
import { displayName } from '../utils/participant'

const YEAR = 2026

const AddPoolEntryPage = () => {
  const qc = useQueryClient()
  const [participantId, setParticipantId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [acquisitionType, setAcquisitionType] = useState('auction')
  const [value, setValue] = useState('')
  const [lastSaved, setLastSaved] = useState(null)

  const { data: participants = [] } = useQuery({
    queryKey: ['participants'],
    queryFn: () => getParticipants().then(r => r.data),
  })

  const { data: driversData = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => getDrivers().then(r => r.data),
  })

  const drivers = [...driversData].sort((a, b) =>
    String(a.car_number).localeCompare(String(b.car_number), undefined, { numeric: true })
  )

  const sortedParticipants = [...participants].sort((a, b) =>
    displayName(a).localeCompare(displayName(b))
  )

  const mutation = useMutation({
    mutationFn: () =>
      createPoolEntry({
        pool_entry: {
          participant_id: parseInt(participantId),
          driver_id: parseInt(driverId),
          acquisition_type: acquisitionType,
          value: parseFloat(value),
          year: YEAR,
        },
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['poolEntries', YEAR] })
      const driver = drivers.find(d => d.id === parseInt(driverId))
      const participant = participants.find(p => p.id === parseInt(participantId))
      setLastSaved({
        driver: driver ? `#${driver.car_number} ${driver.name}` : '—',
        participant: displayName(participant),
        type: acquisitionType,
        value,
      })
      setDriverId('')
      setValue('')
    },
  })

  const canSubmit = participantId && driverId && value && parseFloat(value) > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Add Pool Entry
          </h1>
          <p className="text-red-400 text-sm font-bold uppercase tracking-widest mt-1">
            {YEAR} Indy 500
          </p>
        </div>
        <Link
          to="/pool"
          className="text-blue-300 hover:text-white text-sm font-bold uppercase tracking-wide"
        >
          ← View Pool
        </Link>
      </div>

      {lastSaved && (
        <div className="bg-green-900/40 border border-green-700 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
          <span className="text-green-300 text-sm font-bold">
            ✓ Saved — {lastSaved.participant}: {lastSaved.driver} ({lastSaved.type}) ${lastSaved.value}
          </span>
          <button onClick={() => setLastSaved(null)} className="text-green-500 hover:text-white text-lg">×</button>
        </div>
      )}

      <div className="bg-[#0e2040] border border-red-900 rounded-lg p-6 space-y-6">

        {/* Participant */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-red-300/70 mb-2">
            Participant
          </label>
          <select
            value={participantId}
            onChange={e => setParticipantId(e.target.value)}
            className="w-full bg-[#071428] border border-red-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
          >
            <option value="">Select participant…</option>
            {sortedParticipants.map(p => (
              <option key={p.id} value={p.id}>{displayName(p)}</option>
            ))}
          </select>
        </div>

        {/* Driver */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-red-300/70 mb-2">
            Driver
          </label>
          <select
            value={driverId}
            onChange={e => setDriverId(e.target.value)}
            className="w-full bg-[#071428] border border-red-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
          >
            <option value="">Select driver…</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>#{d.car_number} {d.name}</option>
            ))}
          </select>
        </div>

        {/* Acquisition type */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-red-300/70 mb-2">
            How Acquired
          </label>
          <div className="flex gap-2">
            {['auction', 'draw'].map(type => (
              <button
                key={type}
                onClick={() => setAcquisitionType(type)}
                className={`flex-1 py-3 rounded-lg font-bold uppercase text-sm tracking-wide transition-colors ${
                  acquisitionType === type
                    ? type === 'auction'
                      ? 'bg-red-700 text-white'
                      : 'bg-[#0e2040] border-2 border-blue-500 text-blue-300'
                    : 'bg-[#071428] border border-red-900/50 text-blue-300/50 hover:border-red-700'
                }`}
              >
                {type === 'auction' ? 'Auction' : 'Draw'}
              </button>
            ))}
          </div>
        </div>

        {/* Value */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-red-300/70 mb-2">
            Amount Paid ($)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 font-black">$</span>
            <input
              type="number"
              min="0"
              step="1"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="0"
              className="w-full bg-[#071428] border border-red-900 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
          className="w-full bg-yellow-400 text-black font-black text-lg uppercase py-4 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'Saving…' : 'Add Entry'}
        </button>

        {mutation.isError && (
          <p className="text-red-400 text-sm text-center">
            Something went wrong. Check that this driver isn't already assigned.
          </p>
        )}
      </div>
    </div>
  )
}

export default AddPoolEntryPage
