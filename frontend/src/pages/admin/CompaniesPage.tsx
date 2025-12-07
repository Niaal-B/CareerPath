import { useEffect, useState } from 'react'

import {
  createCompany,
  createCompanyCategory,
  deleteCompany,
  deleteCompanyCategory,
  fetchCompanies,
  fetchCompanyCategories,
  updateCompany,
  updateCompanyCategory,
  type Company,
  type CompanyCategory,
} from '../../services/dashboard'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [categories, setCategories] = useState<CompanyCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Category management
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CompanyCategory | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    icon: '',
    order: 0,
  })
  
  // Company management
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | undefined>()
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    email: '',
    website: '',
    description: '',
    location: '',
    industry: '',
    category_id: undefined as number | undefined,
  })

  useEffect(() => {
    loadData()
  }, [selectedCategoryFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load categories
      const categoriesData = await fetchCompanyCategories(true) // Include inactive for admin
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])

      // Load companies
      const companiesData = await fetchCompanies(true, selectedCategoryFilter)
      setCompanies(Array.isArray(companiesData) ? companiesData : [])
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Unable to load data.')
    } finally {
      setLoading(false)
    }
  }

  // Category handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      const payload = {
        name: categoryFormData.name,
        description: categoryFormData.description || undefined,
        icon: categoryFormData.icon || undefined,
        order: categoryFormData.order,
      }

      if (editingCategory) {
        await updateCompanyCategory(editingCategory.id, payload)
      } else {
        await createCompanyCategory(payload)
      }

      setShowCategoryForm(false)
      setEditingCategory(null)
      resetCategoryForm()
      loadData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Failed to save category.')
    }
  }

  const handleEditCategory = (category: CompanyCategory) => {
    setEditingCategory(category)
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      order: category.order,
    })
    setShowCategoryForm(true)
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!window.confirm('Are you sure you want to delete this category? Companies in this category will be unassigned.')) return
    try {
      await deleteCompanyCategory(categoryId)
      loadData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Failed to delete category.')
    }
  }

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      icon: '',
      order: 0,
    })
  }

  // Company handlers
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyFormData.name.trim() || !companyFormData.email.trim()) {
      setError('Please fill in company name and email.')
      return
    }
    try {
      setError(null)
      const payload = {
        name: companyFormData.name,
        email: companyFormData.email,
        website: companyFormData.website || undefined,
        description: companyFormData.description || undefined,
        location: companyFormData.location || undefined,
        industry: companyFormData.industry || undefined,
        category_id: companyFormData.category_id,
      }

      if (editingCompany) {
        await updateCompany(editingCompany.id, payload)
      } else {
        await createCompany(payload)
      }

      setShowCompanyForm(false)
      setEditingCompany(null)
      resetCompanyForm()
      loadData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Failed to save company.')
    }
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company)
    setCompanyFormData({
      name: company.name,
      email: company.email,
      website: company.website || '',
      description: company.description || '',
      location: company.location || '',
      industry: company.industry || '',
      category_id: company.category_id,
    })
    setShowCompanyForm(true)
  }

  const handleDeleteCompany = async (companyId: number) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return
    try {
      await deleteCompany(companyId)
      loadData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Failed to delete company.')
    }
  }

  const resetCompanyForm = () => {
    setCompanyFormData({
      name: '',
      email: '',
      website: '',
      description: '',
      location: '',
      industry: '',
      category_id: undefined,
    })
  }

  const getCompaniesByCategory = (categoryId?: number) => {
    if (categoryId === undefined) {
      return companies.filter(c => !c.category_id)
    }
    return companies.filter(c => c.category_id === categoryId)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-light">Company Management</p>
          <h3 className="font-display text-2xl text-white">Companies & Categories</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowCategoryForm(true)
              setEditingCategory(null)
              resetCategoryForm()
            }}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            + New Category
          </button>
          <button
            onClick={() => {
              setShowCompanyForm(true)
              setEditingCompany(null)
              resetCompanyForm()
            }}
            className="rounded-full border border-brand bg-brand/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/30"
          >
            + New Company
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Category Form */}
      {showCategoryForm && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h4>
            <button
              onClick={() => {
                setShowCategoryForm(false)
                setEditingCategory(null)
                resetCategoryForm()
              }}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Name *</label>
              <input
                type="text"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                placeholder="e.g., Technology"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Description</label>
              <textarea
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                rows={2}
                placeholder="Category description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Icon</label>
                <input
                  type="text"
                  value={categoryFormData.icon}
                  onChange={(e) => setCategoryFormData((prev) => ({ ...prev, icon: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                  placeholder="e.g., 💻 or tech"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Order</label>
                <input
                  type="number"
                  value={categoryFormData.order}
                  onChange={(e) => setCategoryFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-full border border-brand bg-brand/20 px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand/30"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryForm(false)
                  setEditingCategory(null)
                  resetCategoryForm()
                }}
                className="rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Company Form */}
      {showCompanyForm && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">
              {editingCompany ? 'Edit Company' : 'Create Company'}
            </h4>
            <button
              onClick={() => {
                setShowCompanyForm(false)
                setEditingCompany(null)
                resetCompanyForm()
              }}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Company Name *</label>
                <input
                  type="text"
                  value={companyFormData.name}
                  onChange={(e) => setCompanyFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                  placeholder="Company name"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Email *</label>
                <input
                  type="email"
                  value={companyFormData.email}
                  onChange={(e) => setCompanyFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                  placeholder="contact@company.com"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Website</label>
                <input
                  type="url"
                  value={companyFormData.website}
                  onChange={(e) => setCompanyFormData((prev) => ({ ...prev, website: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Category</label>
                <select
                  value={companyFormData.category_id || ''}
                  onChange={(e) => setCompanyFormData((prev) => ({ ...prev, category_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                >
                  <option value="">No category</option>
                  {categories.filter(c => c.is_active).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon && `${category.icon} `}{category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Location</label>
                <input
                  type="text"
                  value={companyFormData.location}
                  onChange={(e) => setCompanyFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Industry</label>
                <input
                  type="text"
                  value={companyFormData.industry}
                  onChange={(e) => setCompanyFormData((prev) => ({ ...prev, industry: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                  placeholder="e.g., Technology"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Description</label>
              <textarea
                value={companyFormData.description}
                onChange={(e) => setCompanyFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                rows={3}
                placeholder="Company description"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-full border border-brand bg-brand/20 px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand/30"
              >
                {editingCompany ? 'Update Company' : 'Create Company'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCompanyForm(false)
                  setEditingCompany(null)
                  resetCompanyForm()
                }}
                className="rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">Categories ({categories.length})</h4>
          <select
            value={selectedCategoryFilter || ''}
            onChange={(e) => setSelectedCategoryFilter(e.target.value ? parseInt(e.target.value) : undefined)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon && `${category.icon} `}{category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`rounded-2xl border p-4 ${
                category.is_active
                  ? 'border-white/10 bg-black/20'
                  : 'border-slate-500/30 bg-slate-500/10 opacity-60'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {category.icon && <span className="text-xl">{category.icon}</span>}
                  <h5 className="font-semibold text-white">{category.name}</h5>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-white transition hover:bg-white/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-200 transition hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {category.description && (
                <p className="mb-2 text-xs text-slate-400">{category.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>Order: {category.order}</span>
                <span>Companies: {category.companies_count || 0}</span>
                <span className={category.is_active ? 'text-green-400' : 'text-red-400'}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-slate-300">
              <p className="text-sm">No categories yet. Create one to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Companies List */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">Companies ({companies.length})</h4>
        </div>
        <div className="space-y-4">
          {categories.length > 0 && (
            <>
              {categories
                .filter((cat) => !selectedCategoryFilter || cat.id === selectedCategoryFilter)
                .map((category) => {
                  const categoryCompanies = getCompaniesByCategory(category.id)
                  if (categoryCompanies.length === 0 && selectedCategoryFilter !== category.id) return null
                  return (
                    <div key={category.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        {category.icon && <span className="text-lg">{category.icon}</span>}
                        <h5 className="font-semibold text-white">{category.name}</h5>
                        <span className="text-xs text-slate-400">({categoryCompanies.length})</span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {categoryCompanies.map((company) => (
                          <div
                            key={company.id}
                            className={`rounded-xl border p-3 ${
                              company.is_active
                                ? 'border-white/10 bg-black/30'
                                : 'border-slate-500/30 bg-slate-500/10 opacity-60'
                            }`}
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <div>
                                <h6 className="font-semibold text-white">{company.name}</h6>
                                <p className="text-xs text-slate-400">{company.email}</p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditCompany(company)}
                                  className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-white transition hover:bg-white/10"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCompany(company.id)}
                                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-200 transition hover:bg-red-500/20"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            {company.location && (
                              <p className="text-xs text-slate-400">📍 {company.location}</p>
                            )}
                            {company.industry && (
                              <p className="text-xs text-slate-400">🏢 {company.industry}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              {/* Companies without category */}
              {(!selectedCategoryFilter || selectedCategoryFilter === undefined) && getCompaniesByCategory().length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <h5 className="font-semibold text-white">Other Companies</h5>
                    <span className="text-xs text-slate-400">({getCompaniesByCategory().length})</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {getCompaniesByCategory().map((company) => (
                      <div
                        key={company.id}
                        className={`rounded-xl border p-3 ${
                          company.is_active
                            ? 'border-white/10 bg-black/30'
                            : 'border-slate-500/30 bg-slate-500/10 opacity-60'
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <h6 className="font-semibold text-white">{company.name}</h6>
                            <p className="text-xs text-slate-400">{company.email}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditCompany(company)}
                              className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-white transition hover:bg-white/10"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCompany(company.id)}
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-200 transition hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {company.location && (
                          <p className="text-xs text-slate-400">📍 {company.location}</p>
                        )}
                        {company.industry && (
                          <p className="text-xs text-slate-400">🏢 {company.industry}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {companies.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-slate-300">
              <p className="text-sm">No companies yet. Create one to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

