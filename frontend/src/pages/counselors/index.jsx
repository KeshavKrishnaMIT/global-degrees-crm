import React, { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { counselorsAPI } from '../../services/api'

export default function CounselorsPage() {

  const [counselors, setCounselors] =
    useState([])

  const [search, setSearch] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {

    counselorsAPI
      .getAll()
      .then(data => {

        const rows =
          Object.entries(data)
            .map(
              ([name, stats]) => ({
                name,
                total:
                  stats.total,
                converted:
                  stats.converted,
                conversionRate:
                  (
                    stats.converted /
                    stats.total
                  ) * 100
              })
            )
            .sort(
              (a, b) =>
                b.conversionRate -
                a.conversionRate
            )

        setCounselors(rows)

      })
      .catch(console.error)
      .finally(() =>
        setLoading(false)
      )

  }, [])

  const filtered =
    counselors.filter(c =>
      c.name
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    )

  return (
    <div className="animate-fade-in">

      <div
        style={{
          marginBottom: 24
        }}
      >
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color:
              'var(--text-primary)',
            marginBottom: 4
          }}
        >
          Counselors
        </h2>

        <p
          style={{
            color:
              'var(--text-secondary)'
          }}
        >
          Team performance overview
        </p>
      </div>

      <div
        className="card"
        style={{
          marginBottom: 20,
          padding: 16
        }}
      >
        <div
          style={{
            position:
              'relative'
          }}
        >
          <Search
            size={18}
            style={{
              position:
                'absolute',
              left: 14,
              top: 13,
              color:
                'var(--text-muted)'
            }}
          />

          <input
            value={search}
            onChange={e =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search counselor..."
            style={{
              width: '100%',
              padding:
                '12px 14px 12px 42px',
              border:
                '1px solid var(--border-default)',
              borderRadius: 10,
              outline: 'none',
              fontSize: 14
            }}
          />
        </div>
      </div>

      <div
        className="card"
        style={{
          overflowX: 'auto'
        }}
      >

        {loading ? (

          <div
            style={{
              padding: 40,
              textAlign:
                'center'
            }}
          >
            Loading...
          </div>

        ) : (

          <table
            style={{
              width: '100%',
              borderCollapse:
                'collapse'
            }}
          >

            <thead>

              <tr>

                <th
                  style={thStyle}
                >
                  Rank
                </th>

                <th
                  style={thStyle}
                >
                  Counselor
                </th>

                <th
                  style={thStyle}
                >
                  Students
                </th>

                <th
                  style={thStyle}
                >
                  Converted
                </th>

                <th
                  style={thStyle}
                >
                  Conversion %
                </th>

              </tr>

            </thead>

            <tbody>

              {filtered.map(
                (
                  counselor,
                  index
                ) => (

                  <tr
                    key={
                      counselor.name
                    }
                  >

                    <td
                      style={tdStyle}
                    >
                      #{index + 1}
                    </td>

                    <td
                      style={tdStyle}
                    >
                      {
                        counselor.name
                      }
                    </td>

                    <td
                      style={tdStyle}
                    >
                      {
                        counselor.total
                      }
                    </td>

                    <td
                      style={tdStyle}
                    >
                      {
                        counselor.converted
                      }
                    </td>

                    <td
                      style={tdStyle}
                    >
                      <span
                        style={{
                          padding:
                            '5px 10px',
                          borderRadius:
                            999,
                          background:
                            'rgba(34,197,94,0.1)',
                          color:
                            '#16a34a',
                          fontWeight: 600
                        }}
                      >
                        {counselor.conversionRate.toFixed(
                          1
                        )}
                        %
                      </span>
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>

    </div>
  )
}

const thStyle = {
  textAlign: 'left',
  padding: '14px',
  borderBottom:
    '1px solid #e5e7eb',
  fontSize: 13,
  fontWeight: 700
}

const tdStyle = {
  padding: '14px',
  borderBottom:
    '1px solid #f1f5f9',
  fontSize: 14
}