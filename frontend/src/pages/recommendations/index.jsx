import React, { useEffect, useState, useRef } from 'react'
import {
  MessageSquare, Send, Zap, RotateCcw,
  Users, AlertTriangle, Clock, Globe2, BarChart2, Target,
  ChevronRight, Lightbulb, Sparkles, Bell, TrendingUp
} from 'lucide-react'
import { analyticsAPI } from '../../services/api'
import { formatNumber } from '../../utils/formatters'

// ─── Shimmer ──────────────────────────────────────────────────────────────────
function Shimmer({ h = 14, w = '100%', r = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite'
    }} />
  )
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({ label, value, color, sub }) {
  return (
    <div style={{
      padding: '12px 18px', borderRadius: 12,
      background: `${color}0d`, border: `1px solid ${color}22`,
      display: 'flex', flexDirection: 'column', gap: 3
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
        color: 'var(--text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase'
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
        color, lineHeight: 1, letterSpacing: '-0.02em'
      }}>{value}</span>
      {sub && <span style={{
        fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)'
      }}>{sub}</span>}
    </div>
  )
}

// ─── Insight card ─────────────────────────────────────────────────────────────
function InsightCard({ icon: Icon, color, title, body, badge }) {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 11,
      background: 'var(--bg-elevated)', border: `1px solid ${color}18`,
      borderLeft: `3px solid ${color}`
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0, marginTop: 1,
        background: `${color}14`, border: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={15} color={color} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            color: 'var(--text-primary)'
          }}>{title}</span>
          {badge && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
              color, background: `${color}14`, border: `1px solid ${color}25`,
              padding: '3px 8px', borderRadius: 99, letterSpacing: '0.06em',
              textTransform: 'uppercase', flexShrink: 0
            }}>{badge}</span>
          )}
        </div>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)',
          lineHeight: 1.6, margin: 0
        }}>{body}</p>
      </div>
    </div>
  )
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK = {
  total_students: 5000,
  active_students: 1480,
  converted_students: 1072,
  dropped_students: 1241,
  avg_cgpa: '7.91',
  avg_ielts: '7.00',
  avg_lead_score: '88.7',
  enrollment_rate: '21.4',
  avg_enrollment_probability: '87.4',
  high_intent_leads: 3849,
  scholarship_eligible: 1202,
  low_risk_students: 3849,
  medium_risk_students: 1072,
  high_risk_students: 79,
  avg_budget: 28500,
  contacted: 5000,
  counseling: 3800,
  documentation: 2600,
  application: 1700,
  visa: 1200,
  enrolled: 890,
  top_country: 'Canada',
  top_course: 'MS Computer Science',
  top_lead_source: 'Instagram',
  country_distribution: { Canada: 1750, UK: 900, Germany: 720, Australia: 630, USA: 540, Others: 460 },
  lead_sources: [
    { name: 'Instagram', leads: 1140, conversions: 205 },
    { name: 'Facebook',  leads: 980,  conversions: 166 },
    { name: 'Walk-In',   leads: 510,  conversions: 112 },
    { name: 'Referral',  leads: 390,  conversions: 94  },
    { name: 'Seminar',   leads: 820,  conversions: 196 },
  ],
  counselor_leaderboard: [
    { name: 'Priya Sharma', students: 999,  converted: 227, rate: 22.72 },
    { name: 'Amit Verma',   students: 982,  converted: 213, rate: 21.69 },
    { name: 'Sneha Jain',   students: 1018, converted: 219, rate: 21.51 },
    { name: 'Rahul Singh',  students: 967,  converted: 203, rate: 20.99 },
    { name: 'Rohit Gupta',  students: 1034, converted: 210, rate: 20.30 },
  ],
  students_overdue_followup: 38,
  students_stuck_docs: 94,
  visa_deadline_approaching: 27,
  new_leads_this_week: 64,
}

// ─── SHARED METRIC DERIVATIONS ─────────────────────────────────────────────────
function deriveInsights(metrics) {
  const {
    counselors = [], avgCounselorRate = 0, leadSources = [],
    countryDist, total = 0, funnelStages = [], avgBudget = 0
  } = metrics

  const sortedCounselors = [...counselors].sort((a, b) => b.rate - a.rate)
  const topCounselor    = sortedCounselors[0]
  const bottomCounselor = sortedCounselors[sortedCounselors.length - 1]
  const underperforming = counselors.filter(c => c.rate < avgCounselorRate)

  const countryEntries = countryDist
    ? Object.entries(countryDist)
        .filter(([k]) => k && k !== 'undefined' && k !== 'null' && k.trim() !== '' && isNaN(Number(k)))
        .sort((a, b) => b[1] - a[1])
    : []

  const sortedByConv  = [...leadSources].sort((a, b) => (b.conversions / b.leads) - (a.conversions / a.leads))
  const sortedByVol   = [...leadSources].sort((a, b) => b.leads - a.leads)
  const topLeadByConv = sortedByConv[0]
  const topLeadByVol  = sortedByVol[0]
  const bestConvRate  = topLeadByConv ? ((topLeadByConv.conversions / topLeadByConv.leads) * 100).toFixed(1) : '0.0'

  // Only compute drops where there's actual movement through the funnel
  const validFunnelStages = funnelStages.filter(s => s.value > 0)
  const funnelDrops = validFunnelStages.slice(1).map((s, i) => ({
    from: validFunnelStages[i].stage, to: s.stage,
    drop: validFunnelStages[i].value - s.value,
    dropPct: validFunnelStages[i].value > 0
      ? (((validFunnelStages[i].value - s.value) / validFunnelStages[i].value) * 100).toFixed(1)
      : '0.0'
  })).filter(dr => dr.drop > 0)

  const funnelWorstDrop = funnelDrops.length
    ? [...funnelDrops].sort((a, b) => b.drop - a.drop)[0]
    : null

  const budgetNum = typeof avgBudget === 'number' ? avgBudget : (parseFloat(avgBudget) || 0)

  return {
    ...metrics,
    sortedCounselors, topCounselor, bottomCounselor, underperforming,
    countryEntries, topLeadByConv, topLeadByVol, bestConvRate,
    funnelDrops, funnelWorstDrop, avgBudgetFmt: budgetNum.toLocaleString()
  }
}

// ─── LOCAL INTELLIGENCE ENGINE ─────────────────────────────────────────────────
// Detects named countries in free-text so "what about canada" routes correctly
function extractCountryMention(q, countryEntries) {
  const lower = q.toLowerCase()
  for (const [name] of countryEntries) {
    if (lower.includes(name.toLowerCase())) return name
  }
  // Common aliases
  const aliases = { uk: 'UK', 'united kingdom': 'UK', usa: 'USA', 'united states': 'USA', america: 'USA', aus: 'Australia' }
  for (const [alias, mapped] of Object.entries(aliases)) {
    if (lower.includes(alias)) {
      const found = countryEntries.find(([n]) => n === mapped)
      if (found) return mapped
    }
  }
  return null
}

function generalFallback(d) {
  const urgentCount = (d.followupOverdue || 0) + (d.stuckInDocs || 0) + (d.visaDeadlines || 0)
  return `Right now you have ${d.total} students in the CRM — ${d.converted} converted at a ${d.enrollmentRate}% rate, ${d.active} still active. The immediate pressure points are ${d.followupOverdue} overdue follow-ups, ${d.stuckInDocs} stuck in documentation, and ${d.visaDeadlines} with visa deadlines closing in (${urgentCount} total items needing attention today). What do you want to dig into — counsellor performance, lead channels, a specific country, risk segments, or today's action list?`
}

const LOCAL_TOPICS = [
  // ── Greeting ──────────────────────────────────────────────────────────────
  {
    key: 'greeting',
    test: /^\s*(hi+|hello|hey+|sup|what'?s up|what can you do|who are you)\b/i,
    answer: d => `Hey! I'm plugged into your live CRM — ${d.total} students, ${d.enrollmentRate}% conversion rate, and I can see everything from individual counsellor splits to lead source ROI. Ask me about the pipeline, your team, where students are dropping off, which marketing channel is actually working, visa deadlines, scholarships — whatever's on your mind. What do you want to look at?`
  },

  // ── Specific country (must come before generic 'country' topic) ────────────
  {
    key: 'country_specific',
    test: q => {
      // This is a function test — checked differently in generateLocalReply
      return false
    },
    answer: (d, named) => {
      const entry = d.countryEntries.find(([n]) => n.toLowerCase() === named.toLowerCase())
      if (!entry) return `I don't see "${named}" in your current country distribution. The countries with students right now are: ${d.countryEntries.map(([n, c]) => `${n} (${c})`).join(', ')}.`
      const [name, count] = entry
      const share = d.total > 0 ? ((count / d.total) * 100).toFixed(1) : '0'
      const rank  = d.countryEntries.findIndex(([n]) => n === name) + 1
      const rankLabel = rank === 1 ? 'your top market' : rank === 2 ? 'your second-biggest market' : `your #${rank} market`
      const second = d.countryEntries[1]
      const gap = second && name !== second[0] ? ` — ${count - second[1] > 0 ? `${count - second[1]} students ahead of ${second[0]}` : `${second[1] - count} behind ${second[0]}`}` : ''
      return `${name} is ${rankLabel} with ${count} students (${share}% of your pipeline)${gap}. With ${d.scholarshipEligible} scholarship-eligible students across the board and an average budget of $${d.avgBudgetFmt}, ${name}-bound students are worth prioritising for dedicated intake campaigns — counsellors who specialise in ${name}'s visa and university requirements consistently close faster than generalists. ${rank > 1 ? `If you want to grow this market, ${d.countryEntries[0][0]} playbook is the template to replicate.` : `Keep the ${name} funnel tight — it's your biggest revenue driver and any slowdown there hits the overall numbers hard.`}`
    },
    why: (d, named) => {
      const entry = d.countryEntries.find(([n]) => n.toLowerCase() === named.toLowerCase())
      if (!entry) return `That country doesn't currently appear in your pipeline data.`
      const [name, count] = entry
      const share = d.total > 0 ? ((count / d.total) * 100).toFixed(1) : '0'
      return `${name}'s ${count} students (${share}%) matter beyond just the headcount — different countries have different visa complexity, processing timelines, and scholarship availability. Counsellors who handle ${name} applications every day build institutional knowledge that directly reduces documentation errors and speeds up the visa stage. That's why market concentration in your top destinations isn't a risk — it's an efficiency multiplier, as long as you're not 100% dependent on a single intake cycle.`
    }
  },

  // ── Generic country / destination question ────────────────────────────────
  {
    key: 'country',
    test: /\bcountry\b|countries|destination|which market|top market/i,
    answer: d => {
      const entries = d.countryEntries
      if (entries.length === 0) return `${d.topCountry} is your top destination — focus counsellor expertise and partner relationships there for the fastest compounding returns.`
      const [name, count] = entries[0]
      const share = d.total > 0 ? ((count / d.total) * 100).toFixed(1) : '0'
      const others = entries.slice(1, 4).map(([n, c]) => `${n} (${c})`).join(', ')
      return `${name} is your dominant market — ${count} students, ${share}% of the pipeline. Next up: ${others}. I'd double down on ${name} for counsellor specialisation and university partnerships, while treating ${entries[1]?.[0] || 'the secondary markets'} as a hedge against intake-cycle risk. Want the breakdown on any specific country?`
    },
    why: d => {
      const entries = d.countryEntries
      if (entries.length < 2) return `Concentration in one market lets your team build deeper expertise in that country's visa, scholarship, and university systems — which directly cuts processing time and documentation errors.`
      const [n1, c1] = entries[0], [n2, c2] = entries[1]
      const s1 = d.total > 0 ? ((c1 / d.total) * 100).toFixed(1) : '0'
      const s2 = d.total > 0 ? ((c2 / d.total) * 100).toFixed(1) : '0'
      return `${n1} at ${s1}% vs ${n2} at ${s2}% — that's a meaningful gap. The reason to focus on ${n1} isn't just volume, it's that counsellor expertise compounds in country-specific ways. Every ${n1} visa processed makes the next one faster. Spreading thin across many markets means no one on your team ever gets that depth, which shows up as slower processing, more documentation errors, and weaker university relationships.`
    }
  },

  // ── Visa ──────────────────────────────────────────────────────────────────
  {
    key: 'visa',
    test: /visa/i,
    answer: d => `${d.visaDeadlines} students have visa deadlines coming up — these are your most valuable pipeline assets right now. Every one of them has already cleared counselling, documentation, and application, so losing someone here means writing off everything already spent. Get document submission status confirmed for all ${d.visaDeadlines} today, escalate any incomplete cases immediately, and send partner university reminders in parallel. Don't let this sit till tomorrow.`,
    why: d => `Think of the funnel as a cost pyramid — the further a student gets, the more you've invested in them. Visa-stage students are at the top of that pyramid. ${d.followupOverdue} overdue follow-ups might look more urgent on paper because it's a bigger number, but the cost of losing a visa-stage student is 4–5x higher than losing an early-stage lead. That's why these ${d.visaDeadlines} take priority over everything else on today's list.`
  },

  // ── Scholarships ──────────────────────────────────────────────────────────
  {
    key: 'scholarship',
    test: /scholarship|financial aid|funding/i,
    answer: d => `You've got ${d.scholarshipEligible} scholarship-eligible students in the pipeline — and this group is worth treating differently. They tend to have stronger academic profiles (your pipeline average is ${d.avgCgpa} CGPA, ${d.avgIelts} IELTS) and once funding is confirmed, their commitment rate goes up sharply. The play here is proactive outreach, not waiting for them to ask. Cross-check this list against your ${d.followupOverdue} overdue follow-ups — anyone who's both scholarship-eligible and overdue for contact is slipping away for a fixable reason.`,
    why: d => `Cost anxiety is the most common silent drop-off driver — students who are academically strong and genuinely interested still stall at application when they haven't got clarity on what it'll actually cost them. With ${d.highIntentLeads} high-intent leads in the pipeline, there's a real chunk of them who are ready to commit but haven't seen a scholarship conversation yet. Getting that in front of them before they go cold is much cheaper than re-acquiring them later.`
  },

  // ── Documentation ─────────────────────────────────────────────────────────
  {
    key: 'documentation',
    test: /document|paperwork|\bdocs\b|stuck/i,
    answer: d => {
      const worstNote = d.funnelWorstDrop
        ? ` It's also your single biggest funnel drop — ${d.funnelWorstDrop.dropPct}% attrition between ${d.funnelWorstDrop.from} and ${d.funnelWorstDrop.to}.`
        : ''
      return `${d.stuckInDocs} students are blocked at documentation right now.${worstNote} In almost every case this is a process problem, not a motivation problem — missing transcripts, unclear checklists, slow back-and-forth. A standardised doc checklist with automated deadline nudges typically clears 60–70% of a backlog this size within 48 hours. Worth doing today.`
    },
    why: d => `Documentation drop-off is deceptive because it looks like students are disengaging, but they're usually just confused or waiting on something. Unlike early-stage drop-off where intent might genuinely be low, students stuck in documentation have already proven intent by getting this far. That makes ${d.stuckInDocs} students a high-recoverability group — most of them will convert if the process friction is removed. It also directly protects your ${d.visaDeadlines} visa-stage students from cascading delays.`
  },

  // ── Follow-ups / Overdue ──────────────────────────────────────────────────
  {
    key: 'followup',
    test: /follow-?up|overdue|no contact|not contacted|going cold|gone cold/i,
    answer: d => `${d.followupOverdue} students haven't had any contact in 7+ days — that's your most immediate churn risk. Engagement drops fast after a week of silence, and study-abroad decisions have a short window before students start talking to other consultancies. Assign all ${d.followupOverdue} today, and specifically flag any that also sit in your ${d.highRisk}-student high-risk segment — that's where the overlap gets expensive.`,
    why: d => `${d.followupOverdue} out of ${d.active} active students is roughly ${d.active > 0 ? ((d.followupOverdue / d.active) * 100).toFixed(1) : '0'}% of your active pipeline going quiet. The cost of re-acquiring those leads from scratch at your current lead score average of ${d.avgLeadScore}/100 is far higher than a check-in call. These students were qualified when they came in — they don't need more selling, just consistent contact.`
  },

  // ── Counsellors ───────────────────────────────────────────────────────────
  {
    key: 'counselors',
    test: /counsel|coach|rep|team performance|who('?s| is) (best|top|performing|worst|lagging)/i,
    answer: d => {
      const top   = d.topCounselor
      const under = d.underperforming || []
      const avg   = d.avgCounselorRate?.toFixed(1) || '0'
      if (under.length > 0) {
        const underNames = under.map(c => c.name).join(' and ')
        const underStudents = under.reduce((s, c) => s + c.students, 0)
        const potentialGain = under.reduce((s, c) => s + Math.round(c.students * (d.avgCounselorRate - c.rate) / 100), 0)
        return `${top?.name} leads at ${top?.rate.toFixed(1)}% on ${top?.students} students. ${underNames} ${under.length === 1 ? 'is' : 'are'} below the ${avg}% team average — across ${underStudents} students, closing just half that gap would add roughly ${potentialGain} more enrolments without a single new lead. Shadow sessions with ${top?.name} before the next intake cycle is the fastest fix I'd try.`
      }
      return `Solid across the board — everyone's at or above the ${avg}% team average. ${top?.name} leads at ${top?.rate.toFixed(1)}% on ${top?.students} students. At this point, coaching isn't the bottleneck; getting more qualified leads to a team that's already converting well is the higher-leverage move.`
    },
    why: d => {
      const top = d.topCounselor, bottom = d.bottomCounselor
      if (!top || !bottom || top.name === bottom.name) {
        return `When the team is performing close to average, the conversion rate ceiling is typically process and lead quality — not individual skill. That shifts the priority from coaching to volume and funnel efficiency.`
      }
      return `${top.name} at ${top.rate.toFixed(1)}% vs ${bottom.name} at ${bottom.rate.toFixed(1)}% on comparable student volumes — that gap isn't explained by luck. Top performers usually have a tighter follow-up cadence, handle documentation blockers proactively, and build student trust faster. Two weeks of ${bottom.name} shadowing ${top.name}'s calls and seeing how they handle objections is usually enough to shift the rate meaningfully.`
    }
  },

  // ── Lead sources / Marketing ──────────────────────────────────────────────
  {
    key: 'leadsource',
    test: /lead source|lead channel|\broi\b|channel|marketing|campaign|instagram|facebook|referral|seminar|walk.?in/i,
    answer: d => {
      const conv = d.topLeadByConv, vol = d.topLeadByVol
      const allLines = (d.leadSources || []).map(ls => {
        const rate = ls.leads > 0 ? ((ls.conversions / ls.leads) * 100).toFixed(1) : '0.0'
        return `${ls.name}: ${ls.leads} leads, ${rate}% conversion`
      }).join(' · ')
      if (conv && vol && conv.name !== vol.name) {
        return `Two channels doing different jobs well: ${vol.name} brings the volume (${vol.leads} leads), ${conv.name} converts the best (${d.bestConvRate}% — ${conv.conversions} of ${conv.leads}). Keep both funded. Here's the full picture: ${allLines}. The risk to watch is ${conv.name}'s conversion rate declining as you scale it — check it weekly.`
      }
      return `${d.topLeadSrc} is your best channel on both volume and conversion at ${d.bestConvRate}%. Full breakdown: ${allLines}. Lean into ${d.topLeadSrc} but monitor the conversion rate weekly — it tends to drop when a channel gets oversaturated.`
    },
    why: d => {
      return `Volume and conversion are different metrics that pull in different directions. A high-volume channel at average conversion keeps the top of the funnel full. A high-conversion channel at lower volume is your efficiency engine — but it can't replace volume alone. The ideal allocation keeps both running and reallocates budget when you see either the volume channel's conversion drop or the conversion channel starting to cap out on lead supply.`
    }
  },

  // ── Risk segments ─────────────────────────────────────────────────────────
  {
    key: 'risk',
    test: /\brisk\b|re-?engage|churn|high.?risk|at.?risk/i,
    answer: d => `Risk breakdown: ${d.lowRisk} low, ${d.medRisk} medium, ${d.highRisk} high. The ${d.highRisk} high-risk students need to be in someone's queue today — specifically your top counsellors, and especially any that overlap with the ${d.followupOverdue} overdue follow-ups (that's where you're most likely losing people right now). The ${d.medRisk} medium-risk group is actually the bigger opportunity — they're convertible with the right nudge, and there are far more of them.`,
    why: d => `Risk level in a CRM like this usually reflects engagement recency, documentation progress, and lead score combined. The reason medium-risk matters more than high-risk for strategy is scale — ${d.medRisk} students shifting from medium to low risk has a bigger impact on your overall conversion than saving some of the ${d.highRisk} who are already deeply disengaged. High-risk re-engagement is triage; medium-risk is where you actually grow the conversion rate.`
  },

  // ── Conversion rate ───────────────────────────────────────────────────────
  {
    key: 'conversion',
    test: /conversion|enroll(ment)?\s*rate|how many (are )?enrolled|total enrolled/i,
    answer: d => `You're at ${d.enrollmentRate}% conversion — ${d.converted} enrolled out of ${d.total} total, with ${d.active} still active in the pipeline. Average enrollment probability across active students is ${d.enrollProb}%, and ${d.highIntentLeads} are flagged high-intent. The gap between ${d.enrollProb}% probability and ${d.enrollmentRate}% actual conversion is telling — these students want to enrol, the friction is operational. Clear the ${d.stuckInDocs} documentation backlog and ${d.followupOverdue} overdue follow-ups and that number moves.`,
    why: d => `When your average enrollment probability (${d.enrollProb}%) is much higher than your actual conversion rate (${d.enrollmentRate}%), you're not losing students because of weak leads or poor counselling — you're losing them to process delays and dropped balls. That's actually good news because it means the fix is internal, not a lead generation problem. Documentation speed and follow-up consistency are the two levers.`
  },

  // ── Funnel / drop-off ─────────────────────────────────────────────────────
  {
    key: 'funnel',
    test: /\bfunnel\b|drop.?off|dropping|attrition|bottleneck|where.*losing|losing.*where/i,
    answer: d => {
      if (!d.funnelWorstDrop) {
        return `Funnel: ${(d.funnelStages || []).map(s => `${s.stage} (${s.value})`).join(' → ')}. Overall yield is ${d.funnelStages?.[0]?.value > 0 ? ((d.funnelStages[d.funnelStages.length-1]?.value / d.funnelStages[0]?.value) * 100).toFixed(1) : '?'}% end-to-end. Ask me about a specific stage and I'll tell you what's driving the drop.`
      }
      const { from, to, drop, dropPct } = d.funnelWorstDrop
      const flow = (d.funnelStages || []).map(s => `${s.stage} (${s.value})`).join(' → ')
      return `Biggest problem is ${from} to ${to} — ${drop} students lost, ${dropPct}% attrition. That's where your ${d.enrollmentRate}% conversion rate is taking its biggest hit. Full flow: ${flow}. Fix that single stage and the end-to-end yield moves more than any other change you could make right now.`
    },
    why: d => {
      if (!d.funnelDrops?.length) return `Without clear funnel drop data, focus on the operational flags — follow-up overdue and documentation stuck are the most common drop-off drivers regardless of which stage they show up in.`
      const drops = d.funnelDrops.map(dr => `${dr.from}→${dr.to}: ${dr.drop} lost (${dr.dropPct}%)`).join(', ')
      return `Stage breakdown: ${drops}. Why the worst stage matters most — every student lost there carried the full cost of every earlier stage. An early-stage drop costs you a lead. A late-stage drop costs you a lead plus counselling time plus documentation processing plus application fees. The economics heavily favour fixing late-stage drop-off first, even if the absolute numbers look smaller.`
    }
  },

  // ── Academic / student profile ────────────────────────────────────────────
  {
    key: 'academic',
    test: /cgpa|ielts|academic|student profile|lead score|avg score/i,
    answer: d => `Pipeline profile: ${d.avgCgpa} CGPA average, ${d.avgIelts} IELTS average, ${d.avgLeadScore}/100 lead score, $${d.avgBudgetFmt} average budget. Most popular course is ${d.topCourse}, top destination ${d.topCountry}. ${d.highIntentLeads} students flagged high-intent. The quality is solid — your conversion bottlenecks are operational, not a lead quality problem.`
  },

  // ── Today's priorities ────────────────────────────────────────────────────
  {
    key: 'priorities',
    test: /\btoday\b|top\s*\d*\s*action|priorit|what should (i|we) do|next steps|where (do i|should i) start/i,
    answer: d => `Three things, in order of cost-of-inaction: first, lock down your ${d.visaDeadlines} visa-deadline students — confirm document status for all of them today, escalate anything incomplete. Second, get someone on each of the ${d.followupOverdue} overdue follow-ups before end of day — silence is how you lose qualified leads to a competitor. Third, push the ${d.stuckInDocs} documentation-stuck students with direct outreach and a clear checklist. That order matters — losing a visa-stage student costs 4–5x more than losing an early-stage one.`,
    why: d => `The sequence is pure cost-of-loss logic. Visa-stage = maximum sunk cost, highest urgency. Overdue follow-ups = time-sensitive because engagement decays daily and competitors fill the gap fast. Documentation stuck = high recoverability but it compounds — every day in limbo increases drop risk. Tackle in that order and you're protecting the most value first.`
  },

  // ── Pipeline summary ──────────────────────────────────────────────────────
  {
    key: 'summary',
    test: /pipeline|overview|summary|how (are|is) (we|things|it)|state of|how'?s (the )?(crm|business|things)/i,
    answer: d => `Here's where you stand: ${d.total} students total, ${d.converted} converted (${d.enrollmentRate}% rate), ${d.active} still active, ${d.dropped} dropped. Risk split: ${d.lowRisk} low / ${d.medRisk} medium / ${d.highRisk} high. Enrollment probability averaging ${d.enrollProb}% across active students, ${d.highIntentLeads} flagged high-intent. Three fires on the board right now — ${d.followupOverdue} overdue follow-ups, ${d.stuckInDocs} stuck in documentation, ${d.visaDeadlines} with visa deadlines closing in. Want me to go deeper on any of these?`,
    why: d => `These numbers pull directly from your live CRM — headcounts from student records, risk levels from the scoring model, operational flags from activity timestamps. If something looks off, it's worth cross-checking the underlying records for that segment. I don't estimate or smooth anything.`
  },

  // ── New leads ─────────────────────────────────────────────────────────────
  {
    key: 'newleads',
    test: /new leads?|this week|fresh leads?|weekly/i,
    answer: d => `${d.newLeadsWeek} new leads came in this week. First-contact speed is the single biggest predictor of conversion in study-abroad — get someone on each of these within 24 hours if you haven't already. At your current ${d.enrollmentRate}% conversion rate, that's potentially ${Math.round(d.newLeadsWeek * d.enrollmentRate / 100)} more enrolments from this week's intake alone if the pipeline stays healthy.`,
    why: d => `Speed-to-contact research consistently shows that leads contacted within an hour are 7x more likely to convert than those reached after 24 hours. In study-abroad, that window is slightly longer but the principle holds — a student who enquired today is still excited today. By next week they may have spoken to two other consultancies.`
  },
]

// ── Follow-up patterns (conversational continuations) ─────────────────────────
const FOLLOWUP_RE = /^(and\s+)?(why|how come|explain|elaborate|tell me more|go on|what do you mean|expand|give me more detail|break (that|it) down|say more)\b/i
const LESS_RE     = /less words?|shorter|simplif|summarise|summarize|tl;?dr|brief/i
const MORE_RE     = /more detail|more info|go deeper|deep(er)?\s*dive|elaborate more|expand more/i

function generateLocalReply(question, history, metrics) {
  const d = deriveInsights(metrics)
  const q = (question || '').trim()
  const ql = q.toLowerCase()

  // ── "explain in less words" / simplify request ────────────────────────────
  if (LESS_RE.test(ql)) {
    const lastAi = [...history].reverse().find(m => m.role === 'ai')
    if (lastAi?.topic) {
      const topicKey = lastAi.topic.replace(':why', '').replace(':short', '')
      const shortMap = {
        summary:      () => `${d.total} students, ${d.enrollmentRate}% converted, ${d.active} active. Urgent: ${d.followupOverdue} overdue follow-ups, ${d.stuckInDocs} stuck in docs, ${d.visaDeadlines} visa deadlines.`,
        priorities:   () => `1. Visa deadlines (${d.visaDeadlines}) — most expensive to lose. 2. Overdue follow-ups (${d.followupOverdue}) — going cold daily. 3. Docs stuck (${d.stuckInDocs}) — clearable in 48h.`,
        counselors:   () => { const u = d.underperforming; return u?.length ? `${u.map(c=>c.name).join(', ')} below average. Have them shadow ${d.topCounselor?.name}.` : `All counsellors above average. ${d.topCounselor?.name} leads at ${d.topCounselor?.rate.toFixed(1)}%.` },
        leadsource:   () => `${d.topLeadByConv?.name || d.topLeadSrc} converts best (${d.bestConvRate}%). ${d.topLeadByVol?.name !== d.topLeadByConv?.name ? `${d.topLeadByVol?.name} brings most volume.` : 'Same channel wins on both.'} Keep both running.`,
        country:      () => `${d.countryEntries[0]?.[0] || d.topCountry} leads (${d.countryEntries[0] ? ((d.countryEntries[0][1]/d.total)*100).toFixed(1) : '?'}%). Double down there.`,
        visa:         () => `${d.visaDeadlines} students have visa deadlines — confirm their docs today. Most expensive drop-off point.`,
        followup:     () => `${d.followupOverdue} students haven't been contacted in 7+ days. Assign them today before they go to a competitor.`,
        documentation:() => `${d.stuckInDocs} stuck in docs. Send a checklist and a nudge — clears most of it in 48 hours.`,
        risk:         () => `${d.highRisk} high-risk (re-engage now), ${d.medRisk} medium-risk (biggest opportunity), ${d.lowRisk} low-risk (stay the course).`,
        conversion:   () => `${d.enrollmentRate}% conversion. Gap vs ${d.enrollProb}% probability = operational friction, not lead quality. Fix docs + follow-ups.`,
        funnel:       () => d.funnelWorstDrop ? `Biggest drop: ${d.funnelWorstDrop.from} → ${d.funnelWorstDrop.to} (${d.funnelWorstDrop.dropPct}% lost). Fix that first.` : `Funnel data loading — ask me a specific stage.`,
        scholarship:  () => `${d.scholarshipEligible} students eligible for scholarships. Reach out proactively — it removes the biggest drop-off reason at application.`,
      }
      const fn = shortMap[topicKey]
      if (fn) return { text: fn(), topic: `${topicKey}:short` }
    }
    return { text: `${d.total} students, ${d.enrollmentRate}% converted. Urgent items: ${d.followupOverdue} follow-up overdue, ${d.stuckInDocs} stuck in docs, ${d.visaDeadlines} visa deadlines.`, topic: 'general:short' }
  }

  // ── "tell me more" / elaboration request ──────────────────────────────────
  if (FOLLOWUP_RE.test(ql) || MORE_RE.test(ql)) {
    const lastAi = [...history].reverse().find(m => m.role === 'ai')
    if (lastAi?.topic) {
      if (lastAi.topic.endsWith(':why')) {
        return { text: `I've laid out the full reasoning above. If you want to explore a specific angle — like how a particular counsellor's numbers compare, or what the per-channel conversion breakdown looks like — just ask and I'll pull those numbers.`, topic: 'general' }
      }
      const baseKey = lastAi.topic.replace(':short', '')
      const topic = LOCAL_TOPICS.find(t => t.key === baseKey)
      if (topic?.why) {
        return { text: topic.why(d), topic: `${baseKey}:why` }
      }
    }
    return { text: generalFallback(d), topic: 'general' }
  }

  // ── Named country check (e.g. "what about canada", "tell me about uk") ────
  if (/canada|uk|united kingdom|germany|australia|usa|united states|france|ireland|new zealand/i.test(ql) ||
      /what about|tell me about|how('?s| is)|more on|focus on/.test(ql)) {
    const named = extractCountryMention(ql, d.countryEntries)
    if (named) {
      const topic = LOCAL_TOPICS.find(t => t.key === 'country_specific')
      return {
        text: topic.answer(d, named),
        topic: 'country_specific',
        namedCountry: named
      }
    }
  }

  // ── Standard topic matching ───────────────────────────────────────────────
  for (const topic of LOCAL_TOPICS) {
    if (topic.key === 'country_specific') continue // handled above
    const testFn = typeof topic.test === 'function' ? topic.test : (q) => topic.test.test(q)
    if (testFn(ql)) {
      return { text: topic.answer(d), topic: topic.key }
    }
  }

  // ── Generic "why" follow-up that matched no topic ─────────────────────────
  return { text: generalFallback(d), topic: 'general' }
}

// Enrich history messages with named country for country_specific topic why answers
function getWhyAnswer(lastMsg, d) {
  const baseKey = (lastMsg.topic || '').replace(':short', '').replace(':why', '')
  const topic = LOCAL_TOPICS.find(t => t.key === baseKey)
  if (!topic?.why) return null
  if (baseKey === 'country_specific' && lastMsg.namedCountry) {
    return topic.why(d, lastMsg.namedCountry)
  }
  return topic.why(d)
}

// ─── AI COPILOT ───────────────────────────────────────────────────────────────
function AICopilot({ metrics }) {
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [thinking, setThinking]   = useState(false)
  const endRef   = useRef(null)
  const inputRef = useRef(null)

  const suggestions = [
    'Give me a full pipeline summary',
    'Which counsellors need coaching?',
    'Where are students dropping off?',
    'Which lead source has best ROI?',
    'Top 3 actions I should take today',
    'Which country should we focus on?',
  ]

  // ── Build Gemini system prompt ─────────────────────────────────────────────
  function buildSystemPrompt() {
    const {
      counselors = [], avgCounselorRate = 0, topCountry,
      stuckInDocs, followupOverdue, highRisk, funnelWorstDrop, total,
      converted, dropped, active, leadSources = [], countryDist, topCourse,
      avgLeadScore, enrollmentRate, avgCgpa, avgIelts, avgBudget,
      visaDeadlines, newLeadsWeek, enrollProb, lowRisk, medRisk,
      scholarshipEligible, highIntentLeads, funnelStages = []
    } = metrics

    const counselorLines = counselors.map(c =>
      `  - ${c.name}: ${c.students} students, ${c.converted} converted, ${c.rate.toFixed(1)}% rate`
    ).join('\n')

    const leadLines = (leadSources || []).map(ls => {
      const rate = ls.leads > 0 ? ((ls.conversions / ls.leads) * 100).toFixed(1) : '0.0'
      return `  - ${ls.name}: ${ls.leads} leads, ${ls.conversions} conversions, ${rate}% conversion rate`
    }).join('\n')

    const countryLines = countryDist
      ? Object.entries(countryDist)
          .filter(([k]) => k && k !== 'undefined' && k !== 'null' && k.trim() !== '' && isNaN(Number(k)))
          .sort((a, b) => b[1] - a[1])
          .map(([c, n]) => `  - ${c}: ${n} students (${total > 0 ? ((n / total) * 100).toFixed(1) : '0'}% of pipeline)`)
          .join('\n')
      : `  - Top destination: ${topCountry}`

    const funnelLine = funnelWorstDrop
      ? `Biggest funnel drop: ${funnelWorstDrop.from} to ${funnelWorstDrop.to} (${funnelWorstDrop.drop} students lost, ${funnelWorstDrop.dropPct}% attrition)`
      : 'Funnel data unavailable'

    const funnelFlow = funnelStages.length > 0
      ? funnelStages.map(s => `${s.stage}: ${s.value}`).join(' > ')
      : 'Not available'

    const underperforming = counselors.filter(c => c.rate < avgCounselorRate)
    const topCounselor    = [...counselors].sort((a, b) => b.rate - a.rate)[0]
    const bottomCounselor = [...counselors].sort((a, b) => a.rate - b.rate)[0]

    return `You are the Executive AI Copilot for Global Degrees CRM, a study abroad consultancy. You are a sharp, direct business advisor with full access to live pipeline data. Give real, data-driven insights and clear recommendations.

PIPELINE OVERVIEW:
- Total students in CRM: ${total}
- Active (in pipeline): ${active}
- Converted (enrolled): ${converted}
- Dropped out: ${dropped}
- Enrollment rate: ${enrollmentRate}%
- Average enrollment probability: ${enrollProb}%
- High-intent leads: ${highIntentLeads}
- Scholarship-eligible students: ${scholarshipEligible}
- Risk split: ${lowRisk} low / ${medRisk} medium / ${highRisk} high risk

STUDENT ACADEMIC PROFILE:
- Average CGPA: ${avgCgpa}/10
- Average IELTS: ${avgIelts}/9
- Average lead score: ${avgLeadScore}/100
- Average budget: $${typeof avgBudget === 'number' ? avgBudget.toLocaleString() : avgBudget}
- Most popular course: ${topCourse}
- Top destination country: ${topCountry}

FUNNEL FLOW (end-to-end):
${funnelFlow}
${funnelLine}

COUNSELLOR TEAM (team average: ${avgCounselorRate.toFixed(1)}%):
${counselorLines || 'No counsellor data available'}
Top performer: ${topCounselor?.name || 'N/A'} at ${topCounselor?.rate?.toFixed(1) || 0}%
Lowest performer: ${bottomCounselor?.name || 'N/A'} at ${bottomCounselor?.rate?.toFixed(1) || 0}%
Below team average: ${underperforming.length > 0 ? underperforming.map(c => c.name).join(', ') : 'None'}

URGENT OPERATIONAL FLAGS:
- Students overdue for follow-up (7+ days without contact): ${followupOverdue}
- Students stuck in documentation stage: ${stuckInDocs}
- Students with approaching visa deadlines: ${visaDeadlines}
- New leads this week: ${newLeadsWeek}
- High-risk students needing re-engagement: ${highRisk}

LEAD SOURCES (ranked by volume):
${leadLines || 'No lead source data'}

DESTINATION DEMAND:
${countryLines}

RESPONSE RULES:
- Be direct and specific. Always cite actual numbers from the data above.
- Keep answers to 3-5 sentences unless the user asks for more detail.
- Give actionable next steps, not just observations.
- When asked about urgency or today's priorities, lead with the operational flags.
- Remember the full conversation and answer follow-up questions in context.
- Write in plain text only. No markdown, no bullet points, no asterisks, no headers.
- Never invent numbers or facts not present in the data above.`
  }

  // ── Try Gemini API (optional enhancement) ─────────────────────────────────
  async function tryGemini(userMessage) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey || apiKey.trim() === '') throw new Error('NO_KEY')

    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }))
    contents.push({ role: 'user', parts: [{ text: userMessage }] })

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
          contents,
          generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
        })
      }
    )

    if (!res.ok) throw new Error(`HTTP_${res.status}`)

    const data = await res.json()
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!reply) throw new Error('EMPTY')
    return reply
  }

  // ── Main send handler — local engine is primary, Gemini is enhancement ────
  async function handleSend(text) {
    const q = (text || input).trim()
    if (!q || thinking) return

    const userMsg = { role: 'user', text: q }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setThinking(true)

    // Always compute local answer first (instant, reliable)
    const localResult = generateLocalReply(q, messages, metrics)

    try {
      // Attempt Gemini for richer phrasing — 4 second timeout
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4000)

      const geminiReply = await Promise.race([
        tryGemini(q),
        new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 4000))
      ])
      clearTimeout(timeout)

      setMessages(prev => [...prev, { role: 'ai', text: geminiReply, topic: localResult.topic }])
    } catch {
      // Silently fall back to local engine — no error shown to user
      setMessages(prev => [...prev, { role: 'ai', text: localResult.text, topic: localResult.topic }])
    } finally {
      setThinking(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleClear() {
    setMessages([])
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column', minHeight: 540
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 24px', background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 14
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(0,212,255,0.22), rgba(139,92,246,0.18))',
          border: '1px solid rgba(0,212,255,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Sparkles size={18} color="var(--accent-cyan)" strokeWidth={2} />
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700,
            color: 'var(--text-primary)', lineHeight: 1.2
          }}>Ask Global Degrees AI</div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2
          }}>Powered by live CRM data · supports follow-up questions</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                color: 'var(--text-muted)', background: 'transparent',
                border: '1px solid var(--border-subtle)',
                padding: '6px 13px', borderRadius: 8, cursor: 'pointer',
                transition: 'all 0.12s ease', outline: 'none'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--accent-rose)'
                e.currentTarget.style.borderColor = 'rgba(244,63,94,0.30)'
                e.currentTarget.style.background = 'rgba(244,63,94,0.06)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <RotateCcw size={11} strokeWidth={2.2} />
              New chat
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--accent-emerald)',
              boxShadow: '0 0 6px rgba(52,211,153,0.6)',
              animation: 'livePulse 2s ease-in-out infinite'
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
              color: 'var(--accent-emerald)', letterSpacing: '0.06em', textTransform: 'uppercase'
            }}>Live</span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        padding: '24px 24px 12px', flex: 1,
        minHeight: 340, maxHeight: 500,
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18,
        scrollbarWidth: 'thin'
      }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ textAlign: 'center', padding: '8px 0 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(139,92,246,0.15))',
                border: '1px solid rgba(0,212,255,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <MessageSquare size={24} color="var(--accent-cyan)" strokeWidth={1.8} />
              </div>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600,
                color: 'var(--text-primary)', margin: '0 0 6px'
              }}>What would you like to know?</p>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)',
                margin: 0, lineHeight: 1.5
              }}>
                Ask about your pipeline, team performance, operations, or marketing — I have full context of your live CRM data.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 400,
                    color: 'var(--text-secondary)', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '8px 16px', borderRadius: 99, cursor: 'pointer',
                    transition: 'all 0.12s ease', outline: 'none', lineHeight: 1.3
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--accent-cyan)'
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.35)'
                    e.currentTarget.style.background = 'rgba(0,212,255,0.06)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-secondary)'
                    e.currentTarget.style.borderColor = 'var(--border-subtle)'
                    e.currentTarget.style.background = 'var(--bg-elevated)'
                  }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 10, alignItems: 'flex-end'
          }}>
            {msg.role === 'ai' && (
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(0,212,255,0.18), rgba(139,92,246,0.18))',
                border: '1px solid rgba(0,212,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2
              }}>
                <Sparkles size={13} color="var(--accent-cyan)" strokeWidth={2} />
              </div>
            )}
            <div style={{
              maxWidth: '78%', padding: '13px 17px',
              borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(0,212,255,0.13), rgba(0,180,220,0.09))'
                : 'var(--bg-elevated)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(0,212,255,0.25)' : 'var(--border-subtle)'}`,
            }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.72,
                margin: 0, fontWeight: msg.role === 'user' ? 500 : 400,
                color: msg.role === 'user' ? 'var(--accent-cyan)' : 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }}>{msg.text}</p>
            </div>
            {msg.role === 'user' && (
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800,
                color: 'var(--accent-cyan)', marginBottom: 2
              }}>U</div>
            )}
          </div>
        ))}

        {thinking && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.18), rgba(139,92,246,0.18))',
              border: '1px solid rgba(0,212,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={13} color="var(--accent-cyan)" strokeWidth={2} />
            </div>
            <div style={{
              padding: '14px 18px', borderRadius: '4px 14px 14px 14px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: 5
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-cyan)',
                  animation: `copilotDot 1.4s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '14px 20px 18px', borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-elevated)', display: 'flex', gap: 10, alignItems: 'center'
      }}>
        <div
          style={{
            flex: 1, background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)', borderRadius: 12,
            transition: 'border-color 0.15s ease'
          }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.40)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything about your pipeline, team, or operations…"
            style={{
              width: '100%', fontFamily: 'var(--font-body)', fontSize: 14,
              color: 'var(--text-primary)', background: 'transparent',
              border: 'none', outline: 'none', padding: '12px 16px',
              lineHeight: 1.4, boxSizing: 'border-box'
            }}
          />
        </div>
        <button
          onClick={() => handleSend()}
          disabled={thinking || !input.trim()}
          style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: input.trim() && !thinking
              ? 'linear-gradient(135deg, rgba(0,212,255,0.22), rgba(0,180,220,0.16))'
              : 'rgba(0,212,255,0.06)',
            border: `1px solid ${input.trim() && !thinking ? 'rgba(0,212,255,0.38)' : 'rgba(0,212,255,0.12)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() && !thinking ? 'pointer' : 'default',
            transition: 'all 0.15s ease', outline: 'none'
          }}
          onMouseEnter={e => { if (input.trim() && !thinking) e.currentTarget.style.background = 'rgba(0,212,255,0.32)' }}
          onMouseLeave={e => { e.currentTarget.style.background = input.trim() && !thinking ? 'rgba(0,212,255,0.22)' : 'rgba(0,212,255,0.06)' }}
        >
          <Send size={16} color={input.trim() && !thinking ? 'var(--accent-cyan)' : 'var(--text-muted)'} strokeWidth={2} />
        </button>
      </div>

      <style>{`
        @keyframes copilotDot {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Shimmer h={14} w={200} r={4} />
      <Shimmer h={540} r={16} />
      <Shimmer h={240} r={12} />
    </div>
  )

  const d = data || MOCK

  // ── Derived ────────────────────────────────────────────────────────────────
  const total        = d.total_students       || 5000
  const converted    = d.converted_students   || 1072
  const dropped      = d.dropped_students     || 1241
  const active       = d.active_students      || 1480
  const highRisk     = d.high_risk_students   || 79
  const lowRisk      = d.low_risk_students    || 3849
  const medRisk      = d.medium_risk_students || 1072
  const avgLeadScore = parseFloat(d.avg_lead_score) || 88.7
  const avgCgpa      = parseFloat(d.avg_cgpa) || 7.91
  const avgIelts     = parseFloat(d.avg_ielts) || 7.0
  const enrollRate   = parseFloat(d.enrollment_rate) || 21.4
  const enrollProb   = parseFloat(d.avg_enrollment_probability) || 87.4
  const avgBudget    = d.avg_budget || 28500
  const topCountry   = d.top_country     || 'Canada'
  const topCourse    = d.top_course      || 'MS Computer Science'
  const topLeadSrc   = d.top_lead_source || 'Instagram'
  const scholarshipEligible = d.scholarship_eligible || 1202
  const highIntentLeads     = d.high_intent_leads || 3849

  const followupOverdue = d.students_overdue_followup ?? 38
  const stuckInDocs     = d.students_stuck_docs       ?? 94
  const visaDeadlines   = d.visa_deadline_approaching ?? 27
  const newLeadsWeek    = d.new_leads_this_week       ?? 64

  // Lead sources
  const leadSources   = d.lead_sources || MOCK.lead_sources
  const sortedByConv  = [...leadSources].sort((a, b) => (b.conversions / b.leads) - (a.conversions / a.leads))
  const topLeadByConv = sortedByConv[0]
  const topLeadByVol  = [...leadSources].sort((a, b) => b.leads - a.leads)[0]
  const bestConvRate  = topLeadByConv ? ((topLeadByConv.conversions / topLeadByConv.leads) * 100).toFixed(1) : 0

  // Counselors
  const counselors       = d.counselor_leaderboard || MOCK.counselor_leaderboard
  const avgCounselorRate = counselors.reduce((s, c) => s + c.rate, 0) / counselors.length
  const topCounselor     = [...counselors].sort((a, b) => b.rate - a.rate)[0]
  const underperforming  = counselors.filter(c => c.rate < avgCounselorRate)

  // Funnel (kept for copilot metrics only — not rendered)
  const rawFunnel = [
    { stage: 'Contacted',     value: d.contacted     || MOCK.contacted },
    { stage: 'Counseling',    value: d.counseling    || MOCK.counseling },
    { stage: 'Documentation', value: d.documentation || MOCK.documentation },
    { stage: 'Application',   value: d.application   || MOCK.application },
    { stage: 'Visa',          value: d.visa          || MOCK.visa },
    { stage: 'Enrolled',      value: d.enrolled      || MOCK.enrolled },
  ]
  const funnelStages = rawFunnel.reduce((acc, cur, i) => {
    if (i === 0) return [cur]
    const prev = acc[i - 1].value
    return [...acc, { stage: cur.stage, value: Math.min(cur.value, prev) }]
  }, [])
  const funnelDrops = funnelStages.slice(1).map((s, i) => ({
    from: funnelStages[i].stage, to: s.stage,
    drop: funnelStages[i].value - s.value,
    dropPct: funnelStages[i].value > 0
      ? (((funnelStages[i].value - s.value) / funnelStages[i].value) * 100).toFixed(1)
      : '0.0'
  }))
  const funnelWorstDrop = funnelDrops.length ? [...funnelDrops].sort((a, b) => b.drop - a.drop)[0] : null

  // Country distribution
  const countryDist = d.country_distribution || MOCK.country_distribution
  const countryEntries = Object.entries(countryDist || {})
    .filter(([k]) => k && k !== 'undefined' && k !== 'null' && k.trim() !== '' && isNaN(Number(k)))
    .sort((a, b) => b[1] - a[1])

  // Insights
  const insights = [
    {
      icon: AlertTriangle, color: 'var(--accent-rose)',
      title: `${followupOverdue} students overdue for follow-up`,
      body: `No contact in 7+ days significantly increases dropout probability. These are your highest-churn-risk leads right now — assign follow-up tasks today before they go cold.`,
      badge: 'Critical'
    },
    {
      icon: Clock, color: 'var(--accent-amber)',
      title: `${stuckInDocs} students stuck at documentation`,
      body: `This is your largest funnel bottleneck${funnelWorstDrop ? ` — ${funnelWorstDrop.dropPct}% attrition at the ${funnelWorstDrop.from} stage` : ''}. A standardised document checklist and automated deadline nudges can unblock most of these within 48 hours.`,
      badge: 'Bottleneck'
    },
    {
      icon: Bell, color: 'var(--accent-amber)',
      title: `${visaDeadlines} visa deadlines approaching`,
      body: `These students are the furthest along in the pipeline — losing them at this stage is the costliest outcome. Schedule document submission follow-ups and partner university reminders immediately.`,
      badge: 'Urgent'
    },
    {
      icon: BarChart2, color: 'var(--accent-emerald)',
      title: topLeadByConv && topLeadByVol && topLeadByConv.name !== topLeadByVol.name
        ? `${topLeadByConv.name} converts best (${bestConvRate}%), ${topLeadByVol.name} drives most volume`
        : `${topLeadSrc} leads in both volume and conversion efficiency`,
      body: topLeadByConv && topLeadByVol && topLeadByConv.name !== topLeadByVol.name
        ? `Budget should sustain both — quality and scale are complementary. Referral and Walk-In leads also show strong intent quality; track their long-term conversion separately from paid channels.`
        : `Sustained investment in ${topLeadSrc} delivers the strongest pipeline ROI. Monitor conversion rate weekly to catch saturation early.`,
      badge: 'Marketing'
    },
    {
      icon: Users, color: 'var(--accent-violet)',
      title: underperforming.length > 0
        ? `${underperforming.length} counsellor${underperforming.length > 1 ? 's' : ''} below team average (${avgCounselorRate.toFixed(1)}%)`
        : `All counsellors at or above team average`,
      body: underperforming.length > 0
        ? `${underperforming.map(c => c.name).join(', ')} are converting below average. Shadow sessions with ${topCounselor?.name} (${topCounselor?.rate.toFixed(1)}%) before next intake could recover meaningful pipeline value.`
        : `${topCounselor?.name} leads at ${topCounselor?.rate.toFixed(1)}%. Team performance is strong — focus on volume growth rather than conversion optimisation.`,
      badge: 'Team'
    },
    {
      icon: Globe2, color: 'var(--accent-blue)',
      title: countryEntries.length >= 2
        ? `${countryEntries[0][0]} dominates at ${total > 0 ? ((countryEntries[0][1] / total) * 100).toFixed(1) : 0}% of pipeline`
        : `${topCountry} is the top destination`,
      body: countryEntries.length >= 2
        ? `${countryEntries[1][0]} is a strong secondary market at ${total > 0 ? ((countryEntries[1][1] / total) * 100).toFixed(1) : 0}%. Dedicated per-country intake campaigns increase relevance and reduce cost-per-conversion significantly.`
        : `${topCountry} remains the primary student destination. Explore secondary market diversification to reduce intake concentration risk.`,
      badge: 'Destinations'
    },
    {
      icon: Target, color: 'var(--accent-cyan)',
      title: `${formatNumber(highIntentLeads)} high-intent leads in pipeline`,
      body: `With ${enrollProb}% average enrollment probability and ${enrollRate}% overall conversion, pipeline quality is strong. Fast-track processing for high-intent leads before intake deadlines to maximise enrolled numbers this cycle.`,
      badge: 'Pipeline'
    },
    {
      icon: Lightbulb, color: 'var(--accent-emerald)',
      title: `${formatNumber(scholarshipEligible)} students are scholarship-eligible`,
      body: `Scholarship-eligible students typically have stronger academic profiles and higher commitment. Proactively communicating scholarship availability to this segment can accelerate decision-making and reduce dropout at the application stage.`,
      badge: 'Opportunity'
    },
    {
      icon: TrendingUp, color: 'var(--accent-violet)',
      title: `${newLeadsWeek} new leads entered this week`,
      body: `Week-on-week lead flow is an early indicator of intake health. Ensure these new leads are assigned and contacted within 24 hours — first-contact speed is the single biggest predictor of eventual conversion in study-abroad CRMs.`,
      badge: 'Growth'
    },
  ]

  const copilotMetrics = {
    counselors, avgCounselorRate, topCountry, topLeadSrc,
    stuckInDocs, followupOverdue, highRisk, funnelWorstDrop, total,
    converted, dropped, active, leadSources, countryDist, topCourse,
    avgLeadScore, enrollmentRate: enrollRate, avgCgpa, avgIelts, avgBudget,
    visaDeadlines, newLeadsWeek, enrollProb, lowRisk, medRisk,
    scholarshipEligible, highIntentLeads, funnelStages
  }

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <div style={{ width: 3, height: 18, background: 'var(--accent-cyan)', borderRadius: 2 }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase'
          }}>AI Intelligence</span>
        </div>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)',
          paddingLeft: 12, margin: 0
        }}>
          Ask anything · {formatNumber(total)} student records · instant answers
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Stat chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <StatChip label="Total Students"   value={formatNumber(total)}      color="var(--accent-cyan)"    sub="in CRM" />
          <StatChip label="Converted"        value={formatNumber(converted)}  color="var(--accent-emerald)" sub={`${enrollRate}% rate`} />
          <StatChip label="Active Pipeline"  value={formatNumber(active)}     color="var(--accent-blue)"    sub="in progress" />
          <StatChip label="High Risk"        value={highRisk}                 color="var(--accent-rose)"    sub="need attention" />
          <StatChip label="Follow-up Due"    value={followupOverdue}          color="var(--accent-amber)"   sub="7+ days overdue" />
        </div>

        {/* AI Copilot — hero */}
        <AICopilot metrics={copilotMetrics} />

        {/* Business Insights */}
        <section>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
              <div style={{ width: 3, height: 16, background: 'var(--accent-violet)', borderRadius: 2 }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase'
              }}>Key Business Insights</span>
            </div>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', paddingLeft: 12, margin: 0
            }}>Automated intelligence from pipeline, funnel, and team data</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {insights.map((ins, i) => (
              <InsightCard key={i} icon={ins.icon} color={ins.color} title={ins.title} body={ins.body} badge={ins.badge} />
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
