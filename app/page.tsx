import Link from "next/link";

const valuePoints = [
  {
    title: "Fast Call Intake",
    description: "Clear operator workflows from first ring to dispatch.",
  },
  {
    title: "AI-Assisted Triage",
    description: "Support decision-making with guided prioritization.",
  },
  {
    title: "Live Dispatch Visibility",
    description: "Track response teams and status updates in real time.",
  },
];

const skeletonBlocks = ["Hero", "Problem", "How It Works", "Proof", "CTA"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937_0%,_#0b1220_45%,_#030712_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-between px-6 py-10 sm:px-8 sm:py-14">
        <header className="flex items-center justify-between">
          <p className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs tracking-[0.2em] text-white/75 uppercase">
            911 Dispatch
          </p>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 transition hover:border-white/40 hover:text-white"
          >
            Open dashboard
          </Link>
        </header>

        <section className="space-y-6 py-14 sm:py-20">
          <h1 className="max-w-3xl text-4xl leading-tight font-semibold sm:text-5xl">
            Modern emergency response command center.
          </h1>
          <p className="max-w-2xl text-base text-white/75 sm:text-lg">
            A simple foundation page for the 911 Dispatch product. Keep this as
            the launch pad while we add brand, content, and conversion details.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-400"
            >
              Launch demo
            </Link>
            <Link
              href="#skeleton"
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/85 transition hover:border-white/40 hover:text-white"
            >
              View skeleton
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {valuePoints.map((point) => (
            <article
              key={point.title}
              className="flex min-h-28 flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <h2 className="text-sm font-semibold tracking-wide text-white">
                {point.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {point.description}
              </p>
            </article>
          ))}
        </section>

        <section id="skeleton" className="mt-10 space-y-4">
          <p className="text-xs tracking-[0.18em] text-white/55 uppercase">
            Landing Page Skeleton
          </p>
          <div className="grid gap-3 sm:grid-cols-5">
            {skeletonBlocks.map((block) => (
              <div
                key={block}
                className="rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-4 text-center text-xs text-white/70 uppercase"
              >
                {block}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
