import React from 'react'

const skeletonStyle = {
  background:
    'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: '6px'
}

export function Skeleton({
  width = '100%',
  height = 16,
  style = {},
  className = ''
}) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        ...skeletonStyle,
        ...style
      }}
    />
  )
}

export function SkeletonCard({
  lines = 3
}) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <Skeleton
        height={20}
        width="60%"
      />

      {Array.from({
        length: lines
      }).map((_, index) => (
        <Skeleton
          key={index}
          height={14}
          width={
            index === lines - 1
              ? '40%'
              : '100%'
          }
        />
      ))}
    </div>
  )
}

export function SkeletonKPI() {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between'
        }}
      >
        <Skeleton
          height={12}
          width="50%"
        />

        <Skeleton
          height={28}
          width={28}
          style={{
            borderRadius: '8px'
          }}
        />
      </div>

      <Skeleton
        height={36}
        width="70%"
      />

      <Skeleton
        height={12}
        width="40%"
      />
    </div>
  )
}

export function SkeletonTable({
  rows = 6,
  cols = 5
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            `repeat(${cols}, 1fr)`,
          gap: 12
        }}
      >
        {Array.from({
          length: cols
        }).map((_, index) => (
          <Skeleton
            key={index}
            height={12}
          />
        ))}
      </div>

      {Array.from({
        length: rows
      }).map((_, row) => (
        <div
          key={row}
          style={{
            display: 'grid',
            gridTemplateColumns:
              `repeat(${cols}, 1fr)`,
            gap: 12
          }}
        >
          {Array.from({
            length: cols
          }).map((_, col) => (
            <Skeleton
              key={col}
              height={14}
              width={
                col === 0
                  ? '80%'
                  : '60%'
              }
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart({
  height = 300
}) {
  return (
    <div className="card">
      <Skeleton
        height={18}
        width="40%"
        style={{
          marginBottom: 20
        }}
      />

      <Skeleton
        height={height}
        width="100%"
        style={{
          borderRadius: '8px'
        }}
      />
    </div>
  )
}