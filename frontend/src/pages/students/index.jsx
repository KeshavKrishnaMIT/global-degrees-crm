import React, { useEffect, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { studentsAPI } from '../../services/api'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    try {
      const data = await studentsAPI.getStudents()
      setStudents(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

const filteredStudents =
  students.filter(student => {

    const term =
      search.toLowerCase()

    return Object.values(student)
      .join(' ')
      .toLowerCase()
      .includes(term)

  })
  return (
    <div className="animate-fade-in">

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}
          >
            Students
          </h2>

          <p
            style={{
              color: 'var(--text-secondary)',
              marginTop: 4
            }}
          >
            Manage all student records
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: '12px 20px'
          }}
        >
          <strong>
            {filteredStudents.length}
          </strong>
          {' '}
          Students
        </div>
      </div>

      <div
        className="card"
        style={{
          marginBottom: 20
        }}
      >
        <div
          style={{
            position: 'relative'
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              color: '#777'
            }}
          />

          <input
            type="text"
            placeholder="Search anything..."
            value={search}
            onChange={e =>
              setSearch(
                e.target.value
              )
            }
            style={{
              width: '100%',
              padding:
                '10px 12px 10px 40px',
              border:
                '1px solid #ddd',
              borderRadius: 10,
              fontSize: 14
            }}
          />
        </div>
      </div>

      <div className="card">

        {loading ? (
          <div
            style={{
              padding: 30,
              textAlign: 'center'
            }}
          >
            Loading students...
          </div>
        ) : (

          <div
            style={{
              overflowX: 'auto'
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse:
                  'collapse'
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom:
                      '1px solid #ddd'
                  }}
                >
                  <th
                    style={{
                      padding: 12,
                      textAlign: 'left'
                    }}
                  >
                    ID
                  </th>

                  <th
                    style={{
                      padding: 12,
                      textAlign: 'left'
                    }}
                  >
                    Name
                  </th>

                  <th
                    style={{
                      padding: 12,
                      textAlign: 'left'
                    }}
                  >
                    Country
                  </th>

                  <th
                    style={{
                      padding: 12,
                      textAlign: 'left'
                    }}
                  >
                    Course
                  </th>

                  <th
                    style={{
                      padding: 12,
                      textAlign: 'left'
                    }}
                  >
                    IELTS
                  </th>

                  <th
                    style={{
                      padding: 12,
                      textAlign: 'left'
                    }}
                  >
                    CGPA
                  </th>

                  <th
                    style={{
                      padding: 12,
                      textAlign: 'left'
                    }}
                  >
                    Lead Score
                  </th>

                  <th
                    style={{
                      padding: 12,
                      textAlign: 'left'
                    }}
                  >
                    Status
                  </th>

                  <th
                    style={{
                      padding: 12,
                      textAlign: 'left'
                    }}
                  >
                    Counselor
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredStudents.map(
                  student => (
                    <tr
                      key={
                        student.student_id
                      }
                      style={{
                        borderBottom:
                          '1px solid #eee'
                      }}
                    >
                      <td style={{ padding: 12 }}>
                        {student.student_id}
                      </td>

                      <td style={{ padding: 12 }}>
                        {student.name}
                      </td>

                 <td style={{ padding: 12 }}>
  {student.preferred_country}
</td>

<td style={{ padding: 12 }}>
  {student.preferred_course}
</td>

                      <td style={{ padding: 12 }}>
                        {student.ielts_score}
                      </td>

                      <td style={{ padding: 12 }}>
                        {student.cgpa}
                      </td>

                      <td style={{ padding: 12 }}>
                        {student.lead_score}
                      </td>

                      <td style={{ padding: 12 }}>
                        {student.status}
                      </td>

                      <td style={{ padding: 12 }}>
                        {
                          student.assigned_counselor
                        }
                      </td>
                    </tr>
                  )
                )}

              </tbody>
            </table>

            {!filteredStudents.length && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 40,
                  color: '#777'
                }}
              >
                No students found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}