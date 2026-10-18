// Helpers that turn the plain text from the form into structured pieces
// the templates can lay out (bars, pills, cards, tabs, links).

const URL_PATTERN = /(https?:\/\/\S+|www\.\S+)/i

function safeHref(raw) {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`

  try {
    const url = new URL(withProtocol)
    const isWeb = url.protocol === 'http:' || url.protocol === 'https:'
    return isWeb && url.hostname.includes('.') ? url.href : null
  } catch {
    return null
  }
}

export function splitList(text = '') {
  return text
    .split(/[\n,;•]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

// Skills can be written as "React", "React:80", "React 80%" or "React (80%)".
// A number is only treated as a level when it has a colon or a % sign,
// so "Python 3" stays a plain skill.
export function parseSkills(text = '') {
  return splitList(text).map((entry) => {
    const match = entry.match(
      /^(.+?)\s*(?::\s*(\d{1,3})\s*%?|\(?\s*(\d{1,3})\s*%\s*\)?)$/
    )

    if (!match) {
      return { name: entry, level: null }
    }

    const level = Math.min(100, Number(match[2] ?? match[3]))

    return { name: match[1].trim(), level }
  })
}

// Turns a block of text into [{ title, body, link }].
// - Items can be separated by a blank line, or written one per line.
// - "Title: description" or "Title - description" is split into title and body.
// - A multi-line item uses its first line as the title.
// - A web address inside an item becomes its "Visit" link.
export function parseItems(text = '') {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  const chunks =
    blocks.length > 1
      ? blocks
      : text
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)

  return chunks.map((chunk) => {
    let link = null
    const found = chunk.match(URL_PATTERN)

    if (found) {
      link = safeHref(found[0])
      chunk = chunk
        .replace(found[0], '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/[:\-–—\s]+$/g, '')
        .trim()
    }

    const lines = chunk
      .split('\n')
      .map((line) => line.trim().replace(/^[-•*]\s*/, ''))
      .filter(Boolean)

    if (lines.length === 0) {
      return { title: '', body: '', link }
    }

    if (lines.length > 1) {
      return { title: lines[0], body: lines.slice(1).join('\n'), link }
    }

    const match = lines[0].match(/^(.{2,60}?)\s*(?::|\s[-–—]\s)\s*(.+)$/)

    if (match) {
      return { title: match[1], body: match[2], link }
    }

    return { title: '', body: lines[0], link }
  })
}

// Finds links in the "social links" text. Only http/https links become clickable.
export function parseLinks(text = '') {
  const tokens = text
    .split(/[\n,;]+/)
    .map((token) => token.trim())
    .filter(Boolean)

  return tokens.map((token) => {
    const found = token.match(
      /(https?:\/\/\S+|www\.\S+|\b[\w-]+(?:\.[\w-]+)+(?:\/\S*)?)/i
    )

    if (!found) {
      return { label: token, href: null }
    }

    const href = safeHref(found[0])

    if (!href) {
      return { label: token, href: null }
    }

    const typedLabel = token
      .replace(found[0], '')
      .replace(/[:\-–—\s]+$/g, '')
      .trim()

    return {
      label: typedLabel || new URL(href).hostname.replace(/^www\./, ''),
      href,
    }
  })
}

export function initialOf(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?'
}


/* =====================================================
   Structured data (new) + support for older saved text
   The form now saves arrays; portfolios saved earlier used plain text.
   These getters accept both and always return the same shape.
===================================================== */

const text = (value) => String(value ?? '').trim()

const clampLevel = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isNaN(number) ? null : Math.min(100, Math.max(0, Math.round(number)))
}

export function levelLabel(level) {
  if (level < 25) return 'Beginner'
  if (level < 50) return 'Improving'
  if (level < 75) return 'Good'
  if (level < 90) return 'Strong'
  return 'Expert'
}

// Returns { ok, url }. An empty value is fine; a bad one is not.
export function normalizeUrl(value = '') {
  const trimmed = text(value)

  if (!trimmed) return { ok: true, url: '' }

  const href = safeHref(trimmed)

  return href ? { ok: true, url: href } : { ok: false, url: trimmed }
}

export function getSkills(value) {
  if (Array.isArray(value)) {
    return value
      .map((skill) => ({
        name: text(skill?.name),
        level: clampLevel(skill?.level),
      }))
      .filter((skill) => skill.name)
  }

  return parseSkills(value || '')
}

// Every entry has the same shape: { title, meta, body, link, tools[] }
export function getProjects(value) {
  if (Array.isArray(value)) {
    return value
      .map((project) => ({
        title: text(project?.title),
        meta: '',
        body: text(project?.description),
        link: project?.link ? safeHref(text(project.link)) : null,
        tools: splitList(text(project?.tools)),
      }))
      .filter((project) => project.title || project.body)
  }

  return parseItems(value || '').map((item) => ({
    title: item.title,
    meta: '',
    body: item.body,
    link: item.link,
    tools: [],
  }))
}

export function getExperience(value) {
  if (Array.isArray(value)) {
    return value
      .map((job) => ({
        title: text(job?.role),
        meta: [text(job?.company), text(job?.period)].filter(Boolean).join(' · '),
        body: text(job?.description),
        link: null,
        tools: [],
      }))
      .filter((job) => job.title || job.meta || job.body)
  }

  return parseItems(value || '').map((item) => ({
    title: item.title,
    meta: '',
    body: item.body,
    link: null,
    tools: [],
  }))
}

export function getEducation(value) {
  if (Array.isArray(value)) {
    return value
      .map((school) => ({
        title: text(school?.school),
        meta: [text(school?.degree), text(school?.years)].filter(Boolean).join(' · '),
        body: '',
        link: null,
        tools: [],
      }))
      .filter((school) => school.title || school.meta)
  }

  return parseItems(value || '').map((item) => ({
    title: item.title,
    meta: '',
    body: item.body,
    link: null,
    tools: [],
  }))
}

// Returns [{ label, href }] - only entries with a working link
export function getLinks(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        const href = entry?.url ? safeHref(text(entry.url)) : null
        const platform = text(entry?.platform)
        const host = href ? new URL(href).hostname.replace(/^www\./, '') : ''

        return {
          label: platform && platform !== 'Other' ? platform : host,
          href,
        }
      })
      .filter((entry) => entry.label && entry.href)
  }

  return parseLinks(value || '')
}
