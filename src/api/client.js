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

export const getDrivers = () => client.get('/drivers')

export const getQualifyingPredictions = (year = 2026) =>
  client.get(`/qualifying_predictions?year=${year}`)
export const getQualifyingPrediction = (participantId, year = 2026) =>
  client.get(`/qualifying_predictions/${participantId}?year=${year}`)
export const submitQualifyingPrediction = (data) =>
  client.post('/qualifying_predictions', data)
export const updateQualifyingPrediction = (id, data) =>
  client.patch(`/qualifying_predictions/${id}`, data)
export const getQualifyingResult = (year = 2026) =>
  client.get(`/qualifying_results/${year}`)

export default client