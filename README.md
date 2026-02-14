This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Triage JSON extraction

The app extracts the agent’s **triage_state** JSON in two ways:

1. **In-app (your Vercel URL)**
   - While on a call, if the Atoms backend sends `update` or `metadata` data messages containing `triage_state`, the client shows it and POSTs it to `/api/triage`.
   - The UI shows a “Triage state (extracted JSON)” section with **Download JSON** and **Refresh from server**.

2. **Webhook (for when the agent only sends to a URL)**
   - In the [Atoms dashboard](https://console.smallest.ai), add a webhook URL pointing to **your deployed app** (not localhost):
     `https://<your-vercel-app>/api/triage-webhook`
   - Subscribe to **post-conversation** (and optionally pre-conversation).
   - If your agent writes triage state into conversation variables, the webhook will receive it and the app stores it.
   - After the call, open the app and click **Refresh from server**, or call `GET /api/triage` to retrieve the latest state.

**Get the JSON:** Use “Download JSON” in the UI, or `GET https://<your-vercel-app>/api/triage` to receive the latest stored triage object.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
