# Repo Radio

Repo Radio turns GitHub repositories into album covers and the primary languages
used across them into a skills setlist. The workspace has three destinations:
Overview, Repositories, and Skills Explorer.

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

## GitHub authorization

Copy `.env.example` to `.env.local` and configure these values:

- `AUTH_BASE_URL`: the app origin, such as `http://localhost:3000` in development.
- `AUTH_SECRET`: a random secret with at least 32 characters. For example, generate one with `openssl rand -base64 32`.
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: create a GitHub OAuth App and set its callback URL to `${AUTH_BASE_URL}/api/auth/github/callback`. The app requests `read:user` and `public_repo`.
- `GEMINI_API_KEY`: enables on-demand AI-generated repository cover art.
- `GEMINI_IMAGE_MODEL`: optional image model override; defaults to `gemini-2.5-flash-image`.

Restart the development server after changing environment variables. Connect or disconnect GitHub from the overview page. Its access token is encrypted and stored in an HTTP-only cookie; it is not sent to browser JavaScript. Repository cover art is generated only when requested and saved in the current browser. The optional `GITHUB_TOKEN` is only used by the standalone `npm run github` smoke test.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
