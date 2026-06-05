import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRaces,
  getRaceTiers,
  getDrivers,
  createRaceTier,
  updateRaceTierDrivers,
  deleteRaceTier,
} from '../api/client'

const AdminTiersPage = () => {
  const queryClient = useQueryClient()
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const { data: races, isLoading: racesLoading } = useQuery({
    queryKey: ['races'],
    queryFn: () => getRaces().then((r) => r.data),
  })

  const nextRace = races
    ?.filter((r) => r.status !== 'final')
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0]

  const { data: tiers, isLoading: tiersLoading } = useQuery({
    queryKey: ['raceTiers', nextRace?.id],
    queryFn: () => getRaceTiers(nextRace.id).then((r) => r.data),
    enabled: !!nextRace?.id,
  })

  const { data: allDrivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => getDrivers().then((r) => r.data),
  })

  const invalidateTiers = () =>
    queryClient.invalidateQueries({ queryKey: ['raceTiers', nextRace?.id] })

  const addTierMutation = useMutation({
    mutationFn: () => {
      const nextNumber = tiers?.length
        ? Math.max(...tiers.map((t) => t.tier_number)) + 1
        : 1
      return createRaceTier(nextRace.id, nextNumber)
    },
    onSuccess: invalidateTiers,
  })

  const updateDriversMutation = useMutation({
    mutationFn: ({ tierId, driverIds }) => updateRaceTierDrivers(tierId, driverIds),
    onSuccess: invalidateTiers,
  })

  const deleteTierMutation = useMutation({
    mutationFn: (tierId) => deleteRaceTier(tierId),
    onSuccess: () => {
      setConfirmDeleteId(null)
      invalidateTiers()
    },
  })

  const assignedDriverIds = new Set(
    tiers?.flatMap((t) => t.drivers.map((d) => d.id)) ?? []
  )

  const unassignedDrivers = allDrivers?.filter((d) => d.active && !assignedDriverIds.has(d.id)) ?? []

  if (racesLoading) {
    return <p className="text-blue-300">Loading...</p>
  }

  if (!nextRace) {
    return <p className="text-blue-300">No upcoming races found.</p>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-yellow-400 uppercase tracking-tight">
          Manage Tiers
        </h1>
        <p className="text-blue-300 mt-1">
          {nextRace.name} &mdash; {new Date(nextRace.date).toLocaleDateString()}
        </p>
      </div>

      {tiersLoading ? (
        <p className="text-blue-300">Loading tiers...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {tiers?.map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                unassignedDrivers={unassignedDrivers}
                onAddDriver={(driverId) =>
                  updateDriversMutation.mutate({
                    tierId: tier.id,
                    driverIds: [...tier.drivers.map((d) => d.id), driverId],
                  })
                }
                onRemoveDriver={(driverId) =>
                  updateDriversMutation.mutate({
                    tierId: tier.id,
                    driverIds: tier.drivers.map((d) => d.id).filter((id) => id !== driverId),
                  })
                }
                onDelete={() => setConfirmDeleteId(tier.id)}
                confirmingDelete={confirmDeleteId === tier.id}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onConfirmDelete={() => deleteTierMutation.mutate(tier.id)}
              />
            ))}
          </div>

          <button
            onClick={() => addTierMutation.mutate()}
            disabled={addTierMutation.isPending}
            className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2 px-5 rounded uppercase tracking-wide text-sm transition-colors"
          >
            + Add Tier
          </button>
        </>
      )}
    </div>
  )
}

const TierCard = ({
  tier,
  unassignedDrivers,
  onAddDriver,
  onRemoveDriver,
  onDelete,
  confirmingDelete,
  onCancelDelete,
  onConfirmDelete,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState('')

  const handleAdd = () => {
    if (!selectedDriverId) return
    onAddDriver(parseInt(selectedDriverId))
    setSelectedDriverId('')
  }

  return (
    <div className="bg-[#0e2040] border border-blue-900 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-yellow-400 font-black uppercase tracking-wide text-sm">
          Tier {tier.tier_number}
        </h2>
        {confirmingDelete ? (
          <div className="flex gap-2">
            <button
              onClick={onConfirmDelete}
              className="text-xs text-red-400 hover:text-red-300 font-bold"
            >
              Confirm
            </button>
            <button
              onClick={onCancelDelete}
              className="text-xs text-blue-300 hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onDelete}
            className="text-xs text-blue-500 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-1">
        {tier.drivers.map((driver) => (
          <li
            key={driver.id}
            className="flex items-center justify-between text-sm"
            style={{ borderLeft: `3px solid ${driver.primary_color || '#444'}`, paddingLeft: '8px' }}
          >
            <span className="text-white">
              <span className="text-blue-300 mr-1">#{driver.car_number}</span>
              {driver.name}
            </span>
            <button
              onClick={() => onRemoveDriver(driver.id)}
              className="text-blue-500 hover:text-red-400 ml-2 font-bold transition-colors"
              title="Remove"
            >
              ×
            </button>
          </li>
        ))}
        {tier.drivers.length === 0 && (
          <li className="text-blue-500 text-xs italic">No drivers assigned</li>
        )}
      </ul>

      <div className="flex gap-2 mt-auto pt-2 border-t border-blue-900">
        <select
          value={selectedDriverId}
          onChange={(e) => setSelectedDriverId(e.target.value)}
          className="flex-1 bg-[#071428] border border-blue-800 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        >
          <option value="">Add driver...</option>
          {unassignedDrivers.map((d) => (
            <option key={d.id} value={d.id}>
              #{d.car_number} {d.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!selectedDriverId}
          className="bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold px-3 py-1 rounded transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}

export default AdminTiersPage
