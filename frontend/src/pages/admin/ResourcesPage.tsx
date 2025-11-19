import { useEffect, useState } from 'react'

import {
  createResource,
  deleteResource,
  fetchAdminRecommendations,
  fetchAdminResources,
  fetchResourceCategories,
  updateResource,
} from '../../services/dashboard'

type ResourceCategory = {
  id: number
  name: string
  description?: string
  icon?: string
}

type CareerRecommendation = {
  id: number
  career_name: string
  student_email: string
  created_at: string
}

type Resource = {
  id: number
  title: string
  description: string
  resource_type: string
  url?: string
  file_url?: string
  difficulty_level: string
  is_free: boolean
  cost?: number
  category?: ResourceCategory
  career_recommendation?: number
  order: number
  is_active: boolean
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [categories, setCategories] = useState<ResourceCategory[]>([])
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [selectedRecommendation, setSelectedRecommendation] = useState<number | undefined>()
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'article',
    url: '',
    difficulty_level: 'beginner',
    is_free: true,
    cost: '',
    category: '',
    career_recommendation: '',
    order: 0,
  })

  useEffect(() => {
    loadData()
  }, [selectedRecommendation, selectedCategory])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load resources
      const resourcesData = await fetchAdminResources(selectedRecommendation, selectedCategory)
      // API returns array directly or wrapped in a property
      setResources(Array.isArray(resourcesData) ? resourcesData : resourcesData?.resources || [])

      // Load categories
      const categoriesData = await fetchResourceCategories()
      setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData?.categories || [])

      // Load recommendations for dropdown
      const recommendationsData = await fetchAdminRecommendations()
      setRecommendations(recommendationsData.recommendations || [])
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Unable to load resources.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      const payload: any = {
        title: formData.title,
        description: formData.description,
        resource_type: formData.resource_type,
        url: formData.url || undefined,
        difficulty_level: formData.difficulty_level,
        is_free: formData.is_free,
        cost: formData.is_free ? undefined : parseFloat(formData.cost) || undefined,
        category: formData.category ? parseInt(formData.category) : undefined,
        career_recommendation: formData.career_recommendation ? parseInt(formData.career_recommendation) : undefined,
        order: formData.order,
        is_active: true,
      }

      if (editingResource) {
        await updateResource(editingResource.id, payload)
      } else {
        await createResource(payload)
      }

      setShowCreateForm(false)
      setEditingResource(null)
      resetForm()
      loadData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Failed to save resource.')
    }
  }

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource)
    setFormData({
      title: resource.title,
      description: resource.description,
      resource_type: resource.resource_type,
      url: resource.url || '',
      difficulty_level: resource.difficulty_level,
      is_free: resource.is_free,
      cost: resource.cost?.toString() || '',
      category: resource.category?.id.toString() || '',
      career_recommendation: resource.career_recommendation?.toString() || '',
      order: resource.order,
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (resourceId: number) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return
    try {
      await deleteResource(resourceId)
      loadData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Failed to delete resource.')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      resource_type: 'article',
      url: '',
      difficulty_level: 'beginner',
      is_free: true,
      cost: '',
      category: '',
      career_recommendation: '',
      order: 0,
    })
  }

  const getResourceTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      article: '📄',
      video: '🎥',
      course: '📚',
      book: '📖',
      certification: '🏆',
      tool: '🛠️',
      community: '👥',
      report: '📊',
      other: '📌',
    }
    return icons[type] || icons.other
  }

  const getDifficultyColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500/20 text-green-200',
      intermediate: 'bg-yellow-500/20 text-yellow-200',
      advanced: 'bg-red-500/20 text-red-200',
    }
    return colors[level] || colors.beginner
  }

  if (loading && resources.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-light">Resource library</p>
          <h3 className="font-display text-2xl text-white">Manage learning resources</h3>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true)
            setEditingResource(null)
            resetForm()
          }}
          className="rounded-full border border-brand bg-brand/20 px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand/30"
        >
          + Add Resource
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={selectedRecommendation || ''}
          onChange={(e) => setSelectedRecommendation(e.target.value ? parseInt(e.target.value) : undefined)}
          className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white focus:border-brand focus:outline-none"
        >
          <option value="">All Recommendations</option>
          {recommendations.map((rec) => (
            <option key={rec.id} value={rec.id}>
              {rec.career_name}
            </option>
          ))}
        </select>
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : undefined)}
          className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white focus:border-brand focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="rounded-[2.5rem] border border-white/70 bg-white/90 p-8 shadow-lg shadow-brand/10">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-display text-2xl text-ink">
              {editingResource ? 'Edit Resource' : 'Create New Resource'}
            </h3>
            <button
              onClick={() => {
                setShowCreateForm(false)
                setEditingResource(null)
                resetForm()
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateResource} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-ink">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Resource Type *</label>
                <select
                  value={formData.resource_type}
                  onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  required
                >
                  <option value="article">Article</option>
                  <option value="video">Video (YouTube, etc.)</option>
                  <option value="course">Course</option>
                  <option value="book">Book</option>
                  <option value="certification">Certification</option>
                  <option value="tool">Tool</option>
                  <option value="community">Community</option>
                  <option value="report">Report</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-ink">URL (for YouTube videos, articles, etc.)</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-ink">Difficulty Level *</label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  required
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Link to Recommendation</label>
                <select
                  value={formData.career_recommendation}
                  onChange={(e) => setFormData({ ...formData, career_recommendation: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="">General (All Careers)</option>
                  {recommendations.map((rec) => (
                    <option key={rec.id} value={rec.id}>
                      {rec.career_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  Free Resource
                </label>
              </div>
              {!formData.is_free && (
                <div>
                  <label className="text-sm font-medium text-ink">Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-ink">Display Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-brand px-6 py-3 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
              >
                {editingResource ? 'Update Resource' : 'Create Resource'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingResource(null)
                  resetForm()
                }}
                className="rounded-2xl border border-slate-200 px-6 py-3 font-semibold text-ink transition hover:border-brand hover:text-brand"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resources List */}
      {resources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
          <p className="text-slate-400">No resources found</p>
          <p className="mt-2 text-sm text-slate-500">Create your first resource to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getResourceTypeIcon(resource.resource_type)}</span>
                  <div>
                    <h4 className="font-semibold text-lg text-white">{resource.title}</h4>
                    {resource.category && (
                      <span className="text-xs text-slate-400">{resource.category.name}</span>
                    )}
                  </div>
                </div>
                {!resource.is_active && (
                  <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-200">Inactive</span>
                )}
              </div>

              <p className="mb-3 text-sm text-slate-300 line-clamp-2">{resource.description}</p>

              <div className="mb-3 flex flex-wrap gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${getDifficultyColor(resource.difficulty_level)}`}>
                  {resource.difficulty_level}
                </span>
                {resource.is_free ? (
                  <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-200">Free</span>
                ) : (
                  <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-200">${resource.cost}</span>
                )}
              </div>

              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 block truncate text-xs text-brand-light hover:underline"
                >
                  {resource.url}
                </a>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(resource)}
                  className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

