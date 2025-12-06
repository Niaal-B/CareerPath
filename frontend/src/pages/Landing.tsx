import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Hyper-Personalized Tests',
    description: 'Admins craft fresh MCQs for every student request—no recycled question banks.',
  },
  {
    title: 'Human Insight, Not Automation',
    description: 'Responses are reviewed manually to decode motivations, strengths, and thinking styles.',
  },
  {
    title: 'Actionable Roadmaps',
    description: 'Students get clear, multi-step plans with curated resources and milestones.',
  },
]

const steps = [
  {
    title: 'Discover',
    description: 'Students share their background, interests, and request a tailored assessment.',
  },
  {
    title: 'Design',
    description: 'Admins design unique MCQs with multiple perspectives instead of right answers.',
  },
  {
    title: 'Decode',
    description: 'Selections are analyzed to uncover patterns, strengths, and learning preferences.',
  },
  {
    title: 'Deliver',
    description: 'Students receive a personalized career recommendation plus a detailed roadmap.',
  },
]

const testimonials = [
  {
    quote:
      'The roadmap felt like a mentor laid out the next 12 months for me. It made the leap from college to career feel achievable.',
    name: 'Riya Prakash',
    role: 'Engineering Undergraduate',
  },
  {
    quote:
      'As an admin, I love how intuitive it is to design subjective MCQs and track each student’s journey.',
    name: 'Neeraj Balan',
    role: 'Career Coach',
  },
]

const stats = [
  { label: 'Handcrafted MCQs delivered', value: '3.2k+' },
  { label: 'Roadmaps published', value: '1.8k+' },
  { label: 'Career mentors onboard', value: '120+' },
  { label: 'Average review time', value: '< 48h' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#EEF2FF] text-ink">
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-white via-[#EEF2FF] to-[#E0E7FF]">
        <div className="absolute inset-0 opacity-50 bg-grid-light bg-[size:36px_36px]" />
        <div className="absolute inset-x-0 -top-20 -z-10 blur-3xl">
          <div className="mx-auto h-64 w-2/3 rounded-full bg-gradient-to-r from-brand to-accent opacity-40" />
        </div>

        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/70 p-3 shadow-glass">
              <span className="font-display text-xl text-brand">CR</span>
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-ink">Career Recommendation</p>
              <p className="text-sm text-muted">Personalized guidance platform</p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
            <a className="transition hover:text-brand" href="#workflow">
              How it works
            </a>
            <a className="transition hover:text-brand" href="#features">
              Features
            </a>
            <a className="transition hover:text-brand" href="#stories">
              Stories
            </a>
            <Link
              className="rounded-full bg-ink px-5 py-2 text-sm text-white shadow-lg shadow-brand/30 transition hover:bg-brand"
              to="/auth/login"
            >
              Launch app
            </Link>
          </nav>
        </header>

        <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-24 px-6 pb-24 pt-10">
          <section className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="space-y-8">
              <p className="inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-brand shadow-lg shadow-brand/10">
                Trusted by institutes and independent career mentors
              </p>
              <div className="space-y-6">
                <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl lg:text-6xl">
                  A guidance platform that listens first—and recommends later.
                </h1>
                <p className="text-lg text-slate-600">
                  Students take subjective MCQ experiences crafted just for them. Admins interpret the
                  responses and deliver human recommendations with actionable roadmaps.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  className="rounded-full bg-brand px-8 py-3 font-semibold text-white shadow-lg shadow-brand/40 transition hover:bg-brand-dark"
                  to="/auth/register"
                >
                  Request a personalized test
                </Link>
                <Link
                  className="rounded-full border border-slate-200 px-8 py-3 font-semibold text-ink transition hover:border-brand hover:text-brand"
                  to="/auth/login"
                >
                  Explore admin workspace
                </Link>
              </div>
              <div className="flex gap-8 pt-4">
                {stats.slice(0, 2).map((stat) => (
                  <div key={stat.label}>
                    <p className="font-display text-3xl text-ink">{stat.value}</p>
                    <p className="text-sm text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
           
          </section>

          <section id="features" className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Why it works</p>
            <h2 className="font-display text-3xl text-ink">Built for meaningful career guidance</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm shadow-brand/10 backdrop-blur"
                >
                  <div className="mb-4 h-12 w-12 rounded-2xl bg-brand/10 text-2xl text-brand">
                    <span className="flex h-full w-full items-center justify-center">✦</span>
                  </div>
                  <h3 className="font-semibold text-xl text-ink">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="workflow" className="rounded-[2.5rem] border border-white/60 bg-white/80 p-10 shadow-glass backdrop-blur">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Workflow</p>
                <h2 className="font-display text-3xl text-ink">One request. One handcrafted journey.</h2>
              </div>
              <button className="rounded-full border border-ink/10 px-5 py-2 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand">
                View complete playbook
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step.title} className="rounded-3xl border border-slate-100 bg-white/70 p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted">0{index + 1}</p>
                  <h3 className="mt-4 font-semibold text-xl text-ink">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-10 md:grid-cols-2" id="stories">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Impact</p>
              <h2 className="font-display text-3xl text-ink">
                Curated insights that help students act with confidence.
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-white/60 bg-white/70 p-6 text-center">
                    <p className="font-display text-3xl text-ink">{stat.value}</p>
                    <p className="text-sm text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              {testimonials.map((testimonial) => (
                <div key={testimonial.name} className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-glass">
                  <p className="text-lg leading-relaxed text-ink">“{testimonial.quote}”</p>
                  <div className="mt-5">
                    <p className="font-semibold text-ink">{testimonial.name}</p>
                    <p className="text-sm text-muted">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="relative border-t border-white/60 bg-white/80">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div>
              <p className="font-display text-xl text-ink">Ready to craft purposeful journeys?</p>
              <p className="text-sm text-muted">Invite your first student or onboard your guidance team today.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand"
                to="/auth/register"
              >
                Book a demo
              </Link>
              <button className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand">
                Download brochure
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

