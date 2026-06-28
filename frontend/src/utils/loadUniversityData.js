/**
 * loadUniversityData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Loads, parses, and merges BOTH university datasets:
 *   1. world_universities_and_domains.json  — 10,251 universities with
 *      websites, domains, country, and state/province
 *   2. world_university_rankings.csv        — 2,199 ranking rows across
 *      multiple years (2012–2015); we keep the BEST (lowest) world rank
 *      per institution so we always surface the strongest signal
 *
 * The two datasets are merged by fuzzy name matching (lowercase, stripped
 * punctuation). When a ranking entry matches a domain entry the result has
 * both a website and a QS-style world rank; unmatched entries still appear
 * but with partial information.
 *
 * PUBLIC API
 * ──────────
 *  getUniversityDatabase()     → UniversityRecord[]   (cached, lazy-loaded)
 *  searchUniversities(query, filters) → UniversityRecord[]
 *  getUniversitiesByCountry(country)  → UniversityRecord[]
 *  getTopRankedByCountry(country, n)  → UniversityRecord[]
 *  findUniversityByName(name)         → UniversityRecord | null
 *
 * UniversityRecord shape
 * ──────────────────────
 *  {
 *    name:         string          // canonical name (from domain list if available)
 *    country:      string
 *    stateProvince:string | null
 *    website:      string | null   // from domains dataset
 *    domains:      string[]        // e.g. ["utoronto.ca"]
 *    worldRank:    number | null   // best rank across all years
 *    nationalRank: number | null
 *    score:        number | null   // ranking score (0-100 scale)
 *    hasRanking:   boolean
 *    // Derived convenience fields
 *    rankLabel:    string          // "Top 50" | "Top 100" | "Top 200" | "Top 500" | "Ranked" | "Unranked"
 *    tier:         "elite" | "top" | "good" | "regional" | "unranked"
 *  }
 *
 * IMPORTANT: This module never fabricates data. If a field is unknown it is
 * null/empty — never invented. The caller must handle nulls gracefully.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Raw imports ─────────────────────────────────────────────────────────────
// Vite allows importing JSON directly. The CSV is imported as raw text and
// parsed here so we don't need a build plugin.

import domainsRaw   from '../data/world_universities_and_domains.json'
import rankingsText from '../data/world_university_rankings.csv?raw'

// ─── Module-level cache ───────────────────────────────────────────────────────

let _db = null // UniversityRecord[] — built once, reused

// ─── CSV parser ───────────────────────────────────────────────────────────────

/**
 * Minimal RFC 4180-compliant CSV parser.
 * Returns an array of objects keyed by the header row.
 * Handles quoted fields (including commas/newlines inside quotes).
 */
function parseCSV(text) {
  const lines = []
  let current = ''
  let inQuote = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') { current += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === '\n' && !inQuote) {
      lines.push(current.replace(/\r$/, ''))
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) lines.push(current)

  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())

  return lines.slice(1).filter(l => l.trim()).map(line => {
    const fields = []
    let field = ''
    let q = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (q && line[i + 1] === '"') { field += '"'; i++ }
        else q = !q
      } else if (ch === ',' && !q) {
        fields.push(field)
        field = ''
      } else {
        field += ch
      }
    }
    fields.push(field)

    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = (fields[idx] || '').trim()
    })
    return obj
  })
}

// ─── Name normalisation for fuzzy matching ────────────────────────────────────

const _normCache = new Map()

function normaliseName(name) {
  if (!name) return ''
  if (_normCache.has(name)) return _normCache.get(name)
  const n = name
    .toLowerCase()
    .replace(/[''`]/g, '')           // curly apostrophes
    .replace(/[^a-z0-9\s]/g, ' ')   // punctuation → space
    .replace(/\s+/g, ' ')
    .trim()
  _normCache.set(name, n)
  return n
}

// ─── Country normalisation ─────────────────────────────────────────────────────
// The two datasets use slightly different country names. Map ranking CSV
// country names → the form used in the domains JSON so filters work uniformly.

const COUNTRY_ALIASES = {
  'USA':            'United States',
  'United States':  'United States',
  'UK':             'United Kingdom',
  'United Kingdom': 'United Kingdom',
  'South Korea':    'South Korea',
  'Korea, South':   'South Korea',
  'Republic of Korea': 'South Korea',
  'Taiwan':         'Taiwan',
  'Hong Kong':      'Hong Kong',
  'Macao':          'Macao',
  'Czech Republic': 'Czech Republic',
  'Czechia':        'Czech Republic',
  'Russia':         'Russia',
  'Russian Federation': 'Russia',
  'Iran':           'Iran',
  'Iran, Islamic Republic of': 'Iran',
}

function normaliseCountry(raw) {
  if (!raw) return raw
  return COUNTRY_ALIASES[raw.trim()] ?? raw.trim()
}

// ─── Build the merged database ─────────────────────────────────────────────────

function buildDatabase() {
  // 1. Parse rankings CSV — keep only the best (lowest) world_rank per name
  const rankRows = parseCSV(rankingsText)

  // world_rank may be a range like "201-300"; we take the lower bound
  function parseRank(str) {
    if (!str) return null
    const clean = str.replace(/[^0-9-]/g, '')
    if (!clean) return null
    const parts = clean.split('-')
    const n = parseInt(parts[0], 10)
    return isNaN(n) ? null : n
  }

  const bestRankByName = new Map() // normName → best ranking row

  for (const row of rankRows) {
    const norm = normaliseName(row.institution)
    if (!norm) continue
    const rank = parseRank(row.world_rank)
    if (!bestRankByName.has(norm)) {
      bestRankByName.set(norm, { ...row, _rank: rank })
    } else {
      const existing = bestRankByName.get(norm)
      if (rank !== null && (existing._rank === null || rank < existing._rank)) {
        bestRankByName.set(norm, { ...row, _rank: rank })
      }
    }
  }

  // 2. Build map from domain entries for quick lookup
  const domainByNorm = new Map() // normName → domain entry

  for (const entry of domainsRaw) {
    if (!entry.name) continue
    const norm = normaliseName(entry.name)
    if (!domainByNorm.has(norm)) {
      domainByNorm.set(norm, entry)
    }
  }

  // 3. Compute tier from world rank
  function tier(rank) {
    if (rank === null)   return 'unranked'
    if (rank <= 50)      return 'elite'
    if (rank <= 200)     return 'top'
    if (rank <= 500)     return 'good'
    return 'regional'
  }

  function rankLabel(rank) {
    if (rank === null)   return 'Unranked'
    if (rank <= 50)      return 'Top 50'
    if (rank <= 100)     return 'Top 100'
    if (rank <= 200)     return 'Top 200'
    if (rank <= 500)     return 'Top 500'
    return 'Ranked'
  }

  // 4. Merge: start with domain entries (larger set), augment with rankings
  const records = []
  const seenNorms = new Set()

  // A. Domain entries (10k+) augmented by ranking data
  for (const entry of domainsRaw) {
    if (!entry.name) continue
    const norm = normaliseName(entry.name)
    if (seenNorms.has(norm)) continue
    seenNorms.add(norm)

    const rankRow  = bestRankByName.get(norm)
    const worldRank = rankRow ? rankRow._rank : null
    const natRank   = rankRow ? (parseInt(rankRow.national_rank, 10) || null) : null
    const score     = rankRow ? (parseFloat(rankRow.score) || null) : null
    const country   = normaliseCountry(entry.country || rankRow?.country || '')

    records.push({
      name:          entry.name,
      country,
      stateProvince: entry['state-province'] || null,
      website:       entry.web_pages?.[0] ?? null,
      domains:       entry.domains ?? [],
      worldRank,
      nationalRank:  natRank,
      score,
      hasRanking:    worldRank !== null,
      rankLabel:     rankLabel(worldRank),
      tier:          tier(worldRank),
    })
  }

  // B. Rankings-only entries (universities not in domains JSON)
  for (const [norm, rankRow] of bestRankByName.entries()) {
    if (seenNorms.has(norm)) continue
    seenNorms.add(norm)

    const worldRank  = rankRow._rank
    const natRank    = parseInt(rankRow.national_rank, 10) || null
    const score      = parseFloat(rankRow.score) || null
    const country    = normaliseCountry(rankRow.country || '')

    records.push({
      name:          rankRow.institution,
      country,
      stateProvince: null,
      website:       null,
      domains:       [],
      worldRank,
      nationalRank:  natRank,
      score,
      hasRanking:    true,
      rankLabel:     rankLabel(worldRank),
      tier:          tier(worldRank),
    })
  }

  // Sort: ranked first (by rank asc), then unranked alphabetically
  records.sort((a, b) => {
    if (a.worldRank !== null && b.worldRank !== null) return a.worldRank - b.worldRank
    if (a.worldRank !== null) return -1
    if (b.worldRank !== null) return 1
    return a.name.localeCompare(b.name)
  })

  return records
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the full university database (lazy-built, cached forever in-session).
 * @returns {UniversityRecord[]}
 */
export function getUniversityDatabase() {
  if (!_db) _db = buildDatabase()
  return _db
}

/**
 * Search universities by name query and optional filters.
 *
 * @param {string} query         — free-text name search
 * @param {Object} filters       — { country?, tier?, hasRanking? }
 * @param {number} [limit=20]    — max results
 * @returns {UniversityRecord[]}
 */
export function searchUniversities(query = '', filters = {}, limit = 20) {
  const db   = getUniversityDatabase()
  const norm = normaliseName(query)
  const { country, tier: filterTier, hasRanking: filterRanked } = filters

  return db
    .filter(u => {
      if (norm && !normaliseName(u.name).includes(norm)) return false
      if (country && normaliseCountry(u.country) !== normaliseCountry(country)) return false
      if (filterTier && u.tier !== filterTier) return false
      if (filterRanked === true  && !u.hasRanking) return false
      if (filterRanked === false &&  u.hasRanking) return false
      return true
    })
    .slice(0, limit)
}

/**
 * Get all universities for a specific country.
 * Ranked ones are sorted by rank; unranked are appended alphabetically.
 *
 * @param {string} country
 * @returns {UniversityRecord[]}
 */
export function getUniversitiesByCountry(country) {
  const db      = getUniversityDatabase()
  const normC   = normaliseCountry(country)
  return db.filter(u => normaliseCountry(u.country) === normC)
}

/**
 * Get the top N ranked universities for a country.
 * Falls back to alphabetical when there aren't N ranked entries.
 *
 * @param {string} country
 * @param {number} [n=10]
 * @returns {UniversityRecord[]}
 */
export function getTopRankedByCountry(country, n = 10) {
  return getUniversitiesByCountry(country)
    .filter(u => u.hasRanking)
    .slice(0, n)
}

/**
 * Find a single university by exact or near-exact name.
 *
 * @param {string} name
 * @returns {UniversityRecord | null}
 */
export function findUniversityByName(name) {
  const db   = getUniversityDatabase()
  const norm = normaliseName(name)
  return db.find(u => normaliseName(u.name) === norm) ?? null
}

/**
 * Convenience: get country-level stats from the university database.
 * Useful for telling the AI how many ranked universities a country has.
 *
 * @returns {{ country: string, total: number, ranked: number, topRank: number | null }[]}
 */
export function getCountryStats() {
  const db = getUniversityDatabase()
  const map = new Map()

  for (const u of db) {
    const c = u.country || 'Unknown'
    if (!map.has(c)) map.set(c, { country: c, total: 0, ranked: 0, topRank: null })
    const s = map.get(c)
    s.total++
    if (u.hasRanking) {
      s.ranked++
      if (u.worldRank !== null && (s.topRank === null || u.worldRank < s.topRank)) {
        s.topRank = u.worldRank
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.ranked - a.ranked)
}
