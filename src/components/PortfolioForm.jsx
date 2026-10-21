import { useEffect, useRef, useState } from 'react'
import { gooeyToast } from 'goey-toast'
import {
  getSkills,
  parseItems,
  parseLinks,
  normalizeUrl,
  levelLabel,
} from './templates/portfolioHelpers'

const PLATFORMS = [
  'GitHub',
  'LinkedIn',
  'Facebook',
  'Instagram',
  'X (Twitter)',
  'YouTube',
  'Behance',
  'Dribbble',
  'Website',
  'Other',
]

// ---------- Rows: each repeatable entry gets a unique id ----------
let rowCounter = 0
const nextId = () => {
  rowCounter += 1
  return rowCounter
}

const emptySkill = () => ({ id: nextId(), name: '', level: 50 })
const emptyEducation = () => ({ id: nextId(), school: '', degree: '', years: '' })
const emptyProject = () => ({ id: nextId(), title: '', description: '', link: '', tools: '' })
const emptyExperience = () => ({ id: nextId(), role: '', company: '', period: '', description: '' })
const emptyLink = () => ({ id: nextId(), platform: 'GitHub', url: '' })

const fieldNames = ['fullName', 'email', 'phone', 'address', 'profilePicture', 'about']

// Builds the starting values. Works for new portfolios, for ones saved with the
// new structured format, and for older ones saved as plain text.
function buildInitial(data) {
  const fields = {}
  fieldNames.forEach((name) => {
    fields[name] = data?.[name] ?? ''
  })

  const skills = getSkills(data?.skills).map((skill) => ({
    id: nextId(),
    name: skill.name,
    level: skill.level ?? 50,
  }))

  let education = []
  if (Array.isArray(data?.education)) {
    education = data.education.map((item) => ({
      id: nextId(),
      school: item.school || '',
      degree: item.degree || '',
      years: item.years || '',
    }))
  } else if (data?.education) {
    education = parseItems(data.education).map((item) => ({
      id: nextId(),
      school: item.title || item.body,
      degree: item.title ? item.body : '',
      years: '',
    }))
  }

  let projects = []
  if (Array.isArray(data?.projects)) {
    projects = data.projects.map((item) => ({
      id: nextId(),
      title: item.title || '',
      description: item.description || '',
      link: item.link || '',
      tools: item.tools || '',
    }))
  } else if (data?.projects) {
    projects = parseItems(data.projects).map((item) => ({
      id: nextId(),
      title: item.title,
      description: item.body,
      link: item.link || '',
      tools: '',
    }))
  }

  let experience = []
  if (Array.isArray(data?.experience)) {
    experience = data.experience.map((item) => ({
      id: nextId(),
      role: item.role || '',
      company: item.company || '',
      period: item.period || '',
      description: item.description || '',
    }))
  } else if (data?.experience) {
    experience = parseItems(data.experience).map((item) => ({
      id: nextId(),
      role: item.title,
      company: '',
      period: '',
      description: item.body,
    }))
  }

  let links = []
  if (Array.isArray(data?.socialLinks)) {
    links = data.socialLinks.map((item) => ({
      id: nextId(),
      platform: item.platform || 'Website',
      url: item.url || '',
    }))
  } else if (data?.socialLinks) {
    links = parseLinks(data.socialLinks)
      .filter((item) => item.href)
      .map((item) => ({
        id: nextId(),
        platform: PLATFORMS.includes(item.label) ? item.label : 'Website',
        url: item.href,
      }))
  }

  return {
    fields,
    skills: skills.length ? skills : [emptySkill()],
    education: education.length ? education : [emptyEducation()],
    projects: projects.length ? projects : [emptyProject()],
    experience: experience.length ? experience : [emptyExperience()],
    links: links.length ? links : [emptyLink()],
  }
}

function useRows(initialRows, makeEmpty) {
  const [rows, setRows] = useState(initialRows)

  return {
    rows,
    update: (id, field, value) =>
      setRows((previous) =>
        previous.map((row) => (row.id === id ? { ...row, [field]: value } : row))
      ),
    add: () => setRows((previous) => [...previous, makeEmpty()]),
    remove: (id) =>
      setRows((previous) =>
        previous.length > 1 ? previous.filter((row) => row.id !== id) : [makeEmpty()]
      ),
  }
}

// Used to tell whether the person has changed anything
const withoutIds = (rows) => rows.map(({ id, ...rest }) => rest) // eslint-disable-line no-unused-vars

// Shrinks an image in the browser so it is small enough to store
function resizeImage(file, maxSize = 320) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => {
      const image = new Image()

      image.onerror = () => reject(new Error('That file is not a valid image.'))
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)

        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }

      image.src = reader.result
    }

    reader.readAsDataURL(file)
  })
}

function RemoveButton({ onClick, label }) {
  return (
    <button
      className="icon-button small"
      type="button"
      onClick={onClick}
      aria-label={label}
      title="Remove"
    >
      ×
    </button>
  )
}

function PortfolioForm({
  initialData,
  onBack,
  onContinue,
  saveLoading,
  saveMessage,
}) {
  const isEditing = Boolean(initialData?.id)
  const formRef = useRef(null)

  const [initial] = useState(() => buildInitial(initialData))
  const [fields, setFields] = useState(initial.fields)
  const skills = useRows(initial.skills, emptySkill)
  const education = useRows(initial.education, emptyEducation)
  const projects = useRows(initial.projects, emptyProject)
  const experience = useRows(initial.experience, emptyExperience)
  const links = useRows(initial.links, emptyLink)

  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const bypassGuardRef = useRef(false)

  const snapshotOf = (current) =>
    JSON.stringify({
      fields: current.fields,
      skills: withoutIds(current.skills),
      education: withoutIds(current.education),
      projects: withoutIds(current.projects),
      experience: withoutIds(current.experience),
      links: withoutIds(current.links),
    })

  const [startSnapshot] = useState(() => snapshotOf(initial))

  const isDirty =
    snapshotOf({
      fields,
      skills: skills.rows,
      education: education.rows,
      projects: projects.rows,
      experience: experience.rows,
      links: links.rows,
    }) !== startSnapshot

  // Warn before refreshing or closing the tab with unsaved changes
  useEffect(() => {
    if (!isDirty || saveLoading) return undefined

    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty, saveLoading])

  // Esc closes the "unsaved changes" dialog
  useEffect(() => {
    if (!showLeaveDialog) return undefined

    const close = (event) => {
      if (event.key === 'Escape') setShowLeaveDialog(false)
    }

    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [showLeaveDialog])

  // Catch the browser Back button and the phone back gesture while there are
  // unsaved changes: stay on the page and show the same Save / Discard dialog.
  // A spare history entry is added so the first "Back" lands on it instead of
  // leaving the form.
  const guardActive = isDirty && !saveLoading

  useEffect(() => {
    if (!guardActive) return undefined

    if (!window.history.state?.unsavedGuard) {
      window.history.pushState({ unsavedGuard: true }, '')
    }

    const handlePopState = () => {
      if (bypassGuardRef.current) return

      // Put the spare entry back and ask what to do
      window.history.pushState({ unsavedGuard: true }, '')
      setShowLeaveDialog(true)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [guardActive])

  // Leave without saving. If the spare history entry exists, step back over it
  // first so the browser history stays clean.
  const leaveWithoutSaving = () => {
    setShowLeaveDialog(false)
    bypassGuardRef.current = true

    if (window.history.state?.unsavedGuard) {
      const finish = () => {
        window.removeEventListener('popstate', finish)
        onBack({ replace: true })
      }

      window.addEventListener('popstate', finish)
      window.history.go(-1)
    } else {
      onBack({ replace: true })
    }
  }

  const handleBackClick = () => {
    if (isDirty && !saveLoading) {
      setShowLeaveDialog(true)
    } else {
      onBack()
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFields((previous) => ({ ...previous, [name]: value }))
  }

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      gooeyToast.error('Please choose an image file', {
        description: 'JPG, PNG, or WebP images work best.',
      })
      return
    }

    try {
      const resized = await resizeImage(file)
      setFields((previous) => ({ ...previous, profilePicture: resized }))
    } catch (error) {
      console.error('Error processing image:', error)
      gooeyToast.error('Could not use that image', {
        description: 'Please try a different photo.',
      })
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const clean = (value) => String(value ?? '').trim()

    const cleanSkills = skills.rows
      .map((row) => ({ name: clean(row.name), level: Number(row.level) }))
      .filter((row) => row.name)

    const cleanEducation = education.rows
      .map((row) => ({
        school: clean(row.school),
        degree: clean(row.degree),
        years: clean(row.years),
      }))
      .filter((row) => row.school || row.degree || row.years)

    const cleanProjects = projects.rows
      .map((row) => ({
        title: clean(row.title),
        description: clean(row.description),
        link: clean(row.link),
        tools: clean(row.tools),
      }))
      .filter((row) => row.title || row.description || row.link || row.tools)

    const cleanExperience = experience.rows
      .map((row) => ({
        role: clean(row.role),
        company: clean(row.company),
        period: clean(row.period),
        description: clean(row.description),
      }))
      .filter((row) => row.role || row.company || row.period || row.description)

    const cleanLinks = links.rows
      .map((row) => ({ platform: row.platform, url: clean(row.url) }))
      .filter((row) => row.url)

    if (!cleanEducation.some((row) => row.school)) {
      gooeyToast.error('Add at least one school in Education')
      return
    }

    if (cleanSkills.length === 0) {
      gooeyToast.error('Please add at least one skill')
      return
    }

    if (!cleanProjects.some((row) => row.title)) {
      gooeyToast.error('Add a title for at least one project')
      return
    }

    for (const project of cleanProjects) {
      const result = normalizeUrl(project.link)

      if (!result.ok) {
        gooeyToast.error('That project link doesn\'t look right', {
          description: `Check the link for "${project.title || 'your project'}".`,
        })
        return
      }

      project.link = result.url
    }

    for (const link of cleanLinks) {
      const result = normalizeUrl(link.url)

      if (!result.ok) {
        gooeyToast.error('That social link doesn\'t look right', {
          description: `Check your ${link.platform} link.`,
        })
        return
      }

      link.url = result.url
    }

    onContinue({
      ...fields,
      skills: cleanSkills,
      education: cleanEducation,
      projects: cleanProjects,
      experience: cleanExperience,
      socialLinks: cleanLinks,
    })
  }

  return (
    <main className="form-page">
      <button className="text-button" type="button" onClick={handleBackClick}>
        ← Back to dashboard
      </button>

      <div className="form-heading">
        <p className="eyebrow">
          {isEditing ? 'EDIT YOUR PORTFOLIO' : 'YOUR STORY STARTS HERE'}
        </p>
        <h1>
          {isEditing ? 'Update your portfolio.' : "Let's build your portfolio."}
        </h1>
        <p>
          {isEditing
            ? 'Change any details below and save to update your portfolio.'
            : 'Add your details below. You can review your information before choosing a design.'}
        </p>
      </div>

      <form className="portfolio-form" onSubmit={handleSubmit} ref={formRef}>
        <p className="form-required-top">* Required fields</p>

        <h2>Personal information</h2>

        <label>
          Full name *
          <input
            name="fullName"
            type="text"
            value={fields.fullName}
            onChange={handleChange}
            onKeyDown={(e) => {
              // Block digit keys (allow backspace, delete, arrows, etc.)
              if (/^[0-9]$/.test(e.key)) e.preventDefault()
            }}
            placeholder="Enter your full name"
            pattern="[A-Za-zÀ-ÖØ-öø-ÿ .,'\-]+"
            title="Name should only contain letters, spaces, hyphens, or dots"
            required
          />
        </label>

        <label>
          Email address *
          <input
            name="email"
            type="email"
            value={fields.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
        </label>

        <label>
          Phone number <span className="form-optional">(optional)</span>
          <input
            name="phone"
            type="tel"
            value={fields.phone}
            onChange={handleChange}
            placeholder="Your phone number"
          />
        </label>

        <label>
          Address <span className="form-optional">(optional)</span>
          <input
            name="address"
            type="text"
            value={fields.address}
            onChange={handleChange}
            placeholder="Your city or address"
          />
        </label>

        <div className="photo-upload">
          <span className="photo-upload-label">Profile picture</span>

          <div className="photo-upload-row">
            {fields.profilePicture ? (
              <img
                className="photo-upload-preview"
                src={fields.profilePicture}
                alt="Profile preview"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="photo-upload-preview photo-upload-empty">
                {fields.fullName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}

            <div className="photo-upload-actions">
              <label className="secondary-button photo-upload-button">
                {fields.profilePicture ? 'Change photo' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  hidden
                />
              </label>

              {fields.profilePicture && (
                <button
                  className="text-button"
                  type="button"
                  onClick={() =>
                    setFields((previous) => ({ ...previous, profilePicture: '' }))
                  }
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <label>
          About me *
          <textarea
            name="about"
            value={fields.about}
            onChange={handleChange}
            placeholder="Introduce yourself..."
            rows={4}
            required
          />
        </label>

        {/* ---------- Education ---------- */}
        <h2>Education *</h2>

        {education.rows.map((row, index) => (
          <div className="row-card" key={row.id}>
            <div className="row-card-header">
              <span className="row-card-title">School {index + 1}</span>
              <RemoveButton
                onClick={() => education.remove(row.id)}
                label={`Remove school ${index + 1}`}
              />
            </div>

            <label>
              School or university *
              <input
                type="text"
                value={row.school}
                onChange={(event) => education.update(row.id, 'school', event.target.value)}
                placeholder="e.g. Sample University"
              />
            </label>

            <div className="row-grid">
              <label>
                Degree or program <span className="form-optional">(optional)</span>
                <input
                  type="text"
                  value={row.degree}
                  onChange={(event) => education.update(row.id, 'degree', event.target.value)}
                  placeholder="e.g. BS Information Technology"
                />
              </label>

              <label>
                Years <span className="form-optional">(optional)</span>
                <input
                  type="text"
                  value={row.years}
                  onChange={(event) => education.update(row.id, 'years', event.target.value)}
                  placeholder="e.g. 2022 - 2026"
                />
              </label>
            </div>
          </div>
        ))}

        <button
          className="secondary-button add-row"
          type="button"
          onClick={education.add}
        >
          + Add another school
        </button>

        {/* ---------- Skills ---------- */}
        <h2>Skills *</h2>
        <p className="section-hint">
          Add one skill per row and drag the slider to show how confident
          you feel. It appears as a percentage on your portfolio.
        </p>

        {skills.rows.map((row, index) => (
          <div className="skill-row" key={row.id}>
            <input
              type="text"
              value={row.name}
              onChange={(event) => skills.update(row.id, 'name', event.target.value)}
              placeholder={index === 0 ? 'e.g. HTML' : 'Another skill'}
              aria-label={`Skill ${index + 1}`}
            />

            <div className="skill-slider">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={row.level}
                onChange={(event) => skills.update(row.id, 'level', event.target.value)}
                aria-label={`Skill level for skill ${index + 1}`}
                style={{ '--fill': `${row.level}%` }}
              />
              <span className="skill-level-text">
                {row.level}% · {levelLabel(Number(row.level))}
              </span>
            </div>

            <RemoveButton
              onClick={() => skills.remove(row.id)}
              label={`Remove skill ${index + 1}`}
            />
          </div>
        ))}

        <button
          className="secondary-button add-row"
          type="button"
          onClick={skills.add}
        >
          + Add skill
        </button>

        {/* ---------- Projects ---------- */}
        <h2>Projects *</h2>
        <p className="section-hint">
          A link is optional. When you add one, your portfolio shows a
          "View project" button.
        </p>

        {projects.rows.map((row, index) => (
          <div className="row-card" key={row.id}>
            <div className="row-card-header">
              <span className="row-card-title">Project {index + 1}</span>
              <RemoveButton
                onClick={() => projects.remove(row.id)}
                label={`Remove project ${index + 1}`}
              />
            </div>

            <label>
              Project title
              <input
                type="text"
                value={row.title}
                onChange={(event) => projects.update(row.id, 'title', event.target.value)}
                placeholder="e.g. Budget Buddy"
              />
            </label>

            <label>
              What is it and what did you do?
              <textarea
                value={row.description}
                onChange={(event) => projects.update(row.id, 'description', event.target.value)}
                placeholder="A short description of the project and your role"
                rows={3}
              />
            </label>

            <div className="row-grid">
              <label>
                Link (optional)
                <input
                  type="text"
                  inputMode="url"
                  value={row.link}
                  onChange={(event) => projects.update(row.id, 'link', event.target.value)}
                  placeholder="e.g. github.com/you/project"
                />
              </label>

              <label>
                Tools used (optional)
                <input
                  type="text"
                  value={row.tools}
                  onChange={(event) => projects.update(row.id, 'tools', event.target.value)}
                  placeholder="e.g. React, Firebase"
                />
              </label>
            </div>
          </div>
        ))}

        <button
          className="secondary-button add-row"
          type="button"
          onClick={projects.add}
        >
          + Add another project
        </button>

        {/* ---------- Work experience ---------- */}
        <h2>Work experience</h2>

        {experience.rows.map((row, index) => (
          <div className="row-card" key={row.id}>
            <div className="row-card-header">
              <span className="row-card-title">Experience {index + 1}</span>
              <RemoveButton
                onClick={() => experience.remove(row.id)}
                label={`Remove experience ${index + 1}`}
              />
            </div>

            <div className="row-grid">
              <label>
                Role *
                <input
                  type="text"
                  value={row.role}
                  onChange={(event) => experience.update(row.id, 'role', event.target.value)}
                  placeholder="e.g. Web Intern"
                />
              </label>

              <label>
                Company or organization <span className="form-optional">(optional)</span>
                <input
                  type="text"
                  value={row.company}
                  onChange={(event) => experience.update(row.id, 'company', event.target.value)}
                  placeholder="e.g. Sample Studio"
                />
              </label>
            </div>

            <label>
              Period <span className="form-optional">(optional)</span>
              <input
                type="text"
                value={row.period}
                onChange={(event) => experience.update(row.id, 'period', event.target.value)}
                placeholder="e.g. Jun 2025 - Aug 2025"
              />
            </label>

            <label>
              What did you do? (optional)
              <textarea
                value={row.description}
                onChange={(event) => experience.update(row.id, 'description', event.target.value)}
                placeholder="A line or two about your work"
                rows={2}
              />
            </label>
          </div>
        ))}

        <button
          className="secondary-button add-row"
          type="button"
          onClick={experience.add}
        >
          + Add experience
        </button>

        {/* ---------- Social links ---------- */}
        <h2>Social media and links</h2>

        {links.rows.map((row, index) => (
          <div className="link-row" key={row.id}>
            <select
              value={row.platform}
              onChange={(event) => links.update(row.id, 'platform', event.target.value)}
              aria-label={`Platform for link ${index + 1}`}
            >
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>

            <input
              type="text"
              inputMode="url"
              value={row.url}
              onChange={(event) => links.update(row.id, 'url', event.target.value)}
              placeholder="Paste the link, e.g. github.com/you"
              aria-label={`Link ${index + 1}`}
            />

            <RemoveButton
              onClick={() => links.remove(row.id)}
              label={`Remove link ${index + 1}`}
            />
          </div>
        ))}

        <button
          className="secondary-button add-row"
          type="button"
          onClick={links.add}
        >
          + Add link
        </button>

        {saveMessage && (
          <p className="auth-error" role="alert">
            {saveMessage}
          </p>
        )}

        <button
          className="primary-button form-submit"
          type="submit"
          disabled={saveLoading}
        >
          {saveLoading
            ? 'Saving portfolio...'
            : isEditing
              ? 'Save changes ↗'
              : 'Save and continue to templates ↗'}
        </button>
      </form>

      {showLeaveDialog && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setShowLeaveDialog(false)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="leave-title">Save your changes?</h2>
            <p>
              You have changes that aren't saved yet. If you leave now,
              they will be lost.
            </p>

            <div className="modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowLeaveDialog(false)}
              >
                Keep editing
              </button>

              <button
                className="danger-button"
                type="button"
                onClick={leaveWithoutSaving}
              >
                Discard
              </button>

              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setShowLeaveDialog(false)
                  formRef.current?.requestSubmit()
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default PortfolioForm
