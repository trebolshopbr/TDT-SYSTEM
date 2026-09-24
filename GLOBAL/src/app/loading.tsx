export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 h-7 w-52 rounded-md bg-neutral-900" />
          <div className="h-4 w-36 rounded-md bg-neutral-900" />
        </div>
        <div className="h-9 w-48 rounded-lg bg-neutral-900" />
      </div>

      {/* Hero Skeleton */}
      <div className="mb-4 rounded-2xl border border-neutral-900 bg-neutral-950/50 p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-neutral-900" />
          <div className="h-3 w-24 rounded bg-neutral-900" />
        </div>
        <div className="mb-3 h-10 w-48 rounded-md bg-neutral-900" />
        <div className="h-4 w-44 rounded bg-neutral-900" />
      </div>

      {/* Grid Cards Skeleton */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-900 bg-black p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-3.5 w-20 rounded bg-neutral-900" />
              <div className="h-3 w-3 rounded bg-neutral-900" />
            </div>
            <div className="h-6 w-28 rounded bg-neutral-900" />
          </div>
        ))}
      </div>
    </main>
  );
}
