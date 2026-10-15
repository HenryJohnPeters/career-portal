import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { reportError } from "../../lib/report-error";

interface SectionBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

/** Keeps the rest of the landing page usable if a lazily loaded section fails (e.g. offline). */
export class SectionBoundary extends Component<SectionBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    reportError(error, { boundary: "landing-section", componentStack: info.componentStack });
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Shown when the pricing section can't load. */
export function PricingFallback() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="max-w-5xl mx-auto px-5 sm:px-8 pb-20 text-center">
      <h2 id="pricing-heading" className="text-2xl font-extrabold tracking-tight text-text-primary mb-3">
        Simple pricing
      </h2>
      <p className="text-sm text-text-secondary">
        Free to start. Premium is available from your{" "}
        <Link to="/app/billing" className="font-semibold text-primary-700 underline dark:text-primary-300">
          billing page
        </Link>{" "}
        once you've signed up.
      </p>
    </section>
  );
}
