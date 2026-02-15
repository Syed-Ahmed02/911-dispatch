# 911 Dispatch

A modern emergency response command center that uses AI to triage 911 calls—so operators can focus on the calls that matter.

---

## The Problem

911 systems are overwhelmed by noise that wastes time and money:

- **30–50% of all 911 calls from mobile phones are accidental**—"pocket dials" or "butt dials."  
  *— FCC*

- **A single unnecessary police dispatch costs a city roughly $90–$150.**  
  *— NENA (National Emergency Number Association)*

- **During peak times, up to 60% of calls can be classified as prank or malicious misuse.**  
  *— Department of Justice studies on 911 Abuse*

The result: dispatchers and first responders are buried in non-emergencies while real emergencies wait.

---

## The Solution

**We don’t replace the 911 operator.** We eliminate the 70% of the noise so the 30% of actual emergencies get the focus they need.

Roughly:

- **40%** of calls are butt dials (accidental).
- **30%** are non-emergencies.

By triaging these before they hit a human operator, we free capacity without adding headcount—**effectively doubling the size of every police force in the world, for free.**

This project is a **dispatch command center** that demonstrates:

- **AI-assisted call intake** — Voice AI (e.g. Smallest.ai Atoms) can greet callers, confirm intent, and classify urgency.
- **Guided triage** — Operators see prioritized queues, live transcripts, and suggested next steps.
- **Live dispatch visibility** — Map and queue views so teams see what’s active and where.

---

## What We Built

A full-stack **911 Dispatch** app with:

- **Landing page** — Product overview and entry to the dashboard.
- **Dispatcher dashboard** — Overview (metrics, map), call queue (sortable by priority/status/elapsed), and a **simulator** where you can place a voice call to an AI agent.
- **Voice call flow** — Integration with [Smallest.ai Atoms](https://smallest.ai) so callers talk to an AI that can triage before or alongside a human.
- **AI layer** — [Mastra](https://mastra.ai) for agents, tools, and workflows (e.g. weather; extensible to dispatch logic).

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix UI / shadcn, Base UI |
| **Maps** | MapLibre GL |
| **AI / agents** | Mastra (agents, tools, workflows), LibSQL store, Pino logging, Observability |
| **Voice** | Smallest.ai Atoms (voice AI), Atoms client SDK, webcall API |
| **Backend / API** | Next.js API routes (e.g. `/api/call` for webcall session creation) |
| **Real-time / DB** | Convex (available for real-time dispatch data) |
| **Language** | TypeScript, Zod |

### Project Structure (high level)

```
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing
│   ├── dashboard/         # Overview, queue, simulator
│   └── api/call/           # Webcall session (Atoms)
├── agents/mastra/          # Mastra: agents, tools, workflows, storage
├── components/             # UI and dispatcher (overview, queue, call interface)
├── hooks/                  # useAtomsCall, useSpeechRecognition, etc.
├── convex/                 # Convex backend (if used)
└── scripts/                # e.g. setup-agent
```

---

## Setup

### Prerequisites

- Node.js 18+
- pnpm (or npm / yarn)
- [Smallest.ai](https://console.smallest.ai) account and API key (for voice calls)
- Optional: [Convex](https://convex.dev) for real-time data

### 1. Install dependencies

```bash
pnpm install
# or: npm install
```

### 2. Environment variables

Copy the example env and fill in your keys:

```bash
cp .env.example .env.local
```

In `.env.local`:

```env
# Get your API key and create an agent at https://atoms.smallest.ai
SMALLEST_API_KEY=your_smallest_api_key
ATOMS_AGENT_ID=your_atoms_agent_id
```

- **SMALLEST_API_KEY** — Required for the Atoms webcall API (e.g. `/api/call`).
- **ATOMS_AGENT_ID** — The voice agent used in the dashboard simulator and widget.

### 3. Run the app

**Next.js (main app + dashboard):**

```bash
pnpm dev
# or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use “Open dashboard” or “Launch demo” to reach the dispatcher; use the simulator to test a voice call.

**Mastra Studio (agents/workflows):**

```bash
pnpm mastra:dev
```

Runs Mastra Studio at [http://localhost:4111](http://localhost:4111) for debugging agents and workflows.

### 4. Build for production

```bash
pnpm build
pnpm start
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Next.js dev server (port 3000) |
| `pnpm build` | Build Next.js for production |
| `pnpm start` | Run production Next.js server |
| `pnpm mastra:dev` | Start Mastra Studio (port 4111) |
| `pnpm mastra:build` | Build Mastra |
| `pnpm setup-agent` | Run agent setup script (e.g. `tsx scripts/setup-agent.ts`) |
| `pnpm lint` | Run ESLint |

---

## References

- [FCC](https://www.fcc.gov) — 911 and accidental call statistics  
- [NENA](https://www.nena.org) — Emergency number association, dispatch cost context  
- [Department of Justice — 911 Abuse](https://www.justice.gov) — Studies on prank and misuse  
- [Smallest.ai / Atoms](https://atoms.smallest.ai) — Voice AI and webcall API  
- [Mastra](https://mastra.ai) — AI agents and workflows  
- [Next.js](https://nextjs.org) — React framework  
- [Convex](https://convex.dev) — Real-time backend  

---

## License

Private. All rights reserved.
