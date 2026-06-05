import React, { useEffect, useState } from 'react'
import {
  Users, TrendingUp, Zap, Target, UserCheck, UserX,
  Award, DollarSign, Globe2, BookOpen, Wifi,
  Calendar, Crown, Medal, ShieldCheck, Activity
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts'
import { analyticsAPI } from '../../services/api'
import { formatNumber } from '../../utils/formatters'

// ─── Typography exactly matching Executive Dashboard screenshot ───────────────
// Card label  → 11px, uppercase, monospace, letter-spacing, muted
// Big number  → 28-32px, display font, weight 800, tight tracking
// Sub caption → 12px, body font, normal weight, muted

const RISK_COLORS = ['#10b981', '#f59e0b', '#f43f5e']

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 8, padding: '9px 13px',
      fontSize: 12, fontFamily: 'var(--font-body)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
    }}>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '2px 0' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.fill, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {typeof p.value === 'number' && p.value > 999 ? formatNumber(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Card shell ───────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: '20px 22px',
      boxShadow: 'var(--shadow-card)',
      ...style
    }}>
      {children}
    </div>
  )
}

// ─── Section heading — matching dashboard's "BUSINESS OVERVIEW" style ─────────
function SectionLabel({ title, sub, accent = 'var(--accent-cyan)' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
        <div style={{ width: 3, height: 16, background: accent, borderRadius: 2, flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.10em',
          textTransform: 'uppercase'
        }}>
          {title}
        </span>
      </div>
      {sub && (
        <p style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          fontWeight: 400,
          paddingLeft: 12,
          margin: 0,
          lineHeight: 1.4
        }}>
          {sub}
        </p>
      )}
    </div>
  )
}

// ─── KPI card — matches Executive Dashboard cards exactly ─────────────────────
function KPICard({ label, value, sub, icon: Icon, iconColor = 'var(--accent-cyan)' }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hov ? 'var(--border-default)' : 'var(--border-subtle)'}`,
        borderRadius: 12,
        padding: '20px 20px',
        display: 'flex', flexDirection: 'column', gap: 0,
        boxShadow: hov ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all 0.18s ease',
        cursor: 'default',
        position: 'relative', overflow: 'hidden'
      }}
    >
      {/* label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          lineHeight: 1.3
        }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `${iconColor}18`,
            border: `1px solid ${iconColor}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon size={14} color={iconColor} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* big number */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 30,
        fontWeight: 800,
        color: 'var(--text-primary)',
        letterSpacing: '-0.025em',
        lineHeight: 1,
        marginBottom: 8
      }}>
        {value ?? '—'}
      </div>

      {/* caption */}
      {sub && (
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 400,
          color: 'var(--text-muted)',
          lineHeight: 1.4
        }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ─── Risk donut ───────────────────────────────────────────────────────────────
function RiskDonut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const meta = [
    { label: 'Low Risk',    color: '#10b981', bg: 'rgba(16,185,129,0.08)'  },
    { label: 'Medium Risk', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
    { label: 'High Risk',   color: '#f43f5e', bg: 'rgba(244,63,94,0.08)'   },
  ]
  return (
    <div>
      <SectionLabel title="Risk Distribution" sub="Student dropout risk breakdown" accent="var(--accent-rose)" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={68} innerRadius={40}
              dataKey="value" nameKey="name" paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={RISK_COLORS[i]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map((item, i) => {
            const m = meta[i]
            const pct = ((item.value / total) * 100).toFixed(1)
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: 8, background: m.bg
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: m.color }}>
                    {m.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 15,
                    fontWeight: 800, color: 'var(--text-primary)'
                  }}>
                    {formatNumber(item.value)}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: m.color,
                    background: 'rgba(255,255,255,0.06)', padding: '2px 7px',
                    borderRadius: 99, border: `1px solid ${m.color}30`
                  }}>
                    {pct}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Application Journey ──────────────────────────────────────────────────────
function ApplicationJourney({ stages }) {
  const max = Math.max(...stages.map(s => s.value))
  return (
    <div>
      <SectionLabel title="Application Journey" sub="Students at each pipeline stage" accent="var(--accent-cyan)" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stages.map((item, i) => {
          const pct = ((item.value / max) * 100).toFixed(0)
          const op = 1 - i * 0.09
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 110, fontSize: 11, fontFamily: 'var(--font-mono)',
                fontWeight: 500, color: 'var(--text-secondary)',
                flexShrink: 0, textAlign: 'right',
                letterSpacing: '0.04em', textTransform: 'uppercase'
              }}>
                {item.stage}
              </span>
              <div style={{
                flex: 1, height: 28, borderRadius: 6,
                background: 'var(--bg-elevated)', overflow: 'hidden'
              }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 6,
                  background: `rgba(0,212,255,${op})`,
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
                }} />
              </div>
              <span style={{
                width: 44, fontSize: 12, fontFamily: 'var(--font-mono)',
                fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right', flexShrink: 0
              }}>
                {formatNumber(item.value)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Demographics grid ────────────────────────────────────────────────────────
function StudentProfile({ d }) {
  const items = [
    { label: 'Average Age',        value: d.avg_age,              unit: 'years',  icon: Calendar,    color: 'var(--accent-blue)'    },
    { label: 'Female Students',    value: `${d.female_percent}`,  unit: '%',      icon: Users,       color: 'var(--accent-violet)'  },
    { label: 'Male Students',      value: `${d.male_percent}`,    unit: '%',      icon: Users,       color: 'var(--accent-cyan)'    },
    { label: 'Scholarship Demand', value: `${d.scholarship_percent}`, unit: '%', icon: Award,       color: 'var(--accent-amber)'   },
  ]
  return (
    <div>
      <SectionLabel title="Student Profile" sub="Cohort demographic breakdown" accent="var(--accent-violet)" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex', flexDirection: 'column', gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={12} color={item.color} strokeWidth={2} />
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.09em'
                }}>
                  {item.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 28,
                  fontWeight: 800, color: 'var(--text-primary)',
                  letterSpacing: '-0.025em', lineHeight: 1
                }}>
                  {item.value}
                </span>
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  fontWeight: 400, color: 'var(--text-muted)'
                }}>
                  {item.unit}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Counselor table ──────────────────────────────────────────────────────────
function CounselorTable({ data }) {
  return (
    <div>
      <SectionLabel title="Counselor Performance" sub="Ranked by conversion success rate" accent="var(--accent-emerald)" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '28px 1fr 72px 72px 88px',
          padding: '7px 12px', borderRadius: '8px 8px 0 0',
          background: 'var(--bg-elevated)', gap: 8
        }}>
          {['#', 'Counselor', 'Assigned', 'Converted', 'Rate'].map((h, i) => (
            <span key={i} style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
              color: 'var(--text-muted)', letterSpacing: '0.08em',
              textTransform: 'uppercase', textAlign: i > 1 ? 'right' : 'left'
            }}>
              {h}
            </span>
          ))}
        </div>

        {data.map((c, i) => {
          const isTop = i === 0
          const RankEl = i === 0
            ? <Crown size={13} color="var(--accent-amber)" strokeWidth={2} />
            : i === 1
            ? <Medal size={13} color="var(--text-muted)" strokeWidth={2} />
            : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</span>

          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 72px 72px 88px',
              padding: '11px 12px', gap: 8,
              background: isTop ? 'rgba(0,212,255,0.04)' : i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-subtle)',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {RankEl}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: isTop ? 'var(--accent-cyan)' : 'var(--bg-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                  color: isTop ? 'var(--bg-base)' : 'var(--text-secondary)', flexShrink: 0
                }}>
                  {c.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  fontWeight: isTop ? 700 : 400,
                  color: isTop ? 'var(--accent-cyan)' : 'var(--text-primary)'
                }}>
                  {c.name}
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: 'var(--text-secondary)', textAlign: 'right'
              }}>
                {formatNumber(c.students)}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                fontWeight: 600, color: 'var(--accent-emerald)', textAlign: 'right'
              }}>
                {formatNumber(c.converted)}
              </span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                  color: isTop ? 'var(--accent-cyan)' : 'var(--accent-emerald)',
                  background: isTop ? 'rgba(0,212,255,0.10)' : 'rgba(16,185,129,0.10)',
                  border: `1px solid ${isTop ? 'rgba(0,212,255,0.20)' : 'rgba(16,185,129,0.20)'}`,
                  padding: '3px 10px', borderRadius: 99
                }}>
                  {c.rate.toFixed(2)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Key Insights row ─────────────────────────────────────────────────────────
function KeyInsights({ d }) {
  const totalStudents = d.total_students || 5000
  const items = [
    { label: 'Top Country',              value: d.top_country || 'Canada',          icon: Globe2,     color: 'var(--accent-blue)'    },
    { label: 'Top Course',               value: d.top_course || 'Computer Science', icon: BookOpen,   color: 'var(--accent-violet)'  },
    { label: 'Best Lead Source',         value: d.top_lead_source || 'WhatsApp',    icon: Wifi,       color: 'var(--accent-emerald)' },
    { label: 'Enrollment Conversion',    value: `${d.enrollment_rate}%`,            icon: TrendingUp, color: 'var(--accent-amber)'   },
    { label: 'Low Risk Students',        value: formatNumber(d.low_risk_students || 3849), icon: ShieldCheck, color: 'var(--accent-emerald)' },
    { label: 'Avg Enroll Probability',   value: `${d.avg_enrollment_probability}%`, icon: Target,     color: 'var(--accent-cyan)'    },
  ]
  return (
    <div>
      <SectionLabel title="Key Business Insights" sub="Strategic indicators at a glance" accent="var(--accent-cyan)" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: '18px 20px',
              display: 'flex', flexDirection: 'column', gap: 10,
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `${item.color}18`,
                  border: `1px solid ${item.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={13} color={item.color} strokeWidth={2} />
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.09em'
                }}>
                  {item.label}
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 20,
                fontWeight: 800, color: 'var(--text-primary)',
                letterSpacing: '-0.02em', lineHeight: 1
              }}>
                {item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Shimmer({ h = 14, w = '100%', r = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite'
    }} />
  )
}

function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            background: 'var(--bg-surface)', borderRadius: 12, padding: '20px 22px',
            border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <Shimmer h={10} w="50%" />
            <Shimmer h={30} w="65%" />
            <Shimmer h={10} w="40%" />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Shimmer h={220} r={12} />
        <Shimmer h={220} r={12} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.getSummary()
      .then(d => setData(d))
      .catch(() => setData(MOCK_DATA))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <Shimmer h={11} w={180} r={4} />
        <div style={{ marginTop: 5 }}><Shimmer h={12} w={300} r={4} /></div>
      </div>
      <PageSkeleton />
    </div>
  )

  const d = data || MOCK_DATA
  const total = d.total_students || 5000

  const funnelStages = [
    { stage: 'Contacted',     value: d.contacted     || 0 },
    { stage: 'Counseling',    value: d.counseling    || 0 },
    { stage: 'Documentation', value: d.documentation || 0 },
    { stage: 'Application',   value: d.application   || 0 },
    { stage: 'Visa',          value: d.visa          || 0 },
    { stage: 'Enrolled',      value: d.enrolled      || 0 },
  ]

  return (
    <div className="animate-fade-in">

      {/* page header — matches navbar subtitle style */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
          <div style={{ width: 3, height: 16, background: 'var(--accent-cyan)', borderRadius: 2 }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase'
          }}>
            Analytics Hub
          </span>
        </div>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--text-muted)', paddingLeft: 12, margin: 0
        }}>
          Executive intelligence across {formatNumber(total)} student records
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Business Overview */}
        <section>
          <SectionLabel title="Business Overview" sub="Top-line numbers driving the business" accent="var(--accent-cyan)" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
            <KPICard label="Total Students"       value={formatNumber(d.total_students)}            sub="All records"                        icon={Users}      iconColor="var(--accent-cyan)"   />
            <KPICard label="Revenue Potential"    value={`₹${formatNumber(d.revenue_potential)}`}   sub="Estimated pipeline value"           icon={DollarSign} iconColor="var(--accent-emerald)"/>
            <KPICard label="High Intent Leads"    value={formatNumber(d.high_intent_leads)}          sub={`${((d.high_intent_leads/total)*100).toFixed(1)}% of total`} icon={Zap} iconColor="var(--accent-amber)" />
            <KPICard label="Enrollment Probability" value={`${d.avg_enrollment_probability}%`}      sub="Average across pipeline"            icon={TrendingUp} iconColor="var(--accent-violet)" />
          </div>
        </section>

        {/* Pipeline Health */}
        <section>
          <SectionLabel title="Pipeline Health" sub="Current status of the student pipeline" accent="var(--accent-emerald)" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
            <KPICard label="Active Students"     value={formatNumber(d.active_students)}    sub={`${((d.active_students/total)*100).toFixed(1)}% of total`} icon={Activity}   iconColor="var(--accent-emerald)" />
            <KPICard label="Converted Students"  value={formatNumber(d.converted_students)} sub={`${d.enrollment_rate}% conversion rate`}                   icon={UserCheck}  iconColor="var(--accent-cyan)"    />
            <KPICard label="Dropped Students"    value={formatNumber(d.dropped_students)}   sub={`${((d.dropped_students/total)*100).toFixed(1)}% dropout`} icon={UserX}      iconColor="var(--accent-rose)"    />
            <KPICard label="Scholarship Eligible" value={formatNumber(d.scholarship_eligible)} sub={`${d.scholarship_percent}% demand rate`}               icon={Award}      iconColor="var(--accent-violet)"  />
          </div>
        </section>

        {/* Risk + Journey */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card><RiskDonut data={d.risk_distribution || []} /></Card>
          <Card><ApplicationJourney stages={funnelStages} /></Card>
        </div>

        {/* Profile + Counselors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>
          <Card><StudentProfile d={d} /></Card>
          <Card><CounselorTable data={d.counselor_leaderboard || []} /></Card>
        </div>

        {/* Key Insights */}
        <section><KeyInsights d={d} /></section>

      </div>
    </div>
  )
}

const MOCK_DATA = {
  total_students: 5000, active_students: 1480, converted_students: 1072,
  dropped_students: 1241, avg_cgpa: '7.91', avg_ielts: '7.00',
  avg_lead_score: '88.7', enrollment_rate: '21.4', avg_enrollment_probability: '87.4',
  revenue_potential: 10832014823, high_intent_leads: 3849, scholarship_eligible: 1202,
  low_risk_students: 3849, medium_risk_students: 1072, high_risk_students: 79,
  avg_age: '23.1', female_percent: '50.1', male_percent: '49.9',
  scholarship_percent: '67.2', contacted: 562, counseling: 664,
  documentation: 630, application: 598, visa: 639, enrolled: 637,
  top_country: 'Canada', top_course: 'Computer Science', top_lead_source: 'WhatsApp',
  risk_distribution: [
    { name: 'Low', value: 3849 }, { name: 'Medium', value: 1072 }, { name: 'High', value: 79 }
  ],
  counselor_leaderboard: [
    { name: 'Priya Sharma', students: 999,  converted: 227, rate: 22.72 },
    { name: 'Amit Verma',   students: 982,  converted: 213, rate: 21.69 },
    { name: 'Sneha Jain',   students: 1018, converted: 219, rate: 21.51 },
    { name: 'Rahul Singh',  students: 967,  converted: 203, rate: 20.99 },
    { name: 'Rohit Gupta',  students: 1034, converted: 210, rate: 20.30 },
  ]
}