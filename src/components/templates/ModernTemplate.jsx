import { useState } from 'react'
import {
  getSkills,
  getProjects,
  getExperience,
  getEducation,
  getLinks,
  initialOf,
} from './portfolioHelpers'

// Template 2 - Modern 3D: a bento grid of layered, glassy tiles.
// Colors come from the app theme, so it blends with the page background.
function ModernTemplate({ data }) {
  const skills = getSkills(data.skills)
  const projects = getProjects(data.projects)
  const experience = getExperience(data.experience)
  const education = getEducation(data.education)
  const links = getLinks(data.socialLinks)

  const barSkills = skills.filter((skill) => skill.level !== null)
  const listSkills = skills.filter((skill) => skill.level === null)

  const tabs = [
    experience.length > 0 && { id: 'experience', label: 'Experience', items: experience },
    education.length > 0 && { id: 'education', label: 'Education', items: education },
  ].filter(Boolean)

  const [activeTab, setActiveTab] = useState(tabs[0]?.id)
  const current = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  return (
    <div className="tpl-modern">
      <div className="m-bento">
        <section className="m-tile m-profile">
          {data.profilePicture ? (
            <img
              className="m-photo"
              src={data.profilePicture}
              alt={`${data.fullName}'s profile`}
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="m-photo m-photo-empty">{initialOf(data.fullName)}</div>
          )}
          <h1>{data.fullName || 'Your Name'}</h1>
        </section>

        {data.about && (
          <section className="m-tile m-about">
            <h2>About me</h2>
            <p>{data.about}</p>
          </section>
        )}

        {skills.length > 0 && (
          <section className="m-tile m-skills">
            <h2>Skills</h2>

            {barSkills.length > 0 && (
              <ul className="m-bars">
                {barSkills.map((skill, index) => (
                  <li key={index}>
                    <div className="m-bar-label">
                      <span>{skill.name}</span>
                      <span>{skill.level}%</span>
                    </div>
                    <div
                      className="m-bar"
                      role="img"
                      aria-label={`${skill.name} ${skill.level} percent`}
                    >
                      <span style={{ width: `${skill.level}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {listSkills.length > 0 && (
              <ul className="m-bullets">
                {listSkills.map((skill, index) => (
                  <li key={index}>{skill.name}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {(data.email || data.phone || data.address || links.length > 0) && (
          <section className="m-tile m-contact">
            <h2>Contact</h2>
            <ul>
              {data.email && (
                <li>
                  <a href={`mailto:${data.email}`}>{data.email}</a>
                </li>
              )}
              {data.phone && <li>{data.phone}</li>}
              {data.address && <li>{data.address}</li>}
              {links.map((link, index) => (
                <li key={`link-${index}`}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {projects.map((item, index) => (
          <article
            className={`m-tile m-project${index % 5 === 0 ? ' m-project-wide' : ''}`}
            key={index}
          >
            <span className="m-project-number">
              {String(index + 1).padStart(2, '0')}
            </span>

            {item.title && <h3>{item.title}</h3>}
            {item.body && <p>{item.body}</p>}

            {item.tools.length > 0 && (
              <ul className="m-tools">
                {item.tools.map((tool, toolIndex) => (
                  <li key={toolIndex}>{tool}</li>
                ))}
              </ul>
            )}

            {item.link && (
              <a
                className="m-project-link"
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                View project ↗
              </a>
            )}
          </article>
        ))}

        {current && (
          <section className="m-tile m-tabs">
            <div className="m-tablist" role="tablist" aria-label="Background">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`m-tab-${tab.id}`}
                  aria-selected={current.id === tab.id}
                  aria-controls={`m-panel-${tab.id}`}
                  className={current.id === tab.id ? 'is-active' : ''}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <ul
              className="m-entries"
              role="tabpanel"
              id={`m-panel-${current.id}`}
              aria-labelledby={`m-tab-${current.id}`}
            >
              {current.items.map((item, index) => (
                <li key={index}>
                  {item.title && <strong>{item.title}</strong>}
                  {item.meta && <em className="m-meta">{item.meta}</em>}
                  {item.body && <span>{item.body}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

export default ModernTemplate
