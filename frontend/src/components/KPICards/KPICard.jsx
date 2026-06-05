import React, {
  useEffect,
  useState
} from 'react'

import {
  TrendingUp,
  TrendingDown
} from 'lucide-react'

import {
  formatNumber
} from '../../utils/formatters'

function useCountUp(
  target,
  duration = 1200
) {

  const [value,
    setValue] =
    useState(0)

  useEffect(() => {

    const numeric =
      parseFloat(target)

    if (
      isNaN(numeric)
    ) {
      return
    }

    const start =
      Date.now()

    const tick = () => {

      const elapsed =
        Date.now() - start

      const progress =
        Math.min(
          elapsed / duration,
          1
        )

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        )

      setValue(
        numeric * eased
      )

      if (
        progress < 1
      ) {
        requestAnimationFrame(
          tick
        )
      } else {
        setValue(numeric)
      }
    }

    requestAnimationFrame(
      tick
    )

  }, [
    target,
    duration
  ])

  return value
}

export default function KPICard({
  title,
  value,
  previousValue,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  iconColor = 'var(--accent-cyan)',
  trend,
  trendLabel,
  subtitle,
  animate = true,
  highlight = false
}) {

  const isTextCard =
    value === null ||
    value === undefined ||
    value === ''

  const animatedValue =
    useCountUp(
      animate && !isTextCard
        ? parseFloat(value) || 0
        : 0
    )

  const displayValue =
    animate && !isTextCard
      ? animatedValue
      : parseFloat(value)

  const trendValue =
    trend ??
    (
      previousValue
        ? (
            (
              parseFloat(value) -
              parseFloat(previousValue)
            ) /
            parseFloat(previousValue)
          ) * 100
        : null
    )

  const isPositive =
    trendValue > 0

  const isNeutral =
    trendValue === 0 ||
    trendValue === null

  const formattedValue =
    isTextCard
      ? null
      : (
          decimals > 0
            ? displayValue.toFixed(
                decimals
              )
            : formatNumber(
                Math.round(
                  displayValue
                )
              )
        )

  return (
    <div
      className="card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '165px',
        transition:
          'all 0.2s ease',
        ...(highlight && {
          borderColor:
            iconColor,
          boxShadow:
            `0 0 0 1px ${iconColor}22`
        })
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform =
          'translateY(-3px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform =
          'translateY(0)'
      }}
    >

      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 90,
          height: 90,
          borderRadius: '50%',
          background:
            iconColor,
          opacity: 0.05,
          filter:
            'blur(24px)'
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems:
            'flex-start',
          marginBottom: 16
        }}
      >

        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color:
              '#6b7280',
            letterSpacing:
              '0.06em',
            textTransform:
              'uppercase'
          }}
        >
          {title}
        </span>

        {Icon && (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background:
                `${iconColor}15`,
              border:
                `1px solid ${iconColor}25`,
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center'
            }}
          >
            <Icon
              size={18}
              color={iconColor}
            />
          </div>
        )}
      </div>

      {isTextCard ? (

        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#111827',
            marginBottom: 12,
            lineHeight: 1.2
          }}
        >
          {subtitle}
        </div>

      ) : (

        <>
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: '#111827',
              lineHeight: 1,
              marginBottom: 10
            }}
          >
            {prefix}
            {formattedValue}
            {suffix}
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: 13,
                color: '#6b7280',
                fontWeight: 500
              }}
            >
              {subtitle}
            </div>
          )}
        </>
      )}

      {!isTextCard &&
        !isNeutral &&
        trendValue !== null && (

        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            display: 'flex',
            alignItems:
              'center',
            gap: 4,
            padding:
              '4px 8px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            color:
              isPositive
                ? '#16a34a'
                : '#dc2626',
            background:
              isPositive
                ? '#ecfdf5'
                : '#fef2f2'
          }}
        >
          {isPositive ? (
            <TrendingUp size={11} />
          ) : (
            <TrendingDown size={11} />
          )}

          {Math.abs(
            trendValue
          ).toFixed(1)}
          %

          {trendLabel &&
            ` ${trendLabel}`}
        </div>
      )}

    </div>
  )
}