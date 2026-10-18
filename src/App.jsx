import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import PortfolioForm from './components/PortfolioForm'
import { auth, db } from './firebase'
import { GooeyToaster, gooeyToast } from 'goey-toast'
import 'goey-toast/styles.css'
import SimpleTemplate from './components/templates/SimpleTemplate'
import ModernTemplate from './components/templates/ModernTemplate'
import CreativeTemplate from './components/templates/CreativeTemplate'
import './components/templates/templates.css'
import './ui-updates.css'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

const templates = [
  {
    id: 'simple',
    name: 'Simple',
    description: 'Warm, calm, and easy to read.',
    tagline: 'Warm, calm, and easy to read.',
  },
  {
    id: 'modern',
    name: 'Modern 3D',
    description: 'A bento grid of layered tiles with skill bars and tabs.',
    tagline: 'Bento tiles with a layered 3D feel.',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Neobrutalist panels, chunky tabs, and bold color.',
    tagline: 'Bold neobrutalist panels and tabs.',
  },
]

// Small preview graphic for each template card
function TemplatePreview({ id }) {
  if (id === 'simple') {
    return (
      <div className="template-preview simple-preview">
        <span className="preview-number">01 / SIMPLE</span>
        <div className="simple-lines">
          <div className="mini-avatar" />
          <div className="mini-heading" />
          <div className="mini-line" />
          <div className="mini-line short" />
          <div className="mini-blocks">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    )
  }

  if (id === 'modern') {
    return (
      <div className="template-preview modern-preview">
        <span className="preview-number">02 / MODERN 3D</span>
        <div className="modern-mini">
          <div className="modern-mini-label">PORTFOLIO / 2026</div>
          <div className="modern-mini-title">
            Creative
            <br />
            <span>by nature.</span>
          </div>
          <div className="modern-mini-bottom">
            <span>SELECTED WORK</span>
            <span>↗</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="template-preview creative-preview">
      <span className="preview-number">03 / CREATIVE</span>
      <div className="creative-shape shape-one" />
      <div className="creative-shape shape-two" />
      <div className="creative-mini-title">
        THINK
        <br />
        <span>DIFFERENT.</span>
      </div>
      <span className="creative-star">✳</span>
      <span className="creative-caption">IDEAS IN PROGRESS ↗</span>
    </div>
  )
}

// Example content used for the template previews on the landing page
const sampleData = {
  fullName: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  phone: '+63 912 345 6789',
  address: 'Cebu City, Philippines',
  profilePicture: '',
  about:
    'I am an aspiring web developer who enjoys turning ideas into clean, friendly websites. I like learning new tools and building things people actually use.',
  education: [
    {
      school: 'Sample University',
      degree: 'BS Information Technology',
      years: '2022 - 2026',
    },
    {
      school: 'Web Development Bootcamp',
      degree: 'Certificate',
      years: '2025',
    },
  ],
  skills: [
    { name: 'HTML', level: 90 },
    { name: 'CSS', level: 85 },
    { name: 'JavaScript', level: 75 },
    { name: 'React', level: 70 },
    { name: 'Teamwork', level: 95 },
  ],
  projects: [
    {
      title: 'Budget Buddy',
      description: 'A simple app that helps students track daily spending.',
      link: 'https://example.com',
      tools: 'React, Firebase',
    },
    {
      title: 'Campus Events',
      description: 'A website listing school events with a calendar view.',
      link: '',
      tools: 'HTML, CSS, JavaScript',
    },
    {
      title: 'Recipe Box',
      description: 'A small recipe collection with search and favorites.',
      link: 'https://example.com',
      tools: 'React',
    },
  ],
  experience: [
    {
      role: 'Web Intern',
      company: 'Sample Studio',
      period: 'Jun - Aug 2025',
      description: 'Built landing pages and fixed layout issues.',
    },
    {
      role: 'Student Assistant',
      company: 'IT Office',
      period: '2024 - 2025',
      description: 'Helped classmates with lab computers.',
    },
  ],
  socialLinks: [
    { platform: 'GitHub', url: 'github.com/example' },
    { platform: 'LinkedIn', url: 'linkedin.com/in/example' },
  ],
}

function TemplateView({ id, data }) {
  if (id === 'modern') return <ModernTemplate data={data} />
  if (id === 'creative') return <CreativeTemplate data={data} />
  return <SimpleTemplate data={data} />
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const formatDate = (timestamp) =>
  timestamp?.seconds
    ? new Date(timestamp.seconds * 1000).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

function HomeIconButton({ onClick }) {
  return (
    <button
      className="icon-button"
      type="button"
      onClick={onClick}
      aria-label="Go to dashboard"
      title="Dashboard"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 11.5L12 4l9 7.5" />
        <path d="M5.5 10v9.5h13V10" />
        <path d="M10 19.5v-5h4v5" />
      </svg>
    </button>
  )
}

function DashboardSkeleton() {
  return (
    <div
      className="dashboard-grid"
      aria-busy="true"
      aria-label="Loading your portfolios"
    >
      {[0, 1, 2].map((item) => (
        <div className="dashboard-card skeleton-card" key={item}>
          <div className="skeleton skeleton-banner" />
          <div className="skeleton skeleton-line w60" />
          <div className="skeleton skeleton-line w40" />
          <div className="skeleton skeleton-line w80" />
        </div>
      ))}
    </div>
  )
}

function GeneratingScreen({ progress, templateName }) {
  let status = 'Saving your information...'
  if (progress >= 100) status = 'Done! Opening your portfolio...'
  else if (progress >= 85) status = 'Almost done...'
  else if (progress >= 55) status = 'Arranging your sections...'
  else if (progress >= 25) status = `Applying the ${templateName} template...`

  return (
    <main className="generating-screen" role="status" aria-live="polite">
      <div className="generating-card">
        <div className="generating-spinner" aria-hidden="true" />
        <h1>Generating your portfolio</h1>
        <p className="generating-status">{status}</p>

        <div
          className="generating-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>

        <p className="generating-percent">{progress}%</p>
      </div>
    </main>
  )
}

// Portfolios saved before the rename used the id 'warm'
const normalizeTemplateId = (id) => (id === 'warm' ? 'simple' : id)

// Page addresses:
//   /                        landing page (logged out)
//   /dashboard               manage portfolios
//   /portfolio/new           create form
//   /portfolio/:id/edit      edit form
//   /portfolio/:id/templates choose a template
//   /portfolio/:id           preview
function parseRoute(pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/'

  if (clean === '/') return { page: 'home', id: null }
  if (clean === '/dashboard') return { page: 'dashboard', id: null }
  if (clean === '/portfolio/new') return { page: 'form', id: null }

  let match = clean.match(/^\/portfolio\/([^/]+)\/edit$/)
  if (match) return { page: 'form', id: match[1] }

  match = clean.match(/^\/portfolio\/([^/]+)\/templates$/)
  if (match) return { page: 'templates', id: match[1] }

  match = clean.match(/^\/portfolio\/([^/]+)$/)
  if (match) return { page: 'preview', id: match[1] }

  return { page: 'notfound', id: null }
}

function AppContent() {
  const [darkMode, setDarkMode] = useState(true)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const route = parseRoute(pathname)
  const currentPage = route.page
  const deletedIdRef = useRef(null)
  const [authMode, setAuthMode] = useState('login')
  const [portfolioData, setPortfolioData] = useState(null)
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [templateLoading, setTemplateLoading] = useState(false)
  const [templateMessage, setTemplateMessage] = useState('')
  const [portfolios, setPortfolios] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardMessage, setDashboardMessage] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [generating, setGenerating] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)

  // Landing page template preview: Esc closes it and the page behind stays put
  useEffect(() => {
    if (!previewTemplate) return undefined

    const handleKey = (event) => {
      if (event.key === 'Escape') setPreviewTemplate(null)
    }

    const previousOverflow = document.body.style.overflow
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [previewTemplate])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // READ: load every portfolio that belongs to the logged-in user
  const loadPortfolios = async (uid) => {
    const startedAt = Date.now()
    setDashboardLoading(true)
    setDashboardMessage('')

    try {
      const q = query(
        collection(db, 'portfolios'),
        where('userId', '==', uid)
      )
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

      list.sort(
        (a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)
      )

      setPortfolios(list)
    } catch (error) {
      console.error('Error loading portfolios:', error)
      setDashboardMessage(
        'Unable to load your portfolios. Check your connection and refresh.'
      )
    } finally {
      // Keep the skeleton visible for a moment so it doesn't flash
      const elapsed = Date.now() - startedAt
      if (elapsed < 700) await wait(700 - elapsed)
      setDashboardLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthReady(true)

      if (currentUser) {
        loadPortfolios(currentUser.uid)
      } else {
        setPortfolios([])
        setPortfolioData(null)
      }
    })

    return unsubscribe
  }, [])

  // Send people to the right place: logged-out visitors can only see the
  // landing page, and logged-in users skip it.
  useEffect(() => {
    if (!authReady) return

    if (!user && route.page !== 'home' && route.page !== 'notfound') {
      navigate('/', { replace: true })
    } else if (user && route.page === 'home') {
      navigate('/dashboard', { replace: true })
    }
  }, [authReady, user, route.page])

  // Always start at the top of a new page
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Opening or refreshing /portfolio/:id loads that portfolio from the database
  useEffect(() => {
    if (!user || !route.id) return undefined
    if (portfolioData?.id === route.id) return undefined
    if (deletedIdRef.current === route.id) return undefined

    let cancelled = false

    getDoc(doc(db, 'portfolios', route.id))
      .then((snapshot) => {
        if (cancelled) return

        if (!snapshot.exists() || snapshot.data().userId !== user.uid) {
          gooeyToast.error('Portfolio not found', {
            description: 'It may have been deleted.',
          })
          navigate('/dashboard', { replace: true })
          return
        }

        setPortfolioData({ id: snapshot.id, ...snapshot.data() })
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Error loading portfolio:', error)
        gooeyToast.error('Could not open that portfolio')
        navigate('/dashboard', { replace: true })
      })

    return () => {
      cancelled = true
    }
  }, [user, route.id, portfolioData?.id])

  // CREATE or UPDATE
  const handleFormContinue = async (formData) => {
    if (!user) {
      setSaveMessage('Please log in before saving your portfolio.')
      return
    }

    setSaveLoading(true)
    setSaveMessage('')

    try {
      let savedId = route.id

      if (route.id) {
        // Editing an existing portfolio: update it, do not create a new one
        await updateDoc(doc(db, 'portfolios', route.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        })

        setPortfolioData((previous) => ({ ...previous, ...formData }))
      } else {
        // New portfolio
        const portfolioRef = await addDoc(collection(db, 'portfolios'), {
          ...formData,
          userId: user.uid,
          selectedTemplate: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        savedId = portfolioRef.id

        setPortfolioData({
          ...formData,
          id: portfolioRef.id,
          userId: user.uid,
          selectedTemplate: '',
        })
      }

      gooeyToast.success(
        route.id ? 'Portfolio updated' : 'Portfolio saved',
        { description: 'Your portfolio details are saved.' }
      )

      loadPortfolios(user.uid)

      // If a template was already chosen, go straight back to the preview
      const hasTemplate = Boolean(route.id && portfolioData?.selectedTemplate)
      navigate(
        hasTemplate ? `/portfolio/${savedId}` : `/portfolio/${savedId}/templates`,
        // If the form added a spare history entry, replace it so Back stays tidy
        { replace: Boolean(window.history.state?.unsavedGuard) }
      )
    } catch (error) {
      console.error('Error saving portfolio:', error)
      setSaveMessage('Unable to save your portfolio. Please try again.')
      gooeyToast.error('Could not save your portfolio', {
        description: 'Check your connection and try again.',
      })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleSelectTemplate = async (templateId) => {
    if (!portfolioData?.id || !user) {
      setTemplateMessage(
        'Your portfolio could not be found. Please complete the form again.'
      )
      return
    }

    const templateName =
      templates.find((template) => template.id === templateId)?.name || ''

    setTemplateLoading(true)
    setTemplateMessage('')
    setGenerating({ progress: 0, templateName })
    scrollToTop()

    // The bar eases toward 90% while the save runs, then finishes at 100%
    let progress = 0
    const timer = setInterval(() => {
      progress = Math.min(progress + (progress < 55 ? 5 : progress < 85 ? 2 : 1), 90)
      setGenerating({ progress, templateName })
    }, 110)

    try {
      await Promise.all([
        updateDoc(doc(db, 'portfolios', portfolioData.id), {
          selectedTemplate: templateId,
          updatedAt: serverTimestamp(),
        }),
        wait(2200),
      ])

      clearInterval(timer)
      setGenerating({ progress: 100, templateName })
      await wait(500)

      setPortfolioData((previous) => ({
        ...previous,
        selectedTemplate: templateId,
      }))

      loadPortfolios(user.uid)
      setGenerating(null)
      navigate(`/portfolio/${portfolioData.id}`)
      scrollToTop()

      gooeyToast.success('Portfolio generated', {
        description: 'Your portfolio is ready to view.',
      })
    } catch (error) {
      clearInterval(timer)
      setGenerating(null)
      console.error('Error saving selected template:', error)
      setTemplateMessage(
        'Unable to save your template choice. Please try again.'
      )
      gooeyToast.error('Could not save your template choice')
    } finally {
      setTemplateLoading(false)
    }
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthMessage('')
    setAuthLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email').trim()
    const password = formData.get('password')
    const fullName = formData.get('fullName')?.trim()

    try {
      if (authMode === 'reset') {
        await sendPasswordResetEmail(auth, email)

        gooeyToast.success('Check your email', {
          description:
            'If an account exists for that address, a reset link is on its way.',
        })

        setAuthMode('login')
        return
      }

      if (authMode === 'register') {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        )

        if (fullName) {
          await updateProfile(result.user, {
            displayName: fullName,
          })
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }

      gooeyToast.success(
        authMode === 'register' ? 'Account created' : 'Welcome back'
      )
      navigate('/dashboard')
      scrollToTop()
    } catch (error) {
      const messages = {
        'auth/email-already-in-use':
          'This email already has an account. Please log in instead.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password':
          'Your password is too weak. Use at least 6 characters.',
        'auth/invalid-credential':
          'Incorrect email or password. Please check your details.',
        'auth/too-many-requests':
          'Too many attempts. Please try again later.',
        'auth/network-request-failed':
          'Network error. Check your internet connection.',
      }

      const message =
        messages[error.code] || 'Something went wrong. Please try again.'

      setAuthMessage(message)
      gooeyToast.error(
        authMode === 'reset' ? 'Could not send the email' : 'Could not sign you in',
        { description: message }
      )
    } finally {
      setAuthLoading(false)
    }
  }

  const switchAuthMode = (mode) => {
    setAuthMode(mode)
    setAuthMessage('')
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      gooeyToast.info('Logged out', { description: 'See you next time!' })
      scrollToTop()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Dashboard actions
  const handleCreateNew = () => {
    setPortfolioData(null)
    setSaveMessage('')
    navigate('/portfolio/new')
  }

  const handleViewPortfolio = (portfolio) => {
    setPortfolioData(portfolio)
    setTemplateMessage('')
    navigate(
      portfolio.selectedTemplate
        ? `/portfolio/${portfolio.id}`
        : `/portfolio/${portfolio.id}/templates`
    )
  }

  const handleEditFromDashboard = (portfolio) => {
    setPortfolioData(portfolio)
    setSaveMessage('')
    navigate(`/portfolio/${portfolio.id}/edit`)
  }

  // DELETE: step 1 opens the confirmation modal, step 2 deletes
  const handleDeletePortfolio = (portfolio) => {
    setDeleteTarget(portfolio)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setDeleteLoading(true)

    try {
      deletedIdRef.current = deleteTarget.id
      await deleteDoc(doc(db, 'portfolios', deleteTarget.id))

      setPortfolios((previous) =>
        previous.filter((item) => item.id !== deleteTarget.id)
      )

      if (portfolioData?.id === deleteTarget.id) {
        setPortfolioData(null)
      }

      gooeyToast.success('Portfolio deleted', {
        description: `${deleteTarget.fullName || 'The portfolio'} was removed.`,
      })

      setDeleteTarget(null)

      if (currentPage !== 'dashboard') {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error)
      gooeyToast.error('Could not delete the portfolio', {
        description: 'Please try again.',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleEditPortfolio = () => {
    setSaveMessage('')
    navigate(`/portfolio/${portfolioData?.id || route.id}/edit`)
  }

  const goToDashboard = (options) => {
    if (user) loadPortfolios(user.uid)
    navigate('/dashboard', options?.replace === true ? { replace: true } : undefined)
  }

  const goToAccountPanel = (mode) => {
    setAuthMode(mode)
    document.getElementById('account-panel')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  const renderTemplate = () => {
    if (!portfolioData) return null

    if (portfolioData.selectedTemplate === 'modern') {
      return <ModernTemplate data={portfolioData} />
    }

    if (portfolioData.selectedTemplate === 'creative') {
      return <CreativeTemplate data={portfolioData} />
    }

    return <SimpleTemplate data={portfolioData} />
  }

  const appClass = darkMode ? 'app dark-mode' : 'app light-mode'

  const deleteModal = deleteTarget && (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={() => !deleteLoading && setDeleteTarget(null)}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-title">Delete this portfolio?</h2>
        <p>
          The portfolio for{' '}
          <strong>{deleteTarget.fullName || 'this person'}</strong> will be
          permanently deleted. This cannot be undone.
        </p>
        <div className="modal-actions">
          <button
            className="secondary-button"
            type="button"
            disabled={deleteLoading}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </button>
          <button
            className="danger-button"
            type="button"
            disabled={deleteLoading}
            onClick={confirmDelete}
          >
            {deleteLoading ? 'Deleting...' : 'Delete portfolio'}
          </button>
        </div>
      </div>
    </div>
  )

  // Wait for Firebase to tell us if someone is logged in (avoids a flash of the home page)
  if (!authReady) {
    return (
      <div className={appClass}>
        <main className="dashboard-page">
          <div className="skeleton skeleton-hero" />
          <DashboardSkeleton />
        </main>
      </div>
    )
  }

  if (currentPage === 'notfound') {
    return (
      <div className={appClass}>
        <main className="dashboard-page not-found">
          <p className="eyebrow">ERROR 404</p>
          <h1>We couldn't find that page.</h1>
          <p>The link may be old, or the page may have moved.</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => navigate(user ? '/dashboard' : '/')}
          >
            {user ? 'Go to dashboard' : 'Back to home'}
          </button>
        </main>
      </div>
    )
  }

  // Waiting for a redirect, or for a portfolio to load from the database
  const needsPortfolio =
    ['form', 'templates', 'preview'].includes(currentPage) && route.id
  const portfolioReady = !route.id || portfolioData?.id === route.id

  if (
    !generating &&
    user &&
    (currentPage === 'home' || (needsPortfolio && !portfolioReady))
  ) {
    return (
      <div className={appClass}>
        <main className="dashboard-page">
          <div className="skeleton skeleton-hero" />
          <DashboardSkeleton />
        </main>
      </div>
    )
  }

  if (generating) {
    return (
      <div className={appClass}>
        <GeneratingScreen
          progress={generating.progress}
          templateName={generating.templateName}
        />
      </div>
    )
  }

  if (currentPage === 'dashboard' && user) {
    const withTemplate = portfolios.filter((item) => item.selectedTemplate).length

    return (
      <div className={appClass}>
        <header className="navbar">
          <span className="logo">
            Porta<span>Vista</span>
          </span>

          <div className="nav-actions">
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? '☀ Light' : '☾ Dark'}
            </button>

            <button
              className="secondary-button"
              type="button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </header>

        <main className="dashboard-page">
          <section className="dash-hero">
            <div className="dash-hero-text">
              <p className="eyebrow">
                <span className="status-dot" />
                DASHBOARD
              </p>
              <h1>Welcome back, {user.displayName || user.email}</h1>
              <p>
                Create a new portfolio, or pick up where you left off.
              </p>
            </div>

            <button
              className="primary-button"
              type="button"
              onClick={handleCreateNew}
            >
              + Create portfolio
            </button>
          </section>

          <div className="dashboard-stats">
            <div className="stat-card">
              <span className="stat-icon">✳</span>
              <div>
                <strong>{portfolios.length}</strong>
                <span>Portfolios</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">◇</span>
              <div>
                <strong>{withTemplate}</strong>
                <span>With a template</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">↗</span>
              <div>
                <strong className="stat-date">
                  {formatDate(portfolios[0]?.updatedAt)}
                </strong>
                <span>Last updated</span>
              </div>
            </div>
          </div>

          <div className="dash-section-heading">
            <h2>Your portfolios</h2>
            {!dashboardLoading && portfolios.length > 0 && (
              <span>{portfolios.length} total</span>
            )}
          </div>

          {dashboardMessage && (
            <p className="auth-error" role="alert">
              {dashboardMessage}
            </p>
          )}

          {dashboardLoading ? (
            <DashboardSkeleton />
          ) : portfolios.length === 0 ? (
            <div className="empty-state">
              <h2>No portfolios yet</h2>
              <p>Start by creating your first portfolio.</p>
              <button
                className="primary-button"
                type="button"
                onClick={handleCreateNew}
              >
                Create your first portfolio
              </button>
            </div>
          ) : (
            <div className="dashboard-grid">
              {portfolios.map((item) => {
                const templateId = normalizeTemplateId(item.selectedTemplate)
                const templateInfo = templates.find((t) => t.id === templateId)

                return (
                  <article className="dashboard-card" key={item.id}>
                    <div className={`dashboard-banner banner-${templateId || 'none'}`}>
                      <span>{templateInfo?.name || 'No template yet'}</span>
                    </div>

                    <div className="dashboard-card-body">
                      {item.profilePicture ? (
                        <img
                          className="dashboard-avatar"
                          src={item.profilePicture}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="dashboard-avatar">
                          {item.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}

                      <div className="dashboard-card-info">
                        <h3>{item.fullName || 'Untitled portfolio'}</h3>
                        <p>{item.email}</p>
                        <small>Updated {formatDate(item.updatedAt)}</small>
                      </div>
                    </div>

                    <div className="dashboard-card-actions">
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => handleViewPortfolio(item)}
                      >
                        View
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => handleEditFromDashboard(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => handleDeletePortfolio(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          <section className="dash-steps" aria-label="How it works">
            <div>
              <span>1</span>
              <strong>Add your details</strong>
              <p>Fill in your info, skills, and projects.</p>
            </div>
            <div>
              <span>2</span>
              <strong>Pick a style</strong>
              <p>Choose from three different layouts.</p>
            </div>
            <div>
              <span>3</span>
              <strong>Preview and edit</strong>
              <p>Come back anytime to update or delete.</p>
            </div>
          </section>
        </main>

        {deleteModal}
      </div>
    )
  }

  if (currentPage === 'form' && user) {
    return (
      <div className={appClass}>
        <PortfolioForm
          key={route.id || 'new'}
          initialData={route.id ? portfolioData : null}
          onBack={goToDashboard}
          onContinue={handleFormContinue}
          saveLoading={saveLoading}
          saveMessage={saveMessage}
        />
      </div>
    )
  }

  if (currentPage === 'templates' && user) {
    return (
      <div className={appClass}>
        <main className="template-selection-page">
          <div className="page-toolbar">
            <button
              className="text-button"
              type="button"
              onClick={handleEditPortfolio}
            >
              ← Back to form
            </button>

            <HomeIconButton onClick={goToDashboard} />
          </div>

          <div className="template-selection-heading">
            <p className="eyebrow">CHOOSE YOUR STYLE</p>
            <h1>Your story, your design.</h1>
            <p>
              Choose a portfolio layout. Your information will be
              arranged to match the style you select.
            </p>
          </div>

          <div className="template-grid">
            {templates.map((template) => (
              <article className="template-card" key={template.id}>
                <TemplatePreview id={template.id} />

                <div className="template-info">
                  <div>
                    <h3>{template.name}</h3>
                    <p>{template.tagline}</p>
                  </div>
                </div>

                <button
                  className="primary-button template-select-button"
                  type="button"
                  disabled={templateLoading}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  {templateLoading
                    ? 'Please wait...'
                    : `Use ${template.name} ↗`}
                </button>
              </article>
            ))}
          </div>

          {templateMessage && (
            <p className="auth-error" role="alert">
              {templateMessage}
            </p>
          )}
        </main>
      </div>
    )
  }

  if (currentPage === 'preview' && user) {
    const selectedTemplate = templates.find(
      (template) =>
        template.id === normalizeTemplateId(portfolioData?.selectedTemplate)
    )

    const stageClass = `stage-${
      normalizeTemplateId(portfolioData?.selectedTemplate) || 'simple'
    }`

    return (
      <div className={`${appClass} ${stageClass}`}>
        <main className="generated-page">
          <div className="generated-toolbar">
            <button
              className="text-button"
              type="button"
              onClick={() => navigate(`/portfolio/${route.id}/templates`)}
            >
              ← Change template
            </button>

            <HomeIconButton onClick={goToDashboard} />
          </div>

          <div className="generated-heading">
            <p className="eyebrow">YOUR PORTFOLIO PREVIEW</p>
            <h1>{selectedTemplate?.name || 'Your Portfolio'}</h1>
            <p>This is how your information looks in the selected layout.</p>
          </div>

          <div className="template-frame">{renderTemplate()}</div>

          <div className="generated-actions">
            <button
              className="primary-button"
              type="button"
              onClick={handleEditPortfolio}
            >
              Edit my information ↗
            </button>

            <button
              className="danger-button"
              type="button"
              onClick={() => handleDeletePortfolio(portfolioData)}
            >
              Delete
            </button>
          </div>

          <p className="template-note">
            Your template choice is saved. You can come back anytime
            to change the design or edit your information.
          </p>
        </main>

        {deleteModal}
      </div>
    )
  }

  // HOME (shown only when logged out)
  return (
    <div className={appClass}>
      <header className="navbar">
        <a href="#home" className="logo" aria-label="PortaVista home">
          Porta<span>Vista</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#templates">Templates</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀ Light' : '☾ Dark'}
          </button>

          <button
            className="nav-button primary-button"
            type="button"
            onClick={() => goToAccountPanel('register')}
          >
            Get Started <span>↗</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <p className="eyebrow">
              <span className="status-dot" />
              YOUR WORK. YOUR STORY.
            </p>

            <h1>
              Your story,
              <br />
              <span>beautifully told.</span>
            </h1>

            <p className="hero-description">
              PortaVista helps you build a personal portfolio without
              starting from scratch. Add your details, choose a design,
              and create a space that showcases your skills, projects,
              and ambitions.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => goToAccountPanel('register')}
              >
                Create your portfolio <span>↗</span>
              </button>

              <a href="#templates" className="text-button">
                Explore templates <span>↓</span>
              </a>
            </div>

            <div className="hero-note">
              <span className="note-line" />
              <p>Your story, your style, your portfolio.</p>
            </div>

            <div className="hero-benefits">
              <div>
                <span className="benefit-symbol">✳</span>
                <span>Easy to personalize</span>
              </div>
              <div>
                <span className="benefit-symbol">◇</span>
                <span>Three unique styles</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="glow-orb one" />
            <div className="glow-orb two" />

            <div className="visual-label">
              A GLIMPSE OF YOUR FUTURE PORTFOLIO
            </div>

            <div className="portfolio-card">
              <div className="card-top">
                <span className="card-dot" />
                <span className="card-dot" />
                <span className="card-dot" />
                <span className="card-label">PERSONAL PORTFOLIO</span>
              </div>

              <div className="card-content">
                <div className="profile-placeholder">Y</div>
                <p className="card-eyebrow">HELLO, I'M</p>
                <h2>
                  Your Name<span>.</span>
                </h2>
                <p className="card-role">
                  Student · Creator · Future Professional
                </p>

                <div className="card-divider" />

                <p className="card-about">
                  I turn ideas into meaningful work and enjoy learning
                  something new with every project.
                </p>

                <div className="skill-list">
                  <span>Design</span>
                  <span>Development</span>
                  <span>Creativity</span>
                </div>

                <div className="card-footer">
                  <span>SELECTED WORK</span>
                  <span>2026 ↗</span>
                </div>
              </div>
            </div>

            <div className="floating-tag">
              <span>✳</span> YOUR NEXT CHAPTER
            </div>
          </div>
        </section>

        <section className="templates-section" id="templates">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FIND YOUR STYLE</p>
              <h2>Three ways to tell your story.</h2>
            </div>
            <p className="section-description">
              Choose a portfolio style that feels like you.
            </p>
          </div>

          <div className="template-grid">
            {templates.map((template) => (
              <article
                className="template-card template-card-clickable"
                key={template.id}
                onClick={() => setPreviewTemplate(template.id)}
              >
                <TemplatePreview id={template.id} />
                <div className="template-info">
                  <div>
                    <h3>{template.name}</h3>
                    <p>{template.tagline}</p>
                  </div>
                  <button
                    className="template-arrow"
                    type="button"
                    aria-label={`Preview the ${template.name} template`}
                    title="Preview"
                  >
                    ↗
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="section-heading">
            <div>
              <p className="eyebrow">WHY PORTAVISTA?</p>
              <h2>A simpler way to show what you can do.</h2>
            </div>
            <p className="section-description">
              Your portfolio should focus on your work, not on
              the difficulty of building a website.
            </p>
          </div>

          <div className="features-grid">
            <article className="feature-card">
              <div className="feature-icon">✳</div>
              <h3>Start with your story</h3>
              <p>
                Enter your background, skills, projects, and goals
                in one organized form.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">◇</div>
              <h3>Choose your style</h3>
              <p>
                Explore different visual styles and find a layout
                that matches your personality.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">↗</div>
              <h3>Showcase your potential</h3>
              <p>
                Organize your work into a portfolio that can help
                introduce you to future opportunities.
              </p>
            </article>
          </div>
        </section>

        <section className="closing-section">
          <p className="eyebrow">YOUR STORY STARTS HERE</p>
          <h2>
            Good work deserves
            <br />
            a place to be seen.
          </h2>
          <button
            className="primary-button"
            type="button"
            onClick={() => goToAccountPanel('register')}
          >
            Get started with PortaVista <span>↗</span>
          </button>
        </section>

        <section className="account-section" id="account-panel">
          <div className="account-intro">
            <p className="eyebrow">YOUR NEXT CHAPTER</p>
            <h2>
              Ready to make
              <br />
              your mark?
            </h2>
            <p>
              Create an account to get started on your personal
              portfolio journey.
            </p>
            <div className="account-points">
              <span>✓ A place for your skills and projects</span>
              <span>✓ Portfolio styles to explore</span>
              <span>✓ A simple starting point for your story</span>
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-brand">
              <span className="auth-brand-mark">P</span>
              <span>PortaVista</span>
            </div>

            <div className="auth-heading">
              <h2>
                {authMode === 'login'
                  ? 'Welcome back'
                  : authMode === 'reset'
                    ? 'Reset your password'
                    : 'Create your account'}
              </h2>
              <p>
                {authMode === 'login'
                  ? 'Sign in to continue your portfolio journey.'
                  : authMode === 'reset'
                    ? "Enter your email and we'll send you a link to choose a new password."
                    : 'Start building a portfolio that feels like you.'}
              </p>
            </div>

            {authMode !== 'reset' && (
            <div className="auth-tabs">
              <button
                type="button"
                className={
                  authMode === 'login' ? 'auth-tab active' : 'auth-tab'
                }
                onClick={() => switchAuthMode('login')}
              >
                Log in
              </button>
              <button
                type="button"
                className={
                  authMode === 'register' ? 'auth-tab active' : 'auth-tab'
                }
                onClick={() => switchAuthMode('register')}
              >
                Register
              </button>
            </div>
            )}

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <label>
                  Full name
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your name"
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              {authMode !== 'reset' && (
                <>
              <label>
                Password
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    autoComplete={
                      authMode === 'login'
                        ? 'current-password'
                        : 'new-password'
                    }
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                        <path d="M9.9 5.2A11.5 11.5 0 0112 5c5 0 8.5 4.5 9.5 7a11.8 11.8 0 01-3.1 4.3M6.2 6.2C3.9 7.6 2.7 10 2.5 12c1 2.5 4.5 7 9.5 7 1.2 0 2.3-.2 3.3-.7" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

                  {authMode === 'login' && (
                    <button
                      type="button"
                      className="auth-switch forgot-link"
                      onClick={() => switchAuthMode('reset')}
                    >
                      Forgot password?
                    </button>
                  )}
                </>
              )}

              {authMode === 'register' && (
                <p className="auth-hint">
                  Use at least 6 characters for your password.
                </p>
              )}

              {authMessage && (
                <p className="auth-error" role="alert">
                  {authMessage}
                </p>
              )}

              <button
                className="primary-button auth-submit"
                type="submit"
                disabled={authLoading}
              >
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Log in'
                    : authMode === 'reset'
                      ? 'Send reset link'
                      : 'Create account'}
                {!authLoading && <span>↗</span>}
              </button>
            </form>

            <p className="auth-footer">
              {authMode === 'reset' ? (
                <button
                  type="button"
                  className="auth-switch"
                  onClick={() => switchAuthMode('login')}
                >
                  ← Back to log in
                </button>
              ) : (
                <>
                  {authMode === 'login'
                    ? "Don't have an account?"
                    : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    className="auth-switch"
                    onClick={() =>
                      switchAuthMode(authMode === 'login' ? 'register' : 'login')
                    }
                  >
                    {authMode === 'login' ? 'Register here' : 'Log in here'}
                  </button>
                </>
              )}
            </p>

            <p className="auth-disclaimer">
              Your portfolio journey starts here.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a href="#home" className="logo" aria-label="PortaVista home">
          Porta<span>Vista</span>
        </a>
        <p>Your story, your style, your portfolio.</p>
        <span>© 2026 PortaVista</span>
      </footer>

      {previewTemplate && (
        <div
          className="preview-modal-backdrop"
          role="presentation"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="preview-modal-header">
              <div>
                <h2 id="preview-modal-title">
                  {templates.find((t) => t.id === previewTemplate)?.name}{' '}
                  template
                </h2>
                <p>
                  Sample content, so you can see the layout before you
                  sign up.
                </p>
              </div>

              <button
                className="icon-button"
                type="button"
                onClick={() => setPreviewTemplate(null)}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>

            <div className="preview-modal-switch">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={previewTemplate === template.id ? 'is-active' : ''}
                  onClick={() => setPreviewTemplate(template.id)}
                >
                  {template.name}
                </button>
              ))}
            </div>

            <div className={`preview-modal-body pm-${previewTemplate}`}>
              <div className="template-frame">
                <TemplateView id={previewTemplate} data={sampleData} />
              </div>
            </div>

            <div className="preview-modal-footer">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setPreviewTemplate(null)}
              >
                Close
              </button>

              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setPreviewTemplate(null)
                  setTimeout(() => goToAccountPanel('register'), 60)
                }}
              >
                Create your portfolio <span>↗</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <GooeyToaster position="bottom-right" offset="28px" />
    </BrowserRouter>
  )
}

export default App
