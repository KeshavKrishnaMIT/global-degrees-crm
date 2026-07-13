import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  MessageSquare, Send, Zap, RotateCcw,
  Users, AlertTriangle, Clock, Globe2, BarChart2, Target,
  Lightbulb, Sparkles, Bell, TrendingUp, X, GraduationCap,
  BookOpen, DollarSign, Award, ChevronDown, ChevronUp, UserCheck,
  ExternalLink, CheckCircle2, AlertCircle, Info, Shield, HelpCircle,
  Globe, TrendingDown, Star, MapPin
} from 'lucide-react'
import { useStudents } from '../../hooks/useStudents'
import { formatNumber } from '../../utils/formatters'
import {
  computeOverview,
  computeCounselorPerformance,
  computeCountryPerformance,
  computeLeadSourcePerformance,
  computeFunnel,
  computeRiskBreakdown,
  computeStudentPrioritization,
  buildAIContext,
  generateStudentAdvisorInsights,
  scoreUniversityProfile,
} from '../../utils/studentReasoning'
// REPLACE WITH:
import { generateRecommendations, FORM_COUNTRIES, FORM_COURSES, FORM_DEGREES } from '../../utils/universityReasoning'

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
      padding: '18px 24px', borderRadius: 16,
      background: 'var(--bg-surface)',
      border: `1px solid var(--border-subtle)`,
      boxShadow: 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column', gap: 6,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden'
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.boxShadow = `0 12px 24px ${color}10`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: color
      }} />
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
        color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase'
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
        color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.02em'
      }}>{value}</span>
      {sub && <span style={{
        fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500
      }}>{sub}</span>}
    </div>
  )
}

// ─── Insight card ─────────────────────────────────────────────────────────────
function InsightCard({ icon: Icon, color, title, body, badge }) {
  return (
    <div style={{
      display: 'flex', gap: 16, padding: '18px 20px', borderRadius: 16,
      background: 'var(--bg-surface)', border: `1px solid var(--border-subtle)`,
      boxShadow: 'var(--shadow-card)',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden'
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = `${color}40`
        e.currentTarget.style.boxShadow = `0 12px 30px rgba(15, 23, 42, 0.08)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color
      }} />
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${color}0d`, border: `1px solid ${color}1a`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={16} color={color} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
            color: 'var(--text-primary)'
          }}>{title}</span>
          {badge && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
              color, background: `${color}0d`, border: `1px solid ${color}20`,
              padding: '2px 8px', borderRadius: 99, letterSpacing: '0.06em',
              textTransform: 'uppercase', flexShrink: 0
            }}>{badge}</span>
          )}
        </div>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)',
          lineHeight: 1.6, margin: 0
        }}>{body}</p>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// STUDENT AI ADVISOR MODAL
// ═════════════════════════════════════════════════════════════════════════════

const COUNTRIES   = FORM_COUNTRIES
const COURSES     = FORM_COURSES
const DEGREES     = FORM_DEGREES
const UI = {
  radiusLg: 24,
  radiusMd: 16,
  radiusSm: 12,
  borderSoft: 'var(--border-subtle)',
  shadowSoft: '0 20px 50px rgba(15, 23, 42, 0.15)',
  shadowLift: '0 30px 60px rgba(15, 23, 42, 0.25)',
  textHi: 'var(--text-primary)',
  textMid: 'var(--text-secondary)',
  textLow: 'var(--text-muted)',
}

// REPLACE WITH:
// ─── Visual identity helpers ────────────────────────────────────────────────
// Both images are derived from real fields already on the UniversityRecord
// (domains[], country) — nothing here is invented or stock photography.
const COUNTRY_ISO = {
  'United States': 'us', 'United Kingdom': 'gb', 'Canada': 'ca', 'Australia': 'au',
  'Germany': 'de', 'Ireland': 'ie', 'New Zealand': 'nz', 'France': 'fr',
  'Netherlands': 'nl', 'Singapore': 'sg', 'Sweden': 'se', 'Switzerland': 'ch',
  'Denmark': 'dk', 'Norway': 'no', 'Finland': 'fi', 'Japan': 'jp',
  'South Korea': 'kr', 'United Arab Emirates': 'ae', 'India': 'in', 'China': 'cn',
  'Italy': 'it', 'Spain': 'es', 'Austria': 'at', 'Belgium': 'be', 'Hong Kong': 'hk',
  'Taiwan': 'tw', 'Malaysia': 'my', 'South Africa': 'za', 'Russia': 'ru',
}

function getUniversityLogo(university) {
  const domain = university?.domains?.[0]
  return domain ? `https://logo.clearbit.com/${domain}?size=160` : null
}

function getCountryFlag(country) {
  const iso = COUNTRY_ISO[country]
  return iso ? `https://flagcdn.com/w320/${iso}.png` : null
}
const SCAN_STEPS = [
  'Parsing academic CGPA standings...',
  'Correlating IELTS requirements against country quotas...',
  'Analyzing annual budget limits and tuition averages...',
  'Comparing qualifications with 10,250+ university tables...',
  'Retrieving matching historical student outcomes from CRM...',
  'Compiling confidence scoring metrics...'
]

function AdvisorModal({ students, onClose }) {
  const [step, setStep]                       = useState('form')   // 'form' | 'scanning' | 'chat'
  const [isClosing, setIsClosing]             = useState(false)
  const [scanMessageIndex, setScanMessageIndex] = useState(0)
  const [expandedCardIndex, setExpandedCardIndex] = useState(null)
  const [detailRec, setDetailRec]             = useState(null)   // full university profile lightbox
  const [detailClosing, setDetailClosing]     = useState(false)


  const [profile, setProfile]                 = useState({
    name: '', cgpa: '', ielts: '', budget: '', country: '',
    course: '', degree: '', hasScholarship: false
  })
  const [messages, setMessages]               = useState([])
  const [input, setInput]                     = useState('')
  const [thinking, setThinking]               = useState(false)
  const [insights, setInsights]               = useState(null)
  const [recommendations, setRecommendations] = useState([])
  
  const endRef  = useRef(null)
  const inputRef = useRef(null)
  const backdropRef = useRef(null)
  const detailBackdropRef = useRef(null)

  // Smooth close wrapper
  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 200)
  }, [onClose])

  // Smooth close for the "show more" detail lightbox
  const closeDetail = useCallback(() => {
    setDetailClosing(true)
    setTimeout(() => {
      setDetailRec(null)
      setDetailClosing(false)
    }, 180)
  }, [])
  // ESC key support
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (detailRec) {
          closeDetail()
        } else {
          handleClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, detailRec, closeDetail])
  // Backdrop click closing
  const handleBackdropClick = (e) => {
    if (backdropRef.current && e.target === backdropRef.current) {
      handleClose()
    }
  }

  // Detail lightbox backdrop click closing
  const handleDetailBackdropClick = (e) => {
    if (detailBackdropRef.current && e.target === detailBackdropRef.current) {
      closeDetail()
    }
  }

  // Scanning animation stage timer
  useEffect(() => {
    if (step !== 'scanning') return
    const interval = setInterval(() => {
      setScanMessageIndex(prev => {
        if (prev < SCAN_STEPS.length - 1) return prev + 1
        return prev
      })
    }, 250)
    return () => clearInterval(interval)
  }, [step])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking, step])

  function handleChange(k, v) {
    setProfile(prev => ({ ...prev, [k]: v }))
  }

  function handleStart() {
    setStep('scanning')
    setScanMessageIndex(0)
    
    const p = {
      cgpa:          parseFloat(profile.cgpa)   || 0,
      ielts:         parseFloat(profile.ielts)  || 0,
      budget:        parseFloat(profile.budget) || 0,
      country:       profile.country,
      course:        profile.course,
      hasScholarship: profile.hasScholarship,
    }

    const advisorInsights = generateStudentAdvisorInsights(students, p)
    const recs = generateRecommendations(p, students, { maxResults: 6 })

    setRecommendations(recs)
    setInsights(advisorInsights)

    // Simulate analysis delay for standard SaaS feeling
    setTimeout(() => {
      setStep('chat')
      const greeting = buildAdvisorGreeting(profile, advisorInsights, recs)
      setMessages([{ role: 'ai', text: greeting }])
      setTimeout(() => inputRef.current?.focus(), 100)
    }, 1600)
  }

  function buildAdvisorGreeting(prof, ins, recs) {
    const { similarStudents, topCountriesForProfile, topCoursesForProfile, universityScoring } = ins
    const sc = universityScoring
    const topC = topCountriesForProfile[0]?.key || prof.country
    const topCo = topCoursesForProfile[0]?.key || prof.course
    const budgetStr = `₹${Number(prof.budget || 0).toLocaleString('en-IN')}`

    const strengths = []
    const weaknesses = []
    
    if (parseFloat(prof.cgpa || 0) >= 8.0) {
      strengths.push(`• **Strong Academics**: CGPA of **${prof.cgpa}/10** places you in the upper tier of applicants.`)
    } else if (parseFloat(prof.cgpa || 0) >= 7.0) {
      strengths.push(`• **Viable Grades**: CGPA of **${prof.cgpa}/10** meets requirements for target programs.`)
    } else {
      weaknesses.push(`• **Academic Gatekeeping**: CGPA of **${prof.cgpa}/10** is below target averages. Focusing on universities with holistic evaluations is critical.`)
    }

    if (parseFloat(prof.ielts || 0) >= 7.0) {
      strengths.push(`• **Language Mastery**: IELTS score of **${prof.ielts}** represents excellent proficiency.`)
    } else if (parseFloat(prof.ielts || 0) >= 6.0) {
      strengths.push(`• **Standard Language Match**: IELTS score of **${prof.ielts}** satisfies core visa and college requirements.`)
    } else {
      weaknesses.push(`• **Language Hurdle**: IELTS score of **${prof.ielts}** is below key program thresholds; consider a retake to avoid conditional admissions.`)
    }

    if (parseFloat(prof.budget || 0) >= 2500000) {
      strengths.push(`• **Comfortable Budgeting**: Annual budget of **${budgetStr}** gives you maximum flexibility across elite programs.`)
    } else if (parseFloat(prof.budget || 0) >= 1500000) {
      strengths.push(`• **Solid Mid-Tier Budget**: Budget of **${budgetStr}** fits standard tuition rates in Canada/France.`)
    } else {
      weaknesses.push(`• **Financial Constraint**: Annual budget of **${budgetStr}** calls for targeted scholarship searches or regional universities.`)
    }

    if (strengths.length === 0) strengths.push(`• Solid profile intent targeting international programs.`)
    if (weaknesses.length === 0) weaknesses.push(`• No critical profile gaps identified for standard target tiers.`)

    const conversionText = similarStudents.lowConfidence
      ? `limited matching cases in our database.`
      : `**${similarStudents.count}** historical candidates with a conversion rate of **${similarStudents.conversionRate}%**.`

    return `### 📊 AI Candidate Profile Evaluation & Strategy

I have analyzed this student's profile against our live CRM database. Here is my strategic assessment for your counselling session:

**1. Profile Summary**
Candidate is targeting **${prof.course || 'Graduate Studies'}** in **${prof.country || 'International Dest.'}**. We analyzed similar profiles in the CRM database, matching **${conversionText}**

**2. Key Insights**
* **Admission Confidence**: **${sc.admissionConfidence}/100**
* **Scholarship Outlook**: **${sc.scholarshipConfidence}%** (confidence rating based on CGPA & language test)
* **Recommended Countries**: **${topCountriesForProfile.slice(0, 2).map(c => c.key).join(', ') || prof.country}**

**3. Strategic Breakdown**
* **Strengths**:
${strengths.join('\n')}
* **Areas for Focus**:
${weaknesses.join('\n')}

**4. Counsellor Strategy & Action Plan**
• **Primary Target**: Advise the student to apply to **Safe** and **Moderate** choices first. **Moderate** options represent the highest ROI match.
• **Academic Action**: ${parseFloat(prof.ielts || 0) < 7.0 ? 'Advise retaking the IELTS to score **7.0+** to dramatically boost admission odds at top-tier schools.' : 'The student should keep academics high and compile an SOP focusing on project portfolios.'}
• **Financial Strategy**: ${prof.hasScholarship ? 'Counsellor should prepare applications early to qualify for major merit-based institutional scholarships.' : `The budget is ${sc.budgetAdequacy.toLowerCase()} — target public universities and explore regional grants.`}

I have matched **${recs.length}** target universities for this profile. What details or analytics would you like to explore first?`
  }

  // Build Gemini system prompt for student advisor
  function buildAdvisorSystemPrompt() {
    if (!insights) return ''
    const { similarStudents, universityScoring } = insights
    const sc = universityScoring
    const p  = sc.profile

    const recSummary = (recommendations || []).map((r, i) => {
      const { university: u, fit, tuitionRange, scholarshipNote } = r
      return `- **${u.name}** (World Rank: #${u.worldRank || 'Unranked'}, Country: ${u.country})
  Website: ${u.website || 'Not available'}
  Tuition Range: ${tuitionRange || 'Varies'}
  Scholarship Note: ${scholarshipNote || 'None'}
  Overall Fit: ${fit.overall}/100 [Category: ${fit.admissionCategory}].
  Sub-scores: Academics ${fit.academicFit}%, Language ${fit.languageFit}%, Financial ${fit.financialFit}%, Course ${fit.courseFit}%, CRM ${fit.crmSimilarity}%, Scholarship ${fit.scholarshipFit}%`
    }).join('\n\n')

    return `You are the core AI brain of the Global Degrees CRM. You are advising a human Study Abroad Counsellor who is working with a student.
You MUST speak to the counsellor. NEVER address the student directly. Use phrases like "The student should...", "Advise the candidate to...", "This profile indicates...".

STUDENT CANDIDATE PROFILE:
- CGPA: ${p.cgpa}/10
- IELTS: ${p.ielts}/9
- Budget: ₹${Number(p.budget || 0).toLocaleString('en-IN')} per year
- Preferred Country: ${p.country || 'Not specified'}
- Preferred Course: ${p.course || 'Not specified'}
- Scholarship interest: ${p.hasScholarship ? 'Yes' : 'No'}

CRM COHORT DATA (${similarStudents.count} similar student profiles):
- Historical conversion rate: ${similarStudents.conversionRate}%
- Historical dropout rate: ${similarStudents.dropRate}%
- Average budget for similar students: ₹${Number(similarStudents.avgBudget || 0).toLocaleString('en-IN')}
- ${insights.historicalContext}

ACADEMIC STANDING:
- CGPA vs CRM average: ${sc.academicStanding.cgpaRank}
- IELTS vs CRM average: ${sc.academicStanding.ieltsRank}
- Budget adequacy: ${sc.budgetAdequacy}

UNIVERSITY RECOMMENDATIONS GENERATED FOR THIS STUDENT:
${recSummary}

CRITICAL COUNSELLOR STRATEGY RULES:
1. Explain **Why** we recommended a school using its sub-scores breakdown: Academic (28%), IELTS/Language (16%), Budget (16%), Course Match (10%), CRM outcomes (18%), Admission Selectivity (5%), and Scholarships (7%).
2. Define **Safe**, **Moderate**, and **Dream** categories for the counsellor:
   - **Safe** means the student's metrics comfortably exceed typical thresholds (90%+ match).
   - **Moderate** means the profile is highly competitive and represents a balanced target (70%-90% match).
   - **Dream** represents ambitious targets where admission is achievable but requires a compelling application.
3. Compare countries objectively using budget limits, visa success tracking, and tuition averages in our dataset.
4. Detail exactly what the counsellor should advise the student to improve (e.g., retaking IELTS to get **7.0+** represents the highest ROI strategy).
5. For scholarship target queries, advise targeting merit awards if CGPA is **8.5+**, or need-based bursaries and public universities if budgets are tighter.
6. Advise the counsellor to apply to **Safe** options first for the student to secure a baseline admission.
7. Always format key terms, scores, and categories (**Safe**, **Moderate**, **Dream**) in **bold** using double asterisks. Use plain bullet points • instead of asterisks (*). Keep answers structured (no robotic paragraphs). Budget is in Indian Rupees (₹).
8. Use headings, bullet points, and data-driven insights. Sound like a premium enterprise AI analytics engine.`
  }

  async function handleSend(text) {
    const q = (text || input).trim()
    if (!q || thinking) return
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setInput('')
    setThinking(true)

    // Database-first: if we can compute an answer directly from live CRM, do it.
    const dbCalculation = calculateCRMQuery(q.toLowerCase(), students)
    if (dbCalculation) {
      setMessages(prev => [...prev, { role: 'ai', text: dbCalculation, topic: 'calculation:crm' }])
      setThinking(false)
      return
    }


    // Local fallback
    const localReply = generateAdvisorLocalReply(q, insights, profile, recommendations)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey?.trim()) throw new Error('NO_KEY')

      const contents = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }))
      contents.push({ role: 'user', parts: [{ text: q }] })

      const res = await Promise.race([
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: buildAdvisorSystemPrompt() }] },
            contents,
            generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
          })
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 5000))
      ])

      if (!res.ok) throw new Error(`HTTP_${res.status}`)
      const data = await res.json()
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!reply) throw new Error('EMPTY')
      setMessages(prev => [...prev, { role: 'ai', text: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: localReply }])
    } finally {
      setThinking(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function generateAdvisorLocalReply(q, ins, prof, recs = []) {
    if (!ins) return "Fill in your profile first and I'll give you personal recommendations."
    const sc   = ins.universityScoring
    const ql   = q.toLowerCase()
    const cgpa = parseFloat(prof.cgpa || 0)
    const ielts = parseFloat(prof.ielts || 0)
    const budget = parseFloat(prof.budget || 0)
    const budgetStr = `₹${Number(budget).toLocaleString('en-IN')}`
    const budgetLakh = (budget / 100000).toFixed(1)

    const safeRecs = recs.filter(r => r.fit.admissionCategory === 'Safe')
    const modRecs  = recs.filter(r => r.fit.admissionCategory === 'Moderate')
    const dreamRecs = recs.filter(r => r.fit.admissionCategory === 'Dream' || r.fit.admissionCategory === 'Competitive')
    const avgOverall = recs.length ? Math.round(recs.reduce((s,r) => s + r.fit.overall, 0) / recs.length) : 0
    const topRec = recs[0]
    const worstRec = recs[recs.length - 1]

    // ── Which schools / list targets ──
    if (/name them|which schools|what universities|which ones|target|schools|can i get into|realistically|actually get into|list|show me|recommend/.test(ql)) {
      const safe = safeRecs.map(r => `• **${r.university.name}** — ${r.university.country} — Overall Fit: **${r.fit.overall}%** (Academic: ${r.fit.academicFit}%, Financial: ${r.fit.financialFit}%)`)
      const mod  = modRecs.map(r => `• **${r.university.name}** — ${r.university.country} — Overall Fit: **${r.fit.overall}%** (Academic: ${r.fit.academicFit}%, Financial: ${r.fit.financialFit}%)`)
      const dream = dreamRecs.map(r => `• **${r.university.name}** — ${r.university.country} — Overall Fit: **${r.fit.overall}%** (Academic: ${r.fit.academicFit}%, Financial: ${r.fit.financialFit}%)`)

      return `Based on your profile (CGPA: **${cgpa}**, IELTS: **${ielts}**, Budget: **${budgetStr}**), here is the strategic shortlist I've generated across **${recs.length}** matched universities:

**✅ Safe Targets (High Confidence):**
${safe.length ? safe.join('\n') : '• No safe options matched your current filters'}

**🎯 Moderate Targets (Sweet Spot):**
${mod.length ? mod.join('\n') : '• No moderate options matched your current filters'}

**🚀 Dream Targets (Ambitious Reach):**
${dream.length ? dream.join('\n') : '• No dream options found — consider widening your country selection'}

**Strategic Recommendation:** Apply to ${safeRecs.length ? `**${safeRecs[0].university.name}**` : 'a Safe option'} first to lock in a baseline admission, then target Moderate options for the best ROI.`
    }

    // ── Safe tier deep dive ──
    if (/safe|easy|guaranteed|sure|secure|backup/.test(ql)) {
      const safeNames = safeRecs.map(r => r.university.name).slice(0, 3).join(', ')
      const avgFit = safeRecs.length ? Math.round(safeRecs.reduce((s,r) => s + r.fit.overall, 0) / safeRecs.length) : 0
      const avgAcad = safeRecs.length ? Math.round(safeRecs.reduce((s,r) => s + r.fit.academicFit, 0) / safeRecs.length) : 0
      return `**Safe tier** means your CGPA of **${cgpa}** and IELTS of **${ielts}** comfortably exceed the typical admission benchmarks for these universities.

**Your Safe options:** ${safeNames || 'None matched'}
• Average overall fit: **${avgFit}%**
• Average academic fit: **${avgAcad}%**
• Admission confidence: **${sc.classification?.Safe?.admissionConfidence || 90}%**

**Why safe?** These universities historically accept students with CGPA **${(cgpa - 1.0).toFixed(1)}+** and IELTS **${(ielts - 0.5).toFixed(1)}+**, so your credentials are well above the bar. ${safeRecs.length ? `I'd especially recommend **${safeRecs[0].university.name}** as your anchor application — it has the strongest CRM conversion history for profiles like yours.` : ''}`
    }

    // ── Dream tier deep dive ──
    if (/dream|stretch|ambitious|top|reach|elite|ivy|best university/.test(ql)) {
      const dreamNames = dreamRecs.map(r => r.university.name).slice(0, 3).join(', ')
      const idealCGPA = (cgpa + 0.8).toFixed(1)
      const idealIELTS = Math.min(ielts + 0.5, 9.0).toFixed(1)
      return `**Dream tier** schools represent ambitious reach targets where competition is intense and admission selectivity is high.

**Your Dream options:** ${dreamNames || 'None in current selection'}
• Admission confidence: **${sc.classification?.Dream?.admissionConfidence || 25}%**
• Ideal CGPA for this tier: **${idealCGPA}+** (yours: **${cgpa}**)
• Ideal IELTS for this tier: **${idealIELTS}+** (yours: **${ielts}**)

**How to strengthen your Dream application:**
• ${cgpa < 8.5 ? `Push CGPA to **8.5+** through remaining coursework — this alone unlocks ~30% more Dream options` : 'Your CGPA is already in a strong range for Dream schools ✅'}
• ${ielts < 7.5 ? `Retake IELTS targeting **7.5+** — universities like ${dreamNames ? dreamNames.split(',')[0] : 'top-ranked institutions'} use this as a soft filter` : 'Your IELTS score is already competitive for Dream tier ✅'}
• Build a compelling Statement of Purpose that highlights research experience, leadership, or niche expertise
• ${sc.scholarshipConfidence >= 40 ? 'You have decent scholarship potential — target merit-based awards to offset higher tuition' : 'Consider need-based financial aid applications as your scholarship profile needs strengthening'}`
    }

    // ── Moderate tier deep dive ──
    if (/moderate|mid|middle|balanced|sweet spot/.test(ql)) {
      const modNames = modRecs.map(r => r.university.name).slice(0, 3).join(', ')
      const avgFit = modRecs.length ? Math.round(modRecs.reduce((s,r) => s + r.fit.overall, 0) / modRecs.length) : 0
      return `**Moderate tier** is your strategic sweet spot — these are universities where your profile is fully competitive and represents the best return on investment.

**Your Moderate options:** ${modNames || 'None matched'}
• Average overall fit: **${avgFit}%**
• Admission confidence: **${sc.classification?.Moderate?.admissionConfidence || 65}%**

**Why these are your primary targets:**
• Your CGPA of **${cgpa}** and IELTS of **${ielts}** align closely with accepted student averages at these schools
• Budget of **${budgetStr}** (${budgetLakh}L) is ${sc.budgetAdequacy === 'Comfortable' || sc.budgetAdequacy === 'Adequate' ? 'well within range ✅' : 'tight but manageable with careful planning ⚠️'}
• CRM data shows **${ins.similarStudents.conversionRate}%** of similar profiles successfully converted at Moderate-tier institutions

**Strategy:** These should form **60-70%** of your application portfolio. Apply to ${modRecs.length >= 2 ? `both **${modRecs[0]?.university.name}** and **${modRecs[1]?.university.name}**` : modRecs[0] ? `**${modRecs[0].university.name}**` : 'these schools'} early to maximize intake chances.`
    }

    // ── Scholarship / Funding deep dive ──
    if (/scholarship|funding|financial aid|money|cost|tuition|fee|afford|expensive|cheap|pay/.test(ql)) {
      const cheapest = [...recs].sort((a,b) => (a.fit.financialFit || 0) - (b.fit.financialFit || 0)).reverse()[0]
      const scholarshipStrength = sc.scholarshipConfidence >= 60 ? 'strong' : sc.scholarshipConfidence >= 35 ? 'moderate' : 'developing'
      return `**Scholarship & Financial Analysis for your profile:**

• Scholarship confidence score: **${sc.scholarshipConfidence}%** (${scholarshipStrength})
• Budget: **${budgetStr}** per year (${budgetLakh}L)
• Budget adequacy for **${prof.country || 'your target country'}**: **${sc.budgetAdequacy}**

**Detailed breakdown:**
${cgpa >= 8.5 ? `• ✅ Your CGPA of **${cgpa}** qualifies you for **merit-based scholarships** at most institutions` : cgpa >= 7.5 ? `• 🟡 Your CGPA of **${cgpa}** qualifies for **partial merit awards** — push to 8.5+ for full scholarships` : `• ⚠️ Your CGPA of **${cgpa}** limits merit scholarship options — focus on need-based aid and public university tuition waivers`}
${ielts >= 7.0 ? `• ✅ IELTS **${ielts}** meets the threshold for English-medium scholarship programs` : `• ⚠️ IELTS **${ielts}** is below the **7.0** minimum many scholarship programs require — retaking could unlock significant funding`}
${cheapest ? `• 💡 Best financial fit among your matches: **${cheapest.university.name}** (Financial Fit: **${cheapest.fit.financialFit}%**)` : ''}

**Action plan:**
• ${sc.scholarshipConfidence >= 50 ? 'Target merit-based awards at your Moderate and Safe tier schools' : 'Explore need-based bursaries, TA/RA positions, and public university tuition reductions'}
• Apply early — many scholarship deadlines close **2-3 months** before admission deadlines
• Consider countries like **Germany** (zero tuition), **France** (€170/year public), or **Norway** (free tuition) if budget is a primary constraint`
    }

    // ── Country comparison ──
    if (/country|where|destination|best place|which country|canada|usa|uk|australia|germany|compare countries|location/.test(ql)) {
      const topC = ins.topCountriesForProfile?.[0]
      const topC2 = ins.topCountriesForProfile?.[1]
      return `**Country Analysis for your profile:**

• Target country: **${prof.country || 'Not specified'}** — Compatibility score: **${sc.countryScore}/100**
• Best CRM match: **${topC?.key || prof.country || 'N/A'}** (${topC?.count || 0} similar students tracked)
${topC2 ? `• Runner-up: **${topC2.key}** (${topC2.count} similar students tracked)` : ''}

**Key factors for ${prof.country || 'your destination'}:**
• Budget adequacy: **${sc.budgetAdequacy}** — ${sc.budgetAdequacy === 'Comfortable' ? 'your budget comfortably covers tuition + living costs ✅' : sc.budgetAdequacy === 'Adequate' ? 'your budget covers tuition but living costs may be tight 🟡' : 'your budget is below average for this destination — consider alternatives ⚠️'}
• Historical conversion rate for this destination: **${ins.similarStudents.conversionRate}%**
• Dropout rate: **${ins.similarStudents.dropRate}%** (${ins.similarStudents.dropRate > 20 ? 'higher than ideal — usually due to visa delays or cost surprises' : 'healthy range ✅'})

**Strategic advice:**
• ${prof.country === 'Canada' ? 'Canada offers strong post-study work permits (PGWP) and PR pathways — excellent long-term ROI' : prof.country === 'United Kingdom' ? 'UK offers 2-year Graduate visa post-study — shorter programs (1-year Masters) mean faster entry to workforce' : prof.country === 'Australia' ? 'Australia offers 2-4 year post-study work visas and high part-time work allowances during study' : prof.country === 'Germany' ? 'Germany has zero tuition at public universities — ideal for budget-conscious students with strong academics' : prof.country === 'United States' ? 'USA has the largest university ecosystem but highest costs — target TA/RA funding for ROI' : `${prof.country} has growing international student infrastructure — check specific visa and work permit policies`}
• Your matched universities in **${prof.country || 'this country'}** have an average fit of **${avgOverall}%** across all scoring dimensions`
    }

    // ── Profile improvement ──
    if (/improve|score|better|upgrade|what should i do|how to improve|tips|advice|weak|gap|strengthen/.test(ql)) {
      const gaps = []
      if (cgpa < 8.0) gaps.push({ area: 'CGPA', current: cgpa, target: Math.min(cgpa + 1.0, 10).toFixed(1), impact: 'Unlocks more Moderate and Dream tier universities, plus merit scholarships' })
      if (ielts < 7.0) gaps.push({ area: 'IELTS', current: ielts, target: '7.0', impact: 'Opens scholarship eligibility and removes English proficiency filters at most universities' })
      if (ielts >= 7.0 && ielts < 7.5) gaps.push({ area: 'IELTS', current: ielts, target: '7.5', impact: 'Moves you into competitive range for Dream-tier schools and premium scholarships' })
      if (budget < 1500000) gaps.push({ area: 'Budget', current: `₹${budget.toLocaleString('en-IN')}`, target: '₹15,00,000+', impact: 'Widens country options significantly (especially UK, Australia, USA)' })

      if (gaps.length === 0) {
        return `Your profile is already in an **excellent position**:

• CGPA **${cgpa}/10** — above average for most international programs ✅
• IELTS **${ielts}/9** — meets requirements at virtually all English-medium universities ✅
• Budget **${budgetStr}** — rated as **${sc.budgetAdequacy}** ✅
• Overall admission confidence: **${sc.admissionConfidence}/100**

**Focus areas for max impact:**
• Craft a standout Statement of Purpose (SOP) — this is the #1 differentiator at your level
• Secure strong Letters of Recommendation from professors in your target field
• Build relevant extracurriculars, internships, or research experience
• Apply early to maximize your chances — many programs fill on rolling basis`
      }

      const gapLines = gaps.map(g => `• **${g.area}**: Currently **${g.current}** → Target **${g.target}**\n  Impact: ${g.impact}`)
      return `**Profile Gap Analysis & Improvement Roadmap:**

Current scores: CGPA **${cgpa}**, IELTS **${ielts}**, Budget **${budgetStr}**
Overall confidence: **${sc.admissionConfidence}/100**

**Priority improvements (ranked by ROI):**
${gapLines.join('\n')}

**Quick wins:**
• ${ielts < 7.0 ? `IELTS retake is your **#1 priority** — a jump to 7.0+ has the single biggest impact on scholarship eligibility and university options` : `Your IELTS is solid — focus on application quality (SOP, LORs)`}
• ${cgpa < 7.5 ? `If you have remaining semesters, prioritize courses where you can score high to pull up CGPA` : `Your CGPA is competitive — no urgent action needed`}
• Start preparing your SOP and LORs **now** — these take 4-6 weeks to refine properly`
    }

    // ── Similar students / comparison ──
    if (/similar|others|like me|same profile|compare|historical|past students|how many|conversion/.test(ql)) {
      return `**CRM Historical Comparison for profiles like yours:**

We found **${ins.similarStudents.count}** students in our database with a similar academic profile (CGPA ±0.5, IELTS ±0.5, similar budget range).

**Outcomes breakdown:**
• ✅ Successfully enrolled: **${ins.similarStudents.conversionRate}%** (${Math.round(ins.similarStudents.count * ins.similarStudents.conversionRate / 100)} students)
• ❌ Dropped out of pipeline: **${ins.similarStudents.dropRate}%** (${Math.round(ins.similarStudents.count * ins.similarStudents.dropRate / 100)} students)
• Average budget of similar cohort: **₹${Number(ins.similarStudents.avgBudget || 0).toLocaleString('en-IN')}**

**Top reasons for dropouts in similar profiles:**
• Delayed visa processing (most common)
• Unexpected cost increases after acceptance
• Late application submissions missing intake deadlines

**What this means for you:**
• ${ins.similarStudents.conversionRate >= 60 ? 'You are in a **strong conversion bracket** — students with your profile have historically done well ✅' : ins.similarStudents.conversionRate >= 40 ? 'Your conversion potential is **moderate** — focus on timely applications and visa prep to stay on track 🟡' : 'Conversion rates for similar profiles are **below average** — proactive preparation and early applications are critical ⚠️'}
• ${ins.historicalContext}`
    }

    // ── Visa / timeline / process ──
    if (/visa|timeline|when|deadline|intake|september|january|apply when|how long|process/.test(ql)) {
      return `**Application Timeline & Visa Planning:**

Based on standard intake cycles for **${prof.country || 'your target country'}**:

**September/Fall Intake (Primary):**
• Application deadline: **December – March** (varies by university)
• Visa processing: **3-6 months** before program start
• Start preparing: **August – October** of the prior year

**January/Spring Intake:**
• Application deadline: **July – September**
• Visa processing: **2-4 months** before program start

**Your action checklist:**
• ☐ Finalize IELTS score (retake if below 7.0)
• ☐ Draft Statement of Purpose (SOP) — 4-6 weeks
• ☐ Secure 2-3 Letters of Recommendation (LOR)
• ☐ Prepare financial documents (bank statements, scholarship letters)
• ☐ Apply to **Safe** options first, then **Moderate** and **Dream**
• ☐ Begin visa paperwork immediately after receiving offer letter

**Pro tip:** Apply to ${safeRecs.length ? `**${safeRecs[0]?.university.name}**` : 'your Safe options'} early to secure a baseline offer — this reduces stress and strengthens visa applications.`
    }

    // ── Specific university query ──
    if (/tell me about|details on|more about|how is|what about/.test(ql)) {
      const uniQuery = ql.replace(/tell me about|details on|more about|how is|what about/gi, '').trim()
      const matchedRec = recs.find(r => r.university.name.toLowerCase().includes(uniQuery))
      if (matchedRec) {
        const { university: u, fit } = matchedRec
        return `**Detailed Analysis: ${u.name}**

📍 Location: **${u.country}** ${u.worldRank ? `| World Rank: **#${u.worldRank}**` : ''} ${u.rankLabel && u.rankLabel !== 'Unranked' ? `| Tier: **${u.rankLabel}**` : ''}

**Compatibility Breakdown:**
• Overall Match: **${fit.overall}%** — Category: **${fit.admissionCategory}**
• Academic Fit: **${fit.academicFit}%** ${fit.academicFit >= 70 ? '✅' : fit.academicFit >= 50 ? '🟡' : '⚠️'}
• Language Fit: **${fit.languageFit}%** ${fit.languageFit >= 70 ? '✅' : fit.languageFit >= 50 ? '🟡' : '⚠️'}
• Financial Fit: **${fit.financialFit}%** ${fit.financialFit >= 70 ? '✅' : fit.financialFit >= 50 ? '🟡' : '⚠️'}
• Course Match: **${fit.courseFit}%** ${fit.courseFit >= 70 ? '✅' : fit.courseFit >= 50 ? '🟡' : '⚠️'}
• CRM History: **${fit.crmSimilarity}%**
• Scholarship Fit: **${fit.scholarshipFit}%**

**Strengths:** ${matchedRec.pros?.slice(0,2).join(' | ') || 'Strong overall match'}
**Watch out:** ${(matchedRec.cons?.length ? matchedRec.cons : matchedRec.weaknesses || []).slice(0,2).join(' | ') || 'No major concerns'}

${matchedRec.improvements?.[0] ? `**Advisor Tip:** ${matchedRec.improvements[0]}` : ''}`
      }
    }

    // ── SOP / LOR / application ──
    if (/sop|statement of purpose|lor|letter of recommendation|application|essay|personal statement/.test(ql)) {
      return `**Application Documents Strategy:**

**Statement of Purpose (SOP):**
• Lead with your **motivation and career goals** — not autobiography
• Reference specific programs/faculty at the target university
• Highlight ${cgpa >= 8.0 ? 'your strong academic record as evidence of capability' : 'growth trajectory and relevant projects/internships to compensate for CGPA'}
• Keep it **800-1000 words**, structured in 4-5 paragraphs
• Get 2-3 people to review it before submission

**Letters of Recommendation (LOR):**
• Get **2-3 LORs** from professors who know your work well
• Prefer professors in **${prof.course || 'your target discipline'}** who can speak to subject expertise
• Give recommenders at least **3-4 weeks** notice
• Provide them a brief of your target universities and goals

**Application checklist for your ${recs.length} target schools:**
• ☐ Customise SOP for each university (mention specific programs)
• ☐ Ensure all transcripts are attested and translated if needed
• ☐ Prepare portfolio/work samples if applicable
• ☐ Check individual university requirements (some need GRE/GMAT)`
    }

    // ── Best match / top pick ──
    if (/best match|top pick|number one|strongest|highest fit|which one should i|where should i go|first choice/.test(ql)) {
      if (topRec) {
        return `**Your #1 Recommended University: ${topRec.university.name}**

This is your strongest match based on our 6-vector scoring engine:
• Overall Fit: **${topRec.fit.overall}%** — **${topRec.fit.admissionCategory}** tier
• Location: **${topRec.university.country}** ${topRec.university.worldRank ? `(World Rank #${topRec.university.worldRank})` : ''}

**Why this is your best fit:**
• Academic compatibility: **${topRec.fit.academicFit}%** — your CGPA **${cgpa}** ${topRec.fit.academicFit >= 70 ? 'exceeds' : 'meets'} their typical requirements
• Financial alignment: **${topRec.fit.financialFit}%** — your budget ${topRec.fit.financialFit >= 60 ? 'works well' : 'is tight but manageable'}
• CRM precedent: **${topRec.fit.crmSimilarity}%** — ${topRec.fit.crmSimilarity >= 50 ? 'similar students have been successfully placed here before' : 'limited CRM data but metrics are positive'}

**My strategic advice:** Make this your **primary application target**. Apply early, customise your SOP for their program, and prepare financial documents to show you can support your studies.`
      }
    }

    // ── Default catch-all with rich context ──
    return `Based on your profile — CGPA **${cgpa}**, IELTS **${ielts}**, budget **${budgetStr}** targeting **${prof.country || 'global'}** — here is your executive summary:

• Overall admission confidence: **${sc.admissionConfidence}/100**
• ${safeRecs.length} **Safe** targets | ${modRecs.length} **Moderate** targets | ${dreamRecs.length} **Dream** targets
• Average match fit across all recommendations: **${avgOverall}%**
• Scholarship confidence: **${sc.scholarshipConfidence}%**
• Similar CRM profiles: **${ins.similarStudents.count}** students (conversion rate: **${ins.similarStudents.conversionRate}%**)

**Try asking me:**
• "Tell me about ${topRec ? topRec.university.name : 'a specific university'}"
• "Can I get a scholarship?"
• "What should I improve in my profile?"
• "Compare countries for me"
• "When should I apply?"
• "How do I write my SOP?"`
  }

  function formatMessageText(text) {
    if (!text) return '';
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }

  const advisorSuggestions = [
    'Which schools can I target?',
    'Can I get a scholarship?',
    'What should I improve?',
    'What\'s my best match?',
    'Compare countries for me',
    'When should I apply?',
    'How do I write my SOP?',
    
  ]

  const formReady = profile.cgpa && profile.ielts && profile.budget && profile.country

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: isClosing ? 'fadeOutBackdrop 0.2s ease-in forwards' : 'fadeInBackdrop 0.25s ease-out forwards',
      }}
    >
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: UI.radiusLg, width: '100%', 
        maxWidth: step === 'chat' ? 1150 : 640,
        maxHeight: '90vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: UI.shadowSoft,
        animation: isClosing ? 'scaleDownModal 0.2s ease-in forwards' : 'scaleUpModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Modal Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          padding: '18px 24px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(37, 99, 235, 0.1))',
            border: '1px solid rgba(124, 58, 237, 0.35)',
            boxShadow: '0 8px 20px rgba(124, 58, 237, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <GraduationCap size={18} color="var(--accent-violet)" strokeWidth={2} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
              color: 'var(--text-primary)', lineHeight: 1.2
            }}>Student AI Advisor</div>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2
            }}>Personalised admission forecasts built on CRM metrics</div>
          </div>
          
          <button
            onClick={handleClose}
            style={{
              marginLeft: 'auto',
              width: 36, height: 36, borderRadius: 10,
              background: 'transparent', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left panel: Form, Scanning or Chat */}
          <div style={{
            width: step === 'chat' ? '58%' : '100%',
            display: 'flex', flexDirection: 'column',
            borderRight: step === 'chat' ? '1px solid var(--border-subtle)' : 'none',
            overflow: 'hidden'
          }}>
            {/* STEP 1: Profile Form */}
            {step === 'form' && (
              <div style={{ padding: 32, overflowY: 'auto' }}>
                
                {/* Onboarding welcome & Progress Header */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <span>Profile context</span>
                    <span>Step 1 of 2</span>
                  </div>
                  <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(15, 23, 42, 0.05)', overflow: 'hidden' }}>
                    <div style={{ width: '50%', height: '100%', background: 'linear-gradient(90deg, var(--accent-violet), var(--accent-blue))', borderRadius: 2 }} />
                  </div>
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Create Student Candidate Profile
                </h3>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)',
                  marginBottom: 20, lineHeight: 1.5
                }}>
                  Enter your credentials below. The recommendation engine matches stats with converted alumni from the CRM database.
                </p>



                {/* Form fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { k: 'name',   label: 'Your Name (optional)', type: 'text',   placeholder: 'e.g. Arjun Sharma' },
                    { k: 'cgpa',   label: 'CGPA (out of 10) *',   type: 'number', placeholder: 'e.g. 7.8',  min: 0, max: 10, step: 0.1 },
                    { k: 'ielts',  label: 'IELTS Score (out of 9) *', type: 'number', placeholder: 'e.g. 6.5',  min: 0, max: 9,  step: 0.5 },
                    { k: 'budget', label: 'Annual Tuition Budget (₹) *',  type: 'number', placeholder: 'e.g. 2200000' },
                  ].map(({ k, label, type, placeholder, min, max, step }) => (
                    <div key={k}>
                      <label style={{
                        display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10,
                        fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
                        letterSpacing: '0.08em', marginBottom: 6
                      }}>{label}</label>
                      <input
                        type={type} value={profile[k]} min={min} max={max} step={step}
                        placeholder={placeholder}
                        onChange={e => handleChange(k, e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                          fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
                          boxSizing: 'border-box', transition: 'border-color 0.15s ease'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-violet)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                      />
                    </div>
                  ))}

                  {[
                    { k: 'country', label: 'Preferred Destination *', opts: COUNTRIES },
                    { k: 'course',  label: 'Target Discipline',     opts: COURSES   },
                    { k: 'degree',  label: 'Degree Target',         opts: DEGREES   },
                  ].map(({ k, label, opts }) => (
                    <div key={k}>
                      <label style={{
                        display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10,
                        fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
                        letterSpacing: '0.08em', marginBottom: 6
                      }}>{label}</label>
                      <select
                        value={profile[k]}
                        onChange={e => handleChange(k, e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-elevated)', color: profile[k] ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
                          boxSizing: 'border-box', cursor: 'pointer', transition: 'border-color 0.15s ease'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-violet)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                      >
                        <option value="">Select…</option>
                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginTop: 20,
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)'
                }}>
                  <input
                    type="checkbox" checked={profile.hasScholarship}
                    onChange={e => handleChange('hasScholarship', e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent-violet)', cursor: 'pointer' }}
                  />
                  I am applying for merit-based scholarships
                </label>

                <button
                  disabled={!formReady}
                  onClick={handleStart}
                  style={{
                    width: '100%', marginTop: 24, padding: '14px 0',
                    borderRadius: 12, cursor: formReady ? 'pointer' : 'not-allowed',
                    background: formReady
                      ? 'linear-gradient(135deg, var(--accent-violet), var(--accent-blue))'
                      : 'var(--bg-elevated)',
                    border: 'none',
                    fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                    color: formReady ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: formReady ? '0 10px 20px rgba(124, 58, 237, 0.15)' : 'none'
                  }}
                  onMouseEnter={e => {
                    if (formReady) {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(124, 58, 237, 0.25)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (formReady) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 10px 20px rgba(124, 58, 237, 0.15)'
                    }
                  }}
                >
                  <Sparkles size={15} />
                  Get Personalised Evaluation
                </button>

                {!formReady && (
                  <p style={{
                    textAlign: 'center', marginTop: 10, fontFamily: 'var(--font-body)',
                    fontSize: 11, color: 'var(--text-muted)'
                  }}>
                    * CGPA, IELTS, Budget, and Destination are required
                  </p>
                )}
              </div>
            )}

            {/* STEP 1.5: Scanning Loader Screen */}
            {step === 'scanning' && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flex: 1, padding: 32, gap: 24, minHeight: 400
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  border: '3px solid rgba(124, 58, 237, 0.1)',
                  borderTop: '3px solid var(--accent-violet)',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                    AI Analysis Engine Active
                  </h4>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)',
                    animation: 'pulse 1.4s ease-in-out infinite'
                  }}>
                    {SCAN_STEPS[scanMessageIndex]}
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Chat Dialog */}
            {step === 'chat' && (
              <>
                {/* Onboarding progress stepper (mini summary toolbar) */}
                <div style={{
                  padding: '12px 22px', background: 'var(--bg-elevated)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 4 }}>Profile:</span>
                    <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(124,58,237,0.08)', color: 'var(--accent-violet)', fontSize: 11, fontWeight: 700 }}>{profile.name || 'Anonymous'}</span>
                    <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(37,99,235,0.08)', color: 'var(--accent-blue)', fontSize: 11, fontWeight: 700 }}>CGPA {profile.cgpa}</span>
                    <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(0,212,255,0.08)', color: 'var(--accent-cyan)', fontSize: 11, fontWeight: 700 }}>IELTS {profile.ielts}</span>
                    <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(22,163,74,0.08)', color: 'var(--accent-emerald)', fontSize: 11, fontWeight: 700 }}>₹{parseFloat(profile.budget).toLocaleString('en-IN')}</span>
                    <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(217,119,6,0.08)', color: 'var(--accent-amber)', fontSize: 11, fontWeight: 700 }}>{profile.country}</span>
                  </div>
                  <button
                    onClick={() => { setStep('form'); setMessages([]); setInsights(null); setRecommendations([]) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-violet)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <RotateCcw size={11} /> Edit profile
                  </button>
                </div>

                {/* Performance stats banner */}
                {insights && (
                  <div style={{
                    padding: '10px 22px', background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap'
                  }}>
                    {[
                      { label: 'CRM cohorts scanned', value: insights.similarStudents.count, color: 'var(--accent-cyan)' },
                      { label: 'Enrollment rate', value: `${insights.similarStudents.conversionRate}%${insights.similarStudents.lowConfidence ? ' (small sample)' : ''}`, color: 'var(--accent-emerald)' },
                      { label: 'Admission index', value: `${insights.universityScoring.admissionConfidence}/100`, color: 'var(--accent-violet)' },
                      { label: 'Scholarship index', value: `${insights.universityScoring.scholarshipConfidence}%`, color: 'var(--accent-amber)' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat conversation area */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '20px 22px 12px',
                  display: 'flex', flexDirection: 'column', gap: 16,
                  minHeight: 320, maxHeight: 440,
                  scrollbarWidth: 'thin',
                  scrollBehavior: 'smooth'
                }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      gap: 10, alignItems: 'flex-end'
                    }}>
                      {msg.role === 'ai' && (
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(37, 99, 235, 0.15))',
                          border: '1px solid rgba(124, 58, 237, 0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2
                        }}>
                          <Sparkles size={12} color="var(--accent-violet)" strokeWidth={2} />
                        </div>
                      )}
                      <div style={{
                        maxWidth: '82%', padding: '14px 18px',
                        borderRadius: msg.role === 'user' ? '18px 18px 6px 18px' : '6px 18px 18px 18px',
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(37, 99, 235, 0.08))'
                          : 'linear-gradient(180deg, var(--bg-elevated), rgba(15, 23, 42, 0.01))',
                        border: `1px solid ${msg.role === 'user' ? 'rgba(124, 58, 237, 0.25)' : 'var(--border-subtle)'}`,
                        boxShadow: msg.role === 'user' ? '0 8px 24px rgba(124, 58, 237, 0.08)' : '0 2px 10px rgba(15, 23, 42, 0.03)',
                        animation: 'messagePop 0.2s ease-out forwards',
                      }}>
                        <p style={{
                          fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.65,
                          margin: 0, color: msg.role === 'user' ? 'var(--accent-violet)' : 'var(--text-primary)',
                          fontWeight: msg.role === 'user' ? 600 : 400, whiteSpace: 'pre-wrap'
                        }}>{formatMessageText(msg.text)}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.22)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800,
                          color: 'var(--accent-violet)', marginBottom: 2
                        }}>{(profile.name || 'S')[0].toUpperCase()}</div>
                      )}
                    </div>
                  ))}

                  {thinking && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(37, 99, 235, 0.15))',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Sparkles size={12} color="var(--accent-violet)" strokeWidth={2} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', paddingLeft: 4 }}>Advisor is analyzing...</span>
                        <div style={{
                          padding: '12px 18px', borderRadius: '4px 14px 14px 14px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex', alignItems: 'center', gap: 5,
                          boxShadow: '0 6px 20px rgba(15, 23, 42, 0.04)',
                        }}>
                          {[0,1,2].map(i => (
                            <div key={i} style={{
                              width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-violet)',
                              animation: `copilotDot 1.4s ease-in-out ${i * 0.2}s infinite`
                            }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                {/* Suggestions chip row */}
                <div style={{
                  padding: '10px 22px', display: 'flex', gap: 8, flexWrap: 'wrap',
                  borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)'
                }}>
                  {advisorSuggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSend(s)} style={{
                      fontFamily: 'var(--font-body)', fontSize: 11.5, color: 'var(--text-muted)',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                      padding: '6px 14px', borderRadius: 99, cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.35)'; e.currentTarget.style.background = 'rgba(124, 58, 237, 0.03)'; e.currentTarget.style.color = 'var(--accent-violet)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                    >{s}</button>
                  ))}
                </div>

                {/* Chat Sticky Input Area */}
                <div style={{
                  position: 'sticky', bottom: 0, zIndex: 10,
                  padding: '12px 18px 18px', borderTop: '1px solid var(--border-subtle)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex', gap: 10, alignItems: 'center'
                }}>
                  <div style={{
                    flex: 1, background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)', borderRadius: 12,
                    transition: 'border-color 0.15s ease',
                    display: 'flex', alignItems: 'center'
                  }}
                    onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent-violet)'}
                    onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    <input
                      ref={inputRef}
                      value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Ask about target categories, scholarships, visa metrics..."
                      style={{
                        width: '100%', padding: '12px 16px', fontFamily: 'var(--font-body)',
                        fontSize: 13.5, color: 'var(--text-primary)', background: 'transparent',
                        border: 'none', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleSend()}
                    disabled={thinking || !input.trim()}
                    style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: input.trim() && !thinking ? 'var(--accent-violet)' : 'rgba(124, 58, 237, 0.05)',
                      border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: input.trim() && !thinking ? 'pointer' : 'default', outline: 'none',
                      transition: 'all 0.15s ease',
                      boxShadow: input.trim() && !thinking ? '0 6px 14px rgba(124, 58, 237, 0.2)' : 'none'
                    }}
                  >
                    <Send size={15} color={input.trim() && !thinking ? '#ffffff' : 'var(--text-muted)'} strokeWidth={2.2} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right panel: Expansive recommendations dashboard */}
          {step === 'chat' && (
            <div style={{
              width: '42%',
              display: 'flex', flexDirection: 'column',
              background: 'linear-gradient(180deg, var(--bg-elevated), rgba(15, 23, 42, 0.03))',
              borderLeft: '1px solid var(--border-subtle)',
              overflowY: 'auto',
              padding: 20,
              gap: 16
            }}>
              {/* Header section of Recommendations */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>Recommendations</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--accent-violet)', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', padding: '2px 8px', borderRadius: 99 }}>{recommendations.length} schools</span>
              </div>

              {/* Admission Tiers Visual Legend */}
              {recommendations.length > 0 && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: UI.radiusMd,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: 'var(--shadow-card)',
                  animation: 'floatIn 0.3s ease-out forwards'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Info size={13} color="var(--accent-violet)" />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)' }}>Understanding Admission Categories</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { tier: 'Safe', color: 'var(--accent-emerald)', bg: 'rgba(22,163,74,0.04)', border: 'rgba(22,163,74,0.12)', desc: 'High probability of admission.' },
                      { tier: 'Moderate', color: 'var(--accent-blue)', bg: 'rgba(37,99,235,0.04)', border: 'rgba(37,99,235,0.12)', desc: 'Good chance but still competitive.' },
                      { tier: 'Competitive', color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.04)', border: 'rgba(245,158,11,0.12)', desc: 'Requires a strong profile.' },
                      { tier: 'Dream', color: 'var(--accent-violet)', bg: 'rgba(124,58,237,0.04)', border: 'rgba(124,58,237,0.12)', desc: 'Very ambitious universities.' }
                    ].map((t, idx) => (
                      <div key={idx} style={{
                        padding: '8px 10px', borderRadius: 10,
                        background: t.bg, border: `1px solid ${t.border}`,
                        display: 'flex', flexDirection: 'column', gap: 3
                      }}>
                        <span style={{ fontSize: 10.5, fontWeight: 900, color: t.color }}>{t.tier}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{t.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '40px 20px', gap: 12, border: '1px dashed var(--border-default)', borderRadius: UI.radiusMd
                }}>
                  <HelpCircle size={32} color="var(--text-muted)" strokeWidth={1.5} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No universities matched the selected parameters. Try widening filters.</span>
                </div>
              ) : (
                recommendations.map((rec, i) => {
                  const isExpanded = expandedCardIndex === i
                  return (
                    <div
                      key={i}
                      onClick={(e) => {
                        if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON' && !e.target.closest('a') && !e.target.closest('button')) {
                          setExpandedCardIndex(isExpanded ? null : i)
                        }
                      }}
                      style={{
                        background: 'var(--bg-surface)',
                        border: isExpanded ? '1px solid rgba(124, 58, 237, 0.35)' : '1px solid var(--border-subtle)',
                        borderRadius: UI.radiusMd,
                        padding: isExpanded ? 18 : '12px 18px',
                        boxShadow: isExpanded ? '0 12px 28px rgba(15, 23, 42, 0.08)' : 'var(--shadow-card)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isExpanded ? 14 : 0,
                        maxHeight: isExpanded ? '1500px' : '72px',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        flexShrink: 0,
                        animation: 'floatIn 0.3s ease-out forwards',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = isExpanded ? 'translateY(0)' : 'translateY(-2px)'
                        if (!isExpanded) {
                          e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)'
                          e.currentTarget.style.boxShadow = '0 12px 24px rgba(15, 23, 42, 0.06)'
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        if (!isExpanded) {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)'
                          e.currentTarget.style.boxShadow = 'var(--shadow-card)'
                        }
                      }}
                    >
                      {/* Radial-like background shine for elite matching */}
                      {isExpanded && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'radial-gradient(400px circle at 0% 0%, rgba(124, 58, 237, 0.04), transparent 50%)',
                          pointerEvents: 'none'
                        }} />
                      )}

                      {/* Header details: title and tags */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, position: 'relative', zIndex: 1 }}>
                        <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                          }}>
                            {getUniversityLogo(rec.university) ? (
                              <img
                                src={getUniversityLogo(rec.university)}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={e => { e.currentTarget.style.display = 'none' }}
                              />
                            ) : (
                              <GraduationCap size={16} color="var(--text-muted)" strokeWidth={2} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{
                              fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 800,
                              margin: '0 0 4px', color: 'var(--text-primary)', lineHeight: 1.3
                            }}>{rec.university.name}</h4>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                              <span>{rec.university.country}</span>
                              {rec.university.worldRank && (
                                <span style={{
                                  padding: '1px 5px', borderRadius: 4, fontSize: 9.5, fontWeight: 700,
                                  background: 'rgba(15, 23, 42, 0.05)', color: 'var(--text-secondary)'
                                }}>
                                  #{rec.university.worldRank} World
                                </span>
                              )}
                              {rec.university.rankLabel && rec.university.rankLabel !== 'Unranked' && (
                                <span style={{
                                  padding: '1px 5px', borderRadius: 4, fontSize: 9.5, fontWeight: 700,
                                  background: 'rgba(124, 58, 237, 0.06)', color: 'var(--accent-violet)',
                                  border: '1px solid rgba(124, 58, 237, 0.12)'
                                }}>
                                  {rec.university.rankLabel}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                            color: rec.fit.admissionCategory === 'Safe' ? 'var(--accent-emerald)' 
                                 : rec.fit.admissionCategory === 'Moderate' ? 'var(--accent-blue)' 
                                 : 'var(--accent-violet)',
                            background: rec.fit.admissionCategory === 'Safe' ? 'rgba(22,163,74,0.08)' 
                                     : rec.fit.admissionCategory === 'Moderate' ? 'rgba(37,99,235,0.08)' 
                                     : 'rgba(124,58,237,0.08)',
                            border: `1px solid ${
                              rec.fit.admissionCategory === 'Safe' ? 'rgba(22,163,74,0.15)' 
                              : rec.fit.admissionCategory === 'Moderate' ? 'rgba(37,99,235,0.15)' 
                              : 'rgba(124,58,237,0.15)'
                            }`
                          }}>{rec.fit.admissionCategory}</span>
                          
                          {/* Chevron icon indicator */}
                          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section Details */}
                      {isExpanded && (
                        <div style={{
                          display: 'flex', flexDirection: 'column', gap: 14,
                          animation: 'fadeIn 0.2s ease-out forwards',
                          position: 'relative', zIndex: 1
                        }}>
                          <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)' }} />

                          {/* Score visual progress bar */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Overall Match Fit</span>
                              <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent-violet)' }}>{rec.fit.overall}%</span>
                            </div>
                            <div style={{
                              width: '100%', height: 6, borderRadius: 99,
                              background: 'rgba(15, 23, 42, 0.05)', overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${rec.fit.overall}%`, height: '100%',
                                background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-violet))',
                                borderRadius: 99
                              }} />
                            </div>
                          </div>
                          <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)' }} />



                          {/* Sub-score grid visualization */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                            {[
                              { label: 'Academic Fit', val: rec.fit.academicFit },
                              { label: 'Language Fit', val: rec.fit.languageFit },
                              { label: 'Financial Fit', val: rec.fit.financialFit },
                              { label: 'Course Match', val: rec.fit.courseFit },
                              { label: 'CRM History', val: rec.fit.crmSimilarity },
                              { label: 'Scholarships', val: rec.fit.scholarshipFit }
                            ].map((score, sIdx) => (
                              <div key={sIdx} style={{
                                padding: '10px 12px', borderRadius: 12,
                                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                                display: 'flex', flexDirection: 'column', gap: 4
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{score.label}</span>
                                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{score.val}%</span>
                                </div>
                                <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(15, 23, 42, 0.05)', overflow: 'hidden' }}>
                                  <div style={{ width: `${score.val}%`, height: '100%', background: score.val >= 70 ? 'var(--accent-emerald)' : score.val >= 50 ? 'var(--accent-blue)' : 'var(--accent-amber)' }} />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Explanation Paragraph */}
                          <p style={{
                            fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0,
                            background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: 10,
                            borderLeft: '3px solid var(--accent-violet)'
                          }}>
                            {rec.explanation}
                          </p>

                          {/* Pros & Cons / Strengths & Weaknesses (Prompt 5) */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>Top Strengths</span>
                              {rec.pros.slice(0, 2).map((pro, pIdx) => (
                                <div key={pIdx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11.5, color: 'var(--text-muted)' }}>
                                  <CheckCircle2 size={12} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
                                  <span>{pro}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>Areas of Note</span>
                              {(rec.cons.length > 0 ? rec.cons : rec.weaknesses || []).slice(0, 2).map((con, cIdx) => (
                                <div key={cIdx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11.5, color: 'var(--text-muted)' }}>
                                  <AlertCircle size={12} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
                                  <span>{con}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Recommended steps */}
                          {rec.improvements?.length > 0 && (
                            <div style={{
                              display: 'flex', flexDirection: 'column', gap: 6,
                              padding: '10px 12px', background: 'rgba(124, 58, 237, 0.02)',
                              border: '1px dashed rgba(124, 58, 237, 0.2)', borderRadius: 10
                            }}>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent-violet)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Advisor Strategy Tip:</span>
                              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                {rec.improvements[0]}
                              </p>
                            </div>
                          )}
                                {/* Tuition Range Display */}
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: 12, color: 'var(--text-secondary)'
                          }}>
                            <DollarSign size={14} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
                            <span><strong>Tuition Cost:</strong> {rec.tuitionRange}</span>
                          </div>

                          {/* Scholarship note */}
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: 12, color: 'var(--text-secondary)'
                          }}>
                            <Award size={14} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
                            <span><strong>Scholarship Info:</strong> {rec.scholarshipNote}</span>
                          </div>

                          {/* Plain Link of the College */}
                          {rec.university.website && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 4 }}>
                              <Globe size={14} color="var(--accent-violet)" style={{ flexShrink: 0 }} />
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Website:</span>
                              <a
                                href={rec.university.website.startsWith('http') ? rec.university.website : `http://${rec.university.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: 'var(--accent-violet)',
                                  textDecoration: 'underline',
                                  fontWeight: 700,
                                  wordBreak: 'break-all'
                                }}
                              >
                                {rec.university.website}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

        </div>
      </div>

      {/* Matched University Full Profile Lightbox Modal (Prompt 5 / Step 2 & 5) */}
      {detailRec && (
        <div
          ref={detailBackdropRef}
          onClick={handleDetailBackdropClick}
          style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: detailClosing ? 'fadeOutBackdrop 0.18s ease-in-out forwards' : 'fadeInBackdrop 0.2s ease-in-out forwards',
            padding: 20
          }}
        >
          <div
            style={{
              width: '100%', maxWidth: 540,
              maxHeight: '85vh',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 20,
              boxShadow: 'var(--shadow-elevated)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
              animation: detailClosing ? 'scaleDownModal 0.18s ease-in-out forwards' : 'scaleUpModal 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
          >
            {/* Clean Header — no photo */}
            <div style={{
              padding: '20px 22px 16px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(37,99,235,0.04))',
              borderBottom: '1px solid var(--border-subtle)',
              position: 'relative'
            }}>
              {/* Close Button */}
              <button
                onClick={closeDetail}
                style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <X size={15} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* University Logo */}
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {getUniversityLogo(detailRec.university) ? (
                    <img
                      src={getUniversityLogo(detailRec.university)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <GraduationCap size={22} color="var(--accent-violet)" strokeWidth={1.8} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 6, fontSize: 9.5, fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: detailRec.fit.admissionCategory === 'Safe' ? 'var(--accent-emerald)'
                           : detailRec.fit.admissionCategory === 'Moderate' ? 'var(--accent-blue)'
                           : 'var(--accent-violet)',
                      background: detailRec.fit.admissionCategory === 'Safe' ? 'rgba(22,163,74,0.1)'
                               : detailRec.fit.admissionCategory === 'Moderate' ? 'rgba(37,99,235,0.1)'
                               : 'rgba(124,58,237,0.1)',
                      border: `1px solid ${detailRec.fit.admissionCategory === 'Safe' ? 'rgba(22,163,74,0.2)' : detailRec.fit.admissionCategory === 'Moderate' ? 'rgba(37,99,235,0.2)' : 'rgba(124,58,237,0.2)'}`
                    }}>{detailRec.fit.admissionCategory} Tier</span>
                    {detailRec.university.worldRank && (
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-secondary)', background: 'rgba(15,23,42,0.05)', padding: '2px 7px', borderRadius: 5 }}>
                        #{detailRec.university.worldRank} World
                      </span>
                    )}
                    {detailRec.university.rankLabel && detailRec.university.rankLabel !== 'Unranked' && (
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--accent-violet)', background: 'rgba(124,58,237,0.06)', padding: '2px 7px', borderRadius: 5, border: '1px solid rgba(124,58,237,0.12)' }}>
                        {detailRec.university.rankLabel}
                      </span>
                    )}
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800,
                    color: 'var(--text-primary)', margin: '0 0 3px'
                  }}>{detailRec.university.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} /> {detailRec.university.country}
                    </span>
                    {detailRec.university.website && (
                      <a
                        href={detailRec.university.website.startsWith('http') ? detailRec.university.website : `http://${detailRec.university.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: 11, color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none', fontWeight: 600 }}
                      >
                        <Globe size={11} /> {detailRec.university.website}
                      </a>
                    )}
                  </div>
                </div>
                {/* Big match score */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-violet)', lineHeight: 1 }}>{detailRec.fit.overall}%</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>Match Fit</div>
                </div>
              </div>
            </div>


            {/* Scrollable Content */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: 18,
              display: 'flex', flexDirection: 'column', gap: 16
            }}>
              


              {/* Sub-scores grid visualization (Not Cut Off!) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>Compatibility Sub-Scores</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Academic Fit', val: detailRec.fit.academicFit },
                    { label: 'Language Fit', val: detailRec.fit.languageFit },
                    { label: 'Financial Fit', val: detailRec.fit.financialFit },
                    { label: 'Course Match', val: detailRec.fit.courseFit },
                    { label: 'CRM History', val: detailRec.fit.crmSimilarity },
                    { label: 'Scholarships', val: detailRec.fit.scholarshipFit }
                  ].map((score, sIdx) => (
                    <div key={sIdx} style={{
                      padding: '10px 12px', borderRadius: 12,
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                      display: 'flex', flexDirection: 'column', gap: 4
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{score.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{score.val}%</span>
                      </div>
                      <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(15, 23, 42, 0.05)', overflow: 'hidden' }}>
                        <div style={{ width: `${score.val}%`, height: '100%', background: score.val >= 70 ? 'var(--accent-emerald)' : score.val >= 50 ? 'var(--accent-blue)' : 'var(--accent-amber)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation Paragraph */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>Academic Analysis &amp; Rationale</span>
                <p style={{
                  fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0,
                  background: 'var(--bg-elevated)', padding: '12px 14px', borderRadius: 12,
                  borderLeft: '3px solid var(--accent-violet)'
                }}>
                  {detailRec.explanation}
                </p>
              </div>

              {/* Pros & Cons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>Top Strengths</span>
                  {detailRec.pros.map((pro, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      <CheckCircle2 size={13} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{pro}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>Areas of Note</span>
                  {(detailRec.cons.length > 0 ? detailRec.cons : detailRec.weaknesses || []).map((con, cIdx) => (
                    <div key={cIdx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      <AlertCircle size={13} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{con}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy Improvements */}
              {detailRec.improvements?.length > 0 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 6,
                  padding: '12px 14px', background: 'rgba(124, 58, 237, 0.02)',
                  border: '1px dashed rgba(124, 58, 237, 0.2)', borderRadius: 12
                }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent-violet)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Advisor Strategy Tip:</span>
                  <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {detailRec.improvements.map((imp, idx) => (
                      <li key={idx} style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cost & Scholarships */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '4px 0' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, color: 'var(--text-secondary)',
                  padding: 10, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)'
                }}>
                  <DollarSign size={15} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 9.5, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Tuition Cost</span>
                    <strong>{detailRec.tuitionRange}</strong>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, color: 'var(--text-secondary)',
                  padding: 10, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)'
                }}>
                  <Award size={15} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 9.5, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Scholarships</span>
                    <strong>{detailRec.scholarshipNote}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div style={{
              padding: 14, borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)', display: 'flex'
            }}>
              <button
                onClick={closeDetail}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10,
                  background: 'transparent', border: '1px solid var(--border-default)',
                  fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Consolidated Animation Declarations */}
      <style>{`
        @keyframes fadeInBackdrop {
          from { background: rgba(15, 23, 42, 0); backdrop-filter: blur(0px); }
          to { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); }
        }
        @keyframes fadeOutBackdrop {
          from { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); }
          to { background: rgba(15, 23, 42, 0); backdrop-filter: blur(0px); }
        }
        @keyframes scaleUpModal {
          from { opacity: 0; transform: scale(0.96) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes scaleDownModal {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.96) translateY(16px); }
        }
        @keyframes copilotDot {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes messagePop {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 720px) {
          /* Keep content + functionality; only adjust layout visuals */
          .advisor-modal-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// LOCAL INTELLIGENCE ENGINE (unchanged behaviour from the original page — only
// the data source feeding it changed from MOCK to real computed metrics)
// ═════════════════════════════════════════════════════════════════════════════

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

function extractCountryMention(q, countryEntries) {
  const lower = q.toLowerCase()
  for (const [name] of countryEntries) {
    if (lower.includes(name.toLowerCase())) return name
  }
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
  { key: 'greeting', test: /^\s*(hi+|hello|hey+|sup|what'?s up|what can you do|who are you)\b/i,
    answer: d => `Hey! I'm plugged into your live CRM — ${d.total} students, ${d.enrollmentRate}% conversion rate, and I can see everything from individual counsellor splits to lead source ROI. Ask me about the pipeline, your team, where students are dropping off, which marketing channel is actually working, visa deadlines, scholarships — whatever's on your mind. What do you want to look at?` },
  { key: 'country_specific', test: q => false,
    answer: (d, named) => {
      const entry = d.countryEntries.find(([n]) => n.toLowerCase() === named.toLowerCase())
      if (!entry) return `I don't see "${named}" in your current country distribution. The countries with students right now are: ${d.countryEntries.map(([n, c]) => `${n} (${c})`).join(', ')}.`
      const [name, count] = entry
      const share = d.total > 0 ? ((count / d.total) * 100).toFixed(1) : '0'
      const rank  = d.countryEntries.findIndex(([n]) => n === name) + 1
      const rankLabel = rank === 1 ? 'your top market' : rank === 2 ? 'your second-biggest market' : `your #${rank} market`
      return `${name} is ${rankLabel} with ${count} students (${share}% of your pipeline). With ${d.scholarshipEligible} scholarship-eligible students across the board and an average budget of ₹${d.avgBudgetFmt}, ${name}-bound students are worth prioritising for dedicated intake campaigns. ${rank > 1 ? `If you want to grow this market, ${d.countryEntries[0][0]} playbook is the template to replicate.` : `Keep the ${name} funnel tight — it's your biggest revenue driver and any slowdown there hits the overall numbers hard.`}`
    },
    why: (d, named) => {
      const entry = d.countryEntries.find(([n]) => n.toLowerCase() === named.toLowerCase())
      if (!entry) return `That country doesn't currently appear in your pipeline data.`
      const [name, count] = entry
      const share = d.total > 0 ? ((count / d.total) * 100).toFixed(1) : '0'
      return `${name}'s ${count} students (${share}%) matter beyond just the headcount — different countries have different visa complexity, processing timelines, and scholarship availability. Counsellors who handle ${name} applications every day build institutional knowledge that directly reduces documentation errors and speeds up the visa stage.`
    }
  },
  { key: 'country', test: /\bcountry\b|countries|destination|which market|top market/i,
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
      if (entries.length < 2) return `Concentration in one market lets your team build deeper expertise in that country's visa, scholarship, and university systems.`
      const [n1, c1] = entries[0], [n2, c2] = entries[1]
      return `${n1} at ${d.total > 0 ? ((c1/d.total)*100).toFixed(1) : '?'}% vs ${n2} at ${d.total > 0 ? ((c2/d.total)*100).toFixed(1) : '?'}% — that's a meaningful gap. Focus on ${n1} for counsellor expertise that compounds with each application processed.`
    }
  },
  { key: 'visa', test: /visa/i,
    answer: d => `${d.visaDeadlines} students have visa deadlines coming up — these are your most valuable pipeline assets right now. Every one of them has already cleared counselling, documentation, and application, so losing someone here means writing off everything already spent. Get document submission status confirmed for all ${d.visaDeadlines} today, escalate any incomplete cases immediately, and send partner university reminders in parallel.`,
    why: d => `Visa-stage students are at the top of the cost pyramid. ${d.followupOverdue} overdue follow-ups might look more urgent on paper because it's a bigger number, but the cost of losing a visa-stage student is 4–5x higher than losing an early-stage lead. That's why these ${d.visaDeadlines} take priority.`
  },
  { key: 'scholarship', test: /scholarship|financial aid|funding/i,
    answer: d => `You've got ${d.scholarshipEligible} scholarship-eligible students in the pipeline. They tend to have stronger academic profiles and once funding is confirmed, their commitment rate goes up sharply. The play here is proactive outreach, not waiting for them to ask. Cross-check this list against your ${d.followupOverdue} overdue follow-ups — anyone who's both scholarship-eligible and overdue for contact is slipping away for a fixable reason.`,
    why: d => `Cost anxiety is the most common silent drop-off driver. With ${d.highIntentLeads} high-intent leads in the pipeline, there's a real chunk who are ready to commit but haven't seen a scholarship conversation yet.`
  },
  { key: 'documentation', test: /document|paperwork|\bdocs\b|stuck/i,
    answer: d => {
      const worstNote = d.funnelWorstDrop ? ` It's also your single biggest funnel drop — ${d.funnelWorstDrop.dropPct}% attrition between ${d.funnelWorstDrop.from} and ${d.funnelWorstDrop.to}.` : ''
      return `${d.stuckInDocs} students are blocked at documentation right now.${worstNote} A standardised doc checklist with automated deadline nudges typically clears 60–70% of a backlog this size within 48 hours. Worth doing today.`
    },
    why: d => `Documentation drop-off is deceptive because it looks like students are disengaging, but they're usually just confused or waiting on something. ${d.stuckInDocs} students is a high-recoverability group — most of them will convert if the process friction is removed.`
  },
  { key: 'followup', test: /follow-?up|overdue|no contact|not contacted|going cold|gone cold/i,
    answer: d => `${d.followupOverdue} students haven't had any contact in 7+ days — that's your most immediate churn risk. Engagement drops fast after a week of silence, and study-abroad decisions have a short window before students start talking to other consultancies. Assign all ${d.followupOverdue} today.`,
    why: d => `${d.followupOverdue} out of ${d.active} active students is roughly ${d.active > 0 ? ((d.followupOverdue / d.active) * 100).toFixed(1) : '0'}% of your active pipeline going quiet. These students don't need more selling, just consistent contact.`
  },
  { key: 'counselors', test: /counsel|coach|rep|team performance|who('?s| is) (best|top|performing|worst|lagging)/i,
    answer: d => {
      const top = d.topCounselor, under = d.underperforming || [], avg = d.avgCounselorRate?.toFixed(1) || '0'
      if (under.length > 0) {
        const potentialGain = under.reduce((s, c) => s + Math.round(c.students * (d.avgCounselorRate - c.rate) / 100), 0)
        return `${top?.name} leads at ${top?.rate.toFixed(1)}% on ${top?.students} students. ${under.map(c => c.name).join(' and ')} ${under.length === 1 ? 'is' : 'are'} below the ${avg}% team average — closing just half that gap would add roughly ${potentialGain} more enrolments without a single new lead. Shadow sessions with ${top?.name} is the fastest fix.`
      }
      return `Solid across the board — everyone's at or above the ${avg}% team average. ${top?.name} leads at ${top?.rate.toFixed(1)}%. Getting more qualified leads to a team that's already converting well is the higher-leverage move.`
    },
    why: d => {
      const top = d.topCounselor, bottom = d.bottomCounselor
      if (!top || !bottom || top.name === bottom.name) return `When the team is performing close to average, the conversion rate ceiling is typically process and lead quality — not individual skill.`
      return `${top.name} at ${top.rate.toFixed(1)}% vs ${bottom.name} at ${bottom.rate.toFixed(1)}% on comparable student volumes — that gap isn't explained by luck. Top performers have a tighter follow-up cadence and handle documentation blockers proactively.`
    }
  },
  { key: 'leadsource', test: /lead source|lead channel|\broi\b|channel|marketing|campaign|instagram|facebook|referral|seminar|walk.?in/i,
    answer: d => {
      const conv = d.topLeadByConv, vol = d.topLeadByVol
      const allLines = (d.leadSources || []).map(ls => {
        const rate = ls.leads > 0 ? ((ls.conversions / ls.leads) * 100).toFixed(1) : '0.0'
        return `${ls.name}: ${ls.leads} leads, ${rate}% conversion`
      }).join(' · ')
      if (conv && vol && conv.name !== vol.name) return `Two channels doing different jobs well: ${vol.name} brings the volume (${vol.leads} leads), ${conv.name} converts the best (${d.bestConvRate}%). Keep both funded. Here's the full picture: ${allLines}.`
      return `${d.topLeadSrc} is your best channel on both volume and conversion at ${d.bestConvRate}%. Full breakdown: ${allLines}. Lean into it but monitor the conversion rate weekly.`
    },
    why: () => `Volume and conversion are different metrics. A high-volume channel keeps the top of the funnel full. A high-conversion channel is your efficiency engine. The ideal allocation keeps both running.`
  },
  { key: 'risk', test: /\brisk\b|re-?engage|churn|high.?risk|at.?risk/i,
    answer: d => `Risk breakdown: ${d.lowRisk} low, ${d.medRisk} medium, ${d.highRisk} high. The ${d.highRisk} high-risk students need to be in someone's queue today. The ${d.medRisk} medium-risk group is actually the bigger opportunity — they're convertible with the right nudge, and there are far more of them.`,
    why: d => `${d.medRisk} students shifting from medium to low risk has a bigger impact on your overall conversion than saving the ${d.highRisk} who are already deeply disengaged. High-risk re-engagement is triage; medium-risk is where you actually grow the conversion rate.`
  },
  { key: 'conversion', test: /conversion|enroll(ment)?\s*rate|how many (are )?enrolled|total enrolled/i,
    answer: d => `You're at ${d.enrollmentRate}% conversion — ${d.converted} enrolled out of ${d.total} total, with ${d.active} still active. Average enrollment probability across active students is ${d.enrollProb}%, and ${d.highIntentLeads} are flagged high-intent. The gap between ${d.enrollProb}% probability and ${d.enrollmentRate}% actual conversion is operational — clear the documentation backlog and overdue follow-ups and that number moves.`,
    why: d => `When your average enrollment probability (${d.enrollProb}%) is much higher than your actual conversion rate (${d.enrollmentRate}%), you're not losing students because of weak leads — you're losing them to process delays. The fix is internal.`
  },
  { key: 'funnel', test: /\bfunnel\b|drop.?off|dropping|attrition|bottleneck|where.*losing|losing.*where/i,
    answer: d => {
      if (!d.funnelWorstDrop) return `Funnel: ${(d.funnelStages || []).map(s => `${s.stage} (${s.value})`).join(' → ')}. Ask me about a specific stage and I'll tell you what's driving the drop.`
      const { from, to, drop, dropPct } = d.funnelWorstDrop
      const flow = (d.funnelStages || []).map(s => `${s.stage} (${s.value})`).join(' → ')
      return `Biggest problem is ${from} to ${to} — ${drop} students lost, ${dropPct}% attrition. Full flow: ${flow}. Fix that single stage and the end-to-end yield moves more than any other change you could make right now.`
    },
    why: d => {
      if (!d.funnelDrops?.length) return `Focus on the operational flags — follow-up overdue and documentation stuck are the most common drop-off drivers.`
      const drops = d.funnelDrops.map(dr => `${dr.from}→${dr.to}: ${dr.drop} lost (${dr.dropPct}%)`).join(', ')
      return `Stage breakdown: ${drops}. An early-stage drop costs you a lead. A late-stage drop costs you a lead plus counselling time plus documentation plus application fees. Fix late-stage drop-off first.`
    }
  },
  { key: 'academic', test: /cgpa|ielts|academic|student profile|lead score|avg score/i,
    answer: d => `Pipeline profile: ${d.avgCgpa} CGPA average, ${d.avgIelts} IELTS average, ${d.avgLeadScore}/100 lead score, ₹${d.avgBudgetFmt} average budget. Most popular course is ${d.topCourse}, top destination ${d.topCountry}. ${d.highIntentLeads} students flagged high-intent. Your conversion bottlenecks are operational, not a lead quality problem.`
  },
  { key: 'priorities', test: /\btoday\b|top\s*\d*\s*action|priorit|what should (i|we) do|next steps|where (do i|should i) start/i,
    answer: d => `Three things, in order of cost-of-inaction: first, lock down your ${d.visaDeadlines} visa-deadline students — confirm document status for all of them today. Second, get someone on each of the ${d.followupOverdue} overdue follow-ups before end of day. Third, push the ${d.stuckInDocs} documentation-stuck students with direct outreach and a clear checklist. That order matters — losing a visa-stage student costs 4–5x more than losing an early-stage one.`,
    why: d => `The sequence is pure cost-of-loss logic. Visa-stage = maximum sunk cost, highest urgency. Overdue follow-ups = time-sensitive because engagement decays daily. Documentation stuck = high recoverability but compounds daily.`
  },
  { key: 'summary', test: /pipeline|overview|summary|how (are|is) (we|things|it)|state of|how'?s (the )?(crm|business|things)/i,
    answer: d => `Here's where you stand: ${d.total} students total, ${d.converted} converted (${d.enrollmentRate}% rate), ${d.active} still active, ${d.dropped} dropped. Risk split: ${d.lowRisk} low / ${d.medRisk} medium / ${d.highRisk} high. Enrollment probability averaging ${d.enrollProb}% across active students, ${d.highIntentLeads} flagged high-intent. Three fires on the board — ${d.followupOverdue} overdue follow-ups, ${d.stuckInDocs} stuck in documentation, ${d.visaDeadlines} visa deadlines closing in.`,
    why: d => `These numbers pull directly from your live CRM — headcounts from student records, risk levels from the scoring model, operational flags from activity timestamps.`
  },
  { key: 'newleads', test: /new leads?|this week|fresh leads?|weekly/i,
    answer: d => `${d.newLeadsWeek} new leads came in this week. First-contact speed is the single biggest predictor of conversion in study-abroad — get someone on each of these within 24 hours. At your current ${d.enrollmentRate}% conversion rate, that's potentially ${Math.round(d.newLeadsWeek * d.enrollmentRate / 100)} more enrolments from this week's intake alone.`,
    why: () => `Speed-to-contact research consistently shows that leads contacted within an hour are 7x more likely to convert than those reached after 24 hours.`
  },
]

const FOLLOWUP_RE = /^(\s*(and\s+))?(why|how come|explain|elaborate|tell me more|go on|what do you mean|expand|give me more detail|break (that|it) down|say more)\b/i
const LESS_RE     = /less words?|shorter|simplif|summarise|summarize|tl;?dr|brief/i
const MORE_RE     = /more detail|more info|go deeper|deep(er)?\s*dive|elaborate more|expand more/i

const safeFloat = (val) => {
  if (val === null || val === undefined) return 0
  const f = parseFloat(val)
  return isNaN(f) ? 0 : f
}



function calculateCRMQuery(ql, students = []) {
  if (!students || students.length === 0) return null;
  const totalCount = students.length;
  
  // Filters state
  let conditions = [];
  
  // -- CGPA --
  const cgpaMatch = ql.match(/(?:cgpa|gpa)\s*(above|greater than|more than|below|less than|under|lower than|between|=|>|<|>=|<=)?\s*([0-9.]+)(?:\s*(?:and|to|&|-)\s*([0-9.]+))?/i);
  if (cgpaMatch) {
    const op = (cgpaMatch[1] || '').trim().toLowerCase();
    const val1 = parseFloat(cgpaMatch[2]);
    const val2 = cgpaMatch[3] ? parseFloat(cgpaMatch[3]) : null;
    
    if (op.includes('between') || val2 !== null) {
       conditions.push(s => { const g = safeFloat(s.cgpa) || safeFloat(s.gpa); return g >= val1 && g <= val2; });
    } else if (['below', 'less than', 'under', 'lower than', '<', '<='].includes(op)) {
       conditions.push(s => { const g = safeFloat(s.cgpa) || safeFloat(s.gpa); return g > 0 && g <= val1; });
    } else { // default to above or >=
       conditions.push(s => { const g = safeFloat(s.cgpa) || safeFloat(s.gpa); return g >= val1; });
    }
  }
  
  // -- IELTS --
  const ieltsMatch = ql.match(/(?:ielts)\s*(above|greater than|more than|below|less than|under|lower than|between|=|>|<|>=|<=)?\s*([0-9.]+)/i);
  if (ieltsMatch) {
    const op = (ieltsMatch[1] || '').trim().toLowerCase();
    const val1 = parseFloat(ieltsMatch[2]);
    if (['below', 'less than', 'under', 'lower than', '<', '<='].includes(op)) {
       conditions.push(s => { const i = safeFloat(s.ielts_score) || safeFloat(s.ielts); return i > 0 && i < val1; });
    } else {
       conditions.push(s => { const i = safeFloat(s.ielts_score) || safeFloat(s.ielts); return i >= val1; });
    }
  }

  // -- BUDGET --
  const budgetMatch = ql.match(/(?:budget|cost)\s*(above|greater than|more than|below|less than|under|lower than|between|=|>|<|>=|<=)?\s*([0-9.]+)\s*(lakh|l|k)?/i);
  if (budgetMatch) {
    const op = (budgetMatch[1] || '').trim().toLowerCase();
    let val1 = parseFloat(budgetMatch[2]);
    const multiplier = (budgetMatch[3] || '').trim().toLowerCase();
    if (multiplier === 'lakh' || multiplier === 'l' || val1 < 1000) val1 *= 100000;
    
    if (['below', 'less than', 'under', 'lower than', '<', '<='].includes(op)) {
       conditions.push(s => { const b = safeFloat(s.budget) || safeFloat(s.avg_budget); return b > 0 && b < val1; });
    } else {
       conditions.push(s => { const b = safeFloat(s.budget) || safeFloat(s.avg_budget); return b >= val1; });
    }
  }

  // -- GENDER --
  if (ql.match(/\bfemale\b/)) conditions.push(s => (s.gender || '').toLowerCase() === 'female' || (s.gender || '').toLowerCase() === 'f');
  else if (ql.match(/\bmale\b/) && !ql.match(/\bfemale\b/)) conditions.push(s => (s.gender || '').toLowerCase() === 'male' || (s.gender || '').toLowerCase() === 'm');

  // -- COUNTRY --
  const countries = ['uk', 'united kingdom', 'usa', 'us', 'united states', 'canada', 'australia', 'germany', 'ireland', 'france', 'new zealand'];
  const matchedCountries = countries.filter(c => ql.includes(c));
  if (matchedCountries.length > 0 && !ql.includes('compare')) {
      conditions.push(s => {
          const pref = (s.preferred_country || '').toLowerCase();
          return matchedCountries.some(mc => pref.includes(mc === 'uk' ? 'united kingdom' : mc) || pref === mc);
      });
  }

  // -- COURSE --
  if (ql.includes('computer science') || ql.includes('cs') || ql.includes('computing')) {
      conditions.push(s => { const c = (s.preferred_course || '').toLowerCase(); return c.includes('computer science') || c.includes('cs') || c.includes('computing'); });
  } else if (ql.includes('mba') || ql.includes('business')) {
      conditions.push(s => { const c = (s.preferred_course || '').toLowerCase(); return c.includes('mba') || c.includes('business'); });
  }

  // -- SCHOLARSHIP --
  if (ql.includes('scholarship')) {
      conditions.push(s => s.has_scholarship === true || s.wants_scholarship === true || s.scholarship_eligible === true || (safeFloat(s.cgpa) >= 7.5 && safeFloat(s.ielts_score) >= 6.5));
  }

  // -- LOCATION (Delhi, etc.) --
  if (ql.includes('delhi')) conditions.push(s => (s.city || '').toLowerCase().includes('delhi'));
  
  // Apply all filters
  let filtered = students;
  if (conditions.length > 0) {
      filtered = students.filter(s => conditions.every(cond => cond(s)));
  }
  
  // -- AGGREGATIONS --
  
  if (ql.includes('average budget') || ql.includes('avg budget') || (ql.includes('average') && ql.includes('budget')) || ql.includes('median budget')) {
      const budgets = filtered.map(s => safeFloat(s.budget) || safeFloat(s.avg_budget) || 0).filter(b => b > 0);
      const avg = budgets.length ? budgets.reduce((a,b)=>a+b,0)/budgets.length : 0;
      return `### 💰 Budget Analysis\nBased on your filters, the average student budget is **₹${Math.round(avg).toLocaleString('en-IN')}** per year across **${filtered.length}** matching candidates.`;
  }
  
  if (ql.includes('average ielts') || ql.includes('avg ielts') || (ql.includes('average') && ql.includes('ielts'))) {
      const ielts = filtered.map(s => safeFloat(s.ielts_score) || safeFloat(s.ielts) || 0).filter(i => i > 0);
      const avg = ielts.length ? ielts.reduce((a,b)=>a+b,0)/ielts.length : 0;
      return `### 🗣️ IELTS Analysis\nBased on your filters, the average IELTS score is **${avg.toFixed(1)}** across **${filtered.length}** matching candidates.`;
  }

  if (ql.includes('average cgpa') || ql.includes('avg cgpa') || (ql.includes('average') && ql.includes('cgpa'))) {
      const gpas = filtered.map(s => safeFloat(s.cgpa) || safeFloat(s.gpa) || 0).filter(g => g > 0);
      const avg = gpas.length ? gpas.reduce((a,b)=>a+b,0)/gpas.length : 0;
      return `### 🎓 Academic Analysis\nBased on your filters, the average CGPA is **${avg.toFixed(2)}** across **${filtered.length}** matching candidates.`;
  }

  if (ql.match(/top\s*([0-9]*)\s*counsellor/i) || ql.includes('best counsellor') || ql.includes('top counsellor') || ql.includes('top counselor')) {
      const map = {};
      filtered.forEach(s => {
          const c = s.assigned_counselor;
          if(!c) return;
          if(!map[c]) map[c] = {total: 0, conv: 0};
          map[c].total++;
          if((s.status||'').toLowerCase().includes('convert') || (s.status||'').toLowerCase().includes('enroll')) map[c].conv++;
      });
      const sorted = Object.entries(map).map(([k,v]) => ({name: k, ...v, rate: v.conv/v.total})).sort((a,b) => b.conv - a.conv || b.rate - a.rate);
      const top = sorted[0];
      if(!top) return "Not enough data to determine top counsellor.";
      return `### 🏆 Top Counsellor\nThe top performing counsellor for this segment is **${top.name}** with **${top.conv}** conversions (Conversion Rate: **${(top.rate*100).toFixed(1)}%**).`;
  }

  if (ql.includes('highest conversion') || ql.includes('highest convert') || ql.includes('best country')) {
      const countryMap = {};
      filtered.forEach(s => {
          const c = s.preferred_country || 'Unknown';
          if (!countryMap[c]) countryMap[c] = { total: 0, converted: 0 };
          countryMap[c].total++;
          if ((s.status || '').toLowerCase().includes('convert') || (s.status || '').toLowerCase().includes('enroll')) countryMap[c].converted++;
      });
      let bestCountry = '';
      let maxRate = 0;
      Object.keys(countryMap).forEach(c => {
          const rate = countryMap[c].converted / countryMap[c].total;
          if (rate > maxRate && countryMap[c].total >= 3) { maxRate = rate; bestCountry = c; }
      });
      if (bestCountry) return `### 📈 Top Conversion Country\nAccording to live CRM analytics, **${bestCountry}** is the highest performing destination for this segment, with a conversion rate of **${(maxRate * 100).toFixed(1)}%**.`;
  }

  if (ql.includes('top') && (ql.includes('countr') || ql.includes('destination'))) {
      const map = {};
      filtered.forEach(s => {
          const c = s.preferred_country;
          if(c && c !== 'Unknown') map[c] = (map[c] || 0) + 1;
      });
      const sorted = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0, 5);
      const list = sorted.map(([c, count], i) => `${i+1}. **${c}**: ${count} students`).join('\n');
      return `### 🌍 Top Preferred Countries\nBased on your query, here are the most popular destinations among the **${filtered.length}** matching students:\n\n${list}`;
  }

  if (ql.includes('most common intake')) {
       const map = {};
       filtered.forEach(s => {
           const i = s.preferred_intake;
           if(i) map[i] = (map[i] || 0) + 1;
       });
       const sorted = Object.entries(map).sort((a,b)=>b[1]-a[1]);
       if (!sorted.length) return "No intake data available.";
       return `### 📅 Intake Analysis\nThe most common intake is **${sorted[0][0]}** with **${sorted[0][1]}** students.`;
  }

  if (ql.includes('compare') && ql.includes('uk') && ql.includes('canada')) {
      const uk = students.filter(s => (s.preferred_country||'').toLowerCase().includes('uk') || (s.preferred_country||'').toLowerCase().includes('united kingdom'));
      const can = students.filter(s => (s.preferred_country||'').toLowerCase().includes('canada'));
      return `### ⚖️ Country Comparison: UK vs Canada
      
**United Kingdom**:
• Total Applicants: **${uk.length}**
• Average Budget: **₹${Math.round(uk.reduce((acc, s) => acc + (safeFloat(s.budget)||0), 0) / (uk.length||1)).toLocaleString('en-IN')}**
• Average IELTS: **${(uk.reduce((acc, s) => acc + (safeFloat(s.ielts_score)||0), 0) / (uk.length||1)).toFixed(1)}**

**Canada**:
• Total Applicants: **${can.length}**
• Average Budget: **₹${Math.round(can.reduce((acc, s) => acc + (safeFloat(s.budget)||0), 0) / (can.length||1)).toLocaleString('en-IN')}**
• Average IELTS: **${(can.reduce((acc, s) => acc + (safeFloat(s.ielts_score)||0), 0) / (can.length||1)).toFixed(1)}**`;
  }

  // Default Count Aggregation if specific filters were provided or explicit count asked
  if (conditions.length > 0 || ql.includes('how many') || ql.includes('count')) {
      if (ql.includes('list') || ql.includes('who are')) {
          const names = filtered.slice(0, 10).map(s => `• **${s.name}** (${s.preferred_country || 'No country'})`).join('\n');
          return `### 👥 Student Segment Analysis
Found exactly **${filtered.length}** students matching your criteria.

**Sample Candidates:**
${names}
${filtered.length > 10 ? `\n...and ${filtered.length - 10} more.` : ''}`;
      }

      return `### 📊 CRM Database Calculation
Found exactly **${filtered.length}** students matching your specific criteria (out of ${totalCount} total active records).

**Segment Metrics:**
• Represents **${((filtered.length / totalCount) * 100).toFixed(1)}%** of your total pipeline.
• Average Budget: **₹${Math.round(filtered.reduce((acc, s) => acc + (safeFloat(s.budget)||0), 0) / (filtered.length||1)).toLocaleString('en-IN')}**
• Average CGPA: **${(filtered.reduce((acc, s) => acc + (safeFloat(s.cgpa)||0), 0) / (filtered.length||1)).toFixed(2)}**`;
  }

  return null;
}

function generateLocalReply(question, history, metrics, students = []) {
  const q = (question || '').trim()
  const ql = q.toLowerCase()

  const crmCalc = calculateCRMQuery(ql, students)
  if (crmCalc) {
    return { text: crmCalc, topic: 'calculation:crm' }
  }

  const d = deriveInsights(metrics)

  // ─── Direct Database Calculations Engine (Prompt 5 / Step 4) ───
  // 1. Averages
  if (ql.includes('average') || ql.includes('avg')) {
    let metricField = null
    let metricLabel = ''
    if (ql.includes('cgpa') || ql.includes('gpa')) { metricField = 'cgpa'; metricLabel = 'CGPA' }
    else if (ql.includes('ielts')) { metricField = 'ielts_score'; metricLabel = 'IELTS score' }
    else if (ql.includes('budget')) { metricField = 'budget'; metricLabel = 'budget' }

    if (metricField) {
      let filtered = [...students]
      let filterText = ''
      
      const counselorMatch = ql.match(/(?:for|under|assigned to|counselor|counsellor)\s+([a-z\s]+)/i)
      if (counselorMatch) {
        const cName = counselorMatch[1].trim()
        const found = students.find(s => s.assigned_counselor?.toLowerCase() === cName.toLowerCase())
        if (found) {
          filtered = filtered.filter(s => s.assigned_counselor?.toLowerCase() === cName.toLowerCase())
          filterText = ` assigned to ${found.assigned_counselor}`
        }
      }
      
      const countryMatch = extractCountryMention(ql, d.countryEntries)
      if (countryMatch) {
        filtered = filtered.filter(s => s.preferred_country?.toLowerCase() === countryMatch.toLowerCase())
        filterText += ` going to ${countryMatch}`
      }

      const values = filtered.map(s => {
        if (metricField === 'budget') return safeFloat(s.budget) || safeFloat(s.avg_budget) || 0
        return safeFloat(s[metricField])
      }).filter(Boolean)

      if (values.length > 0) {
        const sum = values.reduce((sumVal, b) => sumVal + b, 0)
        const avgVal = sum / values.length
        const formatted = metricField === 'budget' ? `₹${Math.round(avgVal).toLocaleString('en-IN')}` : avgVal.toFixed(2)
        return {
          text: `Based on my calculations from the live database, the average ${metricLabel} of the ${values.length} students${filterText} is ${formatted}.`,
          topic: 'calculation:average'
        }
      }
    }
  }

  // 2. Count of students
  if (ql.includes('how many') || ql.includes('count') || ql.includes('number of') || ql.includes('total students')) {
    let filtered = [...students]
    let filterText = []
    
    const counselorMatch = ql.match(/(?:for|under|assigned to|counselor|counsellor)\s+([a-z\s]+)/i)
    if (counselorMatch) {
      const cName = counselorMatch[1].trim()
      const found = students.find(s => s.assigned_counselor?.toLowerCase() === cName.toLowerCase())
      if (found) {
        filtered = filtered.filter(s => s.assigned_counselor?.toLowerCase() === cName.toLowerCase())
        filterText.push(`assigned to ${found.assigned_counselor}`)
      }
    }
    
    const countryMatch = extractCountryMention(ql, d.countryEntries)
    if (countryMatch) {
      filtered = filtered.filter(s => s.preferred_country?.toLowerCase() === countryMatch.toLowerCase())
      filterText.push(`going to ${countryMatch}`)
    }

    if (ql.includes('enrolled') || ql.includes('converted')) {
      filtered = filtered.filter(s => s.status?.toLowerCase() === 'enrolled' || s.status?.toLowerCase() === 'converted' || s.status?.toLowerCase() === 'enrolment')
      filterText.push(`enrolled`)
    } else if (ql.includes('active')) {
      filtered = filtered.filter(s => s.status?.toLowerCase() !== 'enrolled' && s.status?.toLowerCase() !== 'converted' && s.status?.toLowerCase() !== 'dropped')
      filterText.push(`active`)
    } else if (ql.includes('dropped')) {
      filtered = filtered.filter(s => s.status?.toLowerCase() === 'dropped')
      filterText.push(`dropped`)
    }

    const cgpaAboveMatch = ql.match(/(?:cgpa|gpa)\s*(?:above|greater than|more than|>?)\s*([0-9.]+)/)
    if (cgpaAboveMatch) {
      const val = parseFloat(cgpaAboveMatch[1])
      filtered = filtered.filter(s => safeFloat(s.cgpa) >= val)
      filterText.push(`with CGPA >= ${val}`)
    }
    
    const ieltsAboveMatch = ql.match(/(?:ielts)\s*(?:above|greater than|more than|>?)\s*([0-9.]+)/)
    if (ieltsAboveMatch) {
      const val = parseFloat(ieltsAboveMatch[1])
      filtered = filtered.filter(s => safeFloat(s.ielts_score) >= val)
      filterText.push(`with IELTS >= ${val}`)
    }

    const budgetMatch = ql.match(/(?:budget)\s*(?:above|greater than|more than|>?)\s*([0-9.]+)/i)
    if (budgetMatch) {
      let val = parseFloat(budgetMatch[1])
      if (ql.includes('lakh') || ql.includes('l')) {
        val = val * 100000
      }
      filtered = filtered.filter(s => (safeFloat(s.budget) || safeFloat(s.avg_budget) || 0) >= val)
      filterText.push(`with budget >= ₹${val.toLocaleString('en-IN')}`)
    }

    const desc = filterText.length > 0 ? ` students who are ${filterText.join(', ')}` : ' total students'
    return {
      text: `There are exactly ${filtered.length}${desc} in the CRM pipeline right now.`,
      topic: 'calculation:count'
    }
  }

  // 3. Sum of budget/revenue
  if (ql.includes('total budget') || ql.includes('sum of budget') || ql.includes('value of pipeline')) {
    let filtered = [...students]
    let filterText = ''
    
    const countryMatch = extractCountryMention(ql, d.countryEntries)
    if (countryMatch) {
      filtered = filtered.filter(s => s.preferred_country?.toLowerCase() === countryMatch.toLowerCase())
      filterText = ` going to ${countryMatch}`
    }

    const totalVal = filtered.reduce((acc, s) => acc + (safeFloat(s.budget) || safeFloat(s.avg_budget) || 0), 0)
    return {
      text: `The combined budget value of the ${filtered.length} students${filterText} is ₹${totalVal.toLocaleString('en-IN')}.`,
      topic: 'calculation:sum'
    }
  }

  if (LESS_RE.test(ql)) {
    const lastAi = [...history].reverse().find(m => m.role === 'ai')
    if (lastAi?.topic) {
      const topicKey = lastAi.topic.replace(':why', '').replace(':short', '')
      const shortMap = {
        summary:       () => `${d.total} students, ${d.enrollmentRate}% converted, ${d.active} active. Urgent: ${d.followupOverdue} overdue follow-ups, ${d.stuckInDocs} stuck in docs, ${d.visaDeadlines} visa deadlines.`,
        priorities:    () => `1. Visa deadlines (${d.visaDeadlines}). 2. Overdue follow-ups (${d.followupOverdue}). 3. Docs stuck (${d.stuckInDocs}).`,
        counselors:    () => { const u = d.underperforming; return u?.length ? `${u.map(c=>c.name).join(', ')} below average. Have them shadow ${d.topCounselor?.name}.` : `All above average. ${d.topCounselor?.name} leads at ${d.topCounselor?.rate.toFixed(1)}%.` },
        leadsource:    () => `${d.topLeadByConv?.name || d.topLeadSrc} converts best (${d.bestConvRate}%). Keep both best-converting and highest-volume channels running.`,
        country:       () => `${d.countryEntries[0]?.[0] || d.topCountry} leads (${d.countryEntries[0] ? ((d.countryEntries[0][1]/d.total)*100).toFixed(1) : '?'}%). Double down there.`,
        visa:          () => `${d.visaDeadlines} visa deadlines — confirm docs today. Most expensive drop-off point.`,
        followup:      () => `${d.followupOverdue} students overdue. Assign today before they go to a competitor.`,
        documentation: () => `${d.stuckInDocs} stuck in docs. Send a checklist — clears most in 48 hours.`,
        risk:          () => `${d.highRisk} high-risk (now), ${d.medRisk} medium (biggest opportunity), ${d.lowRisk} low (stay the course).`,
        conversion:    () => `${d.enrollmentRate}% conversion. Gap vs ${d.enrollProb}% probability = operational friction. Fix docs + follow-ups.`,
        funnel:        () => d.funnelWorstDrop ? `Biggest drop: ${d.funnelWorstDrop.from} → ${d.funnelWorstDrop.to} (${d.funnelWorstDrop.dropPct}% lost). Fix that first.` : `Ask me a specific stage.`,
        scholarship:   () => `${d.scholarshipEligible} eligible. Reach out proactively — removes biggest dropout reason at application.`,
      }
      const fn = shortMap[topicKey]
      if (fn) return { text: fn(), topic: `${topicKey}:short` }
    }
    return { text: `${d.total} students, ${d.enrollmentRate}% converted. Urgent: ${d.followupOverdue} overdue, ${d.stuckInDocs} in docs, ${d.visaDeadlines} visa deadlines.`, topic: 'general:short' }
  }

  if (FOLLOWUP_RE.test(ql) || MORE_RE.test(ql)) {
    const lastAi = [...history].reverse().find(m => m.role === 'ai')
    if (lastAi?.topic) {
      if (lastAi.topic.endsWith(':why')) return { text: `I've laid out the full reasoning above. If you want to explore a specific angle, just ask.`, topic: 'general' }
      const baseKey = lastAi.topic.replace(':short', '')
      const topic = LOCAL_TOPICS.find(t => t.key === baseKey)
      if (topic?.why) return { text: topic.why(d), topic: `${baseKey}:why` }
    }
    return { text: generalFallback(d), topic: 'general' }
  }

  if (/canada|uk|united kingdom|germany|australia|usa|united states|france|ireland|new zealand/i.test(ql) ||
      /what about|tell me about|how('?s| is)|more on|focus on/.test(ql)) {
    const named = extractCountryMention(ql, d.countryEntries)
    if (named) {
      const topic = LOCAL_TOPICS.find(t => t.key === 'country_specific')
      return { text: topic.answer(d, named), topic: 'country_specific', namedCountry: named }
    }
  }

  for (const topic of LOCAL_TOPICS) {
    if (topic.key === 'country_specific') continue
    const testFn = typeof topic.test === 'function' ? topic.test : (q) => topic.test.test(q)
    if (testFn(ql)) return { text: topic.answer(d), topic: topic.key }
  }

  return { text: generalFallback(d), topic: 'general' }
}

// ─── AI COPILOT (chatbot logic preserved exactly — only adds the Student
//    Advisor launcher button in its header via the onOpenAdvisor prop) ──────
function AICopilot({ metrics, students = [], onOpenAdvisor }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [thinking, setThinking] = useState(false)
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
          .map(([c, n]) => `  - ${c}: ${n} students (${total > 0 ? ((n / total) * 100).toFixed(1) : '0'}%)`)
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

    // Serialize live students into a compact vertical layout for Gemini calculations (Prompt 5 / Step 4)
    const serializedDb = students.slice(0, 150).map(s => 
      `${s.name || 'Unknown'}|${s.cgpa || ''}|${s.ielts_score || ''}|₹${(safeFloat(s.budget) || safeFloat(s.avg_budget) || 0).toLocaleString('en-IN')}|${s.preferred_country || ''}|${s.preferred_course || ''}|${s.status || ''}|${s.assigned_counselor || ''}`
    ).join('\n')

    return `You are an AI Advisor for a study-abroad counsellor. Your role is to help them manage their student pipeline effectively. You are a sharp, direct business advisor with full access to live pipeline data.

PIPELINE: Total ${total} | Active ${active} | Converted ${converted} | Dropped ${dropped} | Enrollment rate ${enrollmentRate}% | Avg prob ${enrollProb}% | High-intent ${highIntentLeads} | Scholarship-eligible ${scholarshipEligible} | Risk: ${lowRisk} low / ${medRisk} medium / ${highRisk} high

ACADEMIC PROFILE: CGPA ${avgCgpa}/10 | IELTS ${avgIelts}/9 | Lead score ${avgLeadScore}/100 | Budget ₹${typeof avgBudget === 'number' ? avgBudget.toLocaleString('en-IN') : avgBudget} | Top course ${topCourse} | Top country ${topCountry}

FUNNEL: ${funnelFlow} | ${funnelLine}

COUNSELLORS (avg ${avgCounselorRate.toFixed(1)}%): ${counselorLines || 'No data'} | Top: ${topCounselor?.name || 'N/A'} ${topCounselor?.rate?.toFixed(1) || 0}% | Bottom: ${bottomCounselor?.name || 'N/A'} ${bottomCounselor?.rate?.toFixed(1) || 0}% | Below avg: ${underperforming.length > 0 ? underperforming.map(c => c.name).join(', ') : 'None'}

URGENT: ${followupOverdue} overdue follow-up | ${stuckInDocs} stuck in docs | ${visaDeadlines} visa deadlines | ${newLeadsWeek} new leads this week | ${highRisk} high-risk

LEAD SOURCES: ${leadLines || 'No data'}

DESTINATIONS: ${countryLines}

LIVE STUDENT DATABASE (Format: Name|CGPA|IELTS|Budget|Preferred Country|Preferred Course|Status|Counsellor):
${serializedDb}

RULES: Be direct and specific. Always cite actual numbers. Keep answers to 3-5 sentences. Give actionable next steps for the counsellor. Write in plain text only — no markdown, no bullet points, no asterisks, no headers. Never invent numbers. Perform accurate count, sum, average, or listing calculations over the LIVE STUDENT DATABASE list when asked.`
  }

  async function tryGemini(userMessage) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey?.trim()) throw new Error('NO_KEY')
    const contents = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }))
    contents.push({ role: 'user', parts: [{ text: userMessage }] })
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: buildSystemPrompt() }] }, contents, generationConfig: { temperature: 0.2, maxOutputTokens: 1000 } })
    })
    if (!res.ok) throw new Error(`HTTP_${res.status}`)
    const data = await res.json()
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!reply) throw new Error('EMPTY')
    return reply
  }

  async function handleSend(text) {
    const q = (text || input).trim()
    if (!q || thinking) return
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setInput('')
    setThinking(true)
    const localResult = generateLocalReply(q, messages, metrics, students)
    try {
      const geminiReply = await Promise.race([tryGemini(q), new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 4000))])
      setMessages(prev => [...prev, { role: 'ai', text: geminiReply, topic: localResult.topic }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: localResult.text, topic: localResult.topic }])
    } finally {
      setThinking(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }


  function handleClear() { setMessages([]); setInput(''); setTimeout(() => inputRef.current?.focus(), 50) }

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])

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
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Ask Global Degrees AI</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Powered by live CRM data · supports follow-up questions</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Student AI Advisor button */}
          <button
            onClick={onOpenAdvisor}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              color: 'var(--accent-violet)',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(0,212,255,0.08))',
              border: '1px solid rgba(139,92,246,0.35)',
              padding: '7px 14px', borderRadius: 9, cursor: 'pointer',
              transition: 'all 0.15s ease', outline: 'none'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.22)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(0,212,255,0.08))'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)' }}
          >
            <GraduationCap size={13} strokeWidth={2.2} />
            Student Advisor
          </button>
          {messages.length > 0 && (
            <button onClick={handleClear} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
              color: 'var(--text-muted)', background: 'transparent',
              border: '1px solid var(--border-subtle)', padding: '6px 13px',
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.12s ease', outline: 'none'
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-rose)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.30)'; e.currentTarget.style.background = 'rgba(244,63,94,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'transparent' }}
            >
              <RotateCcw size={11} strokeWidth={2.2} /> New chat
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 6px rgba(52,211,153,0.6)', animation: 'livePulse 2s ease-in-out infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--accent-emerald)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live</span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{ padding: '24px 24px 12px', flex: 1, minHeight: 340, maxHeight: 500, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18, scrollbarWidth: 'thin' }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ textAlign: 'center', padding: '8px 0 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(0,212,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={24} color="var(--accent-cyan)" strokeWidth={1.8} />
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>What would you like to know?</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>Ask about your pipeline, team performance, operations, or marketing — I have full context of your live CRM data.</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSend(s)} style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', padding: '8px 16px', borderRadius: 99, cursor: 'pointer', transition: 'all 0.12s ease', outline: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-cyan)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.35)'; e.currentTarget.style.background = 'rgba(0,212,255,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-end' }}>
            {msg.role === 'ai' && <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, rgba(0,212,255,0.18), rgba(139,92,246,0.18))', border: '1px solid rgba(0,212,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}><Sparkles size={13} color="var(--accent-cyan)" strokeWidth={2} /></div>}
            <div style={{ maxWidth: '78%', padding: '13px 17px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px', background: msg.role === 'user' ? 'linear-gradient(135deg, rgba(0,212,255,0.13), rgba(0,180,220,0.09))' : 'var(--bg-elevated)', border: `1px solid ${msg.role === 'user' ? 'rgba(0,212,255,0.25)' : 'var(--border-subtle)'}` }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.72, margin: 0, fontWeight: msg.role === 'user' ? 500 : 400, color: msg.role === 'user' ? 'var(--accent-cyan)' : 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
            </div>
            {msg.role === 'user' && <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: 2 }}>U</div>}
          </div>
        ))}
        {thinking && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, rgba(0,212,255,0.18), rgba(139,92,246,0.18))', border: '1px solid rgba(0,212,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={13} color="var(--accent-cyan)" strokeWidth={2} /></div>
            <div style={{ padding: '14px 18px', borderRadius: '4px 14px 14px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-cyan)', animation: `copilotDot 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '14px 20px 18px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, transition: 'border-color 0.15s ease' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.40)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        >
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything about your pipeline, team, or operations…"
            style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-primary)', background: 'transparent', border: 'none', outline: 'none', padding: '12px 16px', lineHeight: 1.4, boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={() => handleSend()} disabled={thinking || !input.trim()} style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: input.trim() && !thinking ? 'linear-gradient(135deg, rgba(0,212,255,0.22), rgba(0,180,220,0.16))' : 'rgba(0,212,255,0.06)', border: `1px solid ${input.trim() && !thinking ? 'rgba(0,212,255,0.38)' : 'rgba(0,212,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !thinking ? 'pointer' : 'default', transition: 'all 0.15s ease', outline: 'none' }}
          onMouseEnter={e => { if (input.trim() && !thinking) e.currentTarget.style.background = 'rgba(0,212,255,0.32)' }}
          onMouseLeave={e => { e.currentTarget.style.background = input.trim() && !thinking ? 'rgba(0,212,255,0.22)' : 'rgba(0,212,255,0.06)' }}
        >
          <Send size={16} color={input.trim() && !thinking ? 'var(--accent-cyan)' : 'var(--text-muted)'} strokeWidth={2} />
        </button>
      </div>
      <style>{`
        @keyframes copilotDot { 0%, 100% { opacity: 0.25; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes livePulse  { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function RecommendationsPage() {
  const { students, loading } = useStudents()
  const [advisorOpen, setAdvisorOpen] = useState(false)

  // Compute everything from the real students array (cached by useStudents)
  const computed = React.useMemo(() => {
    if (!students.length) return null
    const overview   = computeOverview(students)
    const counselors = computeCounselorPerformance(students)
    const countries  = computeCountryPerformance(students)
    const sources    = computeLeadSourcePerformance(students)
    const funnel     = computeFunnel(students)
    const risk       = computeRiskBreakdown(students)
    const prio       = computeStudentPrioritization(students)

    const avgCounselorRate = counselors.reduce((s, c) => s + c.rate, 0) / (counselors.length || 1)
    const topCounselor     = counselors[0]
    const underperforming  = counselors.filter(c => c.rate < avgCounselorRate)

    // Build country distribution object for legacy copilot metrics shape
    const countryDist = {}
    countries.forEach(c => { countryDist[c.country] = c.total })

    // Build lead sources for copilot
    const leadSources = sources.map(s => ({
      name: s.name, leads: s.leads, conversions: s.conversions
    }))

    const sortedByConv  = [...sources].sort((a, b) => (b.conversions / b.leads) - (a.conversions / a.leads))
    const topLeadByConv = sortedByConv[0]
    const topLeadByVol  = [...sources].sort((a, b) => b.leads - a.leads)[0]
    const bestConvRate  = topLeadByConv?.leads > 0 ? ((topLeadByConv.conversions / topLeadByConv.leads) * 100).toFixed(1) : 0

    const funnelStages = funnel.stages

    return {
      overview, counselors, countries, sources, funnel, risk, prio,
      avgCounselorRate, topCounselor, underperforming,
      countryDist, leadSources, sortedByConv, topLeadByConv, topLeadByVol, bestConvRate,
      funnelStages, funnelWorstDrop: funnel.worstDrop
    }
  }, [students])

  if (loading || !computed) return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Shimmer h={14} w={200} r={4} />
      <Shimmer h={540} r={16} />
      <Shimmer h={240} r={12} />
    </div>
  )

  const { overview, counselors, countries, sources, funnel, risk, prio,
          avgCounselorRate, topCounselor, underperforming, countryDist,
          leadSources, topLeadByConv, topLeadByVol, bestConvRate,
          funnelStages, funnelWorstDrop } = computed

  const countryEntries = countries.map(c => [c.country, c.total])
  const topCountry = countries[0]?.country || '—'
  const topCourse  = ((() => {
    const counts = {}
    students.forEach(s => { if (s.preferred_course) counts[s.preferred_course] = (counts[s.preferred_course]||0)+1 })
    return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'
  })())
  const topLeadSrc = sources[0]?.name || '—'

  const newLeadsWeek = (() => {
    const now = Date.now()
    return students.filter(s => {
      const d = new Date(s.created_at)
      return !isNaN(d) && (now - d.getTime()) <= 7 * 86400000
    }).length
  })()

  const insights = [
    { icon: AlertTriangle, color: 'var(--accent-rose)', title: `${prio.counts.callToday} students overdue for follow-up`, body: `No contact in 7+ days significantly increases dropout probability. These are your highest-churn-risk leads right now — assign follow-up tasks today before they go cold.`, badge: 'Critical' },
    { icon: Clock, color: 'var(--accent-amber)', title: `${prio.counts.stuckInDocs} students stuck at documentation`, body: `This is your largest funnel bottleneck${funnelWorstDrop ? ` — ${funnelWorstDrop.dropPct}% attrition at the ${funnelWorstDrop.from} stage` : ''}. A standardised document checklist and automated deadline nudges can unblock most of these within 48 hours.`, badge: 'Bottleneck' },
    { icon: Bell, color: 'var(--accent-amber)', title: `${prio.counts.needsVisa} visa deadlines approaching`, body: `These students are the furthest along in the pipeline — losing them at this stage is the costliest outcome. Schedule document submission follow-ups and partner university reminders immediately.`, badge: 'Urgent' },
    { icon: BarChart2, color: 'var(--accent-emerald)', title: topLeadByConv && topLeadByVol && topLeadByConv.name !== topLeadByVol.name ? `${topLeadByConv.name} converts best (${bestConvRate}%), ${topLeadByVol.name} drives most volume` : `${topLeadSrc} leads in both volume and conversion`, body: topLeadByConv && topLeadByVol && topLeadByConv.name !== topLeadByVol.name ? `Budget should sustain both — quality and scale are complementary. Track long-term conversion separately for paid vs organic channels.` : `Sustained investment in ${topLeadSrc} delivers the strongest pipeline ROI. Monitor conversion rate weekly to catch saturation early.`, badge: 'Marketing' },
    { icon: Users, color: 'var(--accent-violet)', title: underperforming.length > 0 ? `${underperforming.length} counsellor${underperforming.length > 1 ? 's' : ''} below team average (${avgCounselorRate.toFixed(1)}%)` : `All counsellors at or above team average`, body: underperforming.length > 0 ? `${underperforming.map(c => c.name).join(', ')} are converting below average. Shadow sessions with ${topCounselor?.name} (${topCounselor?.rate.toFixed(1)}%) before next intake could recover meaningful pipeline value.` : `${topCounselor?.name} leads at ${topCounselor?.rate.toFixed(1)}%. Team performance is strong — focus on volume growth.`, badge: 'Team' },
    { icon: Globe2, color: 'var(--accent-blue)', title: countries.length >= 2 ? `${countries[0].country} dominates at ${((countries[0].total / overview.total) * 100).toFixed(1)}% of pipeline` : `${topCountry} is the top destination`, body: countries.length >= 2 ? `${countries[1].country} is a strong secondary market at ${((countries[1].total / overview.total) * 100).toFixed(1)}%. Dedicated per-country intake campaigns increase relevance and reduce cost-per-conversion.` : `${topCountry} remains the primary student destination.`, badge: 'Destinations' },
    { icon: Target, color: 'var(--accent-cyan)', title: `${formatNumber(overview.highIntentLeads)} high-intent leads in pipeline`, body: `With ${overview.avgEnrollmentProbability}% average enrollment probability and ${overview.enrollmentRate}% overall conversion, pipeline quality is strong. Fast-track processing for high-intent leads before intake deadlines.`, badge: 'Pipeline' },
    { icon: Lightbulb, color: 'var(--accent-emerald)', title: `${formatNumber(overview.scholarshipEligible)} students are scholarship-eligible`, body: `Scholarship-eligible students typically have stronger academic profiles and higher commitment. Proactively communicating scholarship availability accelerates decision-making and reduces dropout at application stage.`, badge: 'Opportunity' },
    { icon: TrendingUp, color: 'var(--accent-violet)', title: `${newLeadsWeek} new leads entered this week`, body: `Ensure new leads are assigned and contacted within 24 hours — first-contact speed is the single biggest predictor of eventual conversion in study-abroad CRMs.`, badge: 'Growth' },
  ]

  const copilotMetrics = {
    counselors, avgCounselorRate, topCountry, topLeadSrc,
    stuckInDocs:    prio.counts.stuckInDocs,
    followupOverdue: prio.counts.callToday,
    highRisk:       risk.high,
    funnelWorstDrop,
    total:          overview.total,
    converted:      overview.converted,
    dropped:        overview.dropped,
    active:         overview.active,
    leadSources, countryDist, topCourse,
    avgLeadScore:   overview.avgLeadScore,
    enrollmentRate: overview.enrollmentRate,
    avgCgpa:        overview.avgCgpa,
    avgIelts:       overview.avgIelts,
    avgBudget:      overview.avgBudget,
    visaDeadlines:  prio.counts.needsVisa,
    newLeadsWeek,
    enrollProb:     overview.avgEnrollmentProbability,
    lowRisk:        risk.low,
    medRisk:        risk.medium,
    scholarshipEligible: overview.scholarshipEligible,
    highIntentLeads: overview.highIntentLeads,
    funnelStages,
  }

  return (
    <div className="animate-fade-in">
      {advisorOpen && <AdvisorModal students={students} onClose={() => setAdvisorOpen(false)} />}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <div style={{ width: 3, height: 18, background: 'var(--accent-cyan)', borderRadius: 2 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>AI Intelligence</span>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', paddingLeft: 12, margin: 0 }}>
          Ask anything · {formatNumber(overview.total)} student records · instant answers
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Stat chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <StatChip label="Total Students"  value={formatNumber(overview.total)}     color="var(--accent-cyan)"    sub="in CRM" />
          <StatChip label="Converted"       value={formatNumber(overview.converted)} color="var(--accent-emerald)" sub={`${overview.enrollmentRate}% rate`} />
          <StatChip label="Active Pipeline" value={formatNumber(overview.active)}    color="var(--accent-blue)"    sub="in progress" />
        </div>

        {/* AI Copilot */}
        <AICopilot metrics={copilotMetrics} students={students} onOpenAdvisor={() => setAdvisorOpen(true)} />

        {/* Business Insights */}
        <section>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
              <div style={{ width: 3, height: 16, background: 'var(--accent-violet)', borderRadius: 2 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>Key Business Insights</span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', paddingLeft: 12, margin: 0 }}>Automated intelligence from pipeline, funnel, and team data</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {insights.map((ins, i) => <InsightCard key={i} icon={ins.icon} color={ins.color} title={ins.title} body={ins.body} badge={ins.badge} />)}
          </div>
        </section>
      </div>
    </div>
  )
}
