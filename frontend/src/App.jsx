import WebApp from '@twa-dev/sdk'
import { useEffect, useMemo, useState } from 'react'

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
    name_en: 'Vakhtang',
    title: 'Digital Product & Visual Designer',
    avatar_url: '',
    bio: 'Создаю современные визуальные решения для бизнеса: от брендинга до веб-приложений.',
    bio_en: 'Crafting modern visual solutions for businesses: from brand identity to web apps.',
  },
  pitch: {
    title: 'Готов оживить ваш проект',
    title_en: 'Ready to bring your project to life',
    subtitle: 'Дизайн с высоким эффектом, который выделяет ваш бренд.',
    subtitle_en: 'High-impact visual design that makes your brand stand out.',
    button_text: 'Оставить заявку',
    button_text_en: 'Submit Request',
  },
  contacts: [
    { id: '1', name: 'Telegram', url: 'https://t.me/your_username', icon: 'telegram' },
    { id: '2', name: 'WhatsApp', url: 'https://wa.me/your_number', icon: 'whatsapp' },
    { id: '3', name: 'Instagram', url: 'https://instagram.com/your_handle', icon: 'instagram' },
    { id: '4', name: 'Behance', url: 'https://behance.net/your_profile', icon: 'behance' },
  ],
  cases: [
    {
      id: '1',
      title: 'E-Commerce App Design',
      category: 'UI/UX & Mobile',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
      description: 'Проектирование удобного мобильного приложения интернет-магазина. Разработка интерфейса, логики взаимодействия и дизайн-системы.',
      description_en: 'Full lifecycle UI design for a shopping platform with modern user experience.',
      link: 'https://behance.net'
    },
    {
      id: '2',
      title: 'Fintech Dashboard & Branding',
      category: 'Branding & Web',
      cover: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&q=80',
      description: 'Разработка айдентики и веб-интерфейса для финтех-платформы. Чистый современный стиль и быстрая аналитика данных.',
      description_en: 'Brand identity and dashboard UI design for a fintech platform.',
      link: 'https://behance.net'
    }
  ],
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
    submitBtn: 'Оставить заявку',
    successTitle: 'Заявка отправлена',
    successHint: 'Скоро свяжусь с вами.',
    sendAnother: 'Отправить ещё одну',
    networkError: 'Ошибка сети',
    requestFailed: 'Не удалось выполнить запрос',
    toggleThemeDark: 'Тёмная тема',
    toggleThemeLight: 'Светлая тема',
    openProject: 'Открыть проект',
    preview: 'Превью проекта'
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
    budgetPlaceholder: 'e.g. $1,000',
    description: 'Description',
    sending: 'Sending…',
    submitBtn: 'Submit Request',
    successTitle: 'Request sent',
    successHint: 'I will get back to you soon.',
    sendAnother: 'Send another',
    networkError: 'Network error',
    requestFailed: 'Request failed',
    toggleThemeDark: 'Dark mode',
    toggleThemeLight: 'Light mode',
    openProject: 'View Project',
    preview: 'Project Preview'
  },
}

// Компактные стили без иконок
const SOCIAL_STYLES = {
  telegram: 'bg-[#0088cc]/10 text-[#0088cc] border border-[#0088cc]/25 hover:bg-[#0088cc]/20',
  whatsapp: 'bg-[#25d366]/10 text-[#25d366] border border-[#25d366]/25 hover:bg-[#25d366]/20',
  instagram: 'bg-[#e1306c]/10 text-[#e1306c] border border-[#e1306c]/25 hover:bg-[#e1306c]/20',
  behance: 'bg-[#1769ff]/10 text-[#1769ff] border border-[#1769ff]/25 hover:bg-[#1769ff]/20',
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

// Заглушка изображения
function ImageWithFallback({ src, alt, className, previewText }) {
  const [error, setError] = useState(false)

  if (error || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-violet-900/20 via-zinc-800/40 to-slate-900/30 text-zinc-400 border border-white/10 ${className}`}>
        <svg className="w-8 h-8 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-[10px] font-medium tracking-wide opacity-60">{previewText}</span>
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />
}

export default function App() {
  const [content, setContent] = useState(defaultContent)
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [lang, setLang] = useState('RU')
  const [theme, setTheme] = useState(() => detectTelegramScheme() || 'dark')
  const [selectedCase, setSelectedCase] = useState(null)

  const t = translations[lang]
  const isDark = theme === 'dark'
  const isRu = lang === 'RU'

  useEffect(() => {
    try {
      WebApp.ready()
      WebApp.expand()
    } catch {}

    fetch(`${API_BASE_URL}/api/content`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setContent(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    // Софт-серый глубокий цвет для светлой темы
    document.body.style.background = isDark ? '#0d0d0f' : '#eef0f4'
    document.body.style.color = isDark ? '#fafafa' : '#1f2937'
  }, [isDark])

  const contacts = useMemo(() => content.contacts?.length ? content.contacts : defaultContent.contacts, [content.contacts])
  const cases = useMemo(() => content.cases?.length ? content.cases : defaultContent.cases, [content.cases])
  const profile = content.profile || defaultContent.profile
  const pitch = content.pitch || defaultContent.pitch

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
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
      })

      if (!response.ok) throw new Error(t.requestFailed)

      setStatus('success')
      setForm(emptyForm)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : t.networkError)
    }
  }

  const shell = isDark ? 'bg-[#0d0d0f] text-zinc-100' : 'bg-[#eef0f4] text-slate-800'
  const control = isDark 
    ? 'rounded-xl border border-white/10 bg-white/5 text-zinc-100' 
    : 'rounded-xl border border-slate-300 bg-white text-slate-800 shadow-sm'
  const card = isDark 
    ? 'rounded-2xl border border-white/10 bg-white/5' 
    : 'rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50'
  const field = isDark
    ? 'mt-1 w-full rounded-xl border border-white/10 bg-[#121216] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500'
    : 'mt-1 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500'
  const muted = isDark ? 'text-zinc-400' : 'text-slate-500'
  const title = isDark ? 'text-white' : 'text-slate-900'

  return (
    <div className={`min-h-svh ${shell}`}>
      <div className="mx-auto max-w-md px-4 pb-10 pt-4 space-y-6">
        
        {/* Переключатели */}
        <div className="flex items-center justify-between">
          <div className={`flex overflow-hidden p-0.5 text-xs font-semibold ${control}`}>
            {['RU', 'EN'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`rounded-lg px-2.5 py-1 transition ${
                  lang === code ? 'bg-violet-600 text-white' : muted
                }`}
              >
                {code}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`flex h-8 px-2.5 items-center justify-center text-xs font-medium ${control}`}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* Профиль с Нейтральным Аватаром-Силуэтом */}
        <header className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-tr from-slate-700 via-zinc-800 to-violet-900 flex items-center justify-center text-zinc-400 border border-white/10 shadow-lg">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <svg className="w-9 h-9 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>
          <div>
            <h1 className={`text-xl font-bold ${title}`}>
              {isRu ? (profile.name || 'Вахтанг') : (profile.name_en || 'Vakhtang')}
            </h1>
            <p className="text-xs text-violet-500 font-medium">{profile.title}</p>
            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
              isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t.available}
            </span>
          </div>
        </header>

        {/* Динамическое БИО */}
        <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
          {isRu ? (profile.bio || defaultContent.profile.bio) : (profile.bio_en || defaultContent.profile.bio_en)}
        </p>

        {/* Динамический Питч Баннер */}
        <section className={`rounded-2xl p-4 border ${
          isDark
            ? 'border-violet-500/30 bg-violet-950/20'
            : 'border-violet-200 bg-white shadow-sm'
        }`}>
          <h2 className="text-sm font-bold text-violet-500">
            {isRu ? (pitch.title || defaultContent.pitch.title) : (pitch.title_en || defaultContent.pitch.title_en)}
          </h2>
          <p className={`mt-1 text-xs ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
            {isRu ? (pitch.subtitle || defaultContent.pitch.subtitle) : (pitch.subtitle_en || defaultContent.pitch.subtitle_en)}
          </p>
        </section>

        {/* Карточка 1 вместо 2 в блоке Портфолио (grid-cols-1) */}
        <section className="space-y-3">
          <h2 className={`text-xs font-bold uppercase tracking-wider ${muted}`}>{t.portfolio}</h2>
          <div className="grid grid-cols-1 gap-4">
            {cases.map((work) => (
              <div
                key={work.id}
                onClick={() => setSelectedCase(work)}
                className={`${card} p-3 cursor-pointer transition transform active:scale-[0.98] hover:border-violet-500/40`}
              >
                <ImageWithFallback
                  src={work.cover}
                  alt={work.title}
                  previewText={t.preview}
                  className="h-44 w-full rounded-xl object-cover mb-3"
                />
                <h3 className={`text-sm font-bold ${title}`}>{work.title}</h3>
                <span className="inline-block mt-1 text-[10px] font-semibold text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded">
                  {work.category}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Ультра-компактные кнопки соцсетей без иконок */}
        {contacts.length > 0 && (
          <section className="flex flex-wrap gap-1.5 pt-1">
            {contacts.map((item) => {
              const key = socialKey(item)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openExternal(item.url)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${SOCIAL_STYLES[key]}`}
                >
                  {item.name}
                </button>
              )
            })}
          </section>
        )}

        {/* Форма Заказа */}
        <section className={`${card} p-4`}>
          <h2 className={`text-base font-bold mb-0.5 ${title}`}>{t.orderTitle}</h2>
          <p className={`text-xs mb-4 ${muted}`}>{t.orderHint}</p>

          {status === 'success' ? (
            <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
              <p className="font-bold text-sm">{t.successTitle}</p>
              <p className="text-xs mt-1 opacity-80">{t.successHint}</p>
              <button type="button" onClick={() => setStatus('idle')} className="mt-3 text-xs underline">
                {t.sendAnother}
              </button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={onSubmit}>
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
                  className={field}
                  value={form.contact}
                  onChange={(e) => update('contact', e.target.value)}
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className={`block text-xs ${muted}`}>
                  {t.taskType}
                  <select
                    className={field}
                    value={form.task_type}
                    onChange={(e) => update('task_type', e.target.value)}
                  >
                    {TASK_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {isRu ? type.ru : type.en}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={`block text-xs ${muted}`}>
                  {t.budget}
                  <input
                    required
                    placeholder={t.budgetPlaceholder}
                    className={field}
                    value={form.budget}
                    onChange={(e) => update('budget', e.target.value)}
                  />
                </label>
              </div>

              <label className={`block text-xs ${muted}`}>
                {t.description}
                <textarea
                  required
                  rows={3}
                  className={`${field} resize-none`}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
              </label>

              {status === 'error' && <p className="text-xs text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full rounded-xl bg-violet-600 py-3 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50 shadow-md shadow-violet-600/20"
              >
                {status === 'sending' ? t.sending : t.submitBtn}
              </button>
            </form>
          )}
        </section>

      </div>

      {/* Модальное окно */}
      {selectedCase && (
        <div 
          onClick={() => setSelectedCase(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 border max-h-[85vh] overflow-y-auto ${
              isDark ? 'bg-[#141418] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded font-semibold">
                  {selectedCase.category}
                </span>
                <h3 className="text-lg font-bold mt-1">{selectedCase.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                className="p-1 rounded-full bg-slate-500/10 text-xs w-7 h-7 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <ImageWithFallback
              src={selectedCase.cover}
              alt={selectedCase.title}
              previewText={t.preview}
              className="w-full h-52 object-cover rounded-2xl"
            />

            <p className="text-xs opacity-80 leading-relaxed">
              {isRu ? selectedCase.description : (selectedCase.description_en || selectedCase.description)}
            </p>

            {selectedCase.link && (
              <button
                onClick={() => openExternal(selectedCase.link)}
                className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold text-xs shadow-md shadow-violet-600/20"
              >
                {t.openProject}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}