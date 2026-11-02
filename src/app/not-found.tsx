import Link from "next/link";
export default function NotFound() { return <div className="empty-state"><h1>Nothing here just yet.</h1><p>This page or product doesn’t exist in your workspace.</p><Link className="button primary" href="/dashboard">Back to overview</Link></div>; }
