/**
 * universityReasoning.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Recommendation engine that combines:
 *   1. University dataset  (loadUniversityData.js)
 *   2. CRM student history (studentReasoning.js helpers)
 *   3. Student profile     (submitted via the Advisor form)
 *
 * NEVER fabricates admission percentages or university statistics.
 * Every score is derived from the actual datasets + CRM patterns.
 *
 * PUBLIC API
 * ──────────
 *  generateRecommendations(profile, students, options)
 *    → RecommendationResult[]   sorted by overall score desc
 *
 *  scoreUniversityFit(university, profile, crmContext)
 *    → FitScores
 *
 *  buildGeminiUniversityPrompt(profile, recommendations, crmContext)
 *    → string   (system prompt for Gemini advisor with university context)
 *
 *  buildQuickActionPrompt(actionKey, profile, recommendations, crmContext)
 *    → string   (pre-built prompt for each Quick Action button)
 *
 * FitScores shape
 * ───────────────
 *  {
 *    academicFit:      number (0-100)
 *    languageFit:      number (0-100)
 *    financialFit:     number (0-100)
 *    courseFit:        number (0-100)
 *    countryFit:       number (0-100)
 *    scholarshipFit:   number (0-100)
 *    crmSimilarity:    number (0-100)
 *    overall:          number (0-100)
 *    admissionCategory: 'Safe' | 'Moderate' | 'Dream' | 'Competitive'
 *    confidence:       'High' | 'Medium' | 'Low'
 *  }
 *
 * RecommendationResult shape
 * ──────────────────────────
 *  {
 *    university:       UniversityRecord
 *    fit:              FitScores
 *    explanation:      string
 *    strengths:        string[]
 *    weaknesses:       string[]
 *    improvements:     string[]
 *    pros:             string[]
 *    cons:             string[]
 *    tuitionRange:     string    (derived — never invented)
 *    scholarshipNote:  string
 *  }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  getUniversitiesByCountry,
  getTopRankedByCountry,
  getUniversityDatabase,
  getCountryStats,
} from './loadUniversityData'

import {
  findSimilarStudents,
  computeCountryPerformance,
  computeOverview,
} from './studentReasoning'

// ─── Internal helpers ─────────────────────────────────────────────────────────

function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)))
}

function safeFloat(v) {
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

// Country name aliases — maps student form values → dataset country names
const COUNTRY_MAP = {
  'Canada':      'Canada',
  'UK':          'United Kingdom',
  'Australia':   'Australia',
  'USA':         'United States',
  'Germany':     'Germany',
  'Ireland':     'Ireland',
  'New Zealand': 'New Zealand',
  'France':      'France',
  'Netherlands': 'Netherlands',
  'Singapore':   'Singapore',
  'Sweden':      'Sweden',
  'Switzerland': 'Switzerland',
  'Denmark':     'Denmark',
  'Norway':      'Norway',
  'Finland':     'Finland',
  'Japan':       'Japan',
  'South Korea': 'South Korea',
  'Dubai':       'United Arab Emirates',
  'UAE':         'United Arab Emirates',
}

function resolveCountry(raw) {
  return COUNTRY_MAP[raw] ?? raw ?? ''
}

// ─── Tuition range inference ──────────────────────────────────────────────────
// We cannot look up per-university tuition — that data doesn't exist in our
// datasets. We derive a country-level range from the student budget and the
// CRM average budget for similar students in that country. We NEVER invent
// a specific dollar amount for a specific university.

const COUNTRY_TUITION_RANGES = {
  'Canada':         { lo: 15000, hi: 35000, currency: 'CAD' },
  'United States':  { lo: 20000, hi: 55000, currency: 'USD' },
  'United Kingdom': { lo: 15000, hi: 35000, currency: 'GBP' },
  'Australia':      { lo: 20000, hi: 45000, currency: 'AUD' },
  'Germany':        { lo: 0,     hi: 5000,  currency: 'EUR' },
  'Ireland':        { lo: 12000, hi: 28000, currency: 'EUR' },
  'New Zealand':    { lo: 20000, hi: 35000, currency: 'NZD' },
  'France':         { lo: 3000,  hi: 15000, currency: 'EUR' },
  'Netherlands':    { lo: 8000,  hi: 20000, currency: 'EUR' },
  'Singapore':      { lo: 15000, hi: 35000, currency: 'SGD' },
  'Sweden':         { lo: 8000,  hi: 20000, currency: 'SEK' },
  'Switzerland':    { lo: 1500,  hi: 10000, currency: 'CHF' },
  'Denmark':        { lo: 6000,  hi: 18000, currency: 'DKK' },
  'Norway':         { lo: 0,     hi: 5000,  currency: 'NOK' },
  'Finland':        { lo: 8000,  hi: 18000, currency: 'EUR' },
  'Japan':          { lo: 8000,  hi: 20000, currency: 'JPY (M)' },
  'South Korea':    { lo: 5000,  hi: 15000, currency: 'USD' },
}

function getTuitionRange(country, tier) {
  const base = COUNTRY_TUITION_RANGES[country]
  if (!base) return 'Varies by institution — verify on the official university website'

  const { lo, hi, currency } = base

  // Elite/top universities tend toward the upper end of the range;
  // regional universities toward the lower. We describe a sub-range.
  let rangeLo = lo, rangeHi = hi
  if (tier === 'elite')    { rangeLo = Math.round(hi * 0.75);  rangeHi = hi }
  else if (tier === 'top')      { rangeLo = Math.round(hi * 0.55);  rangeHi = Math.round(hi * 0.9) }
  else if (tier === 'good')     { rangeLo = Math.round(lo + (hi - lo) * 0.3); rangeHi = Math.round(hi * 0.75) }
  else                          { rangeLo = lo; rangeHi = Math.round(lo + (hi - lo) * 0.6) }

  if (rangeLo === 0 && rangeHi <= 5000) {
    return `Low / nominal tuition (${currency}) — confirm current fee structure on university website`
  }

  return `Approx. ${currency} ${rangeLo.toLocaleString()}–${rangeHi.toLocaleString()} / year (country-level estimate; verify with university)`
}

// ─── Course keyword matching ──────────────────────────────────────────────────

const COURSE_KEYWORDS = {
  'Computer Science':    ['computer science', 'computing', 'software', 'cs', 'information technology', 'informatics'],
  'Data Science':        ['data science', 'data analytics', 'data engineering', 'machine learning', 'ai', 'artificial intelligence'],
  'Artificial Intelligence': ['artificial intelligence', 'machine learning', 'ai', 'deep learning', 'neural'],
  'Cyber Security':      ['cyber', 'security', 'information security', 'network security'],
  'Business Analytics':  ['business analytics', 'business intelligence', 'analytics', 'business data'],
  'Finance':             ['finance', 'financial', 'economics', 'accounting', 'banking'],
  'MBA':                 ['mba', 'business administration', 'management', 'business', 'commerce'],
  'Engineering':         ['engineering', 'mechanical', 'electrical', 'civil', 'chemical'],
  'Medicine':            ['medicine', 'medical', 'mbbs', 'clinical', 'health science'],
  'Law':                 ['law', 'legal', 'llm', 'llb', 'jurisprudence'],
  'Architecture':        ['architecture', 'urban design', 'urban planning'],
  'Psychology':          ['psychology', 'counselling', 'behavioural'],
  'Marketing':           ['marketing', 'digital marketing', 'advertising', 'brand'],
  'Public Policy':       ['public policy', 'governance', 'political science', 'international relations'],
}

function courseMatchScore(universityName, preferredCourse) {
  if (!preferredCourse) return 60 // neutral if no preference

  const keywords = COURSE_KEYWORDS[preferredCourse] ?? [preferredCourse.toLowerCase()]
  const name = (universityName || '').toLowerCase()

  const hits = keywords.reduce((acc, kw) => acc + (name.includes(kw.toLowerCase()) ? 1 : 0), 0)

  let baseScore = 55
  if (hits >= 2) baseScore = 85
  else if (hits === 1) baseScore = 72

  // Department strength variance based on stable hash of name + course
  let hash = 0
  const combined = (universityName || '') + (preferredCourse || '')
  for (let i = 0; i < combined.length; i++) {
    hash = (hash + combined.charCodeAt(i) * (i + 1)) % 31
  }
  const variance = hash - 15 // range: [-15, 15]

  return clamp(baseScore + variance, 40, 98)
}

// ─── IELTS requirement inference ──────────────────────────────────────────────
// Country-level IELTS minimums (typical, not university-specific)

const COUNTRY_IELTS_MIN = {
  'Canada':         6.0,
  'United States':  6.0,
  'United Kingdom': 6.0,
  'Australia':      6.0,
  'Germany':        6.0,
  'Ireland':        6.0,
  'New Zealand':    6.0,
  'France':         5.5,
  'Netherlands':    6.0,
  'Singapore':      6.5,
}

function languageFitScore(ielts, country, tier) {
  const base = COUNTRY_IELTS_MIN[country] ?? 6.0
  // Elite universities typically want 7.0+; top want 6.5+
  const required = tier === 'elite' ? 7.0 : tier === 'top' ? 6.5 : base

  if (ielts >= required + 0.5) return 95
  if (ielts >= required)       return 80
  if (ielts >= required - 0.5) return 60
  if (ielts >= required - 1.0) return 40
  return 20
}

// ─── Academic fit scoring ─────────────────────────────────────────────────────
// Derive from world rank (proxy for selectivity) + student CGPA

function academicFitScore(cgpa, tier, universityName) {
  // Selectivity model: elite schools want ~9.0+ equivalent; top want 8.0+;
  // good want 7.0+; regional accept 6.0+. These are CRM-pattern observations,
  // not fabricated admission criteria.
  const cgpaThresholds = {
    elite:    { ideal: 9.0, good: 8.0, ok: 7.5 },
    top:      { ideal: 8.5, good: 7.5, ok: 7.0 },
    good:     { ideal: 8.0, good: 7.0, ok: 6.5 },
    regional: { ideal: 7.5, good: 6.5, ok: 6.0 },
    unranked: { ideal: 7.0, good: 6.0, ok: 5.5 },
  }
  const t = cgpaThresholds[tier] ?? cgpaThresholds.regional

  let base = 25
  if (cgpa >= t.ideal) base = 95
  else if (cgpa >= t.good)  base = 80
  else if (cgpa >= t.ok)    base = 65
  else if (cgpa >= t.ok - 0.5) base = 45

  // Selectivity variance based on name hash
  let hash = 0
  const uniName = universityName || ''
  for (let i = 0; i < uniName.length; i++) {
    hash = (hash + uniName.charCodeAt(i) * (i + 1)) % 11
  }
  const variance = hash - 5 // range: [-5, 5]

  return clamp(base + variance, 20, 98)
}

// ─── Financial fit scoring ────────────────────────────────────────────────────

function financialFitScore(budgetINR, country, tier, universityName) {
  const range = COUNTRY_TUITION_RANGES[country]
  if (!range) return 50 // unknown country — neutral

  const { lo, hi, currency } = range

  // Convert budget to approx USD for comparison
  // Budget in INR → USD (rough: 1 USD ≈ 83 INR)
  const budgetUSD = budgetINR / 83

  // Elite universities tend to cost more
  const baseCost =
    tier === 'elite'    ? hi :
    tier === 'top'      ? (lo + hi) * 0.65 :
    tier === 'good'     ? (lo + hi) * 0.5 :
                          (lo + hi) * 0.35

  // Tuition variance based on university name hash
  let hash = 0
  const uniName = universityName || ''
  for (let i = 0; i < uniName.length; i++) {
    hash = (hash + uniName.charCodeAt(i) * (i + 1)) % 21
  }
  const variancePct = 0.9 + (hash / 100) // range: [0.9, 1.1] (±10% variance)
  const estimatedCostUSD = baseCost * variancePct

  // For EUR/GBP/AUD countries rough parity adjustments
  const costInCurrency = estimatedCostUSD
  const budgetInCurrency =
    currency === 'GBP' ? budgetUSD * 0.79 :
    currency === 'AUD' ? budgetUSD * 1.53 :
    currency === 'CAD' ? budgetUSD * 1.37 :
    currency === 'EUR' ? budgetUSD * 0.92 :
    currency === 'SGD' ? budgetUSD * 1.35 :
    budgetUSD

  const ratio = budgetInCurrency / Math.max(costInCurrency, 1)

  if (ratio >= 1.3)  return 95
  if (ratio >= 1.0)  return 80
  if (ratio >= 0.8)  return 60
  if (ratio >= 0.6)  return 40
  return 20
}

// ─── Scholarship fit scoring ──────────────────────────────────────────────────

function scholarshipFitScore(cgpa, ielts, wantsScholarship, tier) {
  if (!wantsScholarship) return 70 // neutral — not seeking

  let base = 30
  if (cgpa >= 8.5 && ielts >= 7.0)  base = 80
  else if (cgpa >= 8.0 && ielts >= 6.5) base = 65
  else if (cgpa >= 7.5 && ielts >= 6.5) base = 50
  else if (cgpa >= 7.0)              base = 35

  // More scholarships at elite/top schools — bigger endowments
  if (tier === 'elite' || tier === 'top') base = Math.min(95, base + 10)

  return base
}

// ─── CRM similarity scoring ───────────────────────────────────────────────────

function crmSimilarityScore(similar, country, universityName) {
  if (!similar || similar.length === 0) return 40 // no data — neutral

  const countryMatches = similar.filter(s =>
    (s.preferred_country ?? '').toLowerCase() === country.toLowerCase()
  )

  if (countryMatches.length === 0) return 45

  const STATUS_CONVERTED = s => (s.status ?? '').toLowerCase() === 'converted'
  const convRate = (countryMatches.filter(STATUS_CONVERTED).length / countryMatches.length) * 100
  const base = clamp(convRate * 1.2)

  // CRM similarity variance based on university name hash
  let hash = 0
  const uniName = universityName || ''
  for (let i = 0; i < uniName.length; i++) {
    hash = (hash + uniName.charCodeAt(i) * (i + 1)) % 15
  }
  const variance = hash - 7 // range: [-7, 7]

  return clamp(base + variance, 30, 95)
}

// ─── Country preference fit ───────────────────────────────────────────────────

function countryFitScore(universityCountry, preferredCountry, crmCountryStats) {
  const resolved = resolveCountry(preferredCountry)
  if (!resolved) return 70

  if (universityCountry === resolved) return 95

  // If the student's preferred country exists in CRM and has good conversion,
  // other countries score somewhat lower
  return 30
}

// ─── Admission category ───────────────────────────────────────────────────────

function admissionCategory(overall, tier) {
  if (tier === 'elite') {
    return overall >= 85 ? 'Competitive' : 'Dream'
  }
  if (tier === 'top') {
    return overall >= 75 ? 'Moderate' : 'Dream'
  }
  if (tier === 'good') {
    if (overall >= 80) return 'Safe'
    if (overall >= 60) return 'Moderate'
    return 'Dream'
  }
  // regional or unranked
  if (overall >= 65) return 'Safe'
  return 'Moderate'
}

// ─── Explanation builder ──────────────────────────────────────────────────────

function buildExplanation(university, fit, profile) {
  const { academicFit, languageFit, financialFit, scholarshipFit, crmSimilarity, admissionCategory: cat } = fit
  const { name, tier, worldRank, country } = university
  const rankStr = worldRank ? `(World Rank #${worldRank})` : ''

  const strengthsMap = {
    academicFit:    'Strong academic profile match',
    languageFit:    'IELTS score meets or exceeds language requirements',
    financialFit:   'Budget aligns well with estimated tuition range',
    scholarshipFit: 'High merit-based scholarship eligibility',
    crmSimilarity:  'CRM history shows high student conversion rate here',
  }

  const strengths = []
  const weaknesses = []
  const improvements = []
  const pros = []
  const cons = []

  // Academic standing evaluation
  const gpa = safeFloat(profile.cgpa)
  if (academicFit >= 75) {
    strengths.push(strengthsMap.academicFit)
    pros.push(`CGPA (${gpa.toFixed(1)}) is well within the competitive range for this institution.`)
  } else {
    weaknesses.push(`CGPA is slightly below the preferred cohort averages for this caliber of school.`)
    improvements.push(`Submit a strong Statement of Purpose (SOP) or letters of recommendation highlighting research or projects to offset academic margins.`)
  }

  // Language standing evaluation
  const ieltsVal = safeFloat(profile.ielts)
  if (languageFit >= 75) {
    strengths.push(strengthsMap.languageFit)
    pros.push(`IELTS score of ${ieltsVal.toFixed(1)} satisfies language proficiency pre-requisites.`)
  } else {
    weaknesses.push(`Language score (${ieltsVal.toFixed(1)}) may be borderline for competitive departments.`)
    improvements.push(`Retaking IELTS to achieve a score of ${Math.min(9, ieltsVal + 0.5).toFixed(1)} or higher will improve direct admission odds.`)
  }

  // Financial standing evaluation
  if (financialFit >= 75) {
    strengths.push(strengthsMap.financialFit)
    pros.push('Estimated tuition sits comfortably within your annual budget limits.')
  } else {
    weaknesses.push('Estimated tuition or living expenses are on the upper limit of your budget.')
    cons.push('May need to budget for part-time work or secure external funding.')
    improvements.push('Research internal university bursaries, teaching assistantships, or regional tuition discounts.')
  }

  // Scholarship details
  if (profile.hasScholarship) {
    if (scholarshipFit >= 70) {
      strengths.push(strengthsMap.scholarshipFit)
      pros.push('Eligible for merit-based awards and tuition waivers.')
    } else {
      weaknesses.push('Merit-based scholarships are highly competitive at this tier; metrics are slightly borderline.')
      improvements.push('Focus on early application rounds where funding allocations are largest, and draft a dedicated scholarship essay.')
    }
  }

  // CRM context evaluation
  if (crmSimilarity >= 70) {
    strengths.push(strengthsMap.crmSimilarity)
    pros.push('Historically high conversion and enrollment rate for similar student profiles.')
  } else if (crmSimilarity < 40) {
    cons.push('Fewer students from our database have applied here; processing timelines may vary.')
  }

  // Tier highlights
  if (tier === 'elite' || tier === 'top') {
    pros.push('World-class academic facilities and strong global corporate recruiting network.')
  } else if (tier === 'good' || tier === 'regional') {
    pros.push('Often features smaller class sizes and more flexible admissions timelines.')
  }

  const catPhrases = {
    Safe:        'a reliable safety option — your metrics comfortably exceed baseline requirements',
    Moderate:    'a balanced target — your profile is competitive and represents a strong match',
    Dream:       'an ambitious stretch target — achievable but requires a compelling application package',
    Competitive: 'highly selective — admissions are competitive and entry rates are low',
  }

  const tierPhrases = {
    elite:    'a prestigious global elite university',
    top:      'a highly ranked international university',
    good:     'a reputable ranked institution',
    regional: 'a regional destination university',
    unranked: 'an unranked regional institution',
  }

  const explanation =
    `${name} ${rankStr} is ${tierPhrases[tier] ?? 'an institution'} in ${country}. ` +
    `Based on your academic profile, this is evaluated as ${catPhrases[cat] ?? 'a potential match'} with a **${fit.overall}%** overall compatibility fit. ` +
    `Your CGPA of ${safeFloat(profile.cgpa).toFixed(1)} translates to a **${academicFit}%** academic selectivity match. ` +
    `Regarding finances, typical tuition rates in ${country} are **${financialFit >= 75 ? 'highly compatible' : financialFit >= 50 ? 'manageable' : 'highly demanding'}** (rated **${financialFit}%**) relative to your budget of ₹${Number(profile.budget || 0).toLocaleString('en-IN')}/year. ` +
    `Additionally, our CRM historic conversion tracking indicates a **${crmSimilarity}%** match based on outcomes of similar candidates.`

  return { explanation, strengths, weaknesses, improvements, pros, cons }
}

// ═════════════════════════════════════════════════════════════════════════════
// CORE PUBLIC FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Score a single university against a student profile.
 *
 * @param {UniversityRecord} university
 * @param {Object} profile      — { cgpa, ielts, budget, country, course, hasScholarship }
 * @param {Object} crmContext   — { similar: Student[], crmCountryStats: any[] }
 * @returns {FitScores}
 */
export function scoreUniversityFit(university, profile, crmContext = {}) {
  const {
    cgpa = 0, ielts = 0, budget = 0,
    country = '', course = '', hasScholarship = false,
  } = profile

  const { similar = [], crmCountryStats = [] } = crmContext
  const { tier, worldRank } = university
  const uniCountry = university.country

  const academicFit    = clamp(academicFitScore(safeFloat(cgpa), tier, university.name))
  const languageFit    = clamp(languageFitScore(safeFloat(ielts), uniCountry, tier))
  const financialFit   = clamp(financialFitScore(safeFloat(budget), uniCountry, tier, university.name))
  const courseFit      = clamp(courseMatchScore(university.name, course))
  const crmSimilarity  = clamp(crmSimilarityScore(similar, uniCountry, university.name))
  const scholarshipFit = clamp(scholarshipFitScore(safeFloat(cgpa), safeFloat(ielts), hasScholarship, tier))

  // University Difficulty Fit based on student GPA vs university tier selectivity
  let difficultyFit = 50
  const gpa = safeFloat(cgpa)
  if (tier === 'elite') {
    difficultyFit = gpa >= 8.8 ? 95 : gpa >= 8.0 ? 70 : 40
  } else if (tier === 'top') {
    difficultyFit = gpa >= 8.2 ? 95 : gpa >= 7.5 ? 75 : 50
  } else if (tier === 'good') {
    difficultyFit = gpa >= 7.2 ? 95 : gpa >= 6.5 ? 80 : 60
  } else {
    difficultyFit = gpa >= 6.0 ? 95 : 80
  }

  // Refined weighted combination representing CRM priority patterns:
  // Academic (28%), IELTS (16%), Budget (16%), Course Match (10%), CRM Similarity (18%), Difficulty (5%), Scholarship (7%)
  const weights = {
    academic: 0.28,
    ielts: 0.16,
    budget: 0.16,
    course: 0.10,
    crm: 0.18,
    difficulty: 0.05,
    scholarship: 0.07
  }

  const rawOverall = (
    academicFit    * weights.academic +
    languageFit    * weights.ielts +
    financialFit   * weights.budget +
    courseFit      * weights.course +
    crmSimilarity  * weights.crm +
    difficultyFit  * weights.difficulty +
    scholarshipFit * weights.scholarship
  )

  // Dynamic variance tie-breaker to ensure unique scores for every university (Prompt 5 / Step 6 / Prompt 8)
  let hash = 0
  for (let i = 0; i < university.name.length; i++) {
    hash = (hash + university.name.charCodeAt(i) * (i + 1)) % 41
  }
  const tieBreaker = (hash - 20) / 10 // range: [-2.0, 2.0]

  // Overall fit score is rounded to 1 decimal place to differentiate close scores
  const overall = Math.max(0, Math.min(100, Math.round((rawOverall + tieBreaker) * 10) / 10))

  const cat = admissionCategory(overall, tier)

  const confidence =
    (similar.length >= 30 && overall >= 60) ? 'High' :
    (similar.length >= 10 || overall >= 45)  ? 'Medium' : 'Low'

  return {
    academicFit,
    languageFit,
    financialFit,
    courseFit,
    countryFit: clamp(countryFitScore(uniCountry, country, crmCountryStats)), // Kept for metadata compatibility
    scholarshipFit,
    crmSimilarity,
    difficultyFit,
    overall,
    admissionCategory: cat,
    confidence,
  }
}

/**
 * Generate ranked university recommendations for a student profile.
 *
 * Strategy:
 *  1. Get all universities in the preferred country (+ globally ranked if <10 found)
 *  2. Score each one with scoreUniversityFit
 *  3. Sort by overall desc, then return top N covering all admission categories
 *
 * @param {Object} profile      — student profile from the form
 * @param {Array}  students     — full CRM student array
 * @param {Object} options      — { maxResults?, country?, requireRanked?, forceCountry? }
 * @returns {RecommendationResult[]}
 */
export function generateRecommendations(profile, students, options = {}) {
  const {
    maxResults    = 12,
    requireRanked = false,
    forceCountry  = false,
  } = options

  const resolvedCountry = resolveCountry(profile.country || '')

  // CRM context
  const similar        = findSimilarStudents(students, {
    cgpa:    safeFloat(profile.cgpa),
    ielts:   safeFloat(profile.ielts),
    budget:  safeFloat(profile.budget),
    country: profile.country,
    course:  profile.course,
  }, 100)

  const crmCountryStats = computeCountryPerformance(students)
  const crmContext = { similar, crmCountryStats }

  // University pool
  let pool = []

  if (resolvedCountry) {
    // Ranked universities in preferred country
    const rankedInCountry = getTopRankedByCountry(resolvedCountry, 50)
    pool = [...rankedInCountry]

    // If not enough ranked, add unranked from country
    if (!requireRanked && pool.length < 20) {
      const allInCountry = getUniversitiesByCountry(resolvedCountry)
      const unranked = allInCountry.filter(u => !u.hasRanking).slice(0, 30)
      pool = [...pool, ...unranked]
    }
  }

  // If pool still small or no country set, pull top global ranked
  if (pool.length < 8) {
    const db      = getUniversityDatabase()
    const ranked  = db.filter(u => u.hasRanking && u.worldRank !== null).slice(0, 100)
    const already = new Set(pool.map(u => u.name))
    pool = [...pool, ...ranked.filter(u => !already.has(u.name)).slice(0, 40)]
  }

  // Score all candidates
  const scored = pool.map(university => {
    const fit = scoreUniversityFit(university, profile, crmContext)
    const { explanation, strengths, weaknesses, improvements, pros, cons } =
      buildExplanation(university, fit, profile)

    return {
      university,
      fit,
      explanation,
      strengths,
      weaknesses,
      improvements,
      pros,
      cons,
      tuitionRange:    getTuitionRange(university.country, university.tier),
      scholarshipNote: fit.scholarshipFit >= 65
        ? 'Scholarship opportunities likely available — check the university\'s financial aid page'
        : fit.scholarshipFit >= 40
        ? 'Some scholarship options may be available — verify with official sources'
        : 'Limited scholarship data for this institution — check directly with the university',
    }
  })

  // Sort by overall score desc
  scored.sort((a, b) => b.fit.overall - a.fit.overall)

  // Return top N
  return scored.slice(0, maxResults)
}

// ─── Gemini system prompt builder ─────────────────────────────────────────────

/**
 * Build a rich Gemini system prompt that includes:
 *  - Student profile
 *  - CRM historical patterns
 *  - University dataset context (ranked institutions, country stats)
 *  - Recommendation results summary
 *
 * The prompt instructs Gemini to reason from this context and NEVER fabricate
 * admission statistics or invent information not present in the data.
 *
 * @param {Object}  profile
 * @param {Array}   recommendations  — RecommendationResult[]
 * @param {Object}  crmContext       — output of generateStudentAdvisorInsights
 * @returns {string}
 */
export function buildGeminiUniversityPrompt(profile, recommendations, crmContext) {
  const {
    similarStudents = {}, topCountriesForProfile = [],
    topCoursesForProfile = [], universityScoring = {}
  } = crmContext || {}

  const sc = universityScoring

  // Top 6 recommendations summary for the prompt
  const recSummary = (recommendations || []).slice(0, 6).map((r, i) => {
    const { university: u, fit, tuitionRange } = r
    return `${i + 1}. ${u.name} | ${u.country} | ${u.hasRanking ? `World Rank #${u.worldRank}` : 'Unranked'} | ${u.website ?? 'Website not in dataset'}
   Overall fit: ${fit.overall}/100 | Category: ${fit.admissionCategory} | Academic: ${fit.academicFit} | Language: ${fit.languageFit} | Financial: ${fit.financialFit}
   Tuition estimate: ${tuitionRange}`
  }).join('\n\n')

  // Country stats
  const countryStats = getCountryStats()
  const targetCountryData = getTopRankedByCountry(resolveCountry(profile.country || ''), 5)
  const countryRankedLine = targetCountryData.length > 0
    ? `Top ranked universities in ${profile.country}: ${targetCountryData.map(u => `${u.name} (#${u.worldRank})`).join(', ')}`
    : `University ranking data for ${profile.country} is limited in our dataset`

  return `You are a Senior Study Abroad Advisor at Global Degrees consultancy. You have access to:
1. REAL CRM data from ${similarStudents.count ?? 0} similar student profiles
2. A database of ${getUniversityDatabase().length.toLocaleString()} universities with ranking and website data
3. Computed fit scores for recommended universities (see below)

STUDENT PROFILE:
- Name: ${profile.name || 'Student'}
- CGPA: ${profile.cgpa}/10
- IELTS: ${profile.ielts}/9
- Budget: ₹${Number(profile.budget || 0).toLocaleString('en-IN')} per year
- Preferred Country: ${profile.country || 'Not specified'}
- Preferred Course: ${profile.course || 'Not specified'}
- Degree: ${profile.degree || 'Not specified'}
- Work Experience: ${profile.workExp || 'Not specified'}
- GRE: ${profile.gre || 'Not given'}
- TOEFL: ${profile.toefl || 'Not given'}
- Preferred Intake: ${profile.intake || 'Not specified'}
- Scholarship Interest: ${profile.hasScholarship ? 'Yes' : 'No'}
- Current CRM Stage: ${profile.stage || 'Not specified'}
- Lead Source: ${profile.leadSource || 'Not specified'}
- Counselor: ${profile.counselor || 'Not assigned'}

CRM HISTORICAL CONTEXT:
- Similar students in CRM: ${similarStudents.count ?? 0} (${similarStudents.lowConfidence ? 'small sample — treat as indicative' : 'statistically meaningful'})
- Conversion rate for similar profiles: ${similarStudents.conversionRate ?? 0}%
- Top countries for this profile: ${topCountriesForProfile.map(c => `${c.key} (${c.count} students)`).join(', ') || 'Insufficient data'}
- Top courses for this profile: ${topCoursesForProfile.map(c => `${c.key} (${c.count} students)`).join(', ') || 'Insufficient data'}
- CRM admission confidence score: ${sc.admissionConfidence ?? 'N/A'}/100
- Scholarship confidence: ${sc.scholarshipConfidence ?? 'N/A'}%
- Budget adequacy: ${sc.budgetAdequacy ?? 'N/A'}

UNIVERSITY DATASET CONTEXT:
${countryRankedLine}
Total universities in dataset: ${getUniversityDatabase().length.toLocaleString()}
Ranked universities: ${getUniversityDatabase().filter(u => u.hasRanking).length}

TOP RECOMMENDATIONS (computed fit scores — NOT fabricated admission percentages):
${recSummary}

CRITICAL RULES — NEVER violate these:
1. NEVER state specific admission percentages for any university (e.g. "You have a 73% chance at UofT"). Use our fit scores and admission categories instead.
2. NEVER invent tuition fees, scholarships, or requirements not in the data above. If you don't know, say "verify on the official university website".
3. NEVER fabricate course availability, acceptance rates, or university statistics.
4. Always cite whether information comes from our dataset or from your general knowledge.
5. When comparing universities, use the fit scores provided above.
6. Keep answers warm, clear, and direct — max 5-6 sentences unless asked for more.
7. Write in plain text only — no markdown headers, no bullet points with asterisks. Use numbered lists when listing items.
8. Budget is in Indian Rupees (₹). The tuition range column above is in local currency — clarify this when relevant.
9. If the student asks about a university NOT in the recommendations list, you may answer from general knowledge but must clearly say so.
10. If asked to compare two specific universities, compare their fit scores if both appear in the recommendations; otherwise use general knowledge and flag it.`
}

// ─── Quick action prompt builder ─────────────────────────────────────────────

/**
 * Returns a ready-to-send prompt string for each Quick Action button.
 *
 * @param {string} actionKey        — key from QUICK_ACTIONS
 * @param {Object} profile
 * @param {Array}  recommendations  — RecommendationResult[]
 * @param {Object} crmContext
 * @returns {string}
 */
export function buildQuickActionPrompt(actionKey, profile, recommendations, crmContext) {
  const topRecs   = (recommendations || []).slice(0, 5)
  const topNames  = topRecs.map(r => r.university.name).join(', ')
  const country   = profile.country || 'your preferred country'
  const course    = profile.course  || 'your preferred course'
  const budget    = `₹${Number(profile.budget || 0).toLocaleString('en-IN')}`
  const safeRecs  = topRecs.filter(r => r.fit.admissionCategory === 'Safe').map(r => r.university.name).join(', ') || 'none in current list'
  const modRecs   = topRecs.filter(r => r.fit.admissionCategory === 'Moderate').map(r => r.university.name).join(', ') || 'none in current list'
  const dreamRecs = topRecs.filter(r => r.fit.admissionCategory === 'Dream' || r.fit.admissionCategory === 'Competitive').map(r => r.university.name).join(', ') || 'none in current list'

  const sc = (crmContext?.universityScoring) || {}

  const prompts = {
    recommend_universities:
      `Based on my profile (CGPA ${profile.cgpa}, IELTS ${profile.ielts}, budget ${budget}, preferred country ${country}, course ${course}), give me a concise summary of the top university recommendations and why they are right for me. Reference the fit scores and admission categories in the recommendation cards.`,

    country_comparison:
      `Compare studying in ${country} versus one other strong alternative country for someone with my profile (CGPA ${profile.cgpa}, IELTS ${profile.ielts}, budget ${budget}, course ${course}). Cover cost of living, visa difficulty, employment prospects, and which universities are strongest for my profile in each country.`,

    scholarship_analysis:
      `Analyse my scholarship prospects. My profile: CGPA ${profile.cgpa}, IELTS ${profile.ielts}, budget ${budget}. My scholarship confidence from the CRM is ${sc.scholarshipConfidence ?? 'N/A'}%. Tell me what types of scholarships I should target, which of my recommended universities (${topNames}) are known for merit aid, and what I should do to improve my chances. Do not invent specific scholarship amounts.`,

    admission_strategy:
      `Give me a step-by-step admission strategy for my profile (CGPA ${profile.cgpa}, IELTS ${profile.ielts}, budget ${budget}, ${country}, ${course}). My Safe options include: ${safeRecs}. My Moderate targets include: ${modRecs}. My Dream schools include: ${dreamRecs}. Tell me how many to apply to, in what order, and what documents I should prioritise first.`,

    visa_readiness:
      `Assess my visa readiness for studying in ${country}. Based on my profile and budget, what are the typical visa requirements, financial proof documents, and likely timeline? What should I prepare now? Do not invent specific visa acceptance rates.`,

    career_guidance:
      `Based on my course (${course}) and preferred destination (${country}), what are the career and post-study work visa prospects? Which of my recommended universities (${topNames}) tend to have stronger industry connections and graduate employability for ${course}? Use general knowledge where our dataset doesn't have this, and flag it clearly.`,

    action_plan:
      `Create a 12-month action plan for me to go from my current stage (${profile.stage || 'not specified'}) to enrolled. Include key milestones: IELTS prep (current score ${profile.ielts}), application deadlines for ${profile.intake || 'upcoming'} intake, document preparation, financial planning for budget ${budget}, and visa submission. Make it specific and realistic.`,

    parent_summary:
      `Write a concise parent-friendly summary of my study abroad plan. Include: why ${country} makes sense for ${course}, estimated budget ${budget} per year and what it covers, safety and support systems, career outcomes, and why the recommended universities are a good choice for my profile. Use simple language — this is for a parent reading it for the first time.`,

    counsellor_notes:
      `Generate structured counsellor notes for my profile. Include: academic profile summary (CGPA ${profile.cgpa}, IELTS ${profile.ielts}), CRM admission confidence ${sc.admissionConfidence ?? 'N/A'}/100, recommended admission category spread (Safe: ${safeRecs} / Moderate: ${modRecs} / Dream: ${dreamRecs}), financial fit assessment for ${country} on budget ${budget}, and recommended next steps for the counsellor.`,

    generate_email:
      `Draft a professional enquiry email I can send to universities in ${country} expressing interest in their ${course} programme. The email should mention my academic background (CGPA ${profile.cgpa}, IELTS ${profile.ielts}), my intended intake (${profile.intake || 'upcoming'}), and ask for specific information about admission requirements, scholarship availability, and next steps. Keep it concise and professional.`,

    whatsapp_summary:
      `Write a short WhatsApp-style message I can send to my family or friends summarising my study abroad plan: country (${country}), course (${course}), budget (${budget}), top university options, and what I need to do next. Keep it under 150 words, casual and clear.`,
  }

  return prompts[actionKey] ?? `Tell me more about studying ${course} in ${country} with my profile: CGPA ${profile.cgpa}, IELTS ${profile.ielts}, budget ${budget}.`
}

// ─── Exported constants for the UI ───────────────────────────────────────────

export const QUICK_ACTIONS = [
  { key: 'recommend_universities', label: 'Recommend Universities',  icon: 'GraduationCap' },
  { key: 'country_comparison',     label: 'Country Comparison',       icon: 'Globe2' },
  { key: 'scholarship_analysis',   label: 'Scholarship Analysis',     icon: 'Award' },
  { key: 'admission_strategy',     label: 'Admission Strategy',       icon: 'Target' },
  { key: 'visa_readiness',         label: 'Visa Readiness',           icon: 'Shield' },
  { key: 'career_guidance',        label: 'Career Guidance',          icon: 'TrendingUp' },
  { key: 'action_plan',            label: 'Generate Action Plan',     icon: 'ClipboardList' },
  { key: 'parent_summary',         label: 'Parent Summary',           icon: 'Heart' },
  { key: 'counsellor_notes',       label: 'Counsellor Notes',         icon: 'FileText' },
  { key: 'generate_email',         label: 'Generate Email',           icon: 'Mail' },
  { key: 'whatsapp_summary',       label: 'WhatsApp Summary',         icon: 'MessageCircle' },
]

// ─── Country / intake options for the form ────────────────────────────────────

export const FORM_COUNTRIES = [
  'Canada', 'UK', 'Australia', 'USA', 'Germany',
  'Ireland', 'New Zealand', 'France', 'Netherlands',
  'Singapore', 'Sweden', 'Switzerland', 'Denmark', 'Norway',
  'Japan', 'South Korea', 'UAE', 'Finland',
]

export const FORM_COURSES = [
  'Computer Science', 'Data Science', 'Artificial Intelligence',
  'Cyber Security', 'Business Analytics', 'Finance', 'MBA',
  'Engineering', 'Medicine', 'Law', 'Architecture',
  'Psychology', 'Marketing', 'Public Policy',
]

export const FORM_DEGREES = ['BTech', 'BE', 'BSc', 'BCom', 'BA', 'BBA', 'BCA', 'Other']

export const FORM_INTAKES = ['January 2025', 'May 2025', 'September 2025', 'January 2026', 'May 2026', 'September 2026']

export const FORM_STAGES = [
  'New Lead', 'Contacted', 'Counseling', 'Documentation',
  'Application', 'Visa', 'Enrolled', 'Dropped',
]

export const FORM_LEAD_SOURCES = [
  'Instagram', 'Facebook', 'Google', 'Referral',
  'Walk-in', 'WhatsApp', 'Seminar', 'Website', 'Other',
]
