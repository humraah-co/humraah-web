/**
 * Loading placeholders for the workspace, shown the moment a link is
 * clicked while the page's data loads (each route's loading.tsx).
 * Same cards and spacing as the real pages, with soft bars where the data
 * goes. Screen readers hear "Loading…" once.
 */

const card = "rounded-[20px] border border-border-soft bg-card";

/** One placeholder bar. Pulses gently unless the person prefers less motion. */
export function Bone({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-lg bg-blush/70 motion-safe:animate-pulse ${className}`}
    />
  );
}

function Loading({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6 lg:gap-7">
      <span className="sr-only">Loading {label}…</span>
      {children}
    </div>
  );
}

/** The page title is known before the data, so it shows straight away. */
function Header({ title, actions = 0 }: { title: string; actions?: number }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="text-h1 lg:tracking-[-0.2px]">{title}</h1>
        <Bone className="h-5 w-full max-w-[420px]" />
      </div>
      {actions > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {Array.from({ length: actions }, (_, i) => (
            <Bone key={i} className="h-[52px] w-full rounded-pill sm:w-[170px]" />
          ))}
        </div>
      )}
    </header>
  );
}

function Rows({ count, columns = 3 }: { count: number; columns?: number }) {
  return (
    <div className={`overflow-hidden ${card}`}>
      <div className="hidden bg-cream px-6 py-3 md:block">
        <Bone className="h-3.5 w-24" />
      </div>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-3 border-t border-border-soft px-5 py-4 first:border-t-0 md:flex-nowrap md:px-6 md:first:border-t"
        >
          <div className="flex w-full flex-col gap-1.5 md:w-auto md:flex-1">
            <Bone className="h-4 w-3/5" />
            <Bone className="h-3 w-2/5" />
          </div>
          {Array.from({ length: columns }, (_, c) => (
            <Bone key={c} className="h-7 w-24 rounded-pill" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Loading label="the dashboard">
      <Header title="Welcome back" actions={2} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5 xl:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`flex flex-col gap-2 p-4 sm:p-5 ${card}`}>
            <Bone className="size-10 rounded-xl" />
            <Bone className="h-4 w-24" />
            <Bone className="h-10 w-16" />
            <Bone className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <Rows count={5} columns={2} />
        </div>
        <div className={`flex flex-col gap-4 p-5 lg:p-6 xl:w-[340px] xl:shrink-0 ${card}`}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Bone className="size-8 shrink-0 rounded-pill" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Bone className="h-3.5 w-full" />
                <Bone className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

/** Universities, Scholarships: tabs, then the table. */
export function ListSkeleton({ title }: { title: string }) {
  return (
    <Loading label={title.toLowerCase()}>
      <Header title={title} actions={2} />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Bone key={i} className="h-10 w-28 rounded-pill" />
        ))}
      </div>
      <Rows count={8} />
    </Loading>
  );
}

/** Team, Needs review, Search: a header and one table. */
export function TableSkeleton({ title, rows = 6 }: { title: string; rows?: number }) {
  return (
    <Loading label={title.toLowerCase()}>
      <Header title={title} actions={1} />
      <Rows count={rows} columns={2} />
    </Loading>
  );
}

/** The university and scholarship editors: form cards beside Verification. */
export function EditorSkeleton({ title }: { title: string }) {
  const field = (
    <div className="flex flex-col gap-1.5">
      <Bone className="h-4 w-28" />
      <Bone className="h-12 w-full rounded-xl" />
    </div>
  );
  return (
    <Loading label="the editor">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Bone className="h-4 w-36" />
          <h1 className="text-h1 lg:tracking-[-0.2px]">{title}</h1>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Bone className="h-[50px] w-full rounded-pill sm:w-[140px]" />
          <Bone className="h-[50px] w-full rounded-pill sm:w-[120px]" />
        </div>
      </header>
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="flex flex-col gap-6">
          {[4, 3].map((fields, i) => (
            <div key={i} className={`flex flex-col gap-4 p-5 lg:p-6 ${card}`}>
              <Bone className="h-6 w-44" />
              {field}
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: fields - 1 }, (_, f) => (
                  <div key={f}>{field}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={`flex flex-col gap-4 p-5 lg:p-6 ${card}`}>
          <Bone className="h-6 w-32" />
          {field}
          <Bone className="h-[50px] w-full rounded-pill" />
        </div>
      </div>
    </Loading>
  );
}

export function ActivitySkeleton() {
  return (
    <Loading label="the activity log">
      <Header title="Activity log" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 7 }, (_, i) => (
          <Bone key={i} className="h-10 w-24 rounded-pill" />
        ))}
      </div>
      <div className={`grid gap-4 p-5 sm:grid-cols-2 lg:p-6 xl:grid-cols-5 ${card}`}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Bone className="h-4 w-16" />
            <Bone className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className={`flex flex-col gap-[18px] p-5 lg:p-6 ${card}`}>
        <Bone className="h-3.5 w-16" />
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Bone className="size-8 shrink-0 rounded-pill" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Bone className="h-3.5 w-3/4" />
              <Bone className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </Loading>
  );
}

/** Pages whose title is known but whose content is a small card (Add an entry). */
export function PlainSkeleton({ title }: { title?: string }) {
  return (
    <Loading label="the page">
      <header className="flex flex-col gap-2">
        {title ? <h1 className="text-h1 lg:tracking-[-0.2px]">{title}</h1> : <Bone className="h-10 w-56" />}
        <Bone className="h-5 w-full max-w-[420px]" />
      </header>
      <div className={`flex max-w-[640px] flex-col gap-3 p-6 ${card}`}>
        <Bone className="h-4 w-24" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-3/4" />
      </div>
    </Loading>
  );
}
