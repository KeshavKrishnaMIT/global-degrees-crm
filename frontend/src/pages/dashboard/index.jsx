import React, { useEffect, useState } from 'react'
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Globe2,
  BookOpen,
  Zap,
  Target,
  Star,
  Wifi,
  Award,
  Activity
} from 'lucide-react'
import KPICard from '../../components/KPICards/KPICard'
import { SkeletonKPI, SkeletonChart } from '../../components/UI/Skeleton'
import { analyticsAPI } from '../../services/api'
import { formatNumber, formatScore, formatPercent, CHART_COLORS } from '../../utils/formatters'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      {label && <p style={{ color: '#6b7280', marginBottom: 4, fontSize: 11 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: '#111827', margin: '2px 0' }}>
          <span style={{ color: '#6b7280' }}>{p.name}: </span>
          <span style={{ fontWeight: 600 }}>{formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

const MOCK_SOURCE_DATA = [
  { name: 'Instagram', value: 1240 },
  { name: 'Facebook', value: 980 },
  { name: 'Walk-in', value: 760 },
  { name: 'Referral', value: 620 },
  { name: 'Google Ads', value: 480 },
  { name: 'Website', value: 320 },
]

const MOCK_FUNNEL = [
  { name: 'Contacted', value: 5000 },
  { name: 'Counseling', value: 3800 },
  { name: 'Documentation', value: 2600 },
  { name: 'Application', value: 1700 },
  { name: 'Visa', value: 1100 },
  { name: 'Enrolled', value: 890 },
]

const MOCK_COUNTRY_DATA = [
  { name: 'Canada', value: 890 },
  { name: 'UK', value: 760 },
  { name: 'USA', value: 680 },
  { name: 'Australia', value: 540 },
  { name: 'Germany', value: 420 },
  { name: 'Others', value: 310 },
]

const MOCK_COURSE_DATA = [
  { name: 'MS Computer Science', value: 980 },
  { name: 'MBA', value: 760 },
  { name: 'MS Data Science', value: 620 },
  { name: 'BBA', value: 410 },
  { name: 'MS Engineering', value: 380 },
  { name: 'Others', value: 850 },
]

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.getSummary()
      .then(data => setSummary(data))
      .catch(err => {
        console.warn('API not ready, showing mock data:', err.message)
        setSummary(getMockSummary())
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const kpis = buildKPIs(summary)

  // Build funnel data from summary fields
  const funnelData = summary?.funnel_data || [
    { name: 'Contacted', value: summary?.contacted ?? MOCK_FUNNEL[0].value },
    { name: 'Counseling', value: summary?.counseling ?? MOCK_FUNNEL[1].value },
    { name: 'Documentation', value: summary?.documentation ?? MOCK_FUNNEL[2].value },
    { name: 'Application', value: summary?.application ?? MOCK_FUNNEL[3].value },
    { name: 'Visa', value: summary?.visa ?? MOCK_FUNNEL[4].value },
    { name: 'Enrolled', value: summary?.enrolled ?? MOCK_FUNNEL[5].value },
  ]

  const funnelMax = funnelData[0]?.value || 1

  const sourceData = summary?.source_distribution || MOCK_SOURCE_DATA
  const countryData = summary?.country_distribution || MOCK_COUNTRY_DATA
  const courseData = summary?.course_distribution || MOCK_COURSE_DATA

  return (
    <div className="animate-fade-in">
      {/* Section header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 3, height: 20, background: 'var(--accent-cyan)', borderRadius: 2 }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Business Overview
          </h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', paddingLeft: 13 }}>
          Real-time intelligence across {formatNumber(summary?.total_students || 5000)} student records
        </p>
      </div>

      {/* KPI Grid */}
      <div className="stagger-children" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        {kpis.map((kpi, i) => (
          <KPICard key={i} {...kpi} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Top Lead Sources */}
        <div className="card">
          <ChartHeader title="Top Lead Sources" subtitle="Students by acquisition channel" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={sourceData}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fill: '#374151', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="value" name="Students" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {sourceData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Application Funnel */}
        <div className="card">
          <ChartHeader title="Application Funnel" subtitle="Conversion through pipeline stages" />
          <div style={{ padding: '8px 0' }}>
            {funnelData.map((stage, i) => {
              const pct = Math.round((stage.value / funnelMax) * 100)
              const barColor = CHART_COLORS[i % CHART_COLORS.length]
              const prevValue = i > 0 ? funnelData[i - 1].value : null
              const dropPct = prevValue ? Math.round(((prevValue - stage.value) / prevValue) * 100) : null

              return (
                <div key={stage.name} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{stage.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {dropPct !== null && (
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>↓ {dropPct}%</span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', minWidth: 40, textAlign: 'right' }}>
                        {formatNumber(stage.value)}
                      </span>
                    </div>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: barColor,
                      borderRadius: 4,
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>

        {/* Top Performing Countries */}
        <div className="card">
          <ChartHeader title="Top Performing Countries" subtitle="Students by destination" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={countryData}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fill: '#374151', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="value" name="Students" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {countryData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Course Distribution */}
        <div className="card">
          <ChartHeader title="Course Distribution" subtitle="Students by program" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={courseData}
                cx="50%" cy="50%"
                outerRadius={75} innerRadius={42}
                dataKey="value" nameKey="name"
                paddingAngle={2}
              >
                {courseData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <ChartLegend data={courseData} compact />
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ChartHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

function ChartLegend({ data = [], compact = false }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 8,
      marginTop: 8
    }}>
      {data.slice(0, compact ? 4 : 6).map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          <div style={{ width: 7, height: 7, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
          {item.name}
        </div>
      ))}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <SkeletonKPI />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {Array.from({ length: 12 }).map((_, i) => <SkeletonKPI key={i} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <SkeletonChart height={260} />
        <SkeletonChart height={260} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <SkeletonChart height={260} />
        <SkeletonChart height={260} />
      </div>
    </div>
  )
}

function getMockSummary() {
  return {
    total_students: 5000,
    active_students: 2100,
    converted_students: 890,
    dropped_students: 420,
    avg_cgpa: 7.8,
    avg_ielts: 6.9,
    avg_budget: 28500,
    avg_lead_score: 62.4,
    top_country: 'Canada',
    top_course: 'MS Computer Science',
    top_lead_source: 'Instagram',
    enrollment_rate: 17.8,
    contacted: 5000,
    counseling: 3800,
    documentation: 2600,
    application: 1700,
    visa: 1100,
    enrolled: 890,
    source_distribution: MOCK_SOURCE_DATA,
    country_distribution: MOCK_COUNTRY_DATA,
    course_distribution: MOCK_COURSE_DATA,
  }
}

function buildKPIs(summary) {
  if (!summary) return []
  return [
    {
      title: 'Total Students',
      value: summary.total_students || 5000,
      icon: Users,
      iconColor: 'var(--accent-cyan)',
      subtitle: 'All records',
      trendLabel: 'MoM'
    },
    {
      title: 'Active Students',
      value: summary.active_students || 2100,
      icon: Activity,
      iconColor: 'var(--accent-emerald)',
      subtitle: 'In pipeline',
      trend: 4.2,
      trendLabel: 'vs last mo'
    },
    {
      title: 'Converted',
      value: summary.converted_students || 890,
      icon: UserCheck,
      iconColor: 'var(--accent-violet)',
      subtitle: 'Enrolled',
      trend: 8.1
    },
    {
      title: 'Dropped',
      value: summary.dropped_students || 420,
      icon: UserX,
      iconColor: 'var(--accent-rose)',
      subtitle: 'Churn',
      trend: -3.2
    },
    {
      title: 'Avg CGPA',
      value: summary.avg_cgpa || 7.8,
      icon: GraduationCap,
      iconColor: 'var(--accent-amber)',
      decimals: 2,
      suffix: '/10',
      subtitle: 'Academic score'
    },
    {
      title: 'Avg IELTS',
      value: summary.avg_ielts || 6.9,
      icon: BookOpen,
      iconColor: 'var(--accent-cyan)',
      decimals: 1,
      suffix: '/9',
      subtitle: 'English proficiency'
    },
    {
      title: 'Avg Budget',
      value: summary.avg_budget || 28500,
      icon: Target,
      iconColor: 'var(--accent-emerald)',
      prefix: '$',
      subtitle: 'Annual USD'
    },
    {
      title: 'Avg Lead Score',
      value: summary.avg_lead_score || 62.4,
      icon: Zap,
      iconColor: 'var(--accent-violet)',
      decimals: 1,
      suffix: '/100',
      subtitle: 'AI scored'
    },
    {
      title: 'Top Country',
      value: null,
      icon: Globe2,
      iconColor: 'var(--accent-blue)',
      subtitle: summary.top_country || 'Canada',
      animate: false
    },
    {
      title: 'Top Course',
      value: null,
      icon: Star,
      iconColor: 'var(--accent-amber)',
      subtitle: summary.top_course || 'MS Comp Sci',
      animate: false
    },
    {
      title: 'Top Lead Source',
      value: null,
      icon: Wifi,
      iconColor: 'var(--accent-rose)',
      subtitle: summary.top_lead_source || 'Instagram',
      animate: false
    },
    {
      title: 'Enrollment Rate',
      value: summary.enrollment_rate || 17.8,
      icon: Award,
      iconColor: 'var(--accent-cyan)',
      decimals: 1,
      suffix: '%',
      subtitle: 'Conversion ratio',
      trend: 2.1,
      highlight: true
    }
  ]
}