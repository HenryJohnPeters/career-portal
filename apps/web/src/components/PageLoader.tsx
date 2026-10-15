import { Spinner } from "@careerportal/web/ui";

interface PageLoaderProps {
  /** Fill the viewport (route-level loads outside the app shell). */
  fullScreen?: boolean;
  label?: string;
}

/** Suspense / auth fallback for whole pages. */
export function PageLoader({ fullScreen = false, label = "Loading page" }: PageLoaderProps) {
  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <Spinner label={label} className="py-0" />
      </div>
    );
  }
  return <Spinner label={label} className="flex-1 py-24" />;
}
