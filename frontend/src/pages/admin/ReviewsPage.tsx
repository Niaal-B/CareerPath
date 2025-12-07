import { useEffect, useState } from 'react'

import {
  createJobRecommendation,
  createRecommendation,
  fetchCompanies,
  fetchCompanyCategories,
  fetchCompletedTests,
  fetchJobRecommendations,
  fetchTestAnswers,
  type Company,
  type CompanyCategory,
  type JobRecommendation,
} from '../../services/dashboard'

type CompletedTest = {
  id: number
  request_id: number
  student: {
    email: string
    qualification: string
    interests: string
  }
  completed_at: string
  questions_count: number
  has_recommendation: boolean
}

type Answer = {
  question: {
    id: number
    prompt: string
    order: number
  }
  options: Array<{
    id: number
    label: string
    description: string
    order: number
  }>
  selected_answer: {
    option_id: number
    option_label: string
  } | null
}

type TestAnswers = {
  test: {
    id: number
    request_id: number
    student: {
      email: string
      qualification: string
      interests: string
    }
    completed_at: string
    answers: Answer[]
  }
}

export default function ReviewsPage() {
  const [tests, setTests] = useState<CompletedTest[]>([])
  const [selectedTest, setSelectedTest] = useState<TestAnswers | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAnswers, setLoadingAnswers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRecommendationForm, setShowRecommendationForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [recommendation, setRecommendation] = useState({
    career_name: '',
    summary: '',
    companies: '',
    steps: [{ order: 1, title: '', description: '' }],
  })
  const [createdRecommendationId, setCreatedRecommendationId] = useState<number | null>(null)
  const [showCompanyJobForm, setShowCompanyJobForm] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyCategories, setCompanyCategories] = useState<CompanyCategory[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([])
  const [companySearchFilter, setCompanySearchFilter] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | undefined>()
  // Company creation form state (currently unused, but kept for future use)
  // const [showCompanyForm, setShowCompanyForm] = useState(false)
  // const [newCompany, setNewCompany] = useState({
  //   name: '',
  //   email: '',
  //   website: '',
  //   description: '',
  //   location: '',
  //   industry: '',
  //   category_id: undefined as number | undefined,
  // })
  // const [creatingCompany, setCreatingCompany] = useState(false)
  const [newJob, setNewJob] = useState<{
    company: number
    job_title: string
    job_description: string
    requirements: string
    salary_range: string
    job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote'
    application_url: string
  }>({
    company: 0,
    job_title: '',
    job_description: '',
    requirements: '',
    salary_range: '',
    job_type: 'full_time',
    application_url: '',
  })
  const [creatingJob, setCreatingJob] = useState(false)
  const [existingJobs, setExistingJobs] = useState<JobRecommendation[]>([])

  useEffect(() => {
    const loadTests = async () => {
      try {
        setLoading(true)
        const data = await fetchCompletedTests()
        setTests(data.tests || [])
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } }
        setError(error?.response?.data?.detail || 'Unable to load completed tests.')
      } finally {
        setLoading(false)
      }
    }
    loadTests()
  }, [])

  const handleViewAnswers = async (testId: number) => {
    try {
      setLoadingAnswers(true)
      const data = await fetchTestAnswers(testId)
      setSelectedTest(data)
      setShowRecommendationForm(false)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Unable to load test answers.')
    } finally {
      setLoadingAnswers(false)
    }
  }

  const handleAddStep = () => {
    setRecommendation((prev) => ({
      ...prev,
      steps: [...prev.steps, { order: prev.steps.length + 1, title: '', description: '' }],
    }))
  }

  const handleRemoveStep = (index: number) => {
    setRecommendation((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i + 1 })),
    }))
  }

  const handleUpdateStep = (index: number, field: 'title' | 'description', value: string) => {
    setRecommendation((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) => (i === index ? { ...step, [field]: value } : step)),
    }))
  }

  const handleCreateRecommendation = async () => {
    if (!selectedTest || !recommendation.career_name.trim() || !recommendation.summary.trim()) {
      setError('Please fill in career name and summary.')
      return
    }
    
    // Format companies from selected company IDs
    const selectedCompanyNames = selectedCompanyIds
      .map(id => {
        const company = companies.find(c => c.id === id)
        return company?.name
      })
      .filter(Boolean) as string[]
    
    const formattedRecommendation = {
      ...recommendation,
      companies: selectedCompanyNames.length > 0 
        ? selectedCompanyNames.join('\n')
        : recommendation.companies
            .split('\n')
            .map(company => company.trim())
            .filter(company => company.length > 0)
            .join('\n')
    }
    if (recommendation.steps.some((step) => !step.title.trim())) {
      setError('Please fill in all step titles.')
      return
    }
    try {
      setCreating(true)
      const result = await createRecommendation(selectedTest.test.id, formattedRecommendation)
      setCreatedRecommendationId(result.recommendation.id)
      setShowRecommendationForm(false)
      setShowCompanyJobForm(true)
      setError(null)
      // Load companies and existing jobs
      await loadCompanies()
      await loadCompanyCategories()
      if (result.recommendation.id) {
        await loadJobs(result.recommendation.id)
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; detail?: string } } }
      setError(error?.response?.data?.error || error?.response?.data?.detail || 'Failed to create recommendation.')
    } finally {
      setCreating(false)
    }
  }

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true)
      const data = await fetchCompanies(false)
      setCompanies(data || [])
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Failed to load companies.')
    } finally {
      setLoadingCompanies(false)
    }
  }

  const loadCompanyCategories = async () => {
    try {
      setLoadingCategories(true)
      const data = await fetchCompanyCategories(false)
      setCompanyCategories(data || [])
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Failed to load company categories.')
    } finally {
      setLoadingCategories(false)
    }
  }


  const loadJobs = async (recommendationId: number) => {
    try {
      const data = await fetchJobRecommendations(recommendationId)
      setExistingJobs(data || [])
    } catch {
      // Silently fail, jobs might not exist yet
    }
  }

  // Company creation handler (currently unused, but kept for future use)
  // const handleCreateCompany = async () => {
  //   if (!newCompany.name.trim() || !newCompany.email.trim()) {
  //     setError('Please fill in company name and email.')
  //     return
  //   }
  //   try {
  //     setCreatingCompany(true)
  //     const company = await createCompany(newCompany)
  //     setCompanies((prev) => [...prev, company])
  //     setNewCompany({ name: '', email: '', website: '', description: '', location: '', industry: '', category_id: undefined })
  //     setShowCompanyForm(false)
  //     setError(null)
  //     await loadCompanies()
  //   } catch (err: unknown) {
  //     const error = err as { response?: { data?: { error?: string; detail?: string } } }
  //     setError(error?.response?.data?.error || error?.response?.data?.detail || 'Failed to create company.')
  //   } finally {
  //     setCreatingCompany(false)
  //   }
  // }

  const toggleCompanySelection = (companyId: number) => {
    setSelectedCompanyIds((prev) => {
      if (prev.includes(companyId)) {
        return prev.filter(id => id !== companyId)
      } else {
        return [...prev, companyId]
      }
    })
  }

  // Helper to get category ID from company (handles both category_id and category.id)
  const getCompanyCategoryId = (company: Company): number | undefined => {
    return company.category_id ?? company.category?.id
  }

  const getCompaniesByCategory = (categoryId?: number) => {
    let filtered = companies
    
    // Filter by category - handle both number and undefined/null cases
    if (categoryId === undefined || categoryId === null) {
      // Companies without a category
      filtered = filtered.filter(c => {
        const catId = getCompanyCategoryId(c)
        return !catId || catId === null || catId === undefined
      })
    } else {
      // Companies in a specific category - ensure proper comparison
      filtered = filtered.filter(c => {
        const catId = getCompanyCategoryId(c)
        return catId !== undefined && catId !== null && Number(catId) === Number(categoryId)
      })
    }
    
    // Filter by search term
    if (companySearchFilter.trim()) {
      const searchLower = companySearchFilter.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.location?.toLowerCase().includes(searchLower) ||
        c.industry?.toLowerCase().includes(searchLower)
      )
    }
    
    return filtered
  }
  
  const getAllFilteredCompanies = () => {
    let filtered = companies
    
    // Filter by selected category
    if (selectedCategoryFilter !== undefined && selectedCategoryFilter !== null) {
      filtered = filtered.filter(c => {
        const catId = getCompanyCategoryId(c)
        return catId !== undefined && catId !== null && Number(catId) === Number(selectedCategoryFilter)
      })
    }
    
    // Filter by search term
    if (companySearchFilter.trim()) {
      const searchLower = companySearchFilter.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.location?.toLowerCase().includes(searchLower) ||
        c.industry?.toLowerCase().includes(searchLower)
      )
    }
    
    return filtered
  }

  const handleCreateJob = async () => {
    if (!createdRecommendationId || !newJob.company || !newJob.job_title.trim() || !newJob.job_description.trim()) {
      setError('Please fill in company, job title, and job description.')
      return
    }
    try {
      setCreatingJob(true)
      await createJobRecommendation({
        career_recommendation: createdRecommendationId,
        ...newJob,
      })
      setNewJob({
        company: 0,
        job_title: '',
        job_description: '',
        requirements: '',
        salary_range: '',
        job_type: 'full_time',
        application_url: '',
      })
      if (createdRecommendationId) {
        await loadJobs(createdRecommendationId)
      }
      setError(null)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; detail?: string } } }
      setError(error?.response?.data?.error || error?.response?.data?.detail || 'Failed to create job recommendation.')
    } finally {
      setCreatingJob(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
      </div>
    )
  }

  if (error && !selectedTest) {
    return (
      <div className="rounded-[2.5rem] border border-red-500/20 bg-red-500/10 p-6 text-center">
        <p className="text-red-200">{error}</p>
      </div>
    )
  }

  if (selectedTest) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              onClick={() => {
                setSelectedTest(null)
                setShowRecommendationForm(false)
                setError(null)
              }}
              className="mb-4 text-sm text-slate-300 hover:text-white"
            >
              ← Back to reviews
            </button>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-light">Review studio</p>
            <h3 className="font-display text-2xl text-white">Test answers</h3>
            <p className="mt-1 text-sm text-slate-300">Student: {selectedTest.test.student.email}</p>
          </div>
          {!showRecommendationForm && (
            <button
              onClick={async () => {
                setShowRecommendationForm(true)
                await loadCompanyCategories()
                await loadCompanies()
              }}
              className="rounded-full border border-brand bg-brand/20 px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand/30"
            >
              Create recommendation
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {showRecommendationForm ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30">
              <h4 className="mb-4 text-lg font-semibold text-white">Create career recommendation</h4>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Career name</label>
                  <input
                    type="text"
                    value={recommendation.career_name}
                    onChange={(e) => setRecommendation((prev) => ({ ...prev, career_name: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Select Companies</label>
                  {loadingCategories || loadingCompanies ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
                      Loading companies...
                    </div>
                  ) : companyCategories.length > 0 ? (
                    <div className="space-y-4">
                      {/* Search and Filter Controls */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs text-slate-300">Search Companies</label>
                          <input
                            type="text"
                            value={companySearchFilter}
                            onChange={(e) => setCompanySearchFilter(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                            placeholder="Search by name, email, location..."
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-300">Filter by Category</label>
                          <select
                            value={selectedCategoryFilter || ''}
                            onChange={(e) => setSelectedCategoryFilter(e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                          >
                            <option value="">All Categories</option>
                            {companyCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.icon && `${category.icon} `}{category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Display Companies */}
                      {selectedCategoryFilter !== undefined && selectedCategoryFilter !== null ? (
                        // Show only selected category
                        (() => {
                          const category = companyCategories.find(c => c.id === selectedCategoryFilter)
                          const categoryCompanies = getCompaniesByCategory(selectedCategoryFilter)
                          
                          // Also check for companies without category if search is active
                          const uncategorizedCompanies = selectedCategoryFilter === null ? getCompaniesByCategory(undefined) : []
                          
                          if (!category && uncategorizedCompanies.length === 0) {
                            return (
                              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center text-sm text-slate-400">
                                No companies found in this category.
                              </div>
                            )
                          }
                          
                          if (categoryCompanies.length === 0 && uncategorizedCompanies.length === 0) {
                            return (
                              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center text-sm text-slate-400">
                                No companies found matching your filters.
                              </div>
                            )
                          }
                          
                          return (
                            <>
                              {category && categoryCompanies.length > 0 && (
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                  <div className="mb-3 flex items-center gap-2">
                                    {category.icon && <span className="text-lg">{category.icon}</span>}
                                    <h5 className="text-sm font-semibold text-white">{category.name}</h5>
                                    <span className="text-xs text-slate-400">({categoryCompanies.length})</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {categoryCompanies.map((company) => {
                                      const isSelected = selectedCompanyIds.includes(company.id)
                                      return (
                                        <button
                                          key={company.id}
                                          type="button"
                                          onClick={() => toggleCompanySelection(company.id)}
                                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                            isSelected
                                              ? 'border-brand bg-brand/20 text-brand-light'
                                              : 'border-white/20 bg-black/30 text-slate-300 hover:border-white/40 hover:bg-black/40'
                                          }`}
                                        >
                                          {company.name}
                                          {isSelected && ' ✓'}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              {uncategorizedCompanies.length > 0 && (
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                  <div className="mb-3 flex items-center gap-2">
                                    <h5 className="text-sm font-semibold text-white">Other Companies</h5>
                                    <span className="text-xs text-slate-400">({uncategorizedCompanies.length})</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {uncategorizedCompanies.map((company) => {
                                      const isSelected = selectedCompanyIds.includes(company.id)
                                      return (
                                        <button
                                          key={company.id}
                                          type="button"
                                          onClick={() => toggleCompanySelection(company.id)}
                                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                            isSelected
                                              ? 'border-brand bg-brand/20 text-brand-light'
                                              : 'border-white/20 bg-black/30 text-slate-300 hover:border-white/40 hover:bg-black/40'
                                          }`}
                                        >
                                          {company.name}
                                          {isSelected && ' ✓'}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </>
                          )
                        })()
                      ) : (
                        // Show all categories
                        <>
                          {companyCategories.map((category) => {
                            const categoryCompanies = getCompaniesByCategory(category.id)
                            if (categoryCompanies.length === 0) return null
                            return (
                              <div key={category.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <div className="mb-3 flex items-center gap-2">
                                  {category.icon && <span className="text-lg">{category.icon}</span>}
                                  <h5 className="text-sm font-semibold text-white">{category.name}</h5>
                                  <span className="text-xs text-slate-400">({categoryCompanies.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {categoryCompanies.map((company) => {
                                    const isSelected = selectedCompanyIds.includes(company.id)
                                    return (
                                      <button
                                        key={company.id}
                                        type="button"
                                        onClick={() => toggleCompanySelection(company.id)}
                                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                          isSelected
                                            ? 'border-brand bg-brand/20 text-brand-light'
                                            : 'border-white/20 bg-black/30 text-slate-300 hover:border-white/40 hover:bg-black/40'
                                        }`}
                                      >
                                        {company.name}
                                        {isSelected && ' ✓'}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                          {/* Companies without category */}
                          {getCompaniesByCategory().length > 0 && (
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <h5 className="text-sm font-semibold text-white">Other Companies</h5>
                                <span className="text-xs text-slate-400">({getCompaniesByCategory().length})</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {getCompaniesByCategory().map((company) => {
                                  const isSelected = selectedCompanyIds.includes(company.id)
                                  return (
                                    <button
                                      key={company.id}
                                      type="button"
                                      onClick={() => toggleCompanySelection(company.id)}
                                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                        isSelected
                                          ? 'border-brand bg-brand/20 text-brand-light'
                                          : 'border-white/20 bg-black/30 text-slate-300 hover:border-white/40 hover:bg-black/40'
                                      }`}
                                    >
                                      {company.name}
                                      {isSelected && ' ✓'}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      {getAllFilteredCompanies().length === 0 && (companySearchFilter || selectedCategoryFilter !== undefined) && (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center text-sm text-slate-400">
                          No companies found matching your filters.
                        </div>
                      )}
                      
                      {selectedCompanyIds.length > 0 && (
                        <div className="rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-xs text-brand-light">
                          {selectedCompanyIds.length} company{selectedCompanyIds.length !== 1 ? 'ies' : ''} selected
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={recommendation.companies}
                        onChange={(e) => setRecommendation((prev) => ({ ...prev, companies: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                        rows={3}
                        placeholder="Google\nMicrosoft\nAmazon"
                      />
                      <p className="text-xs text-slate-400">Enter one company name per line (or create categories in admin panel)</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Summary</label>
                  <textarea
                    value={recommendation.summary}
                    onChange={(e) => setRecommendation((prev) => ({ ...prev, summary: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-brand focus:outline-none"
                    rows={4}
                    placeholder="Explain why this career is a good fit..."
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Roadmap steps</label>
                    <button
                      onClick={handleAddStep}
                      className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      + Add step
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recommendation.steps.map((step, index) => (
                      <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs text-slate-400">Step {step.order}</span>
                          {recommendation.steps.length > 1 && (
                            <button
                              onClick={() => handleRemoveStep(index)}
                              className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-200 transition hover:bg-red-500/20"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleUpdateStep(index, 'title', e.target.value)}
                          className="mb-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                          placeholder="Step title"
                        />
                        <textarea
                          value={step.description}
                          onChange={(e) => handleUpdateStep(index, 'description', e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                          rows={2}
                          placeholder="Step description"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateRecommendation}
                    disabled={creating}
                    className="rounded-full border border-brand bg-brand/20 px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand/30 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create recommendation'}
                  </button>
                  <button
                    onClick={() => setShowRecommendationForm(false)}
                    className="rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : showCompanyJobForm ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-4">
              <p className="text-green-200">✓ Recommendation created successfully! Now add companies and jobs.</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">Add Companies & Jobs</h4>
                <button
                  onClick={() => {
                    setShowCompanyJobForm(false)
                    const data = fetchCompletedTests()
                    data.then((result) => {
                      setTests(result.tests || [])
                      setSelectedTest(null)
                      setCreatedRecommendationId(null)
                      setRecommendation({
                        career_name: '',
                        summary: '',
                        companies: '',
                        steps: [{ order: 1, title: '', description: '' }],
                      })
                      setSelectedCompanyIds([])
                      setCompanySearchFilter('')
                      setSelectedCategoryFilter(undefined)
                    })
                  }}
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Done
                </button>
              </div>

              {/* Company Management */}
              {/* <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-white">Companies</h5>
                  <button
                    onClick={() => {
                      setShowCompanyForm(!showCompanyForm)
                      if (!showCompanyForm) {
                        loadCompanies()
                      }
                    }}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    {showCompanyForm ? 'Cancel' : '+ New Company'}
                  </button>
                </div>

                {showCompanyForm && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs text-slate-300">Company Name *</label>
                        <input
                          type="text"
                          value={newCompany.name}
                          onChange={(e) => setNewCompany((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                          placeholder="Company name"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-300">Email *</label>
                        <input
                          type="email"
                          value={newCompany.email}
                          onChange={(e) => setNewCompany((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                          placeholder="contact@company.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs text-slate-300">Website</label>
                        <input
                          type="url"
                          value={newCompany.website}
                          onChange={(e) => setNewCompany((prev) => ({ ...prev, website: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-300">Category</label>
                        <select
                          value={newCompany.category_id || ''}
                          onChange={(e) => setNewCompany((prev) => ({ ...prev, category_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                          onClick={loadCompanyCategories}
                        >
                          <option value="">No category</option>
                          {companyCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.icon && `${category.icon} `}{category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-300">Industry</label>
                        <input
                          type="text"
                          value={newCompany.industry}
                          onChange={(e) => setNewCompany((prev) => ({ ...prev, industry: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                          placeholder="e.g., Technology"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Location</label>
                      <input
                        type="text"
                        value={newCompany.location}
                        onChange={(e) => setNewCompany((prev) => ({ ...prev, location: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Description</label>
                      <textarea
                        value={newCompany.description}
                        onChange={(e) => setNewCompany((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                        rows={2}
                        placeholder="Company description"
                      />
                    </div>
                    <button
                      onClick={handleCreateCompany}
                      disabled={creatingCompany}
                      className="w-full rounded-xl border border-brand bg-brand/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/30 disabled:opacity-50"
                    >
                      {creatingCompany ? 'Creating...' : 'Create Company'}
                    </button>
                  </div>
                )}

                {loadingCompanies ? (
                  <p className="text-sm text-slate-400">Loading companies...</p>
                ) : companies.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="mb-2 text-xs text-slate-400">Available Companies ({companies.length})</p>
                    <div className="max-h-32 space-y-1 overflow-y-auto">
                      {companies.map((company) => (
                        <div key={company.id} className="rounded-lg border border-white/5 bg-black/30 px-2 py-1 text-xs text-white">
                          {company.name} - {company.email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div> */}

              {/* Job Recommendation Form */}
              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-white">Add Job Recommendation</h5>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Company *</label>
                    <select
                      value={newJob.company}
                      onChange={(e) => setNewJob((prev) => ({ ...prev, company: parseInt(e.target.value) }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                      onClick={() => {
                        loadCompanies()
                        loadCompanyCategories()
                      }}
                    >
                      <option value={0}>Select a company</option>
                      {companyCategories.length > 0 ? (
                        <>
                          {companyCategories.map((category) => {
                            const categoryCompanies = getCompaniesByCategory(category.id)
                            if (categoryCompanies.length === 0) return null
                            return (
                              <optgroup key={category.id} label={`${category.icon ? category.icon + ' ' : ''}${category.name}`}>
                                {categoryCompanies.map((company) => (
                                  <option key={company.id} value={company.id}>
                                    {company.name}
                                  </option>
                                ))}
                              </optgroup>
                            )
                          })}
                          {getCompaniesByCategory().length > 0 && (
                            <optgroup label="Other Companies">
                              {getCompaniesByCategory().map((company) => (
                                <option key={company.id} value={company.id}>
                                  {company.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </>
                      ) : (
                        companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Job Title *</label>
                    <input
                      type="text"
                      value={newJob.job_title}
                      onChange={(e) => setNewJob((prev) => ({ ...prev, job_title: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Job Description *</label>
                    <textarea
                      value={newJob.job_description}
                      onChange={(e) => setNewJob((prev) => ({ ...prev, job_description: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                      rows={3}
                      placeholder="Describe the job position..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Job Type</label>
                      <select
                        value={newJob.job_type}
                        onChange={(e) => setNewJob((prev) => ({ ...prev, job_type: e.target.value as 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote' }))}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                      >
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                        <option value="remote">Remote</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Salary Range</label>
                      <input
                        type="text"
                        value={newJob.salary_range}
                        onChange={(e) => setNewJob((prev) => ({ ...prev, salary_range: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                        placeholder="e.g., $50k - $80k"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Requirements</label>
                    <textarea
                      value={newJob.requirements}
                      onChange={(e) => setNewJob((prev) => ({ ...prev, requirements: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                      rows={2}
                      placeholder="Job requirements..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Application URL</label>
                    <input
                      type="url"
                      value={newJob.application_url}
                      onChange={(e) => setNewJob((prev) => ({ ...prev, application_url: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                      placeholder="https://..."
                    />
                  </div>
                  <button
                    onClick={handleCreateJob}
                    disabled={creatingJob}
                    className="w-full rounded-xl border border-brand bg-brand/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/30 disabled:opacity-50"
                  >
                    {creatingJob ? 'Adding...' : 'Add Job Recommendation'}
                  </button>
                </div>

                {existingJobs.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="mb-3 text-xs font-semibold text-slate-300">Added Jobs ({existingJobs.length})</p>
                    <div className="space-y-2">
                      {existingJobs.map((job) => (
                        <div key={job.id} className="rounded-lg border border-white/5 bg-black/30 p-2 text-xs text-white">
                          <p className="font-semibold">{job.job_title} at {job.company.name}</p>
                          <p className="text-slate-400">{job.job_type.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedTest.test.answers.map((answer) => (
              <div key={answer.question.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30">
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-400">
                  Question {answer.question.order + 1}
                </p>
                <h4 className="mb-4 text-lg font-semibold text-white">{answer.question.prompt}</h4>
                <div className="space-y-2">
                  {answer.options.map((option) => {
                    const isSelected = answer.selected_answer?.option_id === option.id
                    return (
                      <div
                        key={option.id}
                        className={`rounded-2xl border p-3 ${
                          isSelected
                            ? 'border-brand bg-brand/20'
                            : 'border-white/10 bg-black/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                              isSelected ? 'border-brand bg-brand' : 'border-slate-400'
                            }`}
                          >
                            {isSelected && <div className="h-full w-full rounded-full bg-white" />}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${isSelected ? 'text-brand-light' : 'text-slate-200'}`}>
                              {option.label}
                            </p>
                            {option.description && (
                              <p className="mt-1 text-xs text-slate-400">{option.description}</p>
                            )}
                          </div>
                          {isSelected && (
                            <span className="rounded-full bg-brand/30 px-2 py-1 text-xs font-semibold text-brand-light">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-light">Review studio</p>
          <h3 className="font-display text-2xl text-white">Answer decoding queue</h3>
        </div>
        <p className="text-sm text-slate-300">{tests.length} completed test{tests.length !== 1 ? 's' : ''}</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {tests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-slate-300">
          <p className="text-sm uppercase tracking-[0.3em]">No completed tests</p>
          <p className="mt-2">Completed tests will appear here for review.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((test) => (
            <div
              key={test.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Test #{test.id}</p>
              <p className="mt-2 font-semibold text-xl text-white">{test.student.email}</p>
              <p className="text-sm text-slate-300">
                {test.questions_count} question{test.questions_count !== 1 ? 's' : ''} · Completed{' '}
                {formatDate(test.completed_at)}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleViewAnswers(test.id)}
                  disabled={loadingAnswers}
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  {loadingAnswers ? 'Loading...' : 'View answers'}
                </button>
                {test.has_recommendation && (
                  <span className="rounded-full bg-green-500/20 px-4 py-2 text-xs font-semibold text-green-200">
                    Recommendation created
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
