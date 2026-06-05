import React from 'react'

const VARIANTS = {
  default: {
    bg: 'rgba(139,156,200,0.1)',
    color: 'var(--text-secondary)',
    border: 'var(--border-subtle)'
  },

  cyan: {
    bg: 'rgba(0,212,255,0.1)',
    color: 'var(--accent-cyan)',
    border: 'rgba(0,212,255,0.2)'
  },

  emerald: {
    bg: 'rgba(16,185,129,0.1)',
    color: 'var(--accent-emerald)',
    border: 'rgba(16,185,129,0.2)'
  },

  amber: {
    bg: 'rgba(245,158,11,0.1)',
    color: 'var(--accent-amber)',
    border: 'rgba(245,158,11,0.2)'
  },

  rose: {
    bg: 'rgba(244,63,94,0.1)',
    color: 'var(--accent-rose)',
    border: 'rgba(244,63,94,0.2)'
  },

  violet: {
    bg: 'rgba(139,92,246,0.1)',
    color: 'var(--accent-violet)',
    border: 'rgba(139,92,246,0.2)'
  },

  blue: {
    bg: 'rgba(59,130,246,0.1)',
    color: 'var(--accent-blue)',
    border: 'rgba(59,130,246,0.2)'
  }
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false
}) {

  const current =
    VARIANTS[variant] ||
    VARIANTS.default

  const padding =
    size === 'sm'
      ? '2px 7px'
      : '4px 10px'

  const fontSize =
    size === 'sm'
      ? 11
      : 12

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding,
        borderRadius: 999,
        fontSize,
        fontWeight: 500,
        fontFamily:
          'var(--font-mono)',
        background:
          current.bg,
        color:
          current.color,
        border:
          `1px solid ${current.border}`,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em'
      }}
    >
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background:
              current.color,
            flexShrink: 0
          }}
        />
      )}

      {children}
    </span>
  )
}

export function StatusBadge({
  status
}) {

  const map = {
    active: 'emerald',
    converted: 'cyan',
    dropped: 'rose',
    pending: 'amber',
    in_progress: 'violet',
    applied: 'blue',
    hot: 'rose',
    warm: 'amber',
    cold: 'default'
  }

  const variant =
    map[
      status?.toLowerCase()
    ] || 'default'

  return (
    <Badge
      variant={variant}
      dot
    >
      {status}
    </Badge>
  )
}

export function RiskBadge({
  risk
}) {

  const map = {
    high: 'rose',
    medium: 'amber',
    low: 'emerald'
  }

  const variant =
    map[
      risk?.toLowerCase()
    ] || 'default'

  return (
    <Badge
      variant={variant}
      dot
    >
      {risk} Risk
    </Badge>
  )
}