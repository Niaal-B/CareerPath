import { useEffect, useState } from 'react'

import {
  createQuestionCategory,
  createQuestionTemplate,
  fetchQuestionCategories,
  fetchQuestionTemplates,
} from '../../services/dashboard'

type QuestionCategory = {
  id: number
  name: string
  description?: string
  qualification_tag?: string
}

type QuestionTemplate = {
  id: number
  prompt: string
  category: QuestionCategory
  options: Array<{ id: number; label: string; description: string; order: number }>
}

export default function QuestionBankPage() {
  const [categories, setCategories] = useState<QuestionCategory[]>([])
  const [templates, setTemplates] = useState<QuestionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')

  const [catForm, setCatForm] = useState({ name: '', qualification_tag: '', description: '' })
  const [creatingCategory, setCreatingCategory] = useState(false)

  const [tmplForm, setTmplForm] = useState({
    category: 0,
    prompt: '',
    options: [{ label: '', description: '', order: 0 }],
  })
  const [creatingTemplate, setCreatingTemplate] = useState(false)

  const loadData = async (categoryId?: number | 'all') => {
    try {
      setLoading(true)
      const [cats, temps] = await Promise.all([
        fetchQuestionCategories({ include_inactive: false }),
        fetchQuestionTemplates(categoryId && categoryId !== 'all' ? { category_id: categoryId } : undefined),
      ])
      setCategories(cats || [])
      setTemplates(temps || [])
      if (categoryId === undefined && cats && cats.length > 0) {
        setSelectedCategory('all')
      }
      setError(null)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail || 'Failed to load question bank.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateCategory = async () => {
    if (!catForm.name.trim()) {
      setError('Category name is required.')
      return
    }
    try {
      setCreatingCategory(true)
      await createQuestionCategory({
        name: catForm.name,
        qualification_tag: catForm.qualification_tag || undefined,
        description: catForm.description || undefined,
      })
      setCatForm({ name: '', qualification_tag: '', description: '' })
      await loadData(selectedCategory)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail || 'Failed to create category.')
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleAddOptionField = () => {
    setTmplForm((prev) => ({
      ...prev,
      options: [...prev.options, { label: '', description: '', order: prev.options.length }],
    }))
  }

  const handleUpdateOption = (index: number, field: 'label' | 'description', value: string) => {
    setTmplForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)),
    }))
  }

  const handleCreateTemplate = async () => {
    if (!tmplForm.category) {
      setError('Pick a category for the template.')
      return
    }
    if (!tmplForm.prompt.trim()) {
      setError('Template prompt is required.')
      return
    }
    if (tmplForm.options.some((opt) => !opt.label.trim())) {
      setError('All option labels are required.')
      return
    }
    try {
      setCreatingTemplate(true)
      await createQuestionTemplate({
        category: tmplForm.category,
        prompt: tmplForm.prompt,
        options: tmplForm.options.map((opt, i) => ({
          label: opt.label,
          description: opt.description,
          order: i,
        })),
      })
      setTmplForm({ category: tmplForm.category, prompt: '', options: [{ label: '', description: '', order: 0 }] })
      await loadData(selectedCategory)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail || 'Failed to create template.')
    } finally {
      setCreatingTemplate(false)
    }
  }

  const handleCategoryFilter = async (value: string) => {
    const id = value === 'all' ? 'all' : parseInt(value)
    setSelectedCategory(id)
    await loadData(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-light">Question bank</p>
          <h3 className="font-display text-2xl text-white">Templates & categories</h3>
          <p className="text-sm text-slate-300">Create reusable questions and buckets for quick assignment.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Categories</p>
              <p className="text-sm text-slate-200">Group templates by qualification or theme.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-white">{cat.name}</div>
                    {cat.qualification_tag && (
                      <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] text-slate-200">
                        {cat.qualification_tag}
                      </span>
                    )}
                  </div>
                  {cat.description && <p className="mt-1 text-xs text-slate-300">{cat.description}</p>}
                </div>
              ))}
              {categories.length === 0 && !loading && <p className="text-sm text-slate-400">No categories yet.</p>}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Loading...
                </div>
              )}
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-semibold text-white">Create category</p>
              <div className="mt-3 space-y-3 text-sm">
                <input
                  value={catForm.name}
                  onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Category name (e.g., Plus Two)"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-brand focus:outline-none"
                />
                <input
                  value={catForm.qualification_tag}
                  onChange={(e) => setCatForm((p) => ({ ...p, qualification_tag: e.target.value }))}
                  placeholder="Qualification tag (optional, e.g., plus_two)"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-brand focus:outline-none"
                />
                <textarea
                  value={catForm.description}
                  onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-brand focus:outline-none"
                />
                <button
                  onClick={handleCreateCategory}
                  disabled={creatingCategory}
                  className="w-full rounded-xl border border-brand bg-brand/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand/30 disabled:opacity-50"
                >
                  {creatingCategory ? 'Creating...' : 'Create category'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Templates</p>
              <p className="text-sm text-slate-200">Reusable MCQs with options.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300">Filter by category</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
              >
                <option value="all">All</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{tmpl.category?.name}</div>
                  <span className="text-[11px] text-slate-400">Options: {tmpl.options.length}</span>
                </div>
                <p className="mt-2 font-semibold text-white">{tmpl.prompt}</p>
                <ul className="mt-2 text-xs text-slate-300">
                  {tmpl.options.map((opt) => (
                    <li key={opt.id}>• {opt.label}</li>
                  ))}
                </ul>
              </div>
            ))}
            {templates.length === 0 && !loading && (
              <p className="text-sm text-slate-400">No templates for this filter.</p>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Loading...
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm font-semibold text-white">Create template</p>
            <div className="mt-3 space-y-3 text-sm">
              <select
                value={tmplForm.category || ''}
                onChange={(e) => setTmplForm((p) => ({ ...p, category: parseInt(e.target.value) }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-brand focus:outline-none"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <textarea
                value={tmplForm.prompt}
                onChange={(e) => setTmplForm((p) => ({ ...p, prompt: e.target.value }))}
                placeholder="Question prompt"
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-brand focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Options</label>
                <button
                  onClick={handleAddOptionField}
                  type="button"
                  className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  + Add option
                </button>
              </div>
              <div className="space-y-2">
                {tmplForm.options.map((opt, idx) => (
                  <div key={idx} className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                    <input
                      value={opt.label}
                      onChange={(e) => handleUpdateOption(idx, 'label', e.target.value)}
                      placeholder={`Option ${idx + 1} label`}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-brand focus:outline-none"
                    />
                    <input
                      value={opt.description}
                      onChange={(e) => handleUpdateOption(idx, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-brand focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleCreateTemplate}
                disabled={creatingTemplate}
                className="w-full rounded-xl border border-brand bg-brand/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand/30 disabled:opacity-50"
              >
                {creatingTemplate ? 'Creating...' : 'Create template'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

