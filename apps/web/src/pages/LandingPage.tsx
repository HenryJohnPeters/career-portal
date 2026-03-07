import { Link } from "react-router-dom";
import {
  Sparkles,
  FileText,
  Brain,
  Mic,
  Mail,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Code2,
  Terminal,
  Crown,
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
    icon: Mic,
    title: "Interview Prep",
    free: "Run through mock interviews with structured feedback on your answers.",
    premium:
      "AI simulates a live technical interviewer and scores your responses.",
  },
  {
    icon: Sparkles,
    title: "Smart Insights",
    free: "Get a bird's-eye view of your job search progress and weak spots.",
    premium:
      "AI identifies patterns across your applications and suggests next moves.",
  },
];

const highlights = [
  "Built specifically for software developers",
  "Track every application in one place",
  "AI-powered features for Premium members",
  "Beautiful, modern dashboard experience",
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-12 lg:px-20 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Career Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/register?plan=premium"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-700 transition-all duration-200"
          >
            <Crown className="h-4 w-4" />
            Go Premium
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-all duration-200"
          >
            Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto text-center px-6 pt-20 sm:pt-28 pb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-xs font-medium text-blue-300 mb-6">
          <Terminal className="h-3.5 w-3.5" />
          The career toolkit built for developers
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          Land your next dev role,
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
            faster & smarter.
          </span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-blue-200/70 max-w-2xl mx-auto leading-relaxed">
          CVs, cover letters, job tracking, and interview prep — purpose-built
          for software engineers. Upgrade to{" "}
          <span className="text-amber-400 font-semibold">Premium</span> to
          unlock AI across every feature.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-7 py-3 text-sm font-semibold shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/register?plan=premium"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-7 py-3 text-sm font-semibold shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-700 transition-all duration-200"
          >
            <Crown className="h-4 w-4" />
            Sign Up Premium
            <Sparkles className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-7 py-3 text-sm font-semibold text-blue-200 hover:bg-white/10 transition-all duration-200"
          >
            See Features
          </a>
        </div>

        {/* Highlights */}
        <div className="mt-14 flex flex-wrap justify-center gap-x-6 gap-y-3">
          {highlights.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-sm text-blue-200/60"
            >
              <CheckCircle2 className="h-4 w-4 text-blue-400/70" />
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* Features — Free + Premium per card */}
      <section
        id="features"
        className="relative z-10 max-w-6xl mx-auto px-6 pb-16"
      >
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Everything you need to land your next role
          </h2>
          <p className="mt-3 text-blue-200/60 max-w-xl mx-auto">
            Powerful tools out of the box — supercharged with AI when you go{" "}
            <span className="text-amber-400 font-semibold">Premium</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, free, premium }) => (
            <div
              key={title}
              className="group rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] p-6 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300 flex flex-col"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/10 mb-4 group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-all duration-300">
                <Icon className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold mb-3">{title}</h3>

              {/* Free tier */}
              <div className="flex items-start gap-2 mb-2">
                <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 rounded px-1.5 py-0.5">
                  Free
                </span>
                <p className="text-sm text-blue-200/50 leading-relaxed">
                  {free}
                </p>
              </div>

              {/* Premium tier */}
              <div className="flex items-start gap-2 mt-auto">
                <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 rounded px-1.5 py-0.5">
                  AI
                </span>
                <p className="text-sm text-amber-200/50 leading-relaxed">
                  {premium}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-6 text-center text-xs text-blue-200/30">
        Career Portal &copy; {new Date().getFullYear()}. Built with ♥ for
        developers, by developers.
      </footer>
    </div>
  );
}
