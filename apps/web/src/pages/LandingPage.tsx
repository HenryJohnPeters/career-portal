import { Link } from "react-router-dom";
import {
  Sparkles, FileText, Brain, Code2 as MockIcon, Mail,
  ClipboardList, ArrowRight, CheckCircle2, Code2, Crown,
  Code, Target, Zap,
} from "lucide-react";

const features = [
  { icon: FileText, title: "CV Builder", free: "Build dev-focused resumes that highlight your stack, projects, and open-source contributions.", premium: "AI rewrites your bullet points for maximum impact and ATS compatibility." },
  { icon: Mail, title: "Cover Letters", free: "Generate role-specific cover letters tailored to engineering positions.", premium: "AI analyses the job description and crafts a personalised letter in seconds." },
  { icon: ClipboardList, title: "Job Tracker", free: "Organise your applications on a Kanban board — from applied to offer.", premium: "AI auto-extracts job details from URLs and suggests salary benchmarks." },
  { icon: Brain, title: "Practice Questions", free: "Sharpen your skills with curated DSA, system design, and behavioural questions.", premium: "AI generates custom question sets based on the role you're targeting." },
  { icon: MockIcon, title: "Interview Prep", free: "Run through mock interviews with structured feedback on your answers.", premium: "AI simulates a live technical interviewer and scores your responses." },
  { icon: Code, title: "Mock Tests", free: "Work through timed technical tests across DSA, system design, and behavioural categories.", premium: "AI tailors test difficulty and question selection to your target role and weak spots." },
];

const highlights = [
  "Built for software developers",
  "All tools free to start",
  "AI-powered Premium features",
  "Modern dashboard experience",
];

const stats = [
  { value: "6", label: "Tools included" },
  { value: "5+", label: "AI features" },
  { value: "3", label: "Test categories" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Navbar */}
      <header className="sticky top-0 z-30 h-14 glass glass-border flex items-center">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
              <Code2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-text-primary">Career Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/register?plan=premium" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 transition-all duration-150 active:scale-95">
              <Crown className="h-3 w-3" />Go Premium
            </Link>
            <Link to="/login" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-3.5 py-1.5 text-xs font-semibold text-text-primary hover:bg-bg-tertiary transition-all duration-150 active:scale-95 shadow-sm">
              Sign in <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary-600/8 dark:bg-primary-400/6 blur-[120px] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto text-center px-5 sm:px-8 pt-20 sm:pt-28 md:pt-36 pb-16 sm:pb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 dark:border-primary-800/60 bg-primary-50 dark:bg-primary-900/20 px-3.5 py-1.5 text-xs font-semibold text-primary-700 dark:text-primary-400 mb-8">
            <Target className="h-3 w-3" />The career toolkit built for developers
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6 text-text-primary">
            Land your next dev role,<br />
            <span className="gradient-text">faster &amp; smarter.</span>
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed mb-10">
            CVs, cover letters, job tracking, and interview prep — purpose-built for software engineers. Unlock{" "}
            <span className="text-amber-600 dark:text-amber-400 font-semibold">AI features</span> with Premium.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link to="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 hover:shadow-md transition-all duration-150 active:scale-[0.97]">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register?plan=premium" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 transition-all duration-150 active:scale-[0.97]">
              <Crown className="h-4 w-4" />Try Premium <Sparkles className="h-3.5 w-3.5" />
            </Link>
            <a href="#features" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-elevated px-6 py-3 text-sm font-semibold text-text-secondary hover:bg-bg-tertiary transition-all duration-150 shadow-sm">
              Explore features
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {highlights.map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary-500 shrink-0" />{item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-bg-secondary">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 grid grid-cols-3 divide-x divide-border text-center">
          {stats.map(({ value, label }) => (
            <div key={label} className="px-4">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">{value}</p>
              <p className="text-xs sm:text-sm text-text-tertiary mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-4">
            Everything you need to land your next role
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto">
            Six powerful tools free out of the box — supercharged with AI on{" "}
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Premium</span>.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, free, premium }) => (
            <div key={title} className="group bg-bg-elevated border border-border rounded-2xl p-6 hover:border-primary-200 dark:hover:border-primary-800/60 hover:shadow-lg transition-all duration-200 flex flex-col">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/10 dark:bg-primary-500/10 mb-4 ring-1 ring-primary-600/10 dark:ring-primary-400/10">
                <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-4 tracking-tight">{title}</h3>
              <div className="flex items-start gap-2 mb-3">
                <span className="shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-widest bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-md px-2 py-0.5 ring-1 ring-border whitespace-nowrap">
                  Free
                </span>
                <p className="text-[13px] text-text-secondary leading-relaxed">{free}</p>
              </div>
              <div className="flex items-start gap-2 mt-auto pt-3 border-t border-border">
                <span className="shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-md px-2 py-0.5 ring-1 ring-amber-200/60 dark:ring-amber-700/30 whitespace-nowrap flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />AI
                </span>
                <p className="text-[13px] text-text-tertiary leading-relaxed">{premium}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
        <div className="relative overflow-hidden rounded-2xl bg-bg-elevated border border-border shadow-sm">
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary-500 to-primary-700 rounded-l-2xl" />
          <div className="flex flex-col sm:flex-row items-center gap-8 px-8 sm:px-12 py-10 sm:py-12">
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200/60 dark:border-primary-800/40 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-400 mb-4">
                <Zap className="h-3 w-3" />Free to start · No credit card needed
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-text-primary mb-3">
                Ready to land your next role?
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto sm:mx-0">
                All six tools are free forever. Upgrade to{" "}
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Premium</span>{" "}
                any time to unlock AI across every one of them.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 hover:shadow-md transition-all duration-150 active:scale-[0.97]">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/register?plan=premium" className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/60 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/10 px-7 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all duration-150 active:scale-[0.97]">
                <Crown className="h-4 w-4" />Start with Premium — £9.99/mo
              </Link>
              <p className="text-center text-[11px] text-text-tertiary flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-primary-500" />Cancel Premium anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-text-tertiary">
        Career Portal &copy; {new Date().getFullYear()} · Built for developers, by developers.
      </footer>
    </div>
  );
}
