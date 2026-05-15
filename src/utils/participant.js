export const displayName = (participant) =>
  participant?.name || participant?.email?.split('@')[0] || '—'
