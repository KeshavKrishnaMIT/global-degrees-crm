import React, { useState } from 'react'
import { X, RotateCcw, Check } from 'lucide-react'
import { useFilters } from '../../context/FilterContext'

const COUNTRIES = [
  'Canada',
  'USA',
  'UK',
  'Australia',
  'Germany'
]

const COURSES = [
  'Data Science',
  'Computer Science',
  'MBA',
  'Engineering',
  'Business Analytics'
]

const LEAD_SOURCES = [
  'Instagram',
  'LinkedIn',
  'Referral',
  'Website',
  'Seminar'
]

const STATUSES = [
  'Active',
  'Converted',
  'Dropped'
]

const COUNSELORS = [
  'Priya Sharma',
  'Rahul Verma',
  'Anjali Singh',
  'Amit Patel',
  'Neha Gupta'
]

export default function GlobalFilters() {

  const {
    filters,
    updateFilters,
    resetFilters,
    setIsFilterPanelOpen,
    activeFilterCount
  } = useFilters()

  const [localFilters,
    setLocalFilters] =
    useState(filters)

  const update = (
    key,
    value
  ) => {

    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }))

  }

  const apply = () => {

    updateFilters(localFilters)
    setIsFilterPanelOpen(false)

  }

  const reset = () => {

    resetFilters()

    setLocalFilters({
      country: '',
      course: '',
      counselor: '',
      budgetMin: '',
      budgetMax: '',
      ieltsMin: '',
      ieltsMax: '',
      cgpaMin: '',
      cgpaMax: '',
      leadSource: '',
      status: '',
      scholarshipRequired: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    })

  }

  return (
    <>
      <div
        onClick={() =>
          setIsFilterPanelOpen(false)
        }
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'rgba(0,0,0,0.55)',
          zIndex: 199
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 380,
          background:
            'var(--bg-surface)',
          borderLeft:
            '1px solid var(--border-default)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            padding: 20,
            borderBottom:
              '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h3>
              Global Filters
            </h3>

            {activeFilterCount > 0 && (
              <p
                style={{
                  fontSize: 11,
                  color:
                    'var(--text-muted)'
                }}
              >
                {activeFilterCount}
                {' '}
                active filters
              </p>
            )}
          </div>

          <button
            onClick={() =>
              setIsFilterPanelOpen(false)
            }
            style={closeButton}
          >
            <X size={15} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 18
          }}
        >
          <FilterSelect
            label="Country"
            value={localFilters.country}
            onChange={v =>
              update('country', v)
            }
            options={COUNTRIES}
          />

          <FilterSelect
            label="Course"
            value={localFilters.course}
            onChange={v =>
              update('course', v)
            }
            options={COURSES}
          />

          <FilterSelect
            label="Counselor"
            value={localFilters.counselor}
            onChange={v =>
              update('counselor', v)
            }
            options={COUNSELORS}
          />

          <FilterSelect
            label="Lead Source"
            value={localFilters.leadSource}
            onChange={v =>
              update('leadSource', v)
            }
            options={LEAD_SOURCES}
          />

          <FilterSelect
            label="Status"
            value={localFilters.status}
            onChange={v =>
              update('status', v)
            }
            options={STATUSES}
          />
        </div>

        <div
          style={{
            padding: 16,
            borderTop:
              '1px solid var(--border-subtle)',
            display: 'flex',
            gap: 10
          }}
        >
          <button
            onClick={reset}
            style={secondaryButton}
          >
            <RotateCcw size={14} />
            Reset
          </button>

          <button
            onClick={apply}
            style={primaryButton}
          >
            <Check size={14} />
            Apply Filters
          </button>
        </div>
      </div>
    </>
  )
}

const closeButton = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: '1px solid var(--border-subtle)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const primaryButton = {
  flex: 1,
  padding: '10px 14px',
  border: 'none',
  borderRadius: 8,
  background: 'var(--accent-cyan)',
  color: '#000',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 6
}

const secondaryButton = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 6
}

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 11,
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-mono)'
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)'
}

function FilterSelect({
  label,
  value,
  onChange,
  options
}) {

  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <select
        value={value}
        onChange={e =>
          onChange(e.target.value)
        }
        style={inputStyle}
      >
        <option value="">
          All
        </option>

        {options.map(option => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}