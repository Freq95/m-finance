"use client";

/**
 * Loading skeleton for the dashboard page.
 */

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl glass-panel shadow-soft p-5 animate-pulse"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-black/[0.08]" />
              <div className="h-6 w-6 rounded-lg bg-black/[0.06]" />
            </div>
            <div className="h-4 w-20 rounded bg-black/[0.08] mb-2" />
            <div className="h-7 w-24 rounded bg-black/[0.1]" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl glass-panel shadow-soft overflow-hidden animate-pulse">
        <div className="px-6 pt-6 pb-1">
          <div className="h-5 w-20 bg-black/[0.08] rounded mb-1" />
          <div className="h-8 w-32 bg-black/[0.1] rounded" />
        </div>
        <div className="px-6 pt-2 pb-6">
          <div className="h-64 w-full rounded-2xl bg-black/[0.04]" />
        </div>
      </div>
      <section>
        <div className="h-6 w-24 bg-black/[0.08] rounded mb-1" />
        <div className="h-4 w-48 bg-black/[0.06] rounded mb-4" />
        <div className="rounded-2xl glass-panel shadow-soft overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 border-b border-black/[0.06] last:border-0"
            >
              <div className="h-10 w-10 rounded-xl bg-black/[0.08] shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-28 bg-black/[0.08] rounded" />
                <div className="h-3 w-20 bg-black/[0.06] rounded" />
              </div>
              <div className="h-4 w-16 bg-black/[0.08] rounded" />
              <div className="h-6 w-14 rounded-xl bg-black/[0.06]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
