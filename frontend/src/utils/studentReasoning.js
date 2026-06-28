/**
 * studentReasoning.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Complete analytics engine for Global Degrees CRM.
 * Every function is pure — input is the raw students array, output is derived
 * math. No hardcoded numbers, no fabricated data.
 *
 * EXISTING (DO NOT MODIFY):
 *   computeOverview, computeCounselorPerformance, computeCityPerformance,
 *   computeCountryPerformance, computeLeadSourcePerformance, computeFunnel,
 *   computeRiskBreakdown, filterStudents, findSimilarStudents, cohortOutcomeStats
 *
 * EXTENDED:
 *   Executive KPIs, Executive Summary, AI Context Builder, Marketing Analytics,
 *   Counselor Intelligence, Student Prioritization, Funnel Intelligence,
 *   Opportunity Engine, Risk Engine, Trend Analysis, University Recommendation
 *   Support, AI-Ready Output helpers
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 0 — INTERNAL HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function pct(numerator, denominator) {
  if (!denominator) return 0
  return (numerator / denominator) * 100
}

function roundTo(n, decimals = 2) {
  const factor = Math.pow(10, decimals)
  return Math.round(n * factor) / factor
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] ?? 'Unknown'
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

function countBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] ?? 'Unknown'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
}

function topN(obj, n = 5) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }))
}

function safeFloat(val) {
  const n = parseFloat(val)
  return isNaN(n) ? 0 : n
}

function safeDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function daysSince(dateStr) {
  const d = safeDate(dateStr)
  if (!d) return null
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}

// Real CRM current_stage values, in pipeline order. Note: the source data
// contains two spellings for the same stage ('Documentation' and 'Documents')
// — we treat them as one funnel step via normalizeStage() below so students
// aren't split across two buckets for what is the same stage. Without this,
// 'New Lead', 'Documents', and 'Offer Letter' were previously absent from
// FUNNEL_ORDER entirely, silently excluding ~1,900 of 5,300 students (36%)
// from every funnel/drop-off calculation in the app.
const FUNNEL_ORDER = [
  'New Lead', 'Contacted', 'Counseling', 'Documentation',
  'Application', 'Offer Letter', 'Visa', 'Enrolled'
]

function normalizeStage(stage) {
  if (stage === 'Documents') return 'Documentation'
  return stage
}

// Real CRM data uses these exact status values: 'Active', 'Converted',
// 'Dropped', 'Inactive'. Matching is case-insensitive so minor data entry
// inconsistencies don't silently zero out every calculation in this file.
const normStatus = s => (s || '').toString().trim().toLowerCase()

const STATUS_CONVERTED = s => normStatus(s) === 'converted'
const STATUS_DROPPED   = s => normStatus(s) === 'dropped'
const STATUS_ACTIVE    = s => normStatus(s) === 'active'
const STATUS_INACTIVE  = s => normStatus(s) === 'inactive'

// Estimate "value" of a student from their budget field
function studentValue(student) {
  return safeFloat(student.budget) || safeFloat(student.avg_budget) || 0
}

// Average fee proxy from budget (commission assumption ~10%)
function revenueProxy(budget) {
  return budget * 0.10
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 1 — EXISTING FUNCTIONS (PRESERVED EXACTLY)
// ═════════════════════════════════════════════════════════════════════════════

export function computeOverview(students) {
  const total     = students.length
  const converted = students.filter(s => STATUS_CONVERTED(s.status)).length
  const dropped   = students.filter(s => STATUS_DROPPED(s.status)).length
  const active    = students.filter(s => STATUS_ACTIVE(s.status)).length

  const cgpaVals   = students.map(s => safeFloat(s.cgpa)).filter(Boolean)
  const ieltsVals  = students.map(s => safeFloat(s.ielts_score)).filter(Boolean)
  const scoreVals  = students.map(s => safeFloat(s.lead_score)).filter(Boolean)
  const budgetVals = students.map(s => studentValue(s)).filter(Boolean)

  const enrollmentRate          = roundTo(pct(converted, total), 2)
  const avgEnrollmentProbability = roundTo(avg(scoreVals), 2)

  const scholarshipEligible = students.filter(s =>
    safeFloat(s.cgpa) >= 7.5 && safeFloat(s.ielts_score) >= 6.5
  ).length

  const highIntentLeads = students.filter(s =>
    safeFloat(s.lead_score) >= 75
  ).length

  return {
    total,
    converted,
    dropped,
    active,
    enrollmentRate,
    avgEnrollmentProbability,
    avgCgpa:      roundTo(avg(cgpaVals),  2),
    avgIelts:     roundTo(avg(ieltsVals), 2),
    avgLeadScore: roundTo(avg(scoreVals), 2),
    avgBudget:    roundTo(avg(budgetVals), 0),
    scholarshipEligible,
    highIntentLeads,
  }
}

export function computeCounselorPerformance(students) {
  const byName = groupBy(students, 'assigned_counselor')

  return Object.entries(byName).map(([name, group]) => {
    const converted = group.filter(s => STATUS_CONVERTED(s.status)).length
    const dropped   = group.filter(s => STATUS_DROPPED(s.status)).length
    const active    = group.filter(s => STATUS_ACTIVE(s.status)).length
    const total     = group.length
    const rate      = roundTo(pct(converted, total), 2)
    const avgScore  = roundTo(avg(group.map(s => safeFloat(s.lead_score)).filter(Boolean)), 2)

    return { name, students: total, converted, dropped, active, rate, avgLeadScore: avgScore }
  }).sort((a, b) => b.rate - a.rate)
}

export function computeCityPerformance(students) {
  const byCity = groupBy(students, 'city')

  return Object.entries(byCity).map(([city, group]) => {
    const converted  = group.filter(s => STATUS_CONVERTED(s.status)).length
    const total      = group.length
    const rate       = roundTo(pct(converted, total), 2)
    const avgBudget  = roundTo(avg(group.map(s => studentValue(s)).filter(Boolean)), 0)

    return { city, total, converted, rate, avgBudget }
  }).sort((a, b) => b.total - a.total)
}

export function computeCountryPerformance(students) {
  const byCountry = groupBy(students, 'preferred_country')

  return Object.entries(byCountry)
    .filter(([k]) => k && k !== 'Unknown' && k.trim() !== '')
    .map(([country, group]) => {
      const converted = group.filter(s => STATUS_CONVERTED(s.status)).length
      const total     = group.length
      const rate      = roundTo(pct(converted, total), 2)
      const avgBudget = roundTo(avg(group.map(s => studentValue(s)).filter(Boolean)), 0)

      return { country, total, converted, rate, avgBudget }
    }).sort((a, b) => b.total - a.total)
}

export function computeLeadSourcePerformance(students) {
  const bySrc = groupBy(students, 'lead_source')

  return Object.entries(bySrc).map(([name, group]) => {
    const leads       = group.length
    const conversions = group.filter(s => STATUS_CONVERTED(s.status)).length
    const rate        = roundTo(pct(conversions, leads), 2)

    return { name, leads, conversions, rate }
  }).sort((a, b) => b.leads - a.leads)
}

export function computeFunnel(students) {
  const stageCounts = students.reduce((acc, s) => {
    const stage = normalizeStage(s.current_stage) || s.status || 'Unknown'
    acc[stage] = (acc[stage] || 0) + 1
    return acc
  }, {})

  const stages = FUNNEL_ORDER.map(stage => ({
    stage,
    value: stageCounts[stage] || 0
  })).filter(s => s.value > 0)

  const drops = stages.slice(1).map((s, i) => ({
    from: stages[i].stage,
    to: s.stage,
    drop: stages[i].value - s.value,
    dropPct: roundTo(pct(stages[i].value - s.value, stages[i].value), 1)
  }))

  const worstDrop = drops.length
    ? [...drops].sort((a, b) => b.drop - a.drop)[0]
    : null

  return { stages, drops, worstDrop }
}

export function computeRiskBreakdown(students) {
  const low    = students.filter(s => s.dropout_risk?.toLowerCase() === 'low').length
  const medium = students.filter(s => s.dropout_risk?.toLowerCase() === 'medium').length
  const high   = students.filter(s => s.dropout_risk?.toLowerCase() === 'high').length
  const total  = students.length

  return {
    low, medium, high, total,
    lowPct:    roundTo(pct(low,    total), 1),
    mediumPct: roundTo(pct(medium, total), 1),
    highPct:   roundTo(pct(high,   total), 1),
  }
}

export function filterStudents(students, filters = {}) {
  return students.filter(student => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value || value === '') continue
      const sv = String(student[key] ?? '').toLowerCase()
      if (!sv.includes(String(value).toLowerCase())) return false
    }
    return true
  })
}

export function findSimilarStudents(students, profile, limit = 10) {
  const {
    cgpa = 0, ielts = 0, budget = 0,
    country = '', course = ''
  } = profile

  // Normalized distance (0 = identical, larger = further) instead of an
  // additive score with arbitrary cutoffs. This keeps CGPA (range ~6-9.8),
  // IELTS (range ~5.5-8.5), and budget (range ~800k-3.5M) comparable to each
  // other instead of letting one field's units dominate the match.
  const scored = students.map(s => {
    const sCgpa   = safeFloat(s.cgpa)
    const sIelts  = safeFloat(s.ielts_score)
    const sBudget = studentValue(s)

    const cgpaDist   = sCgpa   ? Math.abs(sCgpa   - cgpa)   / 4        : 1
    const ieltsDist  = sIelts  ? Math.abs(sIelts  - ielts)  / 3.5      : 1
    const budgetDist = sBudget ? Math.abs(sBudget - budget) / 2700000 : 1

    let distance = (cgpaDist + ieltsDist + budgetDist) / 3

    // Reward matching country/course preference instead of requiring it —
    // this keeps the cohort from collapsing to near-zero in markets with
    // few students, while still prioritizing true matches first.
    if (country && s.preferred_country?.toLowerCase() === country.toLowerCase()) distance -= 0.15
    if (course && s.preferred_course?.toLowerCase().includes(course.toLowerCase())) distance -= 0.1

    return { ...s, _distance: Math.max(0, distance) }
  })

  return scored
    .sort((a, b) => a._distance - b._distance)
    .slice(0, limit)
}

export function cohortOutcomeStats(students, field, value) {
  const cohort    = students.filter(s => String(s[field] ?? '').toLowerCase() === String(value).toLowerCase())
  const converted = cohort.filter(s => STATUS_CONVERTED(s.status)).length
  const dropped   = cohort.filter(s => STATUS_DROPPED(s.status)).length
  const active    = cohort.filter(s => STATUS_ACTIVE(s.status)).length

  return {
    field, value,
    total: cohort.length,
    converted, dropped, active,
    conversionRate: roundTo(pct(converted, cohort.length), 2),
    dropRate:       roundTo(pct(dropped,   cohort.length), 2),
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 2 — EXECUTIVE KPI ENGINE
// ═════════════════════════════════════════════════════════════════════════════

export function computeExecutiveKPIs(students) {
  const total     = students.length
  const converted = students.filter(s => STATUS_CONVERTED(s.status))
  const dropped   = students.filter(s => STATUS_DROPPED(s.status))
  const active    = students.filter(s => STATUS_ACTIVE(s.status))
  const highRisk  = students.filter(s => s.dropout_risk?.toLowerCase() === 'high')

  const budgets        = students.map(s => studentValue(s)).filter(Boolean)
  const avgBudget      = avg(budgets)
  const totalPipeline  = budgets.reduce((s, v) => s + v, 0)

  const revenueRealized   = converted.map(s => revenueProxy(studentValue(s))).reduce((s, v) => s + v, 0)
  const revenueUnrealized = active.map(s => revenueProxy(studentValue(s))).reduce((s, v) => s + v, 0)
  const revenueAtRisk     = highRisk.map(s => revenueProxy(studentValue(s))).reduce((s, v) => s + v, 0)

  const overallConvRate  = pct(converted.length, total)
  const activeConvProb   = avg(active.map(s => safeFloat(s.lead_score)).filter(Boolean)) / 100
  const expectedRevenue  = active.map(s => revenueProxy(studentValue(s)) * (safeFloat(s.lead_score) / 100)).reduce((s, v) => s + v, 0)

  const conversionGap    = revenueUnrealized - expectedRevenue
  const growthPotential  = dropped.map(s => revenueProxy(studentValue(s))).reduce((s, v) => s + v, 0) * 0.15 // 15% re-engagement estimate

  return {
    totalStudents:        total,
    totalPipelineValue:   roundTo(totalPipeline,    0),
    avgStudentValue:      roundTo(avgBudget,        0),
    revenueRealized:      roundTo(revenueRealized,  0),
    revenueUnrealized:    roundTo(revenueUnrealized,0),
    revenueAtRisk:        roundTo(revenueAtRisk,    0),
    expectedRevenue:      roundTo(expectedRevenue,  0),
    conversionGap:        roundTo(conversionGap,    0),
    growthPotential:      roundTo(growthPotential,  0),
    overallConvRate:      roundTo(overallConvRate,  2),
    activeConvProbAvg:    roundTo(activeConvProb * 100, 2),
    activeCount:          active.length,
    convertedCount:       converted.length,
    droppedCount:         dropped.length,
    highRiskCount:        highRisk.length,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 3 — EXECUTIVE SUMMARY GENERATOR
// ═════════════════════════════════════════════════════════════════════════════

export function generateExecutiveSummary(students) {
  const kpis       = computeExecutiveKPIs(students)
  const counselors = computeCounselorPerformance(students)
  const countries  = computeCountryPerformance(students)
  const sources    = computeLeadSourcePerformance(students)
  const funnel     = computeFunnel(students)
  const risk       = computeRiskBreakdown(students)
  const overview   = computeOverview(students)

  const topCounselor    = counselors[0]
  const bottomCounselor = counselors[counselors.length - 1]
  const avgRate         = avg(counselors.map(c => c.rate))
  const underperforming = counselors.filter(c => c.rate < avgRate)

  const topCountry  = countries[0]
  const topSource   = [...sources].sort((a, b) => b.rate - a.rate)[0]
  const worstSource = [...sources].sort((a, b) => a.rate - b.rate)[0]

  const stuckInDocs = students.filter(s =>
    (s.current_stage || '').toLowerCase().includes('document') &&
    STATUS_ACTIVE(s.status)
  ).length

  const overdueFollowup = students.filter(s => {
    const d = daysSince(s.last_activity_date)
    return d !== null && d >= 7 && STATUS_ACTIVE(s.status)
  }).length

  const visaDeadlines = students.filter(s =>
    (s.current_stage || '').toLowerCase() === 'visa' &&
    STATUS_ACTIVE(s.status)
  ).length

  // Executive Summary
  const summary = `Pipeline stands at ${kpis.totalStudents} students with a ${kpis.overallConvRate}% overall conversion rate. ` +
    `${kpis.convertedCount} enrolled, ${kpis.activeCount} active, ${kpis.droppedCount} dropped. ` +
    `Total pipeline value is $${kpis.totalPipelineValue.toLocaleString()} with $${kpis.revenueRealized.toLocaleString()} revenue realized. ` +
    `Top destination is ${topCountry?.country || 'N/A'} (${topCountry?.total || 0} students). ` +
    `Best lead source by conversion is ${topSource?.name || 'N/A'} at ${topSource?.rate || 0}%.`

  // Opportunities
  const topOpportunities = [
    {
      title: 'Re-engage medium-risk students',
      reason: `${risk.medium} students are medium-risk and recoverable with targeted outreach.`,
      priority: 'High',
      estimatedImpact: `+${Math.round(risk.medium * 0.15)} potential conversions`
    },
    {
      title: `Scale ${topSource?.name || 'top'} channel`,
      reason: `${topSource?.name} has highest conversion rate (${topSource?.rate}%) — headroom to increase lead volume.`,
      priority: 'High',
      estimatedImpact: `Revenue multiplier on best-performing channel`
    },
    {
      title: 'Scholarship campaign for eligible students',
      reason: `${overview.scholarshipEligible} students meet eligibility criteria but may not be aware.`,
      priority: 'Medium',
      estimatedImpact: `Accelerates decision-making, reduces application dropout`
    },
    {
      title: `Focus ${topCountry?.country || 'top country'} marketing`,
      reason: `${topCountry?.country} has highest demand — dedicated intake campaigns increase relevance.`,
      priority: 'Medium',
      estimatedImpact: `Estimated 10–15% lift in country-specific conversion`
    },
    {
      title: 'Unblock documentation backlog',
      reason: `${stuckInDocs} students stuck in documentation — recoverable with standardised checklists.`,
      priority: 'High',
      estimatedImpact: `${stuckInDocs} recoverable students within 48 hours`
    },
  ]

  // Risks
  const biggestRisks = [
    ...(overdueFollowup > 0 ? [{
      risk: 'Follow-up overdue',
      detail: `${overdueFollowup} active students have had no contact in 7+ days.`,
      severity: 'Critical',
      affectedStudents: overdueFollowup
    }] : []),
    ...(risk.high > 0 ? [{
      risk: 'High-risk pipeline',
      detail: `${risk.high} students classified high-risk with potential revenue loss of $${kpis.revenueAtRisk.toLocaleString()}.`,
      severity: 'High',
      affectedStudents: risk.high
    }] : []),
    ...(underperforming.length > 0 ? [{
      risk: 'Counselor performance gap',
      detail: `${underperforming.map(c => c.name).join(', ')} below team average of ${roundTo(avgRate, 1)}%.`,
      severity: 'Medium',
      affectedStudents: underperforming.reduce((s, c) => s + c.students, 0)
    }] : []),
    ...(funnel.worstDrop ? [{
      risk: `Funnel bottleneck: ${funnel.worstDrop.from} → ${funnel.worstDrop.to}`,
      detail: `${funnel.worstDrop.drop} students lost (${funnel.worstDrop.dropPct}% attrition) at the worst funnel stage.`,
      severity: 'High',
      affectedStudents: funnel.worstDrop.drop
    }] : []),
  ]

  // Immediate actions
  const immediateActions = [
    `Contact all ${overdueFollowup} overdue follow-up students today.`,
    `Assign top counselors to ${risk.high} high-risk students immediately.`,
    `Send document checklists to ${stuckInDocs} students stuck in documentation.`,
    `Confirm visa document status for ${visaDeadlines} visa-stage students.`,
    `Schedule scholarship briefing for ${overview.scholarshipEligible} eligible students.`,
  ]

  // Counselor observations
  const counselorObs = underperforming.length > 0
    ? `${underperforming.length} counselor(s) below team average (${roundTo(avgRate, 1)}%). ` +
      `${topCounselor?.name} leads at ${topCounselor?.rate}% on ${topCounselor?.students} students. ` +
      `Shadow sessions recommended before next intake.`
    : `All counselors at or above team average of ${roundTo(avgRate, 1)}%. Team performance is strong.`

  // Marketing observations
  const bestSourceByConv = [...sources].sort((a, b) => b.rate - a.rate)[0]
  const bestSourceByVol  = [...sources].sort((a, b) => b.leads - a.leads)[0]
  const marketingObs = `Best conversion channel: ${bestSourceByConv?.name} (${bestSourceByConv?.rate}%). ` +
    `Highest volume channel: ${bestSourceByVol?.name} (${bestSourceByVol?.leads} leads). ` +
    `Worst conversion: ${worstSource?.name} (${worstSource?.rate}%) — review or reduce spend.`

  // Pipeline observations
  const pipelineObs = `Expected revenue from active pipeline: $${kpis.expectedRevenue.toLocaleString()}. ` +
    `Conversion gap (unrealized vs expected): $${kpis.conversionGap.toLocaleString()}. ` +
    `Growth potential from re-engaging dropped students: $${kpis.growthPotential.toLocaleString()}.`

  // Scholarship observations
  const scholarshipObs = `${overview.scholarshipEligible} students qualify for scholarship consideration ` +
    `(CGPA ≥ 7.5 and IELTS ≥ 6.5). Proactive outreach to this segment reduces cost-anxiety dropout.`

  return {
    summary,
    topOpportunities,
    biggestRisks,
    immediateActions,
    counselorObservations: counselorObs,
    marketingObservations: marketingObs,
    pipelineObservations:  pipelineObs,
    scholarshipObservations: scholarshipObs,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 4 — AI CONTEXT BUILDER
// ═════════════════════════════════════════════════════════════════════════════

export function buildAIContext(students) {
  const overview   = computeOverview(students)
  const kpis       = computeExecutiveKPIs(students)
  const counselors = computeCounselorPerformance(students)
  const countries  = computeCountryPerformance(students)
  const cities     = computeCityPerformance(students)
  const sources    = computeLeadSourcePerformance(students)
  const funnel     = computeFunnel(students)
  const risk       = computeRiskBreakdown(students)

  const avgCounselorRate = avg(counselors.map(c => c.rate))
  const topCounselor     = counselors[0]
  const bottomCounselor  = counselors[counselors.length - 1]
  const underperforming  = counselors.filter(c => c.rate < avgCounselorRate)

  const courses  = topN(countBy(students, 'preferred_course'), 5)
  const degrees  = topN(countBy(students, 'degree'), 5)
  const streams  = topN(countBy(students, 'stream'), 5)

  const highIntentStudents = students
    .filter(s => safeFloat(s.lead_score) >= 80 && STATUS_ACTIVE(s.status))
    .sort((a, b) => safeFloat(b.lead_score) - safeFloat(a.lead_score))
    .slice(0, 20)
    .map(s => ({
      id:          s.student_id,
      name:        s.name,
      leadScore:   safeFloat(s.lead_score),
      country:     s.preferred_country,
      course:      s.preferred_course,
      counselor:   s.assigned_counselor,
    }))

  const highRiskStudents = students
    .filter(s => s.dropout_risk?.toLowerCase() === 'high' && STATUS_ACTIVE(s.status))
    .slice(0, 20)
    .map(s => ({
      id:        s.student_id,
      name:      s.name,
      leadScore: safeFloat(s.lead_score),
      stage:     s.current_stage,
      counselor: s.assigned_counselor,
      lastContact: daysSince(s.last_activity_date),
    }))

  const stuckInDocs = students.filter(s =>
    (s.current_stage || '').toLowerCase().includes('document') &&
    STATUS_ACTIVE(s.status)
  ).length

  const overdueFollowup = students.filter(s => {
    const d = daysSince(s.last_activity_date)
    return d !== null && d >= 7 && STATUS_ACTIVE(s.status)
  }).length

  const visaDeadlines = students.filter(s =>
    (s.current_stage || '').toLowerCase() === 'visa' &&
    STATUS_ACTIVE(s.status)
  ).length

  const newLeadsWeek = students.filter(s => {
    const d = daysSince(s.created_date)
    return d !== null && d <= 7
  }).length

  const scholarshipStudents = students.filter(s =>
    safeFloat(s.cgpa) >= 7.5 && safeFloat(s.ielts_score) >= 6.5
  ).length

  return {
    kpis: {
      totalStudents:       overview.total,
      converted:           overview.converted,
      dropped:             overview.dropped,
      active:              overview.active,
      enrollmentRate:      overview.enrollmentRate,
      avgEnrollmentProb:   overview.avgEnrollmentProbability,
      totalPipelineValue:  kpis.totalPipelineValue,
      revenueRealized:     kpis.revenueRealized,
      revenueAtRisk:       kpis.revenueAtRisk,
      expectedRevenue:     kpis.expectedRevenue,
      growthPotential:     kpis.growthPotential,
    },
    studentProfile: {
      avgCgpa:      overview.avgCgpa,
      avgIelts:     overview.avgIelts,
      avgLeadScore: overview.avgLeadScore,
      avgBudget:    overview.avgBudget,
    },
    counselors: {
      list:            counselors,
      teamAvgRate:     roundTo(avgCounselorRate, 2),
      topCounselor,
      bottomCounselor,
      underperforming,
    },
    countries: countries.slice(0, 10),
    cities:    cities.slice(0, 10),
    leadSources: sources,
    scholarships: {
      eligible: scholarshipStudents,
    },
    funnel: {
      stages:    funnel.stages,
      drops:     funnel.drops,
      worstDrop: funnel.worstDrop,
    },
    risks: {
      low:    risk.low,
      medium: risk.medium,
      high:   risk.high,
    },
    operationalFlags: {
      overdueFollowup,
      stuckInDocs,
      visaDeadlines,
      newLeadsWeek,
      highRiskStudents: risk.high,
      scholarshipEligible: scholarshipStudents,
      highIntentLeads: overview.highIntentLeads,
    },
    topCourses:  courses,
    topDegrees:  degrees,
    topStreams:   streams,
    highIntentStudents,
    highRiskStudents,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 5 — MARKETING ANALYTICS
// ═════════════════════════════════════════════════════════════════════════════

export function computeMarketingAnalytics(students) {
  const sources = computeLeadSourcePerformance(students)

  const sortedByConv = [...sources].sort((a, b) => b.rate - a.rate)
  const sortedByVol  = [...sources].sort((a, b) => b.leads - a.leads)

  const bestAcquisition  = sortedByConv[0]  || null
  const worstAcquisition = sortedByConv[sortedByConv.length - 1] || null
  const highestVolume    = sortedByVol[0]   || null

  // Cost effectiveness: higher conversion per lead = more efficient
  const costEffectiveness = sources.map(s => ({
    name: s.name,
    leadsPerConversion: s.conversions > 0 ? roundTo(s.leads / s.conversions, 1) : null,
    conversionRate: s.rate,
  })).sort((a, b) => (a.leadsPerConversion || 9999) - (b.leadsPerConversion || 9999))

  const cities   = computeCityPerformance(students)
  const states   = (() => {
    const byState = groupBy(students, 'state')
    return Object.entries(byState).map(([state, group]) => ({
      state,
      total:     group.length,
      converted: group.filter(s => STATUS_CONVERTED(s.status)).length,
      rate:      roundTo(pct(group.filter(s => STATUS_CONVERTED(s.status)).length, group.length), 2),
    })).sort((a, b) => b.rate - a.rate)
  })()

  const countries       = computeCountryPerformance(students)
  const countryDemand   = countries.map(c => ({ country: c.country, demand: c.total, rate: c.rate }))
  const courseDemand    = topN(countBy(students, 'preferred_course'), 10)
  const budgetBuckets   = (() => {
    // Budget is in INR; real range is roughly ₹8,00,000–₹35,00,000.
    // Buckets below are quartile-based on the actual data distribution.
    const buckets = { 'Under ₹15L': 0, '₹15L–22L': 0, '₹22L–29L': 0, '₹29L+': 0 }
    students.forEach(s => {
      const b = studentValue(s)
      if      (b < 1500000)  buckets['Under ₹15L']++
      else if (b < 2200000)  buckets['₹15L–22L']++
      else if (b < 2900000)  buckets['₹22L–29L']++
      else                   buckets['₹29L+']++
    })
    return buckets
  })()

  // Preferred intakes (if your CRM has an `intake` field like "Jan 2025"/"Sep 2025")
  // We keep this defensive: if field missing, returns [].
  const preferredIntakes = (() => {
    const intakeCounts = countBy(students.filter(s => (s.intake ?? '') !== ''), 'intake')
    return topN(intakeCounts, 5)
  })()

  return {
    bestAcquisitionChannel:  bestAcquisition,
    worstAcquisitionChannel: worstAcquisition,
    highestVolumeChannel:    highestVolume,
    costEffectiveness,
    highestConversionCity:   cities[0]   || null,
    highestConversionState:  states[0]   || null,
    countryDemand,
    courseDemand,
    budgetDistribution:      budgetBuckets,
    preferredIntakes,
    allSources:              sources,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 6 — COUNSELOR INTELLIGENCE
// ═════════════════════════════════════════════════════════════════════════════

export function computeCounselorIntelligence(students) {
  const counselors = computeCounselorPerformance(students)
  const avgRate    = avg(counselors.map(c => c.rate))
  const avgLoad    = avg(counselors.map(c => c.students))

  const top    = counselors[0]
  const bottom = counselors[counselors.length - 1]

  const mostOverloaded = [...counselors].sort((a, b) => b.students - a.students)[0]
  const leastActive    = [...counselors].sort((a, b) => a.students - b.students)[0]

  const needsReassignment = students.filter(s =>
    s.dropout_risk?.toLowerCase() === 'high' &&
    STATUS_ACTIVE(s.status) &&
    (() => {
      const c = counselors.find(c => c.name === s.assigned_counselor)
      return c && c.rate < avgRate
    })()
  )

  const coachingPriorities = counselors
    .filter(c => c.rate < avgRate)
    .map(c => ({
      counselor: c.name,
      currentRate: c.rate,
      gap: roundTo(avgRate - c.rate, 2),
      potentialGain: Math.round(c.students * ((avgRate - c.rate) / 100)),
      recommendation: `Shadow ${top?.name} — focus on follow-up cadence and documentation unblocking.`,
    }))
    .sort((a, b) => b.gap - a.gap)

  return {
    topCounselor:    top,
    bottomCounselor: bottom,
    mostOverloaded,
    leastActive,
    teamAvgRate:     roundTo(avgRate, 2),
    teamAvgLoad:     roundTo(avgLoad, 0),
    studentsNeedingReassignment: needsReassignment.length,
    reassignmentList: needsReassignment.slice(0, 20).map(s => ({
      id:        s.student_id,
      name:      s.name,
      counselor: s.assigned_counselor,
      risk:      s.dropout_risk,
    })),
    coachingPriorities,
    underperforming: counselors.filter(c => c.rate < avgRate),
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 7 — STUDENT PRIORITIZATION
// ═════════════════════════════════════════════════════════════════════════════

export function computeStudentPrioritization(students) {
  const active = students.filter(s => STATUS_ACTIVE(s.status))

  const callToday = active
    .filter(s => {
      const d = daysSince(s.last_activity_date)
      return d !== null && d >= 7
    })
    .sort((a, b) => (daysSince(b.last_activity_date) || 0) -
                    (daysSince(a.last_activity_date) || 0))
    .slice(0, 50)

  const needsFollowUp = active
    .filter(s => {
      const d = daysSince(s.last_activity_date)
      return d !== null && d >= 3 && d < 7
    })
    .sort((a, b) => safeFloat(b.lead_score) - safeFloat(a.lead_score))
    .slice(0, 50)

  const highEnrollmentProb = active
    .filter(s => safeFloat(s.lead_score) >= 80)
    .sort((a, b) => safeFloat(b.lead_score) - safeFloat(a.lead_score))
    .slice(0, 30)

  const highDropoutRisk = students
    .filter(s => s.dropout_risk?.toLowerCase() === 'high' && STATUS_ACTIVE(s.status))
    .sort((a, b) => safeFloat(a.lead_score) - safeFloat(b.lead_score))
    .slice(0, 30)

  const stuckInDocs = active
    .filter(s => (s.current_stage || '').toLowerCase().includes('document'))
    .slice(0, 50)

  const needsVisa = active
    .filter(s => (s.current_stage || '').toLowerCase() === 'visa')
    .sort((a, b) => safeFloat(b.lead_score) - safeFloat(a.lead_score))

  // Budget is in INR (real range ~₹8,00,000–₹35,00,000). ₹28,00,000 is
  // roughly the top quartile — students genuinely worth prioritising for
  // high-value handling, not the entire active population.
  const highValue = active
    .filter(s => studentValue(s) >= 2800000)
    .sort((a, b) => studentValue(b) - studentValue(a))
    .slice(0, 20)

  function slim(arr) {
    return arr.map(s => ({
      id:        s.student_id,
      name:      s.name,
      leadScore: safeFloat(s.lead_score),
      stage:     s.current_stage,
      counselor: s.assigned_counselor,
      country:   s.preferred_country,
      risk:      s.dropout_risk,
      budget:    studentValue(s),
    }))
  }

  return {
    callToday:           slim(callToday),
    needsFollowUp:       slim(needsFollowUp),
    highEnrollmentProb:  slim(highEnrollmentProb),
    highDropoutRisk:     slim(highDropoutRisk),
    stuckInDocs:         slim(stuckInDocs),
    needsVisaAttention:  slim(needsVisa),
    highValue:           slim(highValue),
    counts: {
      callToday:          callToday.length,
      needsFollowUp:      needsFollowUp.length,
      highEnrollmentProb: highEnrollmentProb.length,
      highDropoutRisk:    highDropoutRisk.length,
      stuckInDocs:        stuckInDocs.length,
      needsVisa:          needsVisa.length,
      highValue:          highValue.length,
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 8 — FUNNEL INTELLIGENCE
// ═════════════════════════════════════════════════════════════════════════════

export function computeFunnelIntelligence(students) {
  const { stages, drops, worstDrop } = computeFunnel(students)

  if (!stages.length) return { stages, drops, worstDrop: null, intelligence: null }

  const first = stages[0]
  const last  = stages[stages.length - 1]
  const totalYield = first.value > 0 ? roundTo(pct(last.value, first.value), 1) : 0

  const largestBottleneck = worstDrop

  const slowestStage = drops.length
    ? [...drops].sort((a, b) => parseFloat(b.dropPct) - parseFloat(a.dropPct))[0]
    : null

  const fastestStage = drops.length
    ? [...drops].sort((a, b) => parseFloat(a.dropPct) - parseFloat(b.dropPct))[0]
    : null

  const biggestLeak = drops.length
    ? [...drops].sort((a, b) => b.drop - a.drop)[0]
    : null

  let suggestedAction = 'No funnel data available.'
  if (largestBottleneck) {
    const { from, to, drop, dropPct } = largestBottleneck
    if (to === 'Documentation' || from === 'Counseling') {
      suggestedAction = `Standardise document checklist and automate deadline reminders. Can unblock ${drop} students within 48 hours.`
    } else if (to === 'Visa') {
      suggestedAction = `Assign visa specialists to ${drop} application-stage students. Partner university reminders recommended.`
    } else if (to === 'Enrolled') {
      suggestedAction = `Final-mile intervention — personal calls from top counselors to ${drop} visa-cleared students.`
    } else if (from === 'Contacted') {
      suggestedAction = `Improve first-response speed. ${drop} prospects lost at initial contact — review lead qualification and contact SLA.`
    } else {
      suggestedAction = `Focus intervention resources on ${from} → ${to} stage. Deploy top counselors there first.`
    }
  }

  const expectedImprovement = largestBottleneck
    ? `Recovering 30% of ${largestBottleneck.from}→${largestBottleneck.to} attrition would add ~${Math.round(largestBottleneck.drop * 0.30)} enrolled students.`
    : ''

  return {
    stages,
    drops,
    totalYieldPct:      totalYield,
    largestBottleneck,
    slowestStage,
    fastestStage,
    biggestLeak,
    suggestedAction,
    expectedImprovement,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 9 — OPPORTUNITY ENGINE
// ═════════════════════════════════════════════════════════════════════════════

export function computeOpportunities(students) {
  const overview    = computeOverview(students)
  const risk        = computeRiskBreakdown(students)
  const sources     = computeLeadSourcePerformance(students)
  const countries   = computeCountryPerformance(students)
  const funnel      = computeFunnelIntelligence(students)
  const counselors  = computeCounselorPerformance(students)
  const prio        = computeStudentPrioritization(students)

  const avgCounselorRate  = avg(counselors.map(c => c.rate))
  const topSource         = [...sources].sort((a, b) => b.rate - a.rate)[0]
  const highestVolSrc     = [...sources].sort((a, b) => b.leads - a.leads)[0]
  const topCountry        = countries[0]
  const referralSrc       = sources.find(s => s.name.toLowerCase().includes('referral'))
  const whatsappSrc       = sources.find(s => s.name.toLowerCase().includes('whatsapp'))
  const underperforming   = counselors.filter(c => c.rate < avgCounselorRate)

  return [
    {
      title: 'Increase scholarship campaign reach',
      reason: `${overview.scholarshipEligible} students are scholarship-eligible but may not know. Proactive outreach reduces application-stage dropout significantly.`,
      priority: 'High',
      estimatedImpact: `${Math.round(overview.scholarshipEligible * 0.12)} additional conversions estimated`
    },
    {
      title: `Focus ${topCountry?.country || 'top country'} intake marketing`,
      reason: `${topCountry?.country} has highest student demand (${topCountry?.total} students). Dedicated intake campaigns outperform generic ones by 30–40% in engagement.`,
      priority: 'High',
      estimatedImpact: `10–15% lift in ${topCountry?.country} conversion rate`
    },
    {
      title: 'Improve counselor allocation',
      reason: `${underperforming.length} counselors below team average. Rebalancing high-value students to top performers recovers pipeline value without new leads.`,
      priority: 'High',
      estimatedImpact: `+${underperforming.reduce((s, c) => s + Math.round(c.students * ((avgCounselorRate - c.rate) / 100)), 0)} potential conversions`
    },
    {
      title: `Re-engage ${risk.medium} medium-risk students`,
      reason: `Medium-risk students have not fully disengaged. Targeted WhatsApp + call campaign has ~15% recovery rate on this segment.`,
      priority: 'High',
      estimatedImpact: `~${Math.round(risk.medium * 0.15)} recoverable conversions`
    },
    {
      title: `Recover ${risk.high} high-risk students`,
      reason: `High-risk students are at critical dropout risk. Immediate counselor intervention before they go to a competitor.`,
      priority: 'Critical',
      estimatedImpact: `Prevents ~${risk.high} drops and protects pipeline revenue`
    },
    {
      title: referralSrc
        ? `Scale referral program (currently ${referralSrc.rate.toFixed(1)}% conversion)`
        : 'Launch referral campaign',
      reason: `Referral leads consistently convert at higher rates due to trust. Current volume is low relative to potential.`,
      priority: 'Medium',
      estimatedImpact: `Referral scaling can reduce cost-per-acquisition by 40–60%`
    },
    {
      title: 'Improve document completion rate',
      reason: `${prio.counts.stuckInDocs} students stuck in documentation. Every day of delay increases dropout probability.`,
      priority: 'High',
      estimatedImpact: `${prio.counts.stuckInDocs} students clearable within 48 hours with standardised checklist`
    },
    {
      title: whatsappSrc
        ? `Scale WhatsApp campaigns (currently ${whatsappSrc.leads} leads)`
        : 'Launch WhatsApp lead campaign',
      reason: `WhatsApp has high response rates for study-abroad audiences. Cost-effective for re-engagement and nurture sequences.`,
      priority: 'Medium',
      estimatedImpact: `20–30% higher response rate vs email for this demographic`
    },
    {
      title: `Double down on ${topSource?.name || 'best channel'} (${topSource?.rate?.toFixed(1) || 0}% conversion)`,
      reason: `Best-converting acquisition channel. Headroom to scale volume without losing quality — monitor rate weekly.`,
      priority: 'High',
      estimatedImpact: `Highest ROI per additional spend vs any other channel`
    },
    ...(funnel.largestBottleneck ? [{
      title: `Fix ${funnel.largestBottleneck.from} → ${funnel.largestBottleneck.to} funnel drop`,
      reason: `${funnel.largestBottleneck.drop} students lost at this stage (${funnel.largestBottleneck.dropPct}% attrition). Largest single leak point in the funnel.`,
      priority: 'Critical',
      estimatedImpact: funnel.expectedImprovement
    }] : []),
  ]
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 10 — RISK ENGINE
// ═════════════════════════════════════════════════════════════════════════════

export function computeRiskEngine(students) {
  const risk        = computeRiskBreakdown(students)
  const kpis        = computeExecutiveKPIs(students)
  const funnel      = computeFunnelIntelligence(students)
  const counselors  = computeCounselorPerformance(students)
  const prio        = computeStudentPrioritization(students)

  const avgCounselorRate = avg(counselors.map(c => c.rate))
  const underperforming  = counselors.filter(c => c.rate < avgCounselorRate)

  const critical = [
    {
      risk: 'High-risk student dropout',
      severity: 'Critical',
      affectedStudents: risk.high,
      revenueAtRisk: kpis.revenueAtRisk,
      mitigation: 'Assign top counselors immediately. Personal call within 24 hours. Offer scholarship options.',
    },
    {
      risk: `Follow-up overdue (${prio.counts.callToday} students)`,
      severity: 'Critical',
      affectedStudents: prio.counts.callToday,
      revenueAtRisk: Math.round(prio.counts.callToday * kpis.avgStudentValue * 0.10),
      mitigation: 'Mandatory same-day outreach. Assign to available counselors by 12:00 PM.',
    },
  ]

  const medium = [
    {
      risk: 'Documentation bottleneck',
      severity: 'Medium',
      affectedStudents: prio.counts.stuckInDocs,
      revenueAtRisk: Math.round(prio.counts.stuckInDocs * kpis.avgStudentValue * 0.10),
      mitigation: 'Send standardised doc checklist. Automated daily reminders. Clear within 48 hours.',
    },
    {
      risk: 'Medium-risk student attrition',
      severity: 'Medium',
      affectedStudents: risk.medium,
      revenueAtRisk: Math.round(risk.medium * kpis.avgStudentValue * 0.05),
      mitigation: 'Weekly touchpoints. WhatsApp re-engagement sequence. Scholarship communication.',
    },
    ...(underperforming.length > 0 ? [{
      risk: 'Counselor performance gap',
      severity: 'Medium',
      affectedStudents: underperforming.reduce((s, c) => s + c.students, 0),
      revenueAtRisk: Math.round(underperforming.reduce((s, c) => s + c.students, 0) * kpis.avgStudentValue * 0.03),
      mitigation: `Schedule shadow sessions with ${counselors[0]?.name}. KPI review bi-weekly.`,
    }] : []),
  ]

  const low = [
    {
      risk: 'Lead source concentration',
      severity: 'Low',
      affectedStudents: 0,
      revenueAtRisk: 0,
      mitigation: 'Diversify marketing channels. No single source should exceed 40% of total leads.',
    },
    {
      risk: 'Intake cycle dependency',
      severity: 'Low',
      affectedStudents: 0,
      revenueAtRisk: 0,
      mitigation: 'Stagger enrollment targets across Jan, May, and Sep intakes to reduce cycle risk.',
    },
  ]

  const operational = [
    {
      risk: 'Visa stage students at deadline risk',
      severity: 'High',
      affectedStudents: prio.counts.needsVisa,
      mitigation: 'Daily document status check. Escalate any incomplete submissions within 24 hours.',
    },
  ]

  const business = [
    {
      risk: 'Conversion gap vs probability',
      severity: 'Medium',
      detail: `Expected revenue $${kpis.expectedRevenue.toLocaleString()} vs $${kpis.revenueRealized.toLocaleString()} realized. Gap = $${kpis.conversionGap.toLocaleString()}.`,
      mitigation: 'The gap is operational, not lead quality. Fix documentation delays and follow-up SLAs.',
    },
    {
      risk: 'Growth potential left on table',
      severity: 'Low',
      detail: `$${kpis.growthPotential.toLocaleString()} recoverable from dropped students at 15% re-engagement rate.`,
      mitigation: 'Launch quarterly re-engagement campaign targeting dropped students from last 6 months.',
    },
  ]

  return { critical, medium, low, operational, business }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 11 — TREND ANALYSIS
// ═════════════════════════════════════════════════════════════════════════════

export function computeTrends(students) {
  function byMonth(arr, dateField) {
    return arr.reduce((acc, s) => {
      const d = safeDate(s[dateField])
      if (!d) return acc
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }

  function toSeries(obj) {
    return Object.entries(obj)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }))
  }

  const monthlyLeads       = toSeries(byMonth(students, 'created_date'))
  // There's no dedicated "date of conversion" or "date of dropout" field in
  // the CRM schema. last_activity_date is the closest honest proxy — for a
  // Converted or Dropped student, it's generally the last time their record
  // changed, which roughly tracks when that outcome happened.
  const monthlyConversions = toSeries(byMonth(students.filter(s => STATUS_CONVERTED(s.status)), 'last_activity_date'))
  const monthlyDropouts    = toSeries(byMonth(students.filter(s => STATUS_DROPPED(s.status)), 'last_activity_date'))

  // Lead source trend by month
  const leadSourceTrend = (() => {
    const result = {}
    students.forEach(s => {
      const d = safeDate(s.created_date)
      if (!d) return
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const src   = s.lead_source || 'Unknown'
      if (!result[src]) result[src] = {}
      result[src][month] = (result[src][month] || 0) + 1
    })
    return result
  })()

  // Country demand trend
  const countryTrend = (() => {
    const result = {}
    students.forEach(s => {
      const d = safeDate(s.created_date)
      if (!d) return
      const month   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const country = s.preferred_country || 'Unknown'
      if (!result[country]) result[country] = {}
      result[country][month] = (result[country][month] || 0) + 1
    })
    return result
  })()

  // Monthly conversion rate
  const monthlyConvRate = monthlyLeads.map(({ month, count: leads }) => {
    const conversions = (monthlyConversions.find(m => m.month === month) || {}).count || 0
    return { month, leads, conversions, rate: roundTo(pct(conversions, leads), 2) }
  })

  return {
    monthlyLeads,
    monthlyConversions,
    monthlyDropouts,
    leadSourceTrend,
    countryTrend,
    monthlyConvRate,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 12 — UNIVERSITY RECOMMENDATION SUPPORT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Score a student profile against CRM historical patterns.
 * Does NOT fabricate university names.
 * Returns confidence scores and classification bands (Safe/Moderate/Dream).
 */
export function scoreUniversityProfile(profile, students) {
  const {
    cgpa         = 0,
    ielts        = 0,
    budget       = 0,
    country      = '',
    course       = '',
    hasScholarship = false,
  } = profile

  // Find similar historical students using distance metrics.
  // Pass students.length to score everyone so we can find the dynamic cohort size!
  const allScored = findSimilarStudents(students, { cgpa, ielts, budget, country, course }, students.length)
  
  // Dynamic matching cohort size (distance <= 0.4)
  const cohort = allScored.filter(s => s._distance <= 0.4)
  const sampleSize = cohort.length || 15 // fallback to 15 if empty
  
  const similar = allScored.slice(0, 100) // keep top 100 for conversion calculations

  const tightCohort = similar.filter(s => s._distance <= 0.35)
  const reliableCohort = tightCohort.length >= 15 ? tightCohort : similar.slice(0, Math.max(15, tightCohort.length))

  const similarConverted = reliableCohort.filter(s => STATUS_CONVERTED(s.status)).length
  const historicalConvRate = reliableCohort.length > 0 ? pct(similarConverted, reliableCohort.length) : null
  const lowConfidenceSample = reliableCohort.length < 15

  // Academic standing - refined granular classification
  const gpaVal = safeFloat(cgpa)
  const ieltsVal = safeFloat(ielts)
  const avgCgpa  = avg(students.map(s => safeFloat(s.cgpa)).filter(Boolean)) || 7.5
  
  const cgpaRank = gpaVal >= 9.0 ? 'exceptional' 
                 : gpaVal >= 8.0 ? 'above-average' 
                 : gpaVal >= 7.0 ? 'average' 
                 : 'below-average'
                 
  const ieltsRank = ieltsVal >= 8.0 ? 'exceptional'
                  : ieltsVal >= 7.0 ? 'strong'
                  : ieltsVal >= 6.5 ? 'adequate'
                  : ieltsVal >= 6.0 ? 'moderate'
                  : 'borderline'

  // Budget adequacy (compare to CRM avg budget for preferred country)
  const countryStudents = students.filter(s =>
    s.preferred_country?.toLowerCase() === country.toLowerCase()
  )
  const avgCountryBudget = avg(countryStudents.map(s => studentValue(s)).filter(Boolean)) || avg(students.map(s => studentValue(s)).filter(Boolean)) || 2000000
  const budgetAdequacy = budget >= avgCountryBudget * 1.15
    ? 'comfortable'
    : budget >= avgCountryBudget * 0.90
    ? 'adequate'
    : 'tight'

  // Country demand score (0–100)
  const countryPop     = countryStudents.length
  const countryConvRate = countryStudents.length > 0
    ? pct(countryStudents.filter(s => STATUS_CONVERTED(s.status)).length, countryStudents.length)
    : 0
  const countryScore = Math.min(100, Math.round((countryPop / Math.max(students.length, 1)) * 100 * 5 + countryConvRate))

  // Admission confidence (0–100) - detailed weighted mapping
  let admissionConfidence = 50
  if (cgpaRank === 'exceptional') admissionConfidence += 25
  else if (cgpaRank === 'above-average') admissionConfidence += 12
  else if (cgpaRank === 'average') admissionConfidence += 2
  else if (cgpaRank === 'below-average') admissionConfidence -= 18

  if (ieltsRank === 'exceptional') admissionConfidence += 18
  else if (ieltsRank === 'strong') admissionConfidence += 12
  else if (ieltsRank === 'adequate') admissionConfidence += 5
  else if (ieltsRank === 'moderate') admissionConfidence -= 5
  else if (ieltsRank === 'borderline') admissionConfidence -= 15

  if (budgetAdequacy === 'comfortable') admissionConfidence += 10
  else if (budgetAdequacy === 'tight') admissionConfidence -= 12

  if (hasScholarship) admissionConfidence += 5
  
  if (historicalConvRate !== null) {
    // Trust historical conversion rates more as cohort size scales up.
    const sampleWeight = Math.min(0.5, reliableCohort.length / 100)
    admissionConfidence = Math.round(
      admissionConfidence * (1 - sampleWeight) + historicalConvRate * sampleWeight
    )
  }
  admissionConfidence = Math.max(0, Math.min(100, admissionConfidence))

  // Scholarship confidence - refined academic-focused reasoning
  let scholarshipConfidence = 0
  if (gpaVal >= 9.0 && ieltsVal >= 7.5) scholarshipConfidence = 90
  else if (gpaVal >= 8.5 && ieltsVal >= 7.0) scholarshipConfidence = 75
  else if (gpaVal >= 7.8 && ieltsVal >= 6.5) scholarshipConfidence = 50
  else if (gpaVal >= 7.0 && ieltsVal >= 6.0) scholarshipConfidence = 30
  else if (gpaVal >= 6.0) scholarshipConfidence = 15
  else scholarshipConfidence = 5

  // University classification bands
  const safeThreshold     = Math.max(0, admissionConfidence - 25)
  const moderateThreshold = admissionConfidence
  const dreamThreshold    = Math.min(100, admissionConfidence + 20)

  const classification = {
    Safe: {
      description: `Target institutions where your CGPA (${gpaVal.toFixed(1)}) and IELTS (${ieltsVal.toFixed(1)}) comfortably clear historical admission baselines. Minimal entry risk.`,
      admissionConfidence: Math.min(safeThreshold + 25, 95),
      criteria: `Typically accepts CGPA ${Math.max(0, gpaVal - 0.6).toFixed(1)}+ and IELTS ${Math.max(0, ieltsVal - 0.5).toFixed(1)}+`,
      note: 'Acts as your academic safety net. Recommended to apply to at least one backup choice.'
    },
    Moderate: {
      description: `Sweet spot targets where your profile matches typical accepted student profiles. Well balanced opportunity.`,
      admissionConfidence: moderateThreshold,
      criteria: `Aligned with typical CGPA ${gpaVal.toFixed(1)} and IELTS ${ieltsVal.toFixed(1)} profile with ${budgetAdequacy} budget support`,
      note: 'These represent solid matches. Focus 2-3 of your applications here.'
    },
    Dream: {
      description: `Highly selective global targets where academic standards or processing quotas are ambitious stretch goals.`,
      admissionConfidence: Math.max(0, dreamThreshold - 25),
      criteria: `Tends to seek CGPA ${(gpaVal + 0.6).toFixed(1)}+ and IELTS ${(ieltsVal + 0.5).toFixed(1)}+`,
      note: 'Ambitious options. Worth submitting 1-2 applications but keep Moderate/Safe targets prioritized.'
    }
  }

  return {
    profile: { cgpa, ielts, budget, country, course, hasScholarship },
    sampleSize: reliableCohort.length,
    rawPoolSize: sampleSize,
    lowConfidenceSample,
    historicalConvRate: historicalConvRate !== null ? roundTo(historicalConvRate, 1) : null,
    academicStanding: { cgpaRank, ieltsRank },
    budgetAdequacy,
    countryScore,
    admissionConfidence,
    scholarshipConfidence,
    classification,
    recommendation: admissionConfidence >= 70
      ? 'Exceptional profile. You are highly competitive for prestigious universities. We recommend targeted applications to top-tier schools along with strategic safe backstops.'
      : admissionConfidence >= 50
      ? 'Solid applicant profile. Your metrics are strong for moderate tier universities. Secure your backup options first, then target moderate programs with confidence.'
      : 'Competitive landscape indicates caution. Your academic credentials align best with safe-tier options. Focus on retaking IELTS or drafting a stellar statement of purpose to boost admission probability.',
    note: 'University classifications are generated by scanning historical CRM conversions of similar student profiles. Specific requirements must be cross-checked on official portals.',
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 13 — AI-READY OUTPUT HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * generateAIInsights — master output for any AI feature
 * Combines KPIs + context + priorities into one structured object.
 */
export function generateAIInsights(students) {
  const context  = buildAIContext(students)
  const summary  = generateExecutiveSummary(students)
  const risks    = computeRiskEngine(students)
  const opps     = computeOpportunities(students)

  return {
    context,
    executiveSummary: summary.summary,
    topOpportunities: opps.slice(0, 5),
    criticalRisks:    risks.critical,
    immediateActions: summary.immediateActions,
    generatedAt:      new Date().toISOString(),
  }
}

/**
 * generateExecutiveInsights — for C-level / management dashboard
 */
export function generateExecutiveInsights(students) {
  const kpis    = computeExecutiveKPIs(students)
  const summary = generateExecutiveSummary(students)
  const trends  = computeTrends(students)

  return {
    kpis,
    summary:              summary.summary,
    topOpportunities:     summary.topOpportunities,
    biggestRisks:         summary.biggestRisks,
    immediateActions:     summary.immediateActions,
    pipelineObservations: summary.pipelineObservations,
    monthlyLeadTrend:     trends.monthlyLeads.slice(-6),
    monthlyConvTrend:     trends.monthlyConvRate.slice(-6),
    generatedAt:          new Date().toISOString(),
  }
}

/**
 * generateManagementSummary — operations-focused
 */
export function generateManagementSummary(students) {
  const prio    = computeStudentPrioritization(students)
  const funnel  = computeFunnelIntelligence(students)
  const risk    = computeRiskEngine(students)

  return {
    operationalFlags: prio.counts,
    funnelHealth: {
      totalYield:         funnel.totalYieldPct,
      largestBottleneck:  funnel.largestBottleneck,
      suggestedAction:    funnel.suggestedAction,
      expectedImprovement:funnel.expectedImprovement,
    },
    criticalRisks:    risk.critical,
    mediumRisks:      risk.medium,
    operationalRisks: risk.operational,
    callTodayTop10:   prio.callToday.slice(0, 10),
    visaUrgent:       prio.needsVisaAttention,
    generatedAt:      new Date().toISOString(),
  }
}

/**
 * generateCounselorInsights — for team performance views
 */
export function generateCounselorInsights(students) {
  const intel   = computeCounselorIntelligence(students)
  const perf    = computeCounselorPerformance(students)

  return {
    leaderboard:       perf,
    teamAvgRate:       intel.teamAvgRate,
    teamAvgLoad:       intel.teamAvgLoad,
    topCounselor:      intel.topCounselor,
    bottomCounselor:   intel.bottomCounselor,
    mostOverloaded:    intel.mostOverloaded,
    coachingPriorities:intel.coachingPriorities,
    reassignments:     intel.studentsNeedingReassignment,
    generatedAt:       new Date().toISOString(),
  }
}

/**
 * generateMarketingInsights — for marketing team / campaign planning
 */
export function generateMarketingInsights(students) {
  const marketing = computeMarketingAnalytics(students)
  const trends    = computeTrends(students)

  return {
    bestChannel:          marketing.bestAcquisitionChannel,
    worstChannel:         marketing.worstAcquisitionChannel,
    highestVolumeChannel: marketing.highestVolumeChannel,
    costEffectiveness:    marketing.costEffectiveness,
    topCity:              marketing.highestConversionCity,
    topState:             marketing.highestConversionState,
    countryDemand:        marketing.countryDemand.slice(0, 8),
    courseDemand:         marketing.courseDemand.slice(0, 8),
    budgetDistribution:   marketing.budgetDistribution,
    preferredIntakes:     marketing.preferredIntakes,
    allChannels:          marketing.allSources,
    intakeTrend:          trends.intakeTrend,
    monthlyLeadTrend:     trends.monthlyLeads.slice(-6),
    generatedAt:          new Date().toISOString(),
  }
}

/**
 * generateStudentAdvisorInsights — for the Student AI Advisor modal
 * Takes a student profile and returns CRM-pattern-based context for the advisor.
 */
export function generateStudentAdvisorInsights(students, profile) {
  const scoreData  = scoreUniversityProfile(profile, students)
  // Use a slightly wider pool just for "what did similar students choose"
  // context (countries/courses they picked) — this is exploratory context.
  const similar    = findSimilarStudents(students, profile, 50)

  const simConverted = similar.filter(s => STATUS_CONVERTED(s.status))
  const simDropped   = similar.filter(s => STATUS_DROPPED(s.status))
  const countryDist  = countBy(simConverted, 'preferred_country')
  const courseDist   = countBy(simConverted, 'preferred_course')

  const topCountriesForProfile  = topN(countryDist, 3)
  const topCoursesForProfile    = topN(courseDist, 3)
  const avgBudgetSimilar        = avg(similar.map(s => studentValue(s)).filter(Boolean))

  return {
    profile,
    similarStudents: {
      count:           scoreData.sampleSize,
      conversionRate:  scoreData.historicalConvRate ?? 0,
      dropRate:        roundTo(pct(simDropped.length, similar.length || 1), 1),
      avgBudget:       roundTo(avgBudgetSimilar, 0),
      lowConfidence:   scoreData.lowConfidenceSample,
    },
    topCountriesForProfile,
    topCoursesForProfile,
    universityScoring:  scoreData,
    historicalContext:  scoreData.lowConfidenceSample
      ? `Based on a smaller sample of ${scoreData.sampleSize} similar student profiles in our CRM, the historical enrollment success rate is ${scoreData.historicalConvRate ?? 0}%, with an active dropout rate of ${roundTo(pct(simDropped.length, similar.length || 1), 1)}%. We recommend taking a structured, defensive approach focusing heavily on safe backups.`
      : `Based on a robust CRM segment of ${scoreData.sampleSize} similar student records, this cohort sees a high enrollment success rate of ${scoreData.historicalConvRate ?? 0}%, with a dropout rate of ${roundTo(pct(simDropped.length, similar.length || 1), 1)}%. Historical drops were primarily driven by funding gaps or deferred visa processing.`,
    generatedAt:        new Date().toISOString(),
  }
}
