import Link from "next/link";

const problemPoints = [
  {
    stat: "30–50%",
    text: "of all 911 calls from mobile phones are accidental—pocket dials or butt dials.",
    source: "FCC",
  },
  {
    stat: "$90–$150",
    text: "A single unnecessary police dispatch costs a city roughly this much.",
    source: "NENA (National Emergency Number Association)",
  },
  {
    stat: "Up to 60%",
    text: "During peak times, calls can be classified as prank or malicious misuse.",
    source: "Department of Justice studies on 911 Abuse",
  },
];

const solutionPoints = [
  "40% of calls are butt dials (accidental).",
  "30% are non-emergencies.",
  "Triage these before they hit a human operator—effectively doubling the size of every police force in the world, for free.",
];

const valuePoints = [
  {
    title: "AI-assisted call intake",
    description: "Voice AI can greet callers, confirm intent, and classify urgency.",
  },
  {
    title: "Guided triage",
    description: "Operators see prioritized queues, live transcripts, and suggested next steps.",
  },
  {
    title: "Live dispatch visibility",
    description: "Map and queue views so teams see what's active and where.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#f0fdf4_0%,_#dcfce7_40%,_#ffffff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-between px-6 py-10 sm:px-8 sm:py-14">
        <header className="flex items-center justify-between">
          <p className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs tracking-[0.2em] text-emerald-800 uppercase">
            911 Dispatch
          </p>
          <Link
            href="/dashboard"
            className="rounded-full border border-emerald-300 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-50"
          >
            Open dashboard
          </Link>
        </header>

        <section className="space-y-6 py-14 sm:py-20">
          <h1 className="max-w-3xl text-4xl leading-tight font-semibold text-slate-900 sm:text-5xl">
            A modern emergency response command center that uses AI to triage 911
            calls—so operators can focus on the calls that matter.
          </h1>
          <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
            We eliminate the noise so real emergencies get the focus they need.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Launch demo
            </Link>
            <Link
              href="#problem"
              className="rounded-full border border-emerald-300 bg-white/80 px-5 py-2.5 text-sm font-medium text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-50"
            >
              The problem
            </Link>
          </div>
        </section>

        <section id="problem" className="space-y-6 py-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            The Problem
          </h2>
          <p className="max-w-2xl text-slate-600">
            911 systems are overwhelmed by noise that wastes time and money. The
            result: dispatchers and first responders are buried in
            non-emergencies while real emergencies wait.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {problemPoints.map((point) => (
              <article
                key={point.source}
                className="rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-sm"
              >
                <p className="text-2xl font-semibold text-emerald-600">
                  {point.stat}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {point.text}
                </p>
                <p className="mt-3 text-xs text-slate-500 italic">
                  — {point.source}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="solution" className="space-y-6 py-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            The Solution
          </h2>
          <p className="max-w-2xl text-lg text-slate-800">
            We don&apos;t replace the 911 operator. We eliminate the 70% of the
            noise so the 30% of actual emergencies get the focus they need.
          </p>
          <ul className="space-y-2 text-slate-700">
            {solutionPoints.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="max-w-2xl text-sm text-slate-600">
            By triaging before they hit a human operator, we free capacity
            without adding headcount.
          </p>
        </section>

        <section className="grid gap-3 py-10 sm:grid-cols-3">
          <p className="col-span-full text-xs tracking-[0.18em] text-emerald-700 uppercase sm:col-span-3">
            What we built
          </p>
          {valuePoints.map((point) => (
            <article
              key={point.title}
              className="flex min-h-28 flex-col justify-between rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-sm"
            >
              <h3 className="text-sm font-semibold tracking-wide text-slate-900">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {point.description}
              </p>
            </article>
          ))}
        </section>

        <section className="border-t border-emerald-200 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-slate-600">
              Ready to see the dispatch command center?
            </p>
            <Link
              href="/dashboard"
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Open dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
