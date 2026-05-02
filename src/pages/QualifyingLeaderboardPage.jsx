import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getQualifyingPredictions, getQualifyingResult, getDrivers } from '../api/client'

const YEAR = 2026

const PositionBadge = ({ position }) => {
  if (position === 1) return <span className="text-2xl">🥇</span>
  if (position === 2) return <span className="text-2xl">🥈</span>
  if (position === 3) return <span className="text-2xl">🥉</span>
  return <span className="text-gray-400 font-bold text-lg w-8 text-center">{position}</span>
}

const ScorePill = ({ label, value }) => {
  const pending = value === null || value === undefined
  return (
    <div className="bg-gray-800 rounded px-3 py-2 text-center">
      <div className={`font-black text-base ${pending ? 'text-gray-600' : value > 0 ? 'text-green-400' : 'text-gray-400'}`}>
        {pending ? '–' : value}
      </div>
      <div className="text-gray-500 text-xs uppercase tracking-wide">{label}</div>
    </div>
  )
}

const QualifyingLeaderboardPage = () => {
  const [expanded, setExpanded] = useState({})

  const { data: predictions, isLoading } = useQuery({
    queryKey: ['qualifyingPredictions', YEAR],
    queryFn: () => getQualifyingPredictions(YEAR).then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: result } = useQuery({
    queryKey: ['qualifyingResult', YEAR],
    queryFn: () => getQualifyingResult(YEAR).then(r => r.data).catch(() => null),
  })

  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => getDrivers().then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="text-yellow-400 animate-pulse text-center py-16 text-xl font-black uppercase">
        🏎️ Loading...
      </div>
    )
  }

  const driverMap = (driversData || []).reduce((acc, d) => { acc[d.id] = d; return acc }, {})
  const finalized = result?.finalized
  const hasAnyResult = result && (result.fast_twelve_driver_ids?.length > 0 || result.pole_driver_id)

  const driverName = (id) => {
    const d = driverMap[id]
    return d ? `#${d.car_number} ${d.name}` : '—'
  }

  // Precompute result sets/maps for color coding
  const resFtIds = result?.fast_twelve_driver_ids || []
  const resLrIds = result?.last_row_driver_ids || []
  const resFtSet = new Set(resFtIds)
  const resLrSet = new Set(resLrIds)
  const resFtByPos = Object.fromEntries(resFtIds.map((id, i) => [i + 1, id]))
  // Fall back to pole_driver_id as P1 when result positions aren't stored
  if (!resFtByPos[1] && result?.pole_driver_id) resFtByPos[1] = result.pole_driver_id
  const resLrByPos = Object.fromEntries(resLrIds.map((id, i) => [i + 1, id]))

  const ftPickColor = (driverId, pos) => {
    if (!hasAnyResult) return 'text-gray-400'
    if (resFtByPos[pos] === driverId) return 'text-yellow-400'
    if (resFtSet.has(driverId)) return 'text-green-400'
    return 'text-red-400'
  }

  const lrPickColor = (driverId, pos) => {
    if (!hasAnyResult) return 'text-gray-400'
    if (resLrByPos[pos] === driverId) return 'text-yellow-400'
    if (resLrSet.has(driverId)) return 'text-green-400'
    return 'text-red-400'
  }

  const sorted = [...(predictions || [])].sort((a, b) =>
    hasAnyResult
      ? (b.score?.total ?? 0) - (a.score?.total ?? 0)
      : a.participant_name?.localeCompare(b.participant_name)
  )

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight text-yellow-400 mb-2">
        Qualifying Standings
      </h1>
      <p className="text-gray-400 text-sm mb-6">{YEAR} Indy 500 Qualifying Predictions</p>

      {/* Official results summary */}
      {result && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
            {finalized ? '✅ Official Results' : '⏳ Results Pending'}
          </p>
          {finalized ? (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Pole</p>
                <p className="font-bold text-yellow-400 text-xs">{driverName(result.pole_driver_id)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Sat Wreck</p>
                <p className={`font-bold ${result.saturday_wreck ? 'text-red-400' : 'text-green-400'}`}>
                  {result.saturday_wreck ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Sun Wreck</p>
                <p className={`font-bold ${result.sunday_wreck ? 'text-red-400' : 'text-green-400'}`}>
                  {result.sunday_wreck ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Scores will appear once qualifying is complete.</p>
          )}
        </div>
      )}

      {/* Legend */}
      {hasAnyResult && (
        <div className="flex gap-4 text-xs mb-4">
          <span className="text-yellow-400 font-bold">● Exact position</span>
          <span className="text-green-400 font-bold">● In group</span>
          <span className="text-red-400 font-bold">● Miss</span>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No predictions submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((pred, i) => {
            const score = pred.score || {}
            const isLeader = finalized && i === 0
            const isExpanded = !!expanded[pred.id]

            return (
              <div
                key={pred.id}
                className={`rounded-lg border ${isLeader ? 'bg-yellow-400/10 border-yellow-400/50' : 'bg-gray-900 border-gray-800'}`}
              >
                {/* Header row — tap to expand */}
                <button
                  className="w-full p-4 text-left"
                  onClick={() => setExpanded(prev => ({ ...prev, [pred.id]: !prev[pred.id] }))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hasAnyResult && <PositionBadge position={i + 1} />}
                      <span className="font-bold text-lg">{pred.participant_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasAnyResult && (
                        <div className="text-right">
                          <div className="text-2xl font-black text-yellow-400">{score.total ?? 0}</div>
                          <div className="text-gray-500 text-xs uppercase tracking-wide">pts</div>
                        </div>
                      )}
                      <span className="text-gray-500 text-lg">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Score pills (collapsed summary) */}
                  {!isExpanded && (
                    <div className="mt-3">
                      {hasAnyResult ? (
                        <div className="grid grid-cols-4 gap-2">
                          <ScorePill label="Fast 12" value={score.fast_twelve} />
                          <ScorePill label="Last Row" value={score.last_row} />
                          <ScorePill label="Sat Wreck" value={score.saturday_wreck} />
                          <ScorePill label="Sun Wreck" value={score.sunday_wreck} />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-800 rounded px-3 py-2">
                            <p className="text-gray-500 uppercase tracking-wide mb-1">Pole Pick (P1)</p>
                            <p className="font-bold text-white">{driverName(pred.fast_twelve_driver_ids?.[0])}</p>
                          </div>
                          <div className="bg-gray-800 rounded px-3 py-2">
                            <p className="text-gray-500 uppercase tracking-wide mb-1">Wrecks</p>
                            <p className="font-bold">
                              <span className={pred.saturday_wreck ? 'text-red-400' : 'text-green-400'}>Sat {pred.saturday_wreck ? 'Y' : 'N'}</span>
                              {' · '}
                              <span className={pred.sunday_wreck ? 'text-red-400' : 'text-green-400'}>Sun {pred.sunday_wreck ? 'Y' : 'N'}</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </button>

                {/* Expanded picks detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-800 pt-4 space-y-4">
                    {/* Fast 12 */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Fast 12</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {(pred.fast_twelve_driver_ids || []).map((id, i) => {
                          const pos = i + 1
                          return (
                            <div key={id} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-600 w-5 shrink-0 text-right">P{pos}</span>
                              <span className={`font-bold ${ftPickColor(id, pos)}`}>{driverName(id)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Last Row */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Last Row</p>
                      <div className="space-y-1">
                        {(pred.last_row_driver_ids || []).map((id, i) => {
                          const pos = i + 1
                          return (
                            <div key={id} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-600 w-7 shrink-0 text-right">P{31 + i}</span>
                              <span className={`font-bold ${lrPickColor(id, pos)}`}>{driverName(id)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Wrecks */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Wrecks</p>
                      <div className="flex gap-6 text-xs">
                        <div>
                          <span className="text-gray-600">Sat: </span>
                          <span className={`font-bold ${
                            !hasAnyResult ? 'text-gray-400' :
                            pred.saturday_wreck === result.saturday_wreck ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {pred.saturday_wreck ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Sun: </span>
                          <span className={`font-bold ${
                            !hasAnyResult ? 'text-gray-400' :
                            pred.sunday_wreck === result.sunday_wreck ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {pred.sunday_wreck ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default QualifyingLeaderboardPage
