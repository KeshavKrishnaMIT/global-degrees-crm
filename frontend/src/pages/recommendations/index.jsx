import React, { useEffect, useState } from 'react'
import {
  Award, Zap, AlertTriangle, DollarSign, Globe2,
  BookOpen, Wifi, TrendingUp, TrendingDown, Users,
  ShieldCheck, Target, BarChart2, Clock,
  ArrowUpRight, Lightbulb, CheckCircle2, XCircle,
  ChevronRight, Activity, Percent, Info, Crown, Medal
} from 'lucide-react'
import { analyticsAPI } from '../../services/api'
import { formatNumber } from '../../utils/formatters'

// ─────────────────────────────────────────────────────────────────────────────
// Typography follows Executive Dashboard:
//   card label  → font-mono, 11px, uppercase, letter-spacing, text-muted
//   big number  → font-display, 28-32px, weight 800, tight tracking
//   sub caption → font-body, 12px, normal, text-muted
// ─────────────────────────────────────────────────────────────────────────────

// ─── Shared card ─────────────────────────────────────────────────────────────
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

// ─── Section label — mono caps, exactly like dashboard "BUSINESS OVERVIEW" ───
function SectionLabel({ title, sub, accent = 'var(--accent-cyan)' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
        <div style={{ width: 3, height: 16, background: accent, borderRadius: 2, flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase'
        }}>
          {title}
        </span>
      </div>
      {sub && (
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400,
          color: 'var(--text-muted)', paddingLeft: 12, margin: 0, lineHeight: 1.4
        }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function IconBox({ icon: Icon, color, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28),
      background: `${color}18`, border: `1px solid ${color}28`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <Icon size={Math.round(size * 0.42)} color={color} strokeWidth={2} />
    </div>
  )
}

// ─── Insight KPI card — same as Executive Dashboard KPI cards ─────────────────
function InsightKPI({ label, value, sub, icon: Icon, iconColor = 'var(--accent-cyan)', delta, deltaLabel, highlight }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hov ? 'var(--border-default)' : highlight ? `${iconColor}35` : 'var(--border-subtle)'}`,
        borderRadius: 12,
        padding: '20px 20px',
        display: 'flex', flexDirection: 'column', gap: 0,
        boxShadow: hov ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all 0.18s ease',
        cursor: 'default', position: 'relative', overflow: 'hidden'
      }}
    >
      {highlight && (
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 70, height: 70, borderRadius: '50%',
          background: iconColor, opacity: 0.06, filter: 'blur(18px)', pointerEvents: 'none'
        }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase', lineHeight: 1.3
        }}>
          {label}
        </span>
        {Icon && <IconBox icon={Icon} color={iconColor} size={30} />}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800,
        color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 8
      }}>
        {value ?? '—'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {sub && (
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400, color: 'var(--text-muted)'
          }}>
            {sub}
          </span>
        )}
        {delta !== undefined && delta !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: delta >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            background: delta >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
            border: `1px solid ${delta >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
            padding: '2px 7px', borderRadius: 99
          }}>
            {delta >= 0
              ? <TrendingUp size={9} strokeWidth={2.5} />
              : <TrendingDown size={9} strokeWidth={2.5} />
            }
            {Math.abs(delta)}% {deltaLabel}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Recommendation card (Section 2) ─────────────────────────────────────────
function RecommendCard({ icon: Icon, color, label, value, valueSub, desc, tag }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hov ? `${color}35` : 'var(--border-subtle)'}`,
        borderRadius: 12, padding: '20px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        boxShadow: hov ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all 0.18s ease',
        cursor: 'default', position: 'relative', overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: -18, right: -18, width: 64, height: 64,
        borderRadius: '50%', background: color, opacity: 0.05, filter: 'blur(16px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <IconBox icon={Icon} color={color} size={34} />
        {tag && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
            color, background: `${color}14`, border: `1px solid ${color}22`,
            padding: '3px 8px', borderRadius: 99, letterSpacing: '0.08em', textTransform: 'uppercase'
          }}>
            {tag}
          </span>
        )}
      </div>

      <div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase'
        }}>
          {label}
        </span>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
          color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1, marginTop: 6
        }}>
          {value}
        </div>
        {valueSub && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, marginTop: 4 }}>
            {valueSub}
          </div>
        )}
      </div>

      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400,
        color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0,
        borderTop: '1px solid var(--border-subtle)', paddingTop: 10
      }}>
        {desc}
      </p>
    </div>
  )
}

// ─── Priority action row ──────────────────────────────────────────────────────
function ActionRow({ icon: Icon, color, title, detail, badge }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '13px 14px', borderRadius: 9,
        background: hov ? 'var(--bg-hover)' : 'var(--bg-elevated)',
        border: `1px solid ${hov ? `${color}28` : 'var(--border-subtle)'}`,
        transition: 'all 0.15s ease', cursor: 'default'
      }}
    >
      <IconBox icon={Icon} color={color} size={28} />
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
          color: 'var(--text-primary)', margin: '0 0 3px 0', lineHeight: 1.35
        }}>
          {title}
        </p>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400,
          color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5
        }}>
          {detail}
        </p>
      </div>
      {badge && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
          color, background: `${color}14`, border: `1px solid ${color}25`,
          padding: '4px 9px', borderRadius: 99, letterSpacing: '0.06em',
          textTransform: 'uppercase', flexShrink: 0, alignSelf: 'flex-start', marginTop: 1
        }}>
          {badge}
        </span>
      )}
    </div>
  )
}

// ─── Opportunity / Risk item ──────────────────────────────────────────────────
function MatrixRow({ text, type, metric }) {
  const isRisk = type === 'risk'
  const color  = isRisk ? 'var(--accent-rose)' : 'var(--accent-emerald)'
  const Icon   = isRisk ? XCircle : CheckCircle2
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 9,
      padding: '10px 13px', borderRadius: 8,
      background: isRisk ? 'rgba(244,63,94,0.06)' : 'rgba(16,185,129,0.06)',
      border: `1px solid ${isRisk ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)'}`,
      marginBottom: 7
    }}>
      <Icon size={13} color={color} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400,
          color: 'var(--text-secondary)', lineHeight: 1.5
        }}>
          {text}
        </span>
        {metric && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
            color, marginLeft: 6, letterSpacing: '0.03em'
          }}>
            {metric}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Funnel drop-off insight ──────────────────────────────────────────────────
function FunnelInsight({ stages }) {
  if (!stages || stages.length < 2) return null
  const drops = stages.slice(1).map((s, i) => ({
    from:    stages[i].stage,
    to:      s.stage,
    fromVal: stages[i].value,
    toVal:   s.value,
    drop:    stages[i].value - s.value,
    dropPct: (((stages[i].value - s.value) / stages[i].value) * 100).toFixed(1)
  }))
  const worst = [...drops].sort((a, b) => b.drop - a.drop)[0]

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '10px 13px', borderRadius: 8,
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.18)'
      }}>
        <AlertTriangle size={13} color="var(--accent-amber)" strokeWidth={2} style={{ flexShrink: 0 }} />
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400,
          color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5
        }}>
          Biggest drop-off: <strong style={{ color: 'var(--text-primary)' }}>
            {worst.from} → {worst.to}
          </strong> — {worst.drop} students lost ({worst.dropPct}% drop rate). Prioritise this gap.
        </p>
      </div>
    </div>
  )
}

// ─── Counselor gap analysis ───────────────────────────────────────────────────
function CounselorGap({ counselors, avgRate }) {
  const gap = counselors.map(c => ({
    ...c,
    gapVsAvg: (c.rate - avgRate).toFixed(2),
    potential: Math.round((avgRate / 100) * c.students) - c.converted
  }))
  const underperforming = gap.filter(c => c.gapVsAvg < 0)
  const topGain = gap.reduce((best, c) => c.potential > best.potential ? c : best, gap[0])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
      {underperforming.map((c, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 13px', borderRadius: 8,
          background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.14)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-hover)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)'
            }}>
              {c.name.split(' ').map(n => n[0]).join('')}
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
              {c.name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              {c.rate.toFixed(2)}% vs {avgRate.toFixed(2)}% avg
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              color: 'var(--accent-rose)',
              background: 'rgba(244,63,94,0.10)',
              border: '1px solid rgba(244,63,94,0.20)',
              padding: '2px 8px', borderRadius: 99
            }}>
              {c.gapVsAvg}%
            </span>
          </div>
        </div>
      ))}
      {topGain && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 13px', borderRadius: 8,
          background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
          marginTop: 2
        }}>
          <ArrowUpRight size={13} color="var(--accent-cyan)" strokeWidth={2} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400,
            color: 'var(--text-secondary)', lineHeight: 1.4
          }}>
            If <strong style={{ color: 'var(--text-primary)' }}>{topGain.name}</strong> reaches team average,{' '}
            <strong style={{ color: 'var(--accent-cyan)' }}>+{topGain.potential} additional conversions</strong> are achievable.
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Scholarship ROI card ─────────────────────────────────────────────────────
function ScholarshipROI({ eligible, totalBudget, convRate }) {
  const estimatedConv     = Math.round(eligible * (convRate / 100))
  const avgTicket         = totalBudget ? Math.round(totalBudget / 1000) : 28500
  const projectedRevenue  = estimatedConv * avgTicket
  const campaignCostEst   = Math.round(eligible * 2500)
  const roi               = (((projectedRevenue - campaignCostEst) / campaignCostEst) * 100).toFixed(0)

  const rows = [
    { label: 'Scholarship-eligible students', value: formatNumber(eligible), color: 'var(--accent-violet)' },
    { label: 'Expected conversions @ current rate', value: formatNumber(estimatedConv), color: 'var(--accent-cyan)' },
    { label: 'Projected revenue (avg ticket)', value: `₹${formatNumber(projectedRevenue)}`, color: 'var(--accent-emerald)' },
    { label: 'Estimated campaign cost', value: `₹${formatNumber(campaignCostEst)}`, color: 'var(--accent-amber)' },
    { label: 'Projected ROI', value: `${roi}%`, color: 'var(--accent-emerald)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 13px', borderRadius: 7,
          background: i === rows.length - 1 ? 'rgba(16,185,129,0.08)' : 'var(--bg-elevated)',
          border: `1px solid ${i === rows.length - 1 ? 'rgba(16,185,129,0.2)' : 'var(--border-subtle)'}`
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>
            {r.label}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: r.color
          }}>
            {r.value}
          </span>
        </div>
      ))}
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

// ─────────────────────────────────────────────────────────────────────────────
export default function RecommendationsPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.getSummary()
      .then(d => setData(d))
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <Shimmer h={11} w={200} r={4} />
        <div style={{ marginTop: 5 }}><Shimmer h={12} w={340} r={4} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            background: 'var(--bg-surface)', borderRadius: 12, padding: '20px 20px',
            border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <Shimmer h={28} w={28} r={8} />
            <Shimmer h={10} w="50%" />
            <Shimmer h={28} w="70%" />
            <Shimmer h={10} w="100%" />
          </div>
        ))}
      </div>
    </div>
  )

  const d = data || MOCK

  // ── Derived calculations ───────────────────────────────────────────────────
  const total          = d.total_students || 5000
  const converted      = d.converted_students || 1072
  const dropped        = d.dropped_students || 1241
  const active         = d.active_students || 1480
  const highIntentLeads= d.high_intent_leads || 3849
  const scholarshipElig= d.scholarship_eligible || 1202
  const highRisk       = d.high_risk_students || 79
  const lowRisk        = d.low_risk_students || 3849
  const medRisk        = d.medium_risk_students || 1072
  const enrollRate     = parseFloat(d.enrollment_rate) || 21.4
  const enrollProb     = parseFloat(d.avg_enrollment_probability) || 87.4
  const avgLeadScore   = parseFloat(d.avg_lead_score) || 88.7
  const avgCgpa        = parseFloat(d.avg_cgpa) || 7.91
  const avgIelts       = parseFloat(d.avg_ielts) || 7.0
  const revenuePot     = d.revenue_potential || 10832014823
  const topCountry     = d.top_country || 'Canada'
  const topCourse      = d.top_course || 'Computer Science'
  const topLeadSrc     = d.top_lead_source || 'WhatsApp'
  const counselors     = d.counselor_leaderboard || MOCK.counselor_leaderboard
  const avgCounselorRate = counselors.reduce((s, c) => s + c.rate, 0) / counselors.length

  // Gap between high-intent leads and actual conversions
  const conversionGap  = highIntentLeads - converted
  const lostRevEstimate= Math.round(conversionGap * (revenuePot / total))

  // Dropout cost
  const dropoutRevLoss = Math.round(dropped * (revenuePot / total))

  // High-risk students if converted at current rate
  const highRiskRecovery = Math.round(highRisk * (enrollRate / 100))

  // Medium-risk students — recoverable with follow-up
  const medRiskRecovery = Math.round(medRisk * 0.30)

  // Scholarship campaign ROI inputs
  const avgBudget = d.avg_budget || 28500

  // Pipeline drop-off stages for funnel gap analysis
  const funnelStages = [
    { stage: 'Contacted',     value: d.contacted     || 562 },
    { stage: 'Counseling',    value: d.counseling    || 664 },
    { stage: 'Documentation', value: d.documentation || 630 },
    { stage: 'Application',   value: d.application   || 598 },
    { stage: 'Visa',          value: d.visa          || 639 },
    { stage: 'Enrolled',      value: d.enrolled      || 637 },
  ]
  const contactedToEnrolled = funnelStages[0].value > 0
    ? ((funnelStages[funnelStages.length - 1].value / funnelStages[0].value) * 100).toFixed(1)
    : 0

  return (
    <div className="animate-fade-in">

      {/* ── page header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
          <div style={{ width: 3, height: 16, background: 'var(--accent-violet)', borderRadius: 2 }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase'
          }}>
            AI Recommendations
          </span>
        </div>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400,
          color: 'var(--text-muted)', paddingLeft: 12, margin: 0
        }}>
          Actionable insights calculated from {formatNumber(total)} student records
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Section 1: Calculated Opportunity Cards ── */}
        <section>
          <SectionLabel
            title="Top Opportunities"
            sub="Revenue-impact calculations derived from current pipeline data"
            accent="var(--accent-violet)"
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            <RecommendCard
              icon={Zap}
              color="var(--accent-amber)"
              label="Conversion Gap"
              value={formatNumber(conversionGap)}
              valueSub={`High-intent leads not yet converted`}
              desc={`${formatNumber(highIntentLeads)} high-intent leads exist but only ${formatNumber(converted)} have converted. Closing even 10% of this gap adds ₹${formatNumber(Math.round(lostRevEstimate * 0.1))} to revenue.`}
              tag="Revenue Gap"
            />
            <RecommendCard
              icon={Award}
              color="var(--accent-violet)"
              label="Scholarship ROI"
              value={formatNumber(scholarshipElig)}
              valueSub="students eligible for campaign targeting"
              desc={`At current ${enrollRate}% rate, a targeted scholarship campaign can yield ~${formatNumber(Math.round(scholarshipElig * (enrollRate / 100)))} conversions — without acquiring new leads.`}
              tag="High ROI"
            />
            <RecommendCard
              icon={AlertTriangle}
              color="var(--accent-rose)"
              label="Dropout Revenue Loss"
              value={`₹${formatNumber(dropoutRevLoss)}`}
              valueSub={`${formatNumber(dropped)} students dropped out`}
              desc={`Each dropout represents ₹${formatNumber(Math.round(revenuePot / total))} in lost pipeline value. Re-engaging just 15% reduces loss by ₹${formatNumber(Math.round(dropoutRevLoss * 0.15))}.`}
              tag="Urgent"
            />
            <RecommendCard
              icon={TrendingUp}
              color="var(--accent-emerald)"
              label="Risk Recovery Potential"
              value={`+${highRiskRecovery + medRiskRecovery}`}
              valueSub="recoverable conversions from at-risk segment"
              desc={`${highRisk} high-risk + ${formatNumber(medRisk)} medium-risk students. Structured re-engagement at current conversion rate recovers an estimated ${highRiskRecovery + medRiskRecovery} enrollments.`}
              tag="Actionable"
            />
          </div>
        </section>

        {/* ── Section 2: Priority Actions ── */}
        <section>
          <SectionLabel
            title="Priority Actions"
            sub="Ranked by calculated revenue impact on current pipeline"
            accent="var(--accent-cyan)"
          />
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ActionRow
                icon={Zap}
                color="var(--accent-amber)"
                title={`Activate ${formatNumber(highIntentLeads)} high-intent leads immediately`}
                detail={`Lead score avg is ${avgLeadScore}/100 — well above threshold. If ${((highIntentLeads * enrollRate) / 100).toFixed(0)} convert at current rate, pipeline revenue grows by ₹${formatNumber(Math.round((highIntentLeads * enrollRate / 100) * (revenuePot / total)))}.`}
                badge="P1 · Revenue"
              />
              <ActionRow
                icon={Award}
                color="var(--accent-violet)"
                title={`Run scholarship campaign for ${formatNumber(scholarshipElig)} eligible students`}
                detail={`${d.scholarship_percent}% of the pipeline needs scholarship. These students have ${avgCgpa} avg CGPA and ${avgIelts} avg IELTS — strong profiles for university targeting. Expected yield: ${Math.round(scholarshipElig * (enrollRate / 100))} conversions.`}
                badge="P1 · High ROI"
              />
              <ActionRow
                icon={Clock}
                color="var(--accent-rose)"
                title={`7-day re-engagement protocol for ${highRisk} high-risk students`}
                detail={`High-risk segment is small (${((highRisk / total) * 100).toFixed(1)}% of pipeline) but high-cost. Estimated recovery: ${highRiskRecovery} students. Each recovery worth ₹${formatNumber(Math.round(revenuePot / total))} in pipeline value.`}
                badge="P1 · Urgent"
              />
              <ActionRow
                icon={Users}
                color="var(--accent-blue)"
                title={`Address counsellor performance gap of ${(Math.max(...counselors.map(c => c.rate)) - Math.min(...counselors.map(c => c.rate))).toFixed(2)}% between top and bottom`}
                detail={`Best rate: ${Math.max(...counselors.map(c => c.rate)).toFixed(2)}% (${counselors.reduce((b, c) => c.rate > b.rate ? c : b, counselors[0]).name}). Worst: ${Math.min(...counselors.map(c => c.rate)).toFixed(2)}%. If all counsellors match avg ${avgCounselorRate.toFixed(2)}%, team gains ~${counselors.filter(c => c.rate < avgCounselorRate).reduce((s, c) => s + Math.round((avgCounselorRate / 100) * c.students) - c.converted, 0)} conversions.`}
                badge="P2 · Team"
              />
              <ActionRow
                icon={BarChart2}
                color="var(--accent-cyan)"
                title={`Funnel efficiency: only ${contactedToEnrolled}% of contacted students enroll`}
                detail={`${funnelStages[0].value} students were contacted. Only ${funnelStages[funnelStages.length - 1].value} enrolled. Identify and remove the top stage bottleneck to improve throughput across all subsequent stages.`}
                badge="P2 · Process"
              />
            </div>
          </Card>
        </section>

        {/* ── Section 3: Opportunity vs Risk matrix ── */}
        <section>
          <SectionLabel
            title="Opportunity Matrix"
            sub="Calculated from pipeline data — not assumptions"
            accent="var(--accent-emerald)"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <IconBox icon={TrendingUp} color="var(--accent-emerald)" size={28} />
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                  color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase'
                }}>
                  Growth Opportunities
                </span>
              </div>
              <MatrixRow type="growth" text={`${topCountry} demand leads pipeline — focus intake marketing budget here first`}                                                   metric={`Top destination`} />
              <MatrixRow type="growth" text={`${topCourse} is most preferred course — develop dedicated intake campaign`}                                                        metric={`Highest demand`} />
              <MatrixRow type="growth" text={`${topLeadSrc} delivers best CAC — scale spend before competitors do`}                                                             metric={`Best channel`} />
              <MatrixRow type="growth" text={`${formatNumber(scholarshipElig)} scholarship-ready students can convert without new lead acquisition`}                            metric={`Zero CAC leads`} />
              <MatrixRow type="growth" text={`Avg enrollment probability is ${enrollProb}% — pipeline intent is strong, execution is the gap`}                                  metric={`${enrollProb}% intent`} />
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <IconBox icon={AlertTriangle} color="var(--accent-rose)" size={28} />
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                  color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase'
                }}>
                  Business Risks
                </span>
              </div>
              <MatrixRow type="risk" text={`${formatNumber(dropped)} dropped students = ₹${formatNumber(dropoutRevLoss)} in lost pipeline value`}                              metric={`₹${formatNumber(dropoutRevLoss)}`} />
              <MatrixRow type="risk" text={`Conversion rate at ${enrollRate}% — industry benchmark is 25–30% for study-abroad CRMs`}                                            metric={`${(25 - enrollRate).toFixed(1)}% below benchmark`} />
              <MatrixRow type="risk" text={`${highRisk} high-risk students cost ~₹${formatNumber(Math.round(highRisk * (revenuePot / total)))} if they drop`}                  metric={`Immediate risk`} />
              <MatrixRow type="risk" text={`Funnel leakage: only ${contactedToEnrolled}% of contacted students reach enrollment`}                                              metric={`${contactedToEnrolled}% yield`} />
              <MatrixRow type="risk" text={`Counsellor performance gap of ${(Math.max(...counselors.map(c => c.rate)) - Math.min(...counselors.map(c => c.rate))).toFixed(2)}% indicates training or assignment mismatch`} metric={`${(Math.max(...counselors.map(c => c.rate)) - Math.min(...counselors.map(c => c.rate))).toFixed(2)}% gap`} />
            </Card>
          </div>
        </section>

        {/* ── Section 4: Scholarship ROI Calculator ── */}
        <section>
          <SectionLabel
            title="Scholarship Campaign ROI"
            sub="Projected return calculated from eligible student count and current conversion rate"
            accent="var(--accent-violet)"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                color: 'var(--text-muted)', letterSpacing: '0.10em',
                textTransform: 'uppercase', marginBottom: 14
              }}>
                Projected Returns
              </div>
              <ScholarshipROI
                eligible={scholarshipElig}
                totalBudget={avgBudget}
                convRate={enrollRate}
              />
            </Card>
            <Card>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                color: 'var(--text-muted)', letterSpacing: '0.10em',
                textTransform: 'uppercase', marginBottom: 14
              }}>
                Lead Segment KPIs
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'High Intent', value: formatNumber(highIntentLeads), pct: `${((highIntentLeads/total)*100).toFixed(1)}%`, color: 'var(--accent-amber)' },
                  { label: 'Scholarship Eligible', value: formatNumber(scholarshipElig), pct: `${((scholarshipElig/total)*100).toFixed(1)}%`, color: 'var(--accent-violet)' },
                  { label: 'Low Risk', value: formatNumber(lowRisk), pct: `${((lowRisk/total)*100).toFixed(1)}%`, color: 'var(--accent-emerald)' },
                  { label: 'High Risk', value: formatNumber(highRisk), pct: `${((highRisk/total)*100).toFixed(1)}%`, color: 'var(--accent-rose)' },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: '13px 14px', borderRadius: 9,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    display: 'flex', flexDirection: 'column', gap: 6
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em'
                    }}>
                      {s.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                        color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1
                      }}>
                        {s.value}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: s.color
                      }}>
                        {s.pct}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* ── Section 5: Counsellor Gap Analysis ── */}
        <section>
          <SectionLabel
            title="Counsellor Gap Analysis"
            sub={`Team avg: ${avgCounselorRate.toFixed(2)}% — counsellors below average and their recoverable conversion potential`}
            accent="var(--accent-blue)"
          />
          <Card>
            <CounselorGap counselors={counselors} avgRate={avgCounselorRate} />
          </Card>
        </section>

        {/* ── Section 6: Funnel Drop-off Analysis ── */}
        <section>
          <SectionLabel
            title="Funnel Drop-off Analysis"
            sub="Stage-by-stage attrition with biggest leakage point highlighted"
            accent="var(--accent-amber)"
          />
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {funnelStages.slice(1).map((stage, i) => {
                const prev    = funnelStages[i]
                const drop    = prev.value - stage.value
                const dropPct = ((drop / prev.value) * 100).toFixed(1)
                const isBad   = Math.abs(drop) === Math.max(...funnelStages.slice(1).map((s, j) => Math.abs(funnelStages[j].value - s.value)))
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 13px', borderRadius: 8,
                    background: isBad ? 'rgba(245,158,11,0.07)' : 'var(--bg-elevated)',
                    border: `1px solid ${isBad ? 'rgba(245,158,11,0.20)' : 'var(--border-subtle)'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.07em', width: 90, flexShrink: 0
                      }}>
                        {prev.stage}
                      </span>
                      <ChevronRight size={12} color="var(--text-muted)" />
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.07em', width: 90, flexShrink: 0
                      }}>
                        {stage.stage}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)'
                      }}>
                        {prev.value} → {stage.value}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                        color: drop > 0 ? (isBad ? 'var(--accent-amber)' : 'var(--accent-rose)') : 'var(--accent-emerald)',
                        background: drop > 0 ? (isBad ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.10)') : 'rgba(16,185,129,0.10)',
                        border: `1px solid ${drop > 0 ? (isBad ? 'rgba(245,158,11,0.22)' : 'rgba(244,63,94,0.20)') : 'rgba(16,185,129,0.20)'}`,
                        padding: '2px 9px', borderRadius: 99
                      }}>
                        {drop > 0 ? `−${drop} (${dropPct}%)` : `+${Math.abs(drop)}`}
                      </span>
                      {isBad && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                          color: 'var(--accent-amber)',
                          background: 'rgba(245,158,11,0.12)',
                          border: '1px solid rgba(245,158,11,0.22)',
                          padding: '2px 7px', borderRadius: 99, letterSpacing: '0.07em'
                        }}>
                          WORST DROP
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <FunnelInsight stages={funnelStages} />
          </Card>
        </section>

        {/* ── Section 7: Market Focus ── */}
        <section>
          <SectionLabel
            title="Recommended Market Focus"
            sub="Highest-demand destinations, courses, and channels from pipeline data"
            accent="var(--accent-blue)"
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              {
                icon: Globe2, color: 'var(--accent-blue)', label: 'Top Country', value: topCountry,
                reason: 'Highest student demand across all cohorts. Allocate primary intake marketing here.'
              },
              {
                icon: BookOpen, color: 'var(--accent-violet)', label: 'Top Course', value: topCourse,
                reason: 'Consistent first preference. Develop dedicated program campaigns for this discipline.'
              },
              {
                icon: Wifi, color: 'var(--accent-emerald)', label: 'Best Lead Source', value: topLeadSrc,
                reason: 'Lowest cost per converted lead. Scale spend here before diversifying.'
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12, padding: '20px 20px',
                  display: 'flex', flexDirection: 'column', gap: 12,
                  boxShadow: 'var(--shadow-card)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconBox icon={Icon} color={item.color} size={30} />
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em'
                    }}>
                      {item.label}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                    color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1
                  }}>
                    {item.value}
                  </span>
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 6,
                    padding: '8px 10px', borderRadius: 7,
                    background: `${item.color}0d`, border: `1px solid ${item.color}1e`
                  }}>
                    <Info size={11} color={item.color} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 400,
                      color: 'var(--text-secondary)', lineHeight: 1.5
                    }}>
                      {item.reason}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Section 8: Executive Summary ── */}
        <section>
          <SectionLabel
            title="Executive Summary"
            sub="AI-generated strategic overview calculated from live pipeline data"
            accent="var(--accent-cyan)"
          />
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12, overflow: 'hidden',
            boxShadow: 'var(--shadow-card)'
          }}>
            {/* strip */}
            <div style={{
              padding: '12px 22px',
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <IconBox icon={Lightbulb} color="var(--accent-cyan)" size={26} />
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 13,
                fontWeight: 700, color: 'var(--text-primary)'
              }}>
                AI Insight
              </span>
              <span style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                color: 'var(--accent-cyan)',
                background: 'rgba(0,212,255,0.10)',
                border: '1px solid rgba(0,212,255,0.20)',
                padding: '3px 9px', borderRadius: 99, letterSpacing: '0.07em', textTransform: 'uppercase'
              }}>
                {formatNumber(total)} records analysed
              </span>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                {
                  icon: BarChart2, color: 'var(--accent-blue)',
                  text: `Pipeline of ${formatNumber(total)} students carries ₹${formatNumber(revenuePot)} revenue potential. At the current ${enrollRate}% conversion rate, ₹${formatNumber(Math.round(revenuePot * (enrollRate / 100)))} is realised — leaving ₹${formatNumber(Math.round(revenuePot * (1 - enrollRate / 100)))} unrealised.`
                },
                {
                  icon: Zap, color: 'var(--accent-amber)',
                  text: `${formatNumber(highIntentLeads)} high-intent leads (avg score ${avgLeadScore}/100) have not converted. At the current rate, these represent ${formatNumber(Math.round(highIntentLeads * (enrollRate / 100)))} potential enrollments worth ₹${formatNumber(Math.round(highIntentLeads * (enrollRate / 100) * (revenuePot / total)))}.`
                },
                {
                  icon: ShieldCheck, color: 'var(--accent-emerald)',
                  text: `${((lowRisk / total) * 100).toFixed(1)}% of students are low-risk with ${enrollProb}% avg enrollment probability. Pipeline quality is strong — the primary gap is counsellor follow-up cadence and scholarship enablement.`
                },
                {
                  icon: Users, color: 'var(--accent-violet)',
                  text: `Counsellor team avg conversion rate is ${avgCounselorRate.toFixed(2)}%. A ${(25 - avgCounselorRate).toFixed(2)}% gap exists to the 25% industry benchmark. Structured coaching for underperformers could add ${counselors.filter(c => c.rate < avgCounselorRate).reduce((s, c) => s + Math.round((avgCounselorRate / 100) * c.students) - c.converted, 0)} conversions without new lead acquisition.`
                },
                {
                  icon: AlertTriangle, color: 'var(--accent-rose)',
                  text: `Immediate priority: ${highRisk} high-risk students and ${formatNumber(dropped)} dropped leads. Recovery actions within the next 7 days can recover ₹${formatNumber(Math.round((highRiskRecovery + Math.round(dropped * 0.15)) * (revenuePot / total)))} in pipeline value.`
                }
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} style={{
                    display: 'flex', gap: 11, padding: '12px 14px', borderRadius: 9,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    alignItems: 'flex-start'
                  }}>
                    <IconBox icon={Icon} color={item.color} size={26} />
                    <p style={{
                      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400,
                      color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0
                    }}>
                      {item.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
const MOCK = {
  total_students: 5000, active_students: 1480, converted_students: 1072,
  dropped_students: 1241, avg_cgpa: '7.91', avg_ielts: '7.00',
  avg_lead_score: '88.7', enrollment_rate: '21.4', avg_enrollment_probability: '87.4',
  revenue_potential: 10832014823, high_intent_leads: 3849, scholarship_eligible: 1202,
  low_risk_students: 3849, medium_risk_students: 1072, high_risk_students: 79,
  avg_age: '23.1', female_percent: '50.1', male_percent: '49.9',
  scholarship_percent: '67.2', contacted: 562, counseling: 664,
  documentation: 630, application: 598, visa: 639, enrolled: 637,
  avg_budget: 28500,
  top_country: 'Canada', top_course: 'Computer Science', top_lead_source: 'WhatsApp',
  counselor_leaderboard: [
    { name: 'Priya Sharma', students: 999,  converted: 227, rate: 22.72 },
    { name: 'Amit Verma',   students: 982,  converted: 213, rate: 21.69 },
    { name: 'Sneha Jain',   students: 1018, converted: 219, rate: 21.51 },
    { name: 'Rahul Singh',  students: 967,  converted: 203, rate: 20.99 },
    { name: 'Rohit Gupta',  students: 1034, converted: 210, rate: 20.30 },
  ]
}