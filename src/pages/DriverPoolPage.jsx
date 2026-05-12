import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPoolEntries } from '../api/client'

const YEAR = 2026

const AcquisitionBadge = ({ type }) =>
  type === 'auction' ? (
    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-red-700 text-white">
      Auction
    </span>
  ) : (
    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-[#0e2040] text-blue-300 border border-blue-800">
      Draw
    </span>
  )

const driverLabel = (driver) =>
  driver ? `#${driver.car_number} ${driver.name}` : '—'

const participantLabel = (participant) =>
  participant?.name || participant?.email || '—'

const AllDriversTab = ({ entries }) => {
  const sorted = [...entries].sort((a, b) => {
    if (a.acquisition_type !== b.acquisition_type)
      return a.acquisition_type === 'auction' ? -1 : 1
    return (a.driver?.car_number ?? '').localeCompare(b.driver?.car_number ?? '', undefined, { numeric: true })
  })

  return (
    <div className="overflow-x-auto rounded-lg border border-red-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-red-900 bg-red-900/30">
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-red-300">Driver</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-red-300">Owner</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-red-300">How</th>
            <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-red-300">Paid</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <tr key={entry.id} className="border-b border-red-900/30 hover:bg-[#0e2040]/80 transition-colors">
              <td className="px-4 py-3 font-bold">{driverLabel(entry.driver)}</td>
              <td className="px-4 py-3 text-gray-300">{participantLabel(entry.participant)}</td>
              <td className="px-4 py-3">
                <AcquisitionBadge type={entry.acquisition_type} />
              </td>
              <td className="px-4 py-3 text-right font-black text-yellow-400">${entry.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const ByParticipantTab = ({ entries }) => {
  const [expanded, setExpanded] = useState({})

  const byParticipant = entries.reduce((acc, entry) => {
    const id = entry.participant?.id
    if (!id) return acc
    if (!acc[id]) acc[id] = { participant: entry.participant, entries: [] }
    acc[id].entries.push(entry)
    return acc
  }, {})

  const groups = Object.values(byParticipant).sort((a, b) =>
    participantLabel(a.participant).localeCompare(participantLabel(b.participant))
  )

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-2">
      {groups.map(({ participant, entries: pEntries }) => {
        const total = pEntries.reduce((sum, e) => sum + e.value, 0)
        const isOpen = !!expanded[participant.id]
        const auctionCount = pEntries.filter(e => e.acquisition_type === 'auction').length
        const drawCount = pEntries.filter(e => e.acquisition_type === 'draw').length

        return (
          <div
            key={participant.id}
            className="bg-[#0e2040] border border-red-800 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggle(participant.id)}
              className="w-full p-4 flex items-center justify-between hover:border-red-600 hover:bg-[#122550] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-red-400 text-lg">{isOpen ? '▼' : '▶'}</span>
                <div className="text-left">
                  <div className="font-black text-lg">{participantLabel(participant)}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-blue-300">{pEntries.length} driver{pEntries.length !== 1 ? 's' : ''}</span>
                    {auctionCount > 0 && (
                      <span className="text-xs text-red-400">{auctionCount} auctioned</span>
                    )}
                    {drawCount > 0 && (
                      <span className="text-xs text-blue-300/60">{drawCount} drawn</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-yellow-400">${total}</div>
                <div className="text-blue-300/60 text-xs uppercase tracking-wide">total</div>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-red-900/50 divide-y divide-red-900/30">
                {pEntries
                  .sort((a, b) => {
                    if (a.acquisition_type !== b.acquisition_type)
                      return a.acquisition_type === 'auction' ? -1 : 1
                    return (a.driver?.car_number ?? '').localeCompare(b.driver?.car_number ?? '', undefined, { numeric: true })
                  })
                  .map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AcquisitionBadge type={entry.acquisition_type} />
                        <span className="font-bold text-sm">{driverLabel(entry.driver)}</span>
                      </div>
                      <span className="font-black text-yellow-400">${entry.value}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const DriverPoolPage = () => {
  const [tab, setTab] = useState('drivers')

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['poolEntries', YEAR],
    queryFn: () => getPoolEntries(YEAR).then(r => r.data),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-yellow-400 text-xl animate-pulse">🏎️ Loading...</div>
    </div>
  )

  const totalPot = entries.reduce((sum, e) => sum + e.value, 0)
  const auctionEntries = entries.filter(e => e.acquisition_type === 'auction')
  const drawEntries = entries.filter(e => e.acquisition_type === 'draw')

  return (
    <div>
      <div className="text-yellow-400 text-center text-lg tracking-widest mb-1">★ ★ ★</div>
      <h1 className="text-3xl font-black uppercase tracking-tight text-white text-center mb-1">
        Driver Pool
      </h1>
      <p className="text-red-400 text-sm text-center mb-6 font-bold uppercase tracking-widest">{YEAR} Indy 500</p>

      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#0e2040] border border-red-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-yellow-400">${totalPot}</div>
            <div className="text-blue-300/60 text-xs uppercase tracking-wide mt-0.5">Total Pot</div>
          </div>
          <div className="bg-[#0e2040] border border-red-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-red-400">{auctionEntries.length}</div>
            <div className="text-blue-300/60 text-xs uppercase tracking-wide mt-0.5">Auctioned</div>
          </div>
          <div className="bg-[#0e2040] border border-red-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-blue-300">{drawEntries.length}</div>
            <div className="text-blue-300/60 text-xs uppercase tracking-wide mt-0.5">Drawn</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#0e2040] border border-red-900 rounded-lg p-1">
        <button
          onClick={() => setTab('drivers')}
          className={`flex-1 py-2 px-4 rounded text-sm font-bold uppercase tracking-wide transition-colors ${
            tab === 'drivers'
              ? 'bg-red-700 text-white'
              : 'text-blue-300 hover:text-white'
          }`}
        >
          All Drivers
        </button>
        <button
          onClick={() => setTab('participants')}
          className={`flex-1 py-2 px-4 rounded text-sm font-bold uppercase tracking-wide transition-colors ${
            tab === 'participants'
              ? 'bg-red-700 text-white'
              : 'text-blue-300 hover:text-white'
          }`}
        >
          By Participant
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="bg-[#0e2040] border border-red-800 rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">🎰</div>
          <div className="text-blue-300/60">No pool entries yet</div>
        </div>
      ) : tab === 'drivers' ? (
        <AllDriversTab entries={entries} />
      ) : (
        <ByParticipantTab entries={entries} />
      )}
    </div>
  )
}

export default DriverPoolPage
