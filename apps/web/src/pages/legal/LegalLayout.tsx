import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Code2 } from "lucide-react";
import { useAuth } from "../../lib/auth";

export const LEGAL_LAST_UPDATED = "15 October 2026";
export const LEGAL_CONTACT_EMAIL = "support@career-repo.com";

/** Body text styles; links, lists and emphasis inside the content need no classes. */
const PROSE =
  "space-y-3 text-[15px] leading-relaxed text-text-secondary [&_a]:font-medium [&_a]:text-primary-700 [&_a]:underline dark:[&_a]:text-primary-300 [&_li]:pl-1 [&_strong]:text-text-primary [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface LegalLayoutProps {
  title: string;
  intro: ReactNode;
  sections: readonly LegalSection[];
}

/** Shared layout for the privacy policy and terms: header, contents list, numbered sections. */
export function LegalLayout({ title, intro, sections }: LegalLayoutProps) {
  const { isAuthenticated } = useAuth();
  const back = isAuthenticated ? { to: "/app/dashboard", label: "Back to the app" } : { to: "/", label: "Back to home" };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-30 h-14 glass glass-border flex items-center">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg hover:opacity-75 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
              <Code2 className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="text-sm font-bold tracking-tight">careerRepo</span>
          </Link>
          <Link
            to={back.to}
            className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {back.label}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-text-tertiary">Last updated: {LEGAL_LAST_UPDATED}</p>
        <div className={`mt-6 ${PROSE}`}>{intro}</div>

        <nav aria-label="Contents" className="mt-8 rounded-2xl border border-border bg-bg-elevated p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Contents</h2>
          <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-primary-700 hover:underline dark:text-primary-300">
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-20">
              <h2 id={`${section.id}-heading`} className="text-lg font-bold text-text-primary">
                {index + 1}. {section.title}
              </h2>
              <div className={`mt-3 ${PROSE}`}>
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-text-tertiary">
        <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>careerRepo &copy; {new Date().getFullYear()}</span>
          <Link to="/privacy" className="hover:text-text-primary hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-text-primary hover:underline">
            Terms of Service
          </Link>
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="hover:text-text-primary hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
        </nav>
      </footer>
    </div>
  );
}

/** A mailto link to the support address. */
export function ContactLink() {
  return <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;
}
