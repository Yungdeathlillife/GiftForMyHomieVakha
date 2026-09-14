import WebApp from '@twa-dev/sdk'
import { useEffect, useMemo, useRef, useState } from 'react'

const API_BASE_URL = "https://giftformyhomievakha.onrender.com"

const TASK_TYPES = [
  { value: 'Mobile App', ru: 'Mobile App', en: 'Mobile App' },
  { value: 'Landing Page', ru: 'Landing Page', en: 'Landing Page' },
  { value: 'Branding', ru: 'Брендинг', en: 'Branding' },
  { value: 'UX-аудит', ru: 'UX-аудит', en: 'UX audit' },
  { value: 'Другое', ru: 'Другое', en: 'Other' },
]

const emptyForm = {
  name: '',
  contact: '',
  task_type: TASK_TYPES[0].value,
  budget: '',
  description: '',
}

const defaultContent = {
  profile: {
    name: 'Вахтанг',
    title: 'Digital Product & Visual Designer',
    avatar_url:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: 'Crafting modern visual solutions for businesses: from brand identity to web apps.',
  },
  pitch: {
    title: 'Ready to bring your project to life',
    subtitle: 'High-impact visual design that makes your brand stand out.',
    button_text: 'Discuss Project',
  },
  contacts: [
    { id: '1', name: 'Telegram', url: 'https://t.me/your_username', icon: 'telegram' },
    { id: '2', name: 'WhatsApp', url: 'https://wa.me/your_number', icon: 'whatsapp' },
    { id: '3', name: 'Instagram', url: 'https://instagram.com/your_handle', icon: 'instagram' },
    { id: '4', name: 'Behance', url: 'https://behance.net/your_profile', icon: 'behance' },
  ],
  cases: [],
}

const translations = {
  RU: {
    available: 'Доступен для заказов',
    portfolio: 'ПОРТФОЛИО',
    orderTitle: 'Оставить заказ',
    orderHint: 'Коротко опишите задачу — я отвечу в Telegram.',
    name: 'Имя',
    contact: 'Контакт',
    contactPlaceholder: '@username или телефон',
    taskType: 'Тип задачи',
    budget: 'Бюджет',
    budgetPlaceholder: 'например 80 000 ₽',
    description: 'Описание',
    sending: 'Отправка…',
    discuss: 'Обсудить проект',
    successTitle: 'Заявка отправлена',
    successHint: 'Скоро свяжусь с вами.',
    sendAnother: 'Отправить ещё одну',
    networkError: 'Ошибка сети',
    requestFailed: 'Не удалось выполнить запрос',
    toggleThemeDark: 'Тёмная тема',
    toggleThemeLight: 'Светлая тема',
  },
  EN: {
    available: 'Available for work',
    portfolio: 'PORTFOLIO',
    orderTitle: 'Place an Order',
    orderHint: 'Briefly describe the task — I will reply on Telegram.',
    name: 'Name',
    contact: 'Contact',
    contactPlaceholder: '@username or phone',
    taskType: 'Task type',
    budget: 'Budget',
    budgetPlaceholder: 'e.g. 80,000 ₽',
    description: 'Description',
    sending: 'Sending…',
    discuss: 'Discuss Project',
    successTitle: 'Request sent',
    successHint: 'I will get back to you soon.',
    sendAnother: 'Send another',
    networkError: 'Network error',
    requestFailed: 'Request failed',
    toggleThemeDark: 'Dark mode',
    toggleThemeLight: 'Light mode',
  },
}

const SOCIAL_STYLES = {
  telegram: 'bg-[#229ED9] text-white shadow-lg shadow-[#229ED9]/35',
  whatsapp: 'bg-[#25D366] text-white shadow-lg shadow-[#25D366]/35',
  instagram:
    'bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white shadow-lg shadow-[#dd2a7b]/35',
  behance: 'bg-[#053eff] text-white shadow-lg shadow-[#053eff]/35',
}

function detectTelegramScheme() {
  const scheme = window.Telegram?.WebApp?.colorScheme
  return scheme === 'light' || scheme === 'dark' ? scheme : null
}

function socialKey(item) {
  const raw = `${item.icon || ''} ${item.name || ''}`.toLowerCase()
  if (raw.includes('whatsapp')) return 'whatsapp'
  if (raw.includes('instagram')) return 'instagram'
  if (raw.includes('behance')) return 'behance'
  return 'telegram'
}

function openExternal(url) {
  const tg = window.Telegram?.WebApp
  if (tg?.openLink) {
    tg.openLink(url)
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

function errorDetail(payload, fallback) {
  if (!payload || payload.detail == null) return fallback
  if (typeof payload.detail === 'string') return payload.detail
  return JSON.stringify(payload.detail)
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
    </svg>
  )
}

function SocialIcon({ type }) {
  const className = 'h-5 w-5 shrink-0'
  if (type === 'whatsapp') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.4-1.1A11 11 0 0 0 20.5 3.5zm-8.5 17a9.1 9.1 0 0 1-4.6-1.3l-.3-.2-3.2.7.7-3.1-.2-.3a9.1 9.1 0 1 1 7.6 4.2zm5-6.8c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.3-.4.2-.3c.1-.1 0-.3 0-.4l-.9-2.1c-.2-.6-.5-.5-.6-.5h-.5c-.2 0-.4.1-.6.3s-.8.8-.8 1.9.8 2.2.9 2.3a11.7 11.7 0 0 0 4.5 3.9c1.6.7 2.2.8 3 .6.5-.1 1.6-.6 1.8-1.3s.2-1.2.2-1.3-.2-.2-.4-.3z" />
      </svg>
    )
  }
  if (type === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm11.2 1.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2.2A2.8 2.8 0 1 0 12 14.8 2.8 2.8 0 0 0 12 9.2z" />
      </svg>
    )
  }
  if (type === 'behance') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M8.4 11.3c.8-.4 1.2-1 1.2-1.9 0-1.6-1.2-2.4-3.2-2.4H2v10h4.7c2.2 0 3.6-.9 3.6-2.7 0-1.2-.6-2-1.9-2.4zM4.5 8.6h1.7c.8 0 1.3.3 1.3.9s-.5.9-1.4.9H4.5zm2 6.8H4.5v-2.4h2.1c1 0 1.5.4 1.5 1.2s-.6 1.2-1.6 1.2zM21.7 10.4c-1.1-.2-3.6-.1-4.8-.1v-1h4.4V7.8H14v8.3h3c2.2 0 4.8-.3 4.8-3.2 0-1.4-.6-2.3-1.1-2.5zm-4.8 1.2h1.6c1.4 0 2.2.3 2.2 1.5 0 1.3-.9 1.6-2.1 1.6h-1.7zM15.2 6.4h4.3V5h-4.3z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.5 5.5 3.9 7.2v3.6l3.6-2c.8.2 1.6.3 2.5.3 5.5 0 10-4.1 10-9.2S17.5 2 12 2zm4.6 7.1-4.7 7.5c-.2.3-.6.3-.8 0L9 13.3 6.3 12c-.4-.2-.4-.8.1-1l9.6-3.6c.4-.1.8.3.6.7z" />
    </svg>
  )
}

export default function App() {
  const [content, setContent] = useState(defaultContent)
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [lang, setLang] = useState('RU')
  const [theme, setTheme] = useState(() => detectTelegramScheme() || 'dark')
  const [themeManual, setThemeManual] = useState(false)
  const themeManualRef = useRef(false)

  const t = translations[lang]
  const isDark = theme === 'dark'

  useEffect(() => {
    themeManualRef.current = themeManual
  }, [themeManual])

  useEffect(() => {
    try {
      WebApp.ready()
      WebApp.expand()
    } catch {
      // SDK is optional outside Telegram
    }

    const scheme = detectTelegramScheme()
    if (scheme) setTheme(scheme)

    const onThemeChanged = () => {
      if (themeManualRef.current) return
      const next = detectTelegramScheme()
      if (next) setTheme(next)
    }
    window.Telegram?.WebApp?.onEvent?.('themeChanged', onThemeChanged)

    fetch(`${API_BASE_URL}/api/content`, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(errorDetail(payload, translations.RU.requestFailed))
        }
        return response.json()
      })
      .then((data) => setContent(data))
      .catch(() => {
        // Keep default content if CMS is unavailable
      })

    return () => {
      window.Telegram?.WebApp?.offEvent?.('themeChanged', onThemeChanged)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.body.style.background = isDark ? '#0d0d0f' : '#f8f9fa'
    document.body.style.color = isDark ? '#fafafa' : '#111827'
  }, [isDark])

  const contacts = useMemo(() => {
    if (content.contacts?.length) return content.contacts
    return defaultContent.contacts
  }, [content.contacts])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleTheme() {
    setThemeManual(true)
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setStatus('sending')
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        signal: AbortSignal.timeout(12000),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(errorDetail(payload, t.requestFailed))
      }

      setStatus('success')
      setForm(emptyForm)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : t.networkError)
    }
  }

  const { profile, pitch, cases } = content
  const shell = isDark
    ? 'min-h-svh bg-[#0d0d0f] text-zinc-100'
    : 'min-h-svh bg-[#f8f9fa] text-zinc-900'
  const control =
    isDark
      ? 'rounded-xl border border-white/10 bg-white/5 text-zinc-100 backdrop-blur-md'
      : 'rounded-xl border border-zinc-200 bg-white text-zinc-800 shadow-sm'
  const card = isDark
    ? 'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl'
    : 'rounded-2xl border border-zinc-200 bg-white shadow-sm'
  const field =
    isDark
      ? 'mt-1 w-full rounded-xl border border-white/10 bg-[#121216] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500'
      : 'mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-violet-500'
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const title = isDark ? 'text-white' : 'text-zinc-900'

  return (
    <div className={`${shell} ${isDark ? 'dark' : ''}`}>
      <div className="mx-auto max-w-md px-4 pb-10 pt-4">
        <div className="mb-4 flex items-center justify-end gap-2">
          <div className={`flex overflow-hidden p-0.5 text-xs font-semibold ${control}`}>
            {['RU', 'EN'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  lang === code
                    ? isDark
                      ? 'bg-violet-500 text-white'
                      : 'bg-zinc-900 text-white'
                    : muted
                }`}
              >
                {code}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? t.toggleThemeLight : t.toggleThemeDark}
            className={`flex h-9 w-9 items-center justify-center ${control}`}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <header className="mb-6 flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-lg shadow-violet-500/30"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-500 text-xl font-semibold text-white">
              UX
            </div>
          )}
          <div>
            <p className={`text-base font-semibold ${title}`}>{profile.name}</p>
            <p className={`text-sm ${muted}`}>{profile.title}</p>
            <span
              className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-500/10 text-emerald-700'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t.available}
            </span>
          </div>
        </header>

        <p className={`mb-6 text-sm leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
          {profile.bio}
        </p>

        <section
          className={`mb-8 rounded-2xl px-4 py-4 ${
            isDark
              ? 'border border-violet-500/40 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/10'
              : 'border border-violet-200 bg-gradient-to-r from-violet-50 to-white'
          }`}
        >
          <h2 className={`text-base font-semibold ${title}`}>{pitch.title}</h2>
          <p className={`mt-1 text-sm ${isDark ? 'text-violet-100' : 'text-violet-800'}`}>
            {pitch.subtitle}
          </p>
        </section>

        <section className="mb-8">
          <h2 className={`mb-3 text-sm font-medium uppercase tracking-wider ${muted}`}>
            {t.portfolio}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {cases.map((work) => (
              <button
                key={work.id}
                type="button"
                onClick={() => openExternal(work.link)}
                className={`${card} p-3 text-left`}
              >
                <img
                  src={work.cover}
                  alt={work.title}
                  className="mb-3 h-20 w-full rounded-xl object-cover"
                />
                <h3 className={`text-sm font-semibold ${title}`}>{work.title}</h3>
                <p className={`mb-2 text-xs ${muted}`}>{work.category}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    isDark ? 'bg-zinc-800/90 text-violet-300' : 'bg-violet-50 text-violet-700'
                  }`}
                >
                  {work.category}
                </span>
              </button>
            ))}
          </div>
        </section>

        {contacts.length > 0 && (
          <section className="mb-8 grid grid-cols-2 gap-3">
            {contacts.map((item) => {
              const key = socialKey(item)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openExternal(item.url)}
                  className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl px-3 py-4 text-sm font-semibold ${SOCIAL_STYLES[key]}`}
                >
                  <SocialIcon type={key} />
                  {item.name}
                </button>
              )
            })}
          </section>
        )}

        <section id="order" className={`${card} p-4`}>
          <h2 className={`mb-1 text-lg font-semibold ${title}`}>{t.orderTitle}</h2>
          <p className={`mb-4 text-sm ${muted}`}>{t.orderHint}</p>

          {status === 'success' ? (
            <div
              className={`rounded-xl px-4 py-6 text-center ${
                isDark
                  ? 'border border-emerald-500/30 bg-emerald-500/10'
                  : 'border border-emerald-200 bg-emerald-50'
              }`}
            >
              <p className={isDark ? 'font-medium text-emerald-300' : 'font-medium text-emerald-700'}>
                {t.successTitle}
              </p>
              <p className={`mt-1 text-sm ${muted}`}>{t.successHint}</p>
              <button
                type="button"
                className="mt-4 text-sm text-violet-500 underline-offset-2 hover:underline"
                onClick={() => setStatus('idle')}
              >
                {t.sendAnother}
              </button>
            </div>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={onSubmit}>
              <label className={`block text-xs ${muted}`}>
                {t.name}
                <input
                  required
                  className={field}
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </label>
              <label className={`block text-xs ${muted}`}>
                {t.contact}
                <input
                  required
                  placeholder={t.contactPlaceholder}
                  className={`${field} ${isDark ? 'placeholder:text-zinc-600' : 'placeholder:text-zinc-400'}`}
                  value={form.contact}
                  onChange={(e) => update('contact', e.target.value)}
                />
              </label>
              <label className={`block text-xs ${muted}`}>
                {t.taskType}
                <select
                  className={field}
                  value={form.task_type}
                  onChange={(e) => update('task_type', e.target.value)}
                >
                  {TASK_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {lang === 'RU' ? type.ru : type.en}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`block text-xs ${muted}`}>
                {t.budget}
                <input
                  required
                  placeholder={t.budgetPlaceholder}
                  className={`${field} ${isDark ? 'placeholder:text-zinc-600' : 'placeholder:text-zinc-400'}`}
                  value={form.budget}
                  onChange={(e) => update('budget', e.target.value)}
                />
              </label>
              <label className={`block text-xs ${muted}`}>
                {t.description}
                <textarea
                  required
                  rows={4}
                  className={`${field} resize-none`}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
              </label>
              {status === 'error' && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="mt-1 rounded-xl bg-violet-500 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'sending' ? t.sending : lang === 'RU' ? t.discuss : pitch.button_text}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
