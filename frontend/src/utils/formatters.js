export const formatNumber = (num) => {
  if (num === null || num === undefined) return '—'

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }

  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }

  return Number(num).toLocaleString()
}

export const formatCurrency = (
  num,
  currency = 'USD'
) => {

  if (num === null || num === undefined) {
    return '—'
  }

  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency,
      notation:
        num >= 1000000
          ? 'compact'
          : 'standard',
      maximumFractionDigits: 0
    }
  ).format(num)
}

export const formatPercent = (
  num,
  decimals = 1
) => {

  if (num === null || num === undefined) {
    return '—'
  }

  return `${Number(num).toFixed(decimals)}%`
}

export const formatScore = (
  num,
  decimals = 2
) => {

  if (num === null || num === undefined) {
    return '—'
  }

  return Number(num).toFixed(decimals)
}

export const formatDate = (
  dateStr
) => {

  if (!dateStr) return '—'

  return new Date(dateStr)
    .toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    )
}

export const formatDateShort = (
  dateStr
) => {

  if (!dateStr) return '—'

  return new Date(dateStr)
    .toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short'
      }
    )
}

export const formatRelativeTime = (
  dateStr
) => {

  if (!dateStr) return '—'

  const now = new Date()
  const date = new Date(dateStr)

  const diff =
    now.getTime() -
    date.getTime()

  const days =
    Math.floor(
      diff / 86400000
    )

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) {
    return `${Math.floor(days / 7)}w ago`
  }

  if (days < 365) {
    return `${Math.floor(days / 30)}mo ago`
  }

  return `${Math.floor(days / 365)}y ago`
}

export const getStatusColor = (
  status
) => {

  const map = {
    active: 'var(--accent-emerald)',
    converted: 'var(--accent-cyan)',
    dropped: 'var(--accent-rose)',
    pending: 'var(--accent-amber)',
    in_progress: 'var(--accent-violet)',
    applied: 'var(--accent-blue)'
  }

  return (
    map[
      status?.toLowerCase()
    ] ||
    'var(--text-muted)'
  )
}

export const getStageColor = (
  stage
) => {

  const map = {
    enquiry: 'var(--accent-amber)',
    counseling: 'var(--accent-violet)',
    documentation: 'var(--accent-blue)',
    application: 'var(--accent-cyan)',
    visa: 'var(--accent-emerald)',
    enrolled: 'var(--accent-emerald)',
    dropped: 'var(--accent-rose)'
  }

  return (
    map[
      stage?.toLowerCase()
    ] ||
    'var(--text-muted)'
  )
}

export const getRiskColor = (
  risk
) => {

  if (!risk) {
    return 'var(--text-muted)'
  }

  const value =
    risk.toLowerCase()

  if (value === 'high') {
    return 'var(--accent-rose)'
  }

  if (value === 'medium') {
    return 'var(--accent-amber)'
  }

  if (value === 'low') {
    return 'var(--accent-emerald)'
  }

  return 'var(--text-muted)'
}

export const getLeadScoreColor = (
  score
) => {

  if (score >= 80) {
    return 'var(--accent-emerald)'
  }

  if (score >= 60) {
    return 'var(--accent-cyan)'
  }

  if (score >= 40) {
    return 'var(--accent-amber)'
  }

  return 'var(--accent-rose)'
}

export const capitalize = (
  str
) => {

  if (!str) return ''

  return (
    str.charAt(0)
      .toUpperCase() +
    str.slice(1)
      .toLowerCase()
  )
}

export const truncate = (
  str,
  max = 30
) => {

  if (!str) return ''

  return str.length > max
    ? str.slice(0, max) + '…'
    : str
}

export const getInitials = (
  name
) => {

  if (!name) return '?'

  return name
    .split(' ')
    .map(
      part => part[0]
    )
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const CHART_COLORS = [
  '#00d4ff',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#f43f5e',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#a78bfa',
  '#34d399',
  '#fbbf24',
  '#fb7185'
]