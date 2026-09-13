import WebApp from '@twa-dev/sdk'
import { useEffect, useState } from 'react'

const TASK_TYPES = [
  'Mobile App',
  'Landing Page',
  'Branding',
  'UX-аудит',
  'Другое',
]

const WORKS = [
  {
    title: 'Mobile App',
    subtitle: 'Финтех-кошелёк',
    tags: ['iOS', 'Android', 'UX'],
    accent: 'from-violet-500/30 to-fuchsia-500/10',
  },
  {
    title: 'Landing Page',
    subtitle: 'SaaS-продукт',
    tags: ['Web', 'Conversion', 'UI'],
    accent: 'from-violet-400/25 to-zinc-800',
  },
  {
    title: 'Branding',
    subtitle: 'Айдентика студии',
    tags: ['Logo', 'Identity', 'Brand'],
    accent: 'from-fuchsia-500/20 to-violet-900/30',
  },
  {
    title: 'Dashboard',
    subtitle: 'Аналитика продаж',
    tags: ['B2B', 'UI Kit', 'Dark'],
    accent: 'from-zinc-700/80 to-violet-600/20',
  },
]

const emptyForm = {
  name: '',
  contact: '',
  task_type: TASK_TYPES[0],
  budget: '',
  description: '',
}

export default function App() {
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
  }, [])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setStatus('sending')
    setError('')

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        signal: AbortSignal.timeout(12000),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.detail || 'Не удалось отправить заявку')
      }

      setStatus('success')
      setForm(emptyForm)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Ошибка сети')
    }
  }

  return (
    <div className="min-h-svh bg-zinc-900 text-zinc-100">
      <div className="mx-auto max-w-md px-4 pb-10 pt-4">
        <div className="mb-4 rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/10 px-4 py-3">
          <p className="text-sm font-medium leading-relaxed text-violet-100">
            С Днём Рождения, бро! Твой личный комбайн для заказов полон и готов к бою!
          </p>
        </div>

        <header className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-500 text-xl font-semibold text-white shadow-lg shadow-violet-500/30">
            UX
          </div>
          <div>
            <p className="text-base font-semibold text-white">
              UI/UX Designer • Великий Новгород
            </p>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Available for work
            </span>
          </div>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-400">
            Портфолио
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {WORKS.map((work) => (
              <article
                key={work.title}
                className={`rounded-2xl border border-zinc-800 bg-gradient-to-br ${work.accent} p-3`}
              >
                <div className="mb-6 h-16 rounded-xl bg-zinc-800/70" />
                <h3 className="text-sm font-semibold text-white">{work.title}</h3>
                <p className="mb-2 text-xs text-zinc-400">{work.subtitle}</p>
                <div className="flex flex-wrap gap-1">
                  {work.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-800/90 px-2 py-0.5 text-[10px] text-violet-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-800/40 p-4">
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
                {status === 'sending' ? 'Отправка…' : 'Отправить заказ'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
