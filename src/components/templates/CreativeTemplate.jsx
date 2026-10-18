import { useState } from 'react'
import {
  getSkills,
  getProjects,
  getExperience,
  getEducation,
  getLinks,
  initialOf,
} from './portfolioHelpers'

// Template 3 - Creative (neobrutalism): thick outlines, hard shadows, flat color.
// Content lives behind chunky tabs, one panel at a time.
const colors = ['mint', 'butter', 'peach', 'lime']

function CreativeTemplate({ data }) {
  const skills = getSkills(data.skills)
  const projects = getProjects(data.projects)
  const experience = getExperience(data.experience)
  const education = getEducation(data.education)
  const links = getLinks(data.socialLinks)

  const hasContact = Boolean(
    data.email || data.phone || data.address || links.length > 0
  )

  const tabs = [
    projects.length > 0 && { id: 'work', label: 'Work' },
    (data.about || experience.length > 0 || education.length > 0) && {
      id: 'story',
      label: 'Story',
    },
    skills.length > 0 && { id: 'skills', label: 'Skills' },
    hasContact && { id: 'contact', label: 'Contact' },
  ].filter(Boolean)

  const [activeTab, setActiveTab] = useState(tabs[0]?.id)
  const current = tabs.find((tab) => tab.id === activeTab)?.id || tabs[0]?.id

  const renderEntries = (items) => (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          {item.title && <strong>{item.title}</strong>}
          {item.meta && <em className="c-meta">{item.meta}</em>}
          {item.body && <span>{item.body}</span>}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="tpl-creative">
      <header className="c-hero">
        <div className="c-hero-text">
          <p className="c-hello">Hey, I'm</p>
          <h1>{data.fullName || 'Your Name'}</h1>
        </div>

        {data.profilePicture ? (
          <img
            className="c-photo"
            src={data.profilePicture}
            alt={`${data.fullName}'s profile`}
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="c-photo c-photo-empty">{initialOf(data.fullName)}</div>
        )}
      </header>

      {tabs.length > 0 && (
        <div className="c-tablist" role="tablist" aria-label="Portfolio sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`c-tab-${tab.id}`}
              aria-selected={current === tab.id}
              aria-controls={`c-panel-${tab.id}`}
              className={current === tab.id ? 'is-active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div
        className="c-panel"
        role="tabpanel"
        id={`c-panel-${current}`}
        aria-labelledby={`c-tab-${current}`}
      >
        {current === 'work' && (
          <div className="c-grid">
            {projects.map((item, index) => (
              <article
                className={`c-card c-${colors[index % colors.length]}`}
                key={index}
              >
                {item.title && <h3>{item.title}</h3>}
                {item.body && <p>{item.body}</p>}

                {item.tools.length > 0 && (
                  <ul className="c-tools">
                    {item.tools.map((tool, toolIndex) => (
                      <li key={toolIndex}>{tool}</li>
                    ))}
                  </ul>
                )}

                {item.link && (
                  <a
                    className="c-button"
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View project ↗
                  </a>
                )}
              </article>
            ))}
          </div>
        )}

        {current === 'story' && (
          <div className="c-story">
            {data.about && (
              <section className="c-card c-mint c-about">
                <h2>About me</h2>
                <p>{data.about}</p>
              </section>
            )}

            {experience.length > 0 && (
              <section className="c-card c-butter">
                <h2>Experience</h2>
                {renderEntries(experience)}
              </section>
            )}

            {education.length > 0 && (
              <section className="c-card c-peach">
                <h2>Education</h2>
                {renderEntries(education)}
              </section>
            )}
          </div>
        )}

        {current === 'skills' && (
          <div className="c-skills">
            <ul className="c-bars">
              {skills
                .filter((skill) => skill.level !== null)
                .map((skill, index) => (
                  <li key={index}>
                    <div className="c-bar-label">
                      <strong>{skill.name}</strong>
                      <span>{skill.level}%</span>
                    </div>
                    <div
                      className="c-bar"
                      role="img"
                      aria-label={`${skill.name} ${skill.level} percent`}
                    >
                      <span
                        className={`c-${colors[index % colors.length]}`}
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </li>
                ))}
            </ul>

            <ul className="c-stickers">
              {skills
                .filter((skill) => skill.level === null)
                .map((skill, index) => (
                  <li className={`c-${colors[index % colors.length]}`} key={index}>
                    {skill.name}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {current === 'contact' && (
          <div className="c-contact">
            {data.email && (
              <a className="c-big-link c-lime" href={`mailto:${data.email}`}>
                {data.email}
              </a>
            )}
            {data.phone && <p className="c-big-link c-butter">{data.phone}</p>}
            {data.address && <p className="c-big-link c-peach">{data.address}</p>}
            {links.map((link, index) => (
              <a
                key={index}
                className={`c-big-link c-${colors[index % colors.length]}`}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CreativeTemplate
