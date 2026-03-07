import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getParticipants } from '../api/client'

const Participants = () => {
  const { data: participants, isLoading } = useQuery({
    queryKey: ['participants'],
    queryFn: () => getParticipants().then(res => res.data)
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-yellow-400 text-xl animate-pulse">🏎️ Loading...</div>
    </div>
  )

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight text-yellow-400 mb-6">
        👥 Participants
      </h1>

      <div className="space-y-2">
        {participants?.sort((a, b) => a.name?.localeCompare(b.name)).map(participant => (
          <Link
            key={participant.id}
            to={`/participants/${participant.id}`}
            className="block bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-yellow-400 transition-colors"
          >
            <div className="font-bold text-lg">{participant.name || participant.email}</div>
            {participant.name && (
              <div className="text-gray-500 text-sm">{participant.email}</div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Participants