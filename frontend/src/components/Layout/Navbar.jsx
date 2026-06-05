import React, {
  useState,
  useEffect
} from 'react'

import { useLocation } from 'react-router-dom'

import {
  Activity
} from 'lucide-react'

import {
  formatDate
} from '../../utils/formatters'

const PAGE_TITLES = {
  '/': {
    title: 'Executive Dashboard',
    sub: 'Business Intelligence Overview'
  },

  '/students': {
    title: 'Student Explorer',
    sub: 'Browse Student Records'
  },

  '/analytics': {
    title: 'Analytics Hub',
    sub: 'Advanced Analytics'
  },

  '/counselors': {
    title: 'Counselors',
    sub: 'Performance Management'
  },

  '/recommendations': {
    title: 'AI Recommendations',
    sub: 'Machine Learning Insights'
  }
}

export default function Navbar() {

  const location =
    useLocation()

  const [currentTime,
    setCurrentTime] =
    useState(new Date())

  const page =
    PAGE_TITLES[
      location.pathname
    ] || {
      title: 'Global Degrees',
      sub: ''
    }

  useEffect(() => {

    const timer =
      setInterval(() => {

        setCurrentTime(
          new Date()
        )

      }, 60000)

    return () =>
      clearInterval(timer)

  }, [])

  return (
    <header
      style={{
        height: '72px',
        background: '#ffffff',
        borderBottom:
          '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          'space-between',
        padding: '0 30px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >

      <div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#111827',
            lineHeight: 1.1,
            marginBottom: 2
          }}
        >
          {page.title}
        </h1>

        <div
          style={{
            fontSize: 14,
            color: '#6b7280',
            fontWeight: 500
          }}
        >
          {page.sub}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20
        }}
      >

        <div
          style={{
            textAlign: 'right'
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#111827'
            }}
          >
            {currentTime.toLocaleTimeString(
              'en-IN',
              {
                hour: '2-digit',
                minute: '2-digit'
              }
            )}
          </div>

          <div
            style={{
              fontSize: 13,
              color: '#6b7280'
            }}
          >
            {formatDate(
              currentTime.toISOString()
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 10,
            background:
              '#ecfdf5',
            border:
              '1px solid #bbf7d0'
          }}
        >
          <Activity
            size={14}
            color="#16a34a"
          />

          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#16a34a'
            }}
          >
            SYSTEM ONLINE
          </span>
        </div>

      </div>

    </header>
  )
}