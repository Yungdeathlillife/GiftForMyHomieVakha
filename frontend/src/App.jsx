import WebApp from '@twa-dev/sdk'
import { useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://giftformyhomievakha.onrender.com"

const TASK_TYPES = [
  'Mobile App',
  'Landing Page',
  'Branding',
  'UX-аудит',
  'Другое',
]

const emptyForm = {
  name: '',
  contact: '',
  task_type: TASK_TYPES[0],
  budget: '',
  description: '',
}

const defaultContent = {
  profile: {
    name: 'Vakha',
    title: 'Digital Product & Visual Designer',
    avatar_url: 'https://via.placeholder.com/150',
    bio: 'Crafting modern visual solutions for businesses: from brand identity to web apps.',
  },
  pitch: {
    title: 'Ready to bring your project to life',
    subtitle: 'High-impact visual design that makes your brand stand out.',
    button_text: 'Discuss Project',
  },
  contacts: [],
  cases: [],
}

function errorDetail(payload) {
  if (!payload || payload.detail == null) return 'Не удалось выполнить запрос'
  if (typeof payload.detail === 'string') return payload.detail
  return JSON.stringify(payload.detail)
}

export default function App() {
  const [content, setContent] = useState(defaultContent)
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      WebApp.ready()
      WebApp.expand()
    } catch {
      // SDK is optional outside Telegram
    }

    fetch(`${API_BASE_URL}/api/content`, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(errorDetail(payload))
        }
        return response.json()
      })
      .then((data) => setContent(data))
      .catch(() => {
        // Keep default content if CMS is unavailable
      })
  }, [])

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
        signal: AbortSignal.timeout(12000),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(errorDetail(payload))
      }

      setStatus('success')
      setForm(emptyForm)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Ошибка сети')
    }
  }

  const { profile, pitch, contacts, cases } = content

  return (
    <div className="min-h-svh bg-zinc-900 text-zinc-100">
      <div className="mx-auto max-w-md px-4 pb-10 pt-4">
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
            <p className="text-base font-semibold text-white">{profile.name}</p>
            <p className="text-sm text-zinc-400">{profile.title}</p>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Available for work
            </span>
          </div>
        </header>

        <p className="mb-6 text-sm leading-relaxed text-zinc-300">{profile.bio}</p>

        <section className="mb-8 rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/10 px-4 py-4">
          <h2 className="text-base font-semibold text-white">{pitch.title}</h2>
          <p className="mt-1 text-sm text-violet-100">{pitch.subtitle}</p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-400">
            Портфолио
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {cases.map((work) => (
              <a
                key={work.id}
                href={work.link}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-zinc-800 bg-zinc-800/40 p-3"
              >
                <img
                  src={work.cover}
                  alt={work.title}
                  className="mb-3 h-20 w-full rounded-xl object-cover"
                />
                <h3 className="text-sm font-semibold text-white">{work.title}</h3>
                <p className="mb-2 text-xs text-zinc-400">{work.category}</p>
                <span className="rounded-full bg-zinc-800/90 px-2 py-0.5 text-[10px] text-violet-300">
                  {work.category}
                </span>
              </a>
            ))}
          </div>
        </section>

        {contacts.length > 0 && (
          <section className="mb-8 flex flex-wrap gap-2">
            {contacts.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
              >
                {item.name}
              </a>
            ))}
          </section>
        )}

        <section id="order" className="rounded-2xl border border-zinc-800 bg-zinc-800/40 p-4">
          <h2 className="mb-1 text-lg font-semibold text-white">Оставить заказ</h2>
          <p className="mb-4 text-sm text-zinc-400">
            Коротко опишите задачу — я отвечу в Telegram.
          </p>

          {status === 'success' ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-6 text-center">
              <p className="font-medium text-emerald-300">Заявка отправлена</p>
              <p className="mt-1 text-sm text-zinc-400">Скоро свяжусь с вами.</p>
              <button
                type="button"
                className="mt-4 text-sm text-violet-400 underline-offset-2 hover:underline"
                onClick={() => setStatus('idle')}
              >
                Отправить ещё одну
              </button>
            </div>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={onSubmit}>
              <label className="block text-xs text-zinc-400">
                Имя
                <input
                  required
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Контакт
                <input
                  required
                  placeholder="@username или телефон"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-500"
                  value={form.contact}
                  onChange={(e) => update('contact', e.target.value)}
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Тип задачи
                <select
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                  value={form.task_type}
                  onChange={(e) => update('task_type', e.target.value)}
                >
                  {TASK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-zinc-400">
                Бюджет
                <input
                  required
                  placeholder="например 80 000 ₽"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-500"
                  value={form.budget}
                  onChange={(e) => update('budget', e.target.value)}
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Описание
                <textarea
                  required
                  rows={4}
                  className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
              </label>
              {status === 'error' && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="mt-1 rounded-xl bg-violet-500 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'sending' ? 'Отправка…' : pitch.button_text}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
