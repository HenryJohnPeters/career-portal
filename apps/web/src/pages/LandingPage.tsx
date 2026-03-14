import { Link } from "react-router-dom";
import {
  Sparkles,
  FileText,
  Brain,
  Code2 as MockIcon,
  Mail,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Code2,
  Crown,
  Code,
  Target,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "CV Builder",
    free: "Build dev-focused resumes that highlight your stack, projects, and open-source contributions.",
    premium:
      "AI rewrites your bullet points for maximum impact and ATS compatibility.",
  },
  {
    icon: Mail,
    title: "Cover Letters",
    free: "Generate role-specific cover letters tailored to engineering positions.",
    premium:
      "AI analyses the job description and crafts a personalised letter in seconds.",
  },
  {
    icon: ClipboardList,
    title: "Job Tracker",
    free: "Organise your applications on a Kanban board — from applied to offer.",
    premium:
      "AI auto-extracts job details from URLs and suggests salary benchmarks.",
  },
  {
    icon: Brain,
    title: "Practice Questions",
    free: "Sharpen your skills with curated DSA, system design, and behavioural questions.",
    premium:
      "AI generates custom question sets based on the role you're targeting.",
  },
  {
    icon: MockIcon,
    title: "Interview Prep",
    free: "Run through mock interviews with structured feedback on your answers.",
    premium:
      "AI simulates a live technical interviewer and scores your responses.",
  },
  {
    icon: Code,
    title: "Mock Tests",
    free: "Work through timed technical tests across DSA, system design, and behavioural categories.",
    premium:
      "AI tailors test difficulty and question selection to your target role and weak spots.",
  },
];

const highlights = [
  "Built specifically for software developers",
  "Track every application in one place",
  "AI-powered features for Premium members",
  "Beautiful, modern dashboard experience",
];

// Real counts — one per actual page/feature in the app
const stats = [
  {
    icon: FileText,
    label: "Tools included",
    value: "6",
    sub: "CV, letters, jobs, prep & more",
  },
  {
    icon: Crown,
    label: "Premium AI features",
    value: "5+",
    sub: "Across every tool",
  },
  {
    icon: Code,
    label: "Mock test categories",
    value: "3",
    sub: "DSA, system design & behavioural",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 h-16 bg-bg-secondary/80 backdrop-blur-xl border-b border-border flex items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
              <Code2 className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-text-primary">
              Career Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/register?plan=premium"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-accent-400 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-accent-500 transition-all duration-200 active:scale-95"
            >
              <Crown className="h-3.5 w-3.5" />
              Go Premium
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-bg-secondary px-4 py-2 text-sm font-semibold text-text-primary hover:bg-bg-tertiary transition-all duration-200 active:scale-95"
            >
              Login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative max-w-6xl mx-auto text-center px-6 pt-20 sm:pt-28 pb-20 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary-500/10 dark:bg-primary-400/10 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 border border-primary-500/20 px-4 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 mb-8">
            <Target className="h-3.5 w-3.5" />
            The career toolkit built for developers
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-text-primary">
            Land your next dev role,
            <br />
            <span className="text-primary-600 dark:text-primary-400">
              faster & smarter.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-10">
            CVs, cover letters, job tracking, and interview prep — purpose-built
            for software engineers. Upgrade to{" "}
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              Premium
            </span>{" "}
            to unlock AI across every feature.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-7 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 transition-all duration-200 active:scale-95"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/register?plan=premium"
              className="inline-flex items-center gap-2 rounded-xl bg-accent-400 px-7 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-accent-500 transition-all duration-200 active:scale-95"
            >
              <Crown className="h-4 w-4" />
              Try Premium
              <Sparkles className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-bg-secondary px-7 py-3.5 text-sm font-semibold text-text-secondary hover:bg-bg-tertiary transition-all duration-200 active:scale-95"
            >
              Explore Features
            </a>
          </div>

          {/* Highlights */}
          <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-sm text-text-tertiary"
              >
                <CheckCircle2 className="h-4 w-4 text-primary-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── replaced fake numbers with real feature counts */}

      {/* ── Features ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-2">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mb-3">
            Everything you need to land your next role
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Powerful tools out of the box — supercharged with AI when you go{" "}
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              Premium
            </span>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, free, premium }) => (
            <div
              key={title}
              className="group bg-bg-elevated border border-border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10 border border-primary-500/10 mb-4 group-hover:scale-110 transition-transform duration-200">
                <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-base font-bold text-text-primary mb-4">
                {title}
              </h3>

              <div className="flex items-start gap-2 mb-3">
                <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-md px-2 py-0.5">
                  Free
                </span>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {free}
                </p>
              </div>

              <div className="flex items-start gap-2 mt-auto pt-3 border-t border-border">
                <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md px-2 py-0.5 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI
                </span>
                <p className="text-sm text-text-tertiary leading-relaxed">
                  {premium}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── sleek split layout */}
      <section className="max-w-6xl mx-auto px-2 ">
        <div className="relative overflow-hidden bg-bg-elevated border border-border rounded-3xl shadow-sm">
          {/* Accent left border */}
          <div className="absolute inset-y-0 left-0 w-1 bg-primary-600 rounded-l-3xl" />

          <div className="flex flex-col sm:flex-row items-center gap-8 px-10 py-10 sm:py-12">
            {/* Left — copy */}
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 border border-primary-500/20 px-3 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400 mb-4">
                <Target className="h-3 w-3" />
                Free to start · No credit card needed
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-3">
                Ready to land your next role?
              </h2>
              <p className="text-text-secondary leading-relaxed max-w-md">
                All six tools are free. Upgrade to{" "}
                <span className="text-accent-500 dark:text-accent-400 font-semibold">
                  Premium
                </span>{" "}
                at any time to unlock AI across every one of them.
              </p>
            </div>

            {/* Right — actions stacked */}
            <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 transition-all duration-200 active:scale-95"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register?plan=premium"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-accent-400/40 bg-accent-50 dark:bg-accent-900/10 px-8 py-3.5 text-sm font-bold text-accent-600 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-900/20 hover:border-accent-400/60 transition-all duration-200 active:scale-95"
              >
                <Crown className="h-4 w-4" />
                Start with Premium — £9.99/mo
              </Link>
              <p className="text-center text-xs text-text-tertiary flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary-500" />
                Cancel Premium anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 text-center text-sm text-text-tertiary">
        Career Portal &copy; {new Date().getFullYear()}. Built with ♥ for
        developers, by developers.
      </footer>
    </div>
  );
}
