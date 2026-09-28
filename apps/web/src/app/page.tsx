export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-20">
      <div className="max-w-xl space-y-6">
        <span className="inline-flex rounded-full border px-3 py-1 text-sm font-medium">
          Unigym
        </span>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          Your gym, ready to grow.
        </h1>
        <p className="text-lg text-muted-foreground">
          A place for memberships, classes, and bookings. We&apos;re building
          the foundation for a better gym experience.
        </p>
      </div>
      <section className="w-full max-w-md rounded-xl border bg-card p-7 shadow-sm">
        <h2 className="text-xl font-semibold">Coming together</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Member access and gym features will appear here as Unigym grows.
        </p>
      </section>
    </main>
  );
}
