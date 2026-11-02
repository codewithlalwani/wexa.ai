"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="empty-state"><h2>We couldn’t load your workspace.</h2><p>Please try again in a moment. If this keeps happening, check the database connection.</p><button className="button primary" onClick={reset}>Try again</button></div>;
}
