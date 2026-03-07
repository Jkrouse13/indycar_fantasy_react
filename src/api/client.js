import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
})

export const getRaces = () => client.get('/races')
export const getRace = (id) => client.get(`/races/${id}`)
export const getRaceLeaderboard = (raceId) => client.get(`/leaderboard/race/${raceId}`)
export const getSeasonLeaderboard = (year) => client.get(`/leaderboard/season/${year}`)
export const getRaceTiers = (raceId) => client.get(`/race_tiers?race_id=${raceId}`)
export const submitPicks = (picks) => client.post('/picks', picks)
export const getParticipants = () => client.get('/participants')
export const getParticipant = (id) => client.get(`/participants/${id}`)
export const createParticipant = (email) =>
  client.post('/participants', { participant: { email } })

export default client