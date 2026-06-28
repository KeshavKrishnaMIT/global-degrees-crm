import React, { useEffect, useState, useMemo } from 'react'
import { Search, Users, Filter, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { studentsAPI } from '../../services/api'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false) // Start closed or open as toggle
  const [globalSearch, setGlobalSearch] = useState('')

  // Filter States
  const [filterState, setFilterState] = useState({
    searchName: '',
    searchEmail: '',
    searchPhone: '',
    searchStudentId: '',
    country: '',
    preferredCountry: '',
    course: '',
    degree: '',
    cgpaMin: '',
    cgpaMax: '',
    ieltsMin: '',
    ieltsMax: '',
    budgetMin: '',
    budgetMax: '',
    scholarshipRequired: '',
    status: '',
    counselor: '',
    leadSource: '',
    intake: '',
    applicationYear: ''
  })

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    try {
      const data = await studentsAPI.getStudents()
      
      // Normalize and fallback missing fields on load
      const normalized = (data || []).map(student => {
        // Derive intake based on created_date month if not present
        let intake = student.intake;
        if (!intake && student.created_date) {
          const month = new Date(student.created_date).getMonth();
          if (month >= 0 && month <= 2) intake = 'Spring';
          else if (month >= 3 && month <= 5) intake = 'Summer';
          else if (month >= 6 && month <= 8) intake = 'Fall';
          else intake = 'Winter';
        }
        if (!intake) intake = 'Fall'; // default fallback

        const appYear = student.application_year || 
          (student.created_date ? new Date(student.created_date).getFullYear().toString() : '2026');

        const email = student.email || `${student.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@globaldegrees.com`;
        const phone = student.phone || student.phone_number || `+91 ${Math.floor(6000000000 + (student.cgpa * 400000000) % 4000000000)}`;
        const country = student.country || 'India';

        return {
          ...student,
          intake,
          application_year: appYear,
          email,
          phone,
          country
        };
      })

      setStudents(normalized)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Extract unique options for filter dropdowns based on the dataset
  const filterOptions = useMemo(() => {
    const countries = new Set()
    const preferredCountries = new Set()
    const courses = new Set()
    const degrees = new Set()
    const counselors = new Set()
    const leadSources = new Set()
    const intakes = new Set()
    const applicationYears = new Set()
    const statuses = new Set()

    students.forEach(s => {
      if (s.country) countries.add(s.country)
      if (s.preferred_country) preferredCountries.add(s.preferred_country)
      if (s.preferred_course) courses.add(s.preferred_course)
      if (s.degree) degrees.add(s.degree)
      if (s.assigned_counselor) counselors.add(s.assigned_counselor)
      if (s.lead_source) leadSources.add(s.lead_source)
      if (s.intake) intakes.add(s.intake)
      if (s.application_year) applicationYears.add(s.application_year)
      if (s.status) statuses.add(s.status)
    })

    return {
      countries: Array.from(countries).sort(),
      preferredCountries: Array.from(preferredCountries).sort(),
      courses: Array.from(courses).sort(),
      degrees: Array.from(degrees).sort(),
      counselors: Array.from(counselors).sort(),
      leadSources: Array.from(leadSources).sort(),
      intakes: Array.from(intakes).sort(),
      applicationYears: Array.from(applicationYears).sort(),
      statuses: Array.from(statuses).sort()
    }
  }, [students])

  // Combine filters using AND logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Global Search (checks all stringified properties)
      if (globalSearch) {
        const term = globalSearch.toLowerCase()
        const isMatched = Object.values(student)
          .join(' ')
          .toLowerCase()
          .includes(term)
        if (!isMatched) return false
      }

      // General Search Filters
      if (filterState.searchName && !student.name.toLowerCase().includes(filterState.searchName.toLowerCase())) return false
      if (filterState.searchEmail && !student.email.toLowerCase().includes(filterState.searchEmail.toLowerCase())) return false
      if (filterState.searchPhone && !student.phone.toLowerCase().includes(filterState.searchPhone.toLowerCase())) return false
      if (filterState.searchStudentId && !student.student_id.toLowerCase().includes(filterState.searchStudentId.toLowerCase())) return false

      // Academic Filters
      if (filterState.country && student.country !== filterState.country) return false
      if (filterState.preferredCountry && student.preferred_country !== filterState.preferredCountry) return false
      if (filterState.course && student.preferred_course !== filterState.course) return false
      if (filterState.degree && student.degree !== filterState.degree) return false
      
      if (filterState.cgpaMin && Number(student.cgpa) < Number(filterState.cgpaMin)) return false
      if (filterState.cgpaMax && Number(student.cgpa) > Number(filterState.cgpaMax)) return false
      
      if (filterState.ieltsMin && Number(student.ielts_score) < Number(filterState.ieltsMin)) return false
      if (filterState.ieltsMax && Number(student.ielts_score) > Number(filterState.ieltsMax)) return false

      // Financial Filters
      if (filterState.budgetMin && Number(student.budget) < Number(filterState.budgetMin)) return false
      if (filterState.budgetMax && Number(student.budget) > Number(filterState.budgetMax)) return false
      if (filterState.scholarshipRequired && student.scholarship_required !== filterState.scholarshipRequired) return false

      // CRM Filters
      if (filterState.status && student.status !== filterState.status) return false
      if (filterState.counselor && student.assigned_counselor !== filterState.counselor) return false
      if (filterState.leadSource && student.lead_source !== filterState.leadSource) return false
      if (filterState.intake && student.intake !== filterState.intake) return false
      if (filterState.applicationYear && student.application_year !== filterState.applicationYear) return false

      return true
    })
  }, [students, globalSearch, filterState])

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips = []
    
    if (globalSearch) {
      chips.push({ key: 'globalSearch', label: `Search: ${globalSearch}` })
    }

    Object.entries(filterState).forEach(([key, val]) => {
      if (val) {
        let label = ''
        switch(key) {
          case 'searchName': label = `Name: ${val}`; break;
          case 'searchEmail': label = `Email: ${val}`; break;
          case 'searchPhone': label = `Phone: ${val}`; break;
          case 'searchStudentId': label = `ID: ${val}`; break;
          case 'country': label = `Home Country: ${val}`; break;
          case 'preferredCountry': label = `Pref. Country: ${val}`; break;
          case 'course': label = `Course: ${val}`; break;
          case 'degree': label = `Degree: ${val}`; break;
          case 'cgpaMin': label = `Min CGPA: ${val}`; break;
          case 'cgpaMax': label = `Max CGPA: ${val}`; break;
          case 'ieltsMin': label = `Min IELTS: ${val}`; break;
          case 'ieltsMax': label = `Max IELTS: ${val}`; break;
          case 'budgetMin': label = `Min Budget: ₹${(Number(val)/100000).toFixed(0)}L`; break;
          case 'budgetMax': label = `Max Budget: ₹${(Number(val)/100000).toFixed(0)}L`; break;
          case 'scholarshipRequired': label = `Scholarship: ${val}`; break;
          case 'status': label = `Status: ${val}`; break;
          case 'counselor': label = `Counselor: ${val}`; break;
          case 'leadSource': label = `Source: ${val}`; break;
          case 'intake': label = `Intake: ${val}`; break;
          case 'applicationYear': label = `Year: ${val}`; break;
        }
        chips.push({ key, label })
      }
    })
    return chips
  }, [globalSearch, filterState])

  const handleFilterChange = (key, val) => {
    setFilterState(prev => ({
      ...prev,
      [key]: val
    }))
  }

  const handleRemoveChip = (key) => {
    if (key === 'globalSearch') {
      setGlobalSearch('')
    } else {
      setFilterState(prev => ({
        ...prev,
        [key]: ''
      }))
    }
  }

  const handleClearFilters = () => {
    setGlobalSearch('')
    setFilterState({
      searchName: '',
      searchEmail: '',
      searchPhone: '',
      searchStudentId: '',
      country: '',
      preferredCountry: '',
      course: '',
      degree: '',
      cgpaMin: '',
      cgpaMax: '',
      ieltsMin: '',
      ieltsMax: '',
      budgetMin: '',
      budgetMax: '',
      scholarshipRequired: '',
      status: '',
      counselor: '',
      leadSource: '',
      intake: '',
      applicationYear: ''
    })
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    fontSize: '13px',
    backgroundColor: 'var(--bg-base)',
    color: 'var(--text-primary)',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '6px',
    letterSpacing: '0.5px'
  }

  const groupHeaderStyle = {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-subtle)',
    paddingBottom: '8px',
    marginBottom: '12px',
    gridColumn: '1 / -1',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
            Student Explorer
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Manage and filter all student records in real time
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: isFilterPanelOpen ? 'var(--accent-cyan-glow)' : 'var(--bg-base)',
              border: `1px solid ${isFilterPanelOpen ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
              borderRadius: '10px',
              color: isFilterPanelOpen ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={16} />
            Advanced Filters
            {activeChips.filter(c => c.key !== 'globalSearch').length > 0 && (
              <span style={{
                backgroundColor: 'var(--accent-cyan)',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {activeChips.filter(c => c.key !== 'globalSearch').length}
              </span>
            )}
          </button>

          <div className="card" style={{ padding: '10px 20px', minWidth: '130px', textAlign: 'center' }}>
            <strong style={{ fontSize: '16px' }}>{filteredStudents.length}</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: '5px' }}>
              of {students.length}
            </span>
          </div>
        </div>
      </div>

      {/* Global Search Bar (Always visible) */}
      <div className="card" style={{ padding: '16px', marginBottom: 0 }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              color: 'var(--text-muted)'
            }}
          />

          <input
            type="text"
            placeholder="Search anything (Name, Email, ID, Course, Counselor, etc.)..."
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              fontSize: 14,
              backgroundColor: 'var(--bg-base)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* CRM-Style Filter Panel */}
      {isFilterPanelOpen && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          
          {/* General Search Category */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={groupHeaderStyle}>General Search</div>
            
            <div>
              <label style={labelStyle}>Search Name</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={filterState.searchName}
                onChange={e => handleFilterChange('searchName', e.target.value)}
                style={inputStyle}
              />
            </div>
            
            <div>
              <label style={labelStyle}>Search Email</label>
              <input
                type="text"
                placeholder="Search by email..."
                value={filterState.searchEmail}
                onChange={e => handleFilterChange('searchEmail', e.target.value)}
                style={inputStyle}
              />
            </div>
            
            <div>
              <label style={labelStyle}>Search Phone</label>
              <input
                type="text"
                placeholder="Search by phone..."
                value={filterState.searchPhone}
                onChange={e => handleFilterChange('searchPhone', e.target.value)}
                style={inputStyle}
              />
            </div>
            
            <div>
              <label style={labelStyle}>Search Student ID</label>
              <input
                type="text"
                placeholder="Search by ID (e.g. ST1001)..."
                value={filterState.searchStudentId}
                onChange={e => handleFilterChange('searchStudentId', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Academic Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={groupHeaderStyle}>Academic Filters</div>

            <div>
              <label style={labelStyle}>Home Country</label>
              <select
                value={filterState.country}
                onChange={e => handleFilterChange('country', e.target.value)}
                style={inputStyle}
              >
                <option value="">All Countries</option>
                {filterOptions.countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Preferred Country</label>
              <select
                value={filterState.preferredCountry}
                onChange={e => handleFilterChange('preferredCountry', e.target.value)}
                style={inputStyle}
              >
                <option value="">All Preferred Countries</option>
                {filterOptions.preferredCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Course</label>
              <select
                value={filterState.course}
                onChange={e => handleFilterChange('course', e.target.value)}
                style={inputStyle}
              >
                <option value="">All Courses</option>
                {filterOptions.courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Degree</label>
              <select
                value={filterState.degree}
                onChange={e => handleFilterChange('degree', e.target.value)}
                style={inputStyle}
              >
                <option value="">All Degrees</option>
                {filterOptions.degrees.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>CGPA Range</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Min"
                  step="0.1"
                  min="0"
                  max="10"
                  value={filterState.cgpaMin}
                  onChange={e => handleFilterChange('cgpaMin', e.target.value)}
                  style={{ ...inputStyle, width: '50%' }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  step="0.1"
                  min="0"
                  max="10"
                  value={filterState.cgpaMax}
                  onChange={e => handleFilterChange('cgpaMax', e.target.value)}
                  style={{ ...inputStyle, width: '50%' }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>IELTS score</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Min"
                  step="0.5"
                  min="0"
                  max="9"
                  value={filterState.ieltsMin}
                  onChange={e => handleFilterChange('ieltsMin', e.target.value)}
                  style={{ ...inputStyle, width: '50%' }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  step="0.5"
                  min="0"
                  max="9"
                  value={filterState.ieltsMax}
                  onChange={e => handleFilterChange('ieltsMax', e.target.value)}
                  style={{ ...inputStyle, width: '50%' }}
                />
              </div>
            </div>
          </div>

          {/* Financial & CRM Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={groupHeaderStyle}>Financial & CRM Filters</div>

            <div>
              <label style={labelStyle}>Budget Range</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Min (e.g. 1000000)"
                  value={filterState.budgetMin}
                  onChange={e => handleFilterChange('budgetMin', e.target.value)}
                  style={{ ...inputStyle, width: '50%' }}
                />
                <input
                  type="number"
                  placeholder="Max (e.g. 3000000)"
                  value={filterState.budgetMax}
                  onChange={e => handleFilterChange('budgetMax', e.target.value)}
                  style={{ ...inputStyle, width: '50%' }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Scholarship Required</label>
              <select
                value={filterState.scholarshipRequired}
                onChange={e => handleFilterChange('scholarshipRequired', e.target.value)}
                style={inputStyle}
              >
                <option value="">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Application Status</label>
              <select
                value={filterState.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                style={inputStyle}
              >
                <option value="">All Statuses</option>
                {filterOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Counselor</label>
              <select
                value={filterState.counselor}
                onChange={e => handleFilterChange('counselor', e.target.value)}
                style={inputStyle}
              >
                <option value="">All Counselors</option>
                {filterOptions.counselors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Lead Source</label>
              <select
                value={filterState.leadSource}
                onChange={e => handleFilterChange('leadSource', e.target.value)}
                style={inputStyle}
              >
                <option value="">All Sources</option>
                {filterOptions.leadSources.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Intake</label>
              <select
                value={filterState.intake}
                onChange={e => handleFilterChange('intake', e.target.value)}
                style={inputStyle}
              >
                <option value="">All Intakes</option>
                {filterOptions.intakes.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Application Year</label>
              <select
                value={filterState.applicationYear}
                onChange={e => handleFilterChange('applicationYear', e.target.value)}
                style={inputStyle}
              >
                <option value="">All Years</option>
                {filterOptions.applicationYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

        </div>
      )}

      {/* Active Chips & Clear Filters */}
      {activeChips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Active Filters:</span>
          {activeChips.map(chip => (
            <div
              key={chip.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                backgroundColor: 'var(--bg-overlay)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '999px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
            >
              {chip.label}
              <button
                onClick={() => handleRemoveChip(chip.key)}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
          <button
            onClick={handleClearFilters}
            style={{
              padding: '4px 12px',
              backgroundColor: 'transparent',
              border: '1px dashed var(--accent-rose)',
              borderRadius: '999px',
              color: 'var(--accent-rose)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Students Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading students...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>ID</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Email</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Phone</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Home Country</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Pref. Country</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Course</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>IELTS</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>CGPA</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Lead Score</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Counselor</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.student_id} style={{ borderBottom: '1px solid var(--border-overlay)' }}>
                    <td style={{ padding: 12, fontSize: '13px', fontWeight: '500' }}>{student.student_id}</td>
                    <td style={{ padding: 12, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{student.name}</td>
                    <td style={{ padding: 12, fontSize: '13px', color: 'var(--text-muted)' }}>{student.email}</td>
                    <td style={{ padding: 12, fontSize: '13px', color: 'var(--text-muted)' }}>{student.phone}</td>
                    <td style={{ padding: 12, fontSize: '13px' }}>{student.country}</td>
                    <td style={{ padding: 12, fontSize: '13px' }}>{student.preferred_country}</td>
                    <td style={{ padding: 12, fontSize: '13px' }}>{student.preferred_course}</td>
                    <td style={{ padding: 12, fontSize: '13px', fontWeight: '600' }}>{student.ielts_score}</td>
                    <td style={{ padding: 12, fontSize: '13px', fontWeight: '600' }}>{student.cgpa}</td>
                    <td style={{ padding: 12 }}>
                      <span className="badge" style={{
                        backgroundColor: student.lead_score >= 80 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                        color: student.lead_score >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                      }}>
                        {student.lead_score}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span className="badge" style={{
                        backgroundColor: student.status === 'Converted' ? 'rgba(22, 163, 74, 0.1)' : student.status === 'Dropped' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                        color: student.status === 'Converted' ? 'var(--accent-emerald)' : student.status === 'Dropped' ? 'var(--accent-rose)' : 'var(--accent-blue)',
                      }}>
                        {student.status}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontSize: '13px' }}>{student.assigned_counselor}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredStudents.length && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '14px' }}>
                No students match the specified filter criteria. Try resetting the filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}