import {
  getSkills,
  getProjects,
  getExperience,
  getEducation,
  getLinks,
  initialOf,
} from './portfolioHelpers'

// Template 1 - Simple: calm, warm, and easy to read.
// A friendly greeting at the top, then quiet sections on soft paper.
function SimpleTemplate({ data }) {
  const skills = getSkills(data.skills)
  const projects = getProjects(data.projects)
  const experience = getExperience(data.experience)
  const education = getEducation(data.education)
  const links = getLinks(data.socialLinks)

  const renderEntries = (items) => (
    <ul className="s-list">
      {items.map((item, index) => (
        <li key={index}>
          {item.title && <strong>{item.title}</strong>}
          {item.meta && <em className="s-meta">{item.meta}</em>}
          {item.body && <span>{item.body}</span>}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="tpl-simple">
      <header className="s-hero">
        {data.profilePicture ? (
          <img
            className="s-photo"
            src={data.profilePicture}
            alt={`${data.fullName}'s profile`}
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="s-photo s-photo-empty">{initialOf(data.fullName)}</div>
        )}

        <div className="s-hero-text">
          <p className="s-hello">Hello, I'm</p>
          <h1>{data.fullName || 'Your Name'}</h1>
          {data.about && <p className="s-lead">{data.about}</p>}

          <ul className="s-contact">
            {data.email && (
              <li>
                <a href={`mailto:${data.email}`}>{data.email}</a>
              </li>
            )}
            {data.phone && <li>{data.phone}</li>}
            {data.address && <li>{data.address}</li>}
          </ul>
        </div>
      </header>

      {projects.length > 0 && (
        <section className="s-section">
          <h2>Things I've worked on</h2>
          <ul className="s-projects">
            {projects.map((item, index) => (
              <li key={index}>
                {item.title && <h3>{item.title}</h3>}
                {item.body && <p>{item.body}</p>}

                {item.tools.length > 0 && (
                  <ul className="s-tools">
                    {item.tools.map((tool, toolIndex) => (
                      <li key={toolIndex}>{tool}</li>
                    ))}
                  </ul>
                )}

                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    View project ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {skills.length > 0 && (
        <section className="s-section">
          <h2>What I'm good at</h2>
          <ul className="s-tags">
            {skills.map((skill, index) => (
              <li key={index}>
                {skill.name}
                {skill.level !== null && <small>{skill.level}%</small>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(experience.length > 0 || education.length > 0) && (
        <section className="s-section s-columns">
          {experience.length > 0 && (
            <div>
              <h2>Experience</h2>
              {renderEntries(experience)}
            </div>
          )}

          {education.length > 0 && (
            <div>
              <h2>Education</h2>
              {renderEntries(education)}
            </div>
          )}
        </section>
      )}

      {links.length > 0 && (
        <section className="s-section s-links">
          <h2>Find me online</h2>
          <p>
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </p>
        </section>
      )}
    </div>
  )
}

export default SimpleTemplate
