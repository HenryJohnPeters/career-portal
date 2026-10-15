import { Link } from "react-router-dom";

/** Placeholder registered by web-shell; web-pages replaces it with the full terms. */
export function TermsPage() {
  return (
    <main className="min-h-screen bg-bg-primary px-6 py-16">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link to="/" className="text-sm font-semibold text-primary-700 dark:text-primary-300">
          careerRepo
        </Link>
        <h1 className="text-3xl font-bold text-text-primary">Terms of service</h1>
        <p className="text-sm text-text-secondary">
          Questions about these terms? Email{" "}
          <a className="underline" href="mailto:support@career-repo.com">
            support@career-repo.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
