import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE_NAME,
  verifySessionToken,
} from '@/lib/admin-auth';
import { loadAdminMetrics, type AdminMetrics } from '@/lib/admin-metrics';
import { logoutAction } from './actions';

export default async function AdminDashboard() {
  // Defence-in-depth — middleware already gates this path, but verify again
  // server-side in case middleware is misconfigured or bypassed.
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!(await verifySessionToken(token))) {
    redirect('/admin/login');
  }

  const metrics = await loadAdminMetrics();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-primary">
            Fabletime Admin
          </h1>
          <p className="text-sm text-secondary">
            Live metrics — generated on every request.
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-[var(--border-card)] bg-[var(--surface-card)] px-3 py-1.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
          >
            Sign out
          </button>
        </form>
      </header>

      {metrics.errors.length > 0 && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <p className="mb-1 font-semibold">Some metrics could not be loaded:</p>
          <ul className="list-disc pl-5">
            {metrics.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <StoryVolume metrics={metrics} />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <RatingsCard metrics={metrics} />
        <IssuesCard metrics={metrics} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <TopList title="Most popular characters" rows={metrics.topCharacters} />
        <TopList title="Most popular themes" rows={metrics.topThemes} />
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-card)] p-5 shadow-sm">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatNumber({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-secondary">
        {label}
      </p>
      <p className="font-heading text-3xl font-semibold text-foreground tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function StoryVolume({ metrics }: { metrics: AdminMetrics }) {
  return (
    <Card title="Story volume">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatNumber label="Total stories" value={metrics.totalStories} />
        <StatNumber label="Today" value={metrics.storiesToday} />
        <StatNumber label="This week" value={metrics.storiesThisWeek} />
        <StatNumber label="This month" value={metrics.storiesThisMonth} />
      </div>
      <p className="mt-4 rounded-lg border border-dashed border-[var(--border-card)] bg-[var(--surface-card)] px-3 py-2 text-xs text-secondary">
        <span className="font-semibold text-foreground">TODO — Unique users:</span>{' '}
        the stories table does not yet store a user id, session id, or IP.
        Add one (e.g. <code>session_id</code> on stories) and compute a real
        <code className="ml-1">COUNT(DISTINCT …)</code> here.
      </p>
    </Card>
  );
}

function RatingsCard({ metrics }: { metrics: AdminMetrics }) {
  const max = metrics.ratingsDistribution.reduce(
    (m, r) => Math.max(m, r.count),
    0
  );
  return (
    <Card title="Ratings">
      <div className="mb-4 flex items-baseline gap-4">
        <StatNumber label="Total" value={metrics.totalRatings} />
        <StatNumber
          label="Average"
          value={metrics.averageRating === null ? '—' : metrics.averageRating.toFixed(2)}
        />
      </div>
      {metrics.totalRatings === 0 ? (
        <p className="text-sm text-secondary">No ratings yet.</p>
      ) : (
        <ul className="space-y-1">
          {metrics.ratingsDistribution.map((r) => {
            const pct = max > 0 ? Math.round((r.count / max) * 100) : 0;
            return (
              <li key={r.stars} className="flex items-center gap-2 text-sm">
                <span className="w-6 tabular-nums text-secondary">{r.stars}★</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-chip-inactive)] overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right tabular-nums text-secondary">
                  {r.count}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function IssuesCard({ metrics }: { metrics: AdminMetrics }) {
  return (
    <Card title="User submissions">
      <div className="grid grid-cols-2 gap-4">
        <StatNumber label="Feedback" value={metrics.feedbackCount} />
        <StatNumber label="Bug reports" value={metrics.bugCount} />
      </div>
      <p className="mt-3 text-xs text-secondary">
        Counts include open + closed issues on the GitHub repo.
      </p>
    </Card>
  );
}

function TopList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ value: string; count: number }>;
}) {
  return (
    <Card title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-secondary">No data yet.</p>
      ) : (
        <ol className="space-y-1">
          {rows.map((r, i) => (
            <li
              key={r.value}
              className="flex items-baseline justify-between text-sm"
            >
              <span>
                <span className="mr-2 inline-block w-5 text-right tabular-nums text-secondary">
                  {i + 1}.
                </span>
                <span className="capitalize">{r.value}</span>
              </span>
              <span className="tabular-nums text-secondary">{r.count}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
