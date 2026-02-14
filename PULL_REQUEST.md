# Pull Request: Atoms voice call env setup & widget removal

## Summary

Wires the main **Call 911** button to the configured Atoms agent via environment variables, removes the embed widget that caused SSR errors, and adds env documentation.

---

## What changed

### Removed
- **Atoms widget embed** – The floating widget (and optional Text/Call toggle) was removed because:
  - `atoms-widget-core` uses `document` at import time and caused `ReferenceError: document is not defined` during server-side rendering in Next.js.
  - The desired behavior is achieved by the existing **Call 911** button on the page instead.
- **`components/atoms-widget-embed.tsx`** – Deleted; no longer used.
- **Widget script** – The UMD script and `<AtomsWidgetEmbed />` were removed from `app/layout.tsx`.
- **`atoms-widget-core` dependency** – Removed from `package.json` since the widget is no longer used.

### Added
- **`.env.example`** – Documents required env vars for voice calls:
  - `SMALLEST_API_KEY` – Smallest AI / Atoms API key.
  - `ATOMS_AGENT_ID` – Atoms assistant/agent ID used for the webcall.
- **`package-lock.json`** – Tracked so installs are reproducible (and reflects removal of `atoms-widget-core`).

### Unchanged (already correct)
- **`app/api/call/route.ts`** – Already reads `SMALLEST_API_KEY` and `ATOMS_AGENT_ID`; no code change.
- **`app/layout.tsx`** – Widget import and usage removed; layout only renders `{children}`.
- **Call flow** – User clicks **Call 911** → `/api/call` uses env to get a webcall token for `ATOMS_AGENT_ID` → `useAtomsCall` starts the voice session. No widget required.

---

## How to use after merge

1. Copy `.env.example` to `.env.local`.
2. Set `SMALLEST_API_KEY` and `ATOMS_AGENT_ID` in `.env.local` (get them from [atoms.smallest.ai](https://atoms.smallest.ai)).
3. Restart the dev server so env is loaded.
4. Click **Call 911** on the app to start a voice call to the configured agent.

---

## Notes

- `.env.local` is gitignored; secrets are not committed.
- The **Call 911** button is the single entry point for talking to the agent; no separate widget UI.
