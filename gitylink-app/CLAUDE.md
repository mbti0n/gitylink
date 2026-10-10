@AGENTS.md

# gitylink-app: design system rules for Figma → code

"Commit to Post" is a dark developer dashboard that turns GitHub activity into LinkedIn posts.
These rules apply when implementing Figma designs through the Figma MCP server.

## Figma source

- File: `Commit to Post — Dark Dashboard`, fileKey `2xDhCyHOWRjZwuA2bhGxAa`, everything is on `Page 1` (`0:1`).
- Screens (all 1440px wide, desktop only):

  | Screen | Frame node | Status in code |
  |---|---|---|
  | Dashboard | `1:2` | `app/(workspace)/page.tsx` |
  | Activity | `31:1723` | `app/(workspace)/activity/` |
  | Post studio | `31:2090` | `app/(workspace)/post-studio/` |
  | Skills Explorer | `2:2` | Not built |
  | Career roadmap | — (no Figma frame) | `app/(workspace)/roadmap/page.tsx`, styled with the shared `page-*`, `kpi-grid` and `.panel` classes |

- Each screen is a 240px `Navigation sidebar` (`Sidebar` on Skills Explorer) plus a 1200px `Main workspace`.
- Reused Figma components (instances): `Navigation item`, `Active navigation`, `Action` (buttons), `Field` (inputs), `Status`.
- Figma component sets: `CTP / Navigation`, `CTP / Navigation active`, `CTP / Primary`, `CTP / Secondary`, `CTP / Input`, `CTP / Badge`. Text styles: `CTP / heading` (Inter 600 28/1.5), `CTP / section` (600 18), `CTP / body` (400 14), `CTP / caption` (400 12).
- **The file defines no Figma variables** (`get_variable_defs` returns `{}`). `get_design_context` output uses `var(--ctp-*, <fallback>)` names, but those variables don't exist in code. Map them to the CSS tokens below; don't paste them in as literals:

  | Figma | Code |
  |---|---|
  | `--ctp-bg` | `--page-bg` |
  | `--ctp-surface` | `--panel-bg` (cards) / `--sidebar-bg` |
  | `--ctp-raised` | `--raised-bg` |
  | `--ctp-border` | `--panel-border` |
  | `--ctp-text`, `--ctp-muted` | `--text`, `--muted` |
  | `--ctp-blue`, `--ctp-green` | `--primary`, `--green` |
  | `--ctp-tint` | `--active-bg` |
  | `--ctp-success` | `--green-soft` (badge text `--success-text`) |
  | `#83bbff` | `--link` |
- Calling `get_metadata` on `0:1` returns about 100 KB. Query a single screen frame instead.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16.4 App Router (`app/`), React 19.3, TypeScript (strict) |
| Bundler | Turbopack (`next dev` / `next build`). CSS goes through `@tailwindcss/turbopack` (see `next.config.ts`) |
| Styling | Tailwind CSS v4 is imported, but the UI is styled with **hand-written global CSS classes** in `app/globals.css` |
| Config flags | `cacheComponents: true` and `partialPrefetching: true` in `next.config.ts` |
| Data | Octokit (`octokit`) for GitHub. `github.js` is a standalone auth smoke test (`npm run github`, needs `GITHUB_TOKEN` in `.env`) |
| Path alias | `@/*` → project root (`gitylink-app/`) |
| Package manager | Both `package-lock.json` and `pnpm-lock.yaml` exist. Check with the user before adding dependencies |

Next 16 has breaking changes (see `AGENTS.md`). Read `node_modules/next/dist/docs/` before using routing, data-fetching or caching APIs.

## 1. Design tokens

All tokens are CSS custom properties on `:root` in `app/globals.css`. There is no token pipeline: no Style Dictionary, no JSON tokens, no Tailwind `@theme` block.

```css
/* app/globals.css */
:root {
  --page-bg: #20252a;        /* app background */
  --sidebar-bg: #292f35;     /* sidebar surface */
  --panel-bg: rgba(41, 47, 53, 0.9);  /* cards */
  --panel-border: #3b444d;   /* card borders, outline buttons */
  --soft-border: rgba(123, 138, 156, 0.25); /* dividers */
  --text: #f4f7fb;           /* primary text */
  --muted: #99a6b4;          /* secondary text, labels */
  --muted-strong: #c9d4df;   /* tag text */
  --primary: #1477df;        /* primary buttons, avatar */
  --primary-soft: #1c354f;
  --green: #2dbb52;          /* brand accent, "connected", heatmap max */
  --green-soft: rgba(45, 187, 82, 0.17);
  --amber: #f5b84b;
  --shadow: rgba(11, 15, 18, 0.42);
  --raised-bg: #343c44;      /* secondary buttons, story options, attachments */
  --active-bg: rgba(27, 62, 90, 0.9); /* active nav, selected option */
  --active-text: #a3d2ff;
  --chip-bg: rgba(153, 166, 180, 0.12); /* tags, metric icon tiles */
  --link: #83bbff;           /* repo names, text links */
  --success-text: #7fe39b;   /* success chip/badge text */
}
```

Rules:
- When a Figma color matches a token, use `var(--token)`. If a new color shows up on two or more screens, add it to `:root` with a role-based name (`--danger`, `--link`) and use the variable.
- The icon tints `#6fbbff`, `#5ddc7d`, `#f7ca67` (`.tone-*`) are still hard-coded. Tokenize them the next time they're touched.
- There are two heatmap scales. The dashboard uses 4 levels, `.level-0` … `.level-3`. The Activity contribution calendar uses Figma's 5 levels, `.contrib-0` … `.contrib-4` (`#39434a`, `#1e5a38`, `#247c46`, `#2a9f4b`, `--green`). Use the 5-level scale for new grids.
- Spacing, radius and type have no tokens. The values below are the de-facto scale, so snap Figma values to them:
  - **Spacing:** 6, 8, 10, 12, 14, 16, 18, 20, 28, 40px. The page gutter is `40px`, or `20px` below 880px. Grid gaps are `18px`.
  - **Radius:** 3 (heat cell), 7 (tags), 8 (buttons, nav items, icons), 11–12 (cards), 15 (avatar).
  - **Type sizes:** 10 (labels, legend), 11, 12 (body small, buttons), 13 (nav), 14, 15–16 (card titles), 19 (section h2/h3), 26–27 (page h1, metric numbers).
  - **Weights:** 500, 600, 700, 800.
  - **Small caps labels:** `font-size: 10px; letter-spacing: 0.12em; font-weight: 700; color: var(--muted)` (`.section-label`).

### Font
The Figma file uses Inter. `app/layout.tsx` loads it with `next/font/google` as `--font-inter`, and `body` uses `var(--font-inter)`. Don't add a `<link>` to Google Fonts. Don't absolutely position text next to other text; Inter is wider than the fallback fonts.

## 2. Components

- Shared UI lives in `components/` (imported as `@/components/...`), one PascalCase file per component:
  - `Sidebar.tsx`: brand, settings and account. Rendered once by `app/(workspace)/layout.tsx`, so new screens get it automatically.
  - `SidebarNav.tsx`: a client component. Nav items are `next/link` links, and the active item comes from `usePathname()`. Add new routes to its `navItems` array.
  - `Topbar.tsx`: `<Topbar crumb="Post studio" />` renders the breadcrumb and search box.
- Every workspace page renders `<section className="content-panel"><Topbar crumb="…" />…</section>`. Inside it, use the shared page layout classes: `.page-content` (padding and 24px gap), `.page-heading` with `.page-intro` (28px h1 and subtitle), and `.page-column` (column with an 18px h2). Put interactive parts in a co-located client component, for example `post-studio/PostStudio.tsx`, and keep `page.tsx` a server component that exports `metadata`.
- There is no Storybook and no Code Connect mappings.
- Figma components map to CSS classes:

  | Figma | Class |
  |---|---|
  | `CTP / Navigation` / `Navigation active` | `.nav-item` / `.nav-item.active` |
  | `CTP / Primary` / `CTP / Secondary` | `.btn.btn-primary` / `.btn.btn-secondary` |
  | `CTP / Input` | `.field` wrapping a native `<select>` (the chevron comes from `::after`) |
  | `CTP / Badge` | `.status-badge` |
  | Cards ("Panel") | `.panel` plus a per-panel class that sets padding and gap |

  Extract these into React components (`Button`, `Field`) once a third screen needs them.
  - Components are server components by default. Add `"use client"` only when a component needs state, effects or event handlers.
  - Props are typed with a local `type Props = {...}`. Keep sample data in typed arrays at the top of the file until it's replaced by Octokit data.
- Buttons are native `<button type="button">`, or `next/link` when they navigate. New screens use `.btn`. The dashboard still uses older one-off classes: `.primary-btn` (blue with a glow), `.secondary-btn` (blue) and `.draft-btn` (outline). All button classes lift by `translateY(-1px)` on hover.

## 3. Styling approach

- **Global, semantic, kebab-case class names** in `app/globals.css`, e.g. `.stat-card`, `.share-topline`, `.heat-cell`. No CSS Modules, no styled-components, and almost no Tailwind utilities (only on `<html>`/`<body>` in `layout.tsx`).
- Modifiers are extra classes: `.nav-item.active`, `.nav-item.compact`, `.tone-blue|green|amber`, `.level-0..3`.
- Element styles are scoped through a parent class: `.hero-row h1`, `.share-card p`.
- Match this convention when implementing Figma. Keep markup semantic (`main`, `aside`, `nav`, `section`, `article`, `header`) and add classes to `globals.css`, grouped by screen or section in source order. If `globals.css` gets hard to manage, move a screen's styles to `app/<route>/<route>.css` and import it from that route. Don't switch methodology midway.
- Don't mix in Tailwind utilities for things the global classes already cover. Only use Tailwind if the user asks to migrate. In that case, move the `:root` tokens into a Tailwind v4 `@theme` block so the utilities and the CSS variables stay one source.
- Surfaces are layered: `--page-bg` → `--sidebar-bg` / `--panel-bg` cards with a 1px `--panel-border` and 11–12px radius → `--raised-bg` controls / `--chip-bg` chips.
- Transitions are short and simple: `0.2s ease` on background, color, transform or opacity.

### Responsive
The Figma file is desktop-only (1440px). Code uses desktop-first `max-width` media queries at the end of `globals.css`:

```css
@media (max-width: 1120px) { /* 4-col stats → 2-col; 2-col layouts → 1-col */ }
@media (max-width: 880px)  { /* sidebar stacks above content; gutters 40→20px; stats 1-col */ }
```

Use the same two breakpoints for new screens: CSS grid with `repeat(n, minmax(<min>, 1fr))`, collapsing to fewer columns at 1120px and 880px. Add rules to the existing media blocks; don't create new breakpoints.

## 4. Assets

- Static files go in `public/` and are referenced by root path (`/logo.svg`). The SVGs currently there (`file`, `globe`, `next`, `vercel`, `window`) are create-next-app leftovers and aren't used.
- No CDN, no `images` config, no remote patterns. Raster images should use `next/image`. Remote images such as GitHub avatars would need `images.remotePatterns` added to `next.config.ts`.
- Figma asset URLs from `get_design_context` / `download_assets` expire. Download them into `public/` right away. Never ship a Figma URL in code.
- The brand mark isn't an asset. It's a CSS gradient tile (`.brand-mark`, `linear-gradient(135deg, #35d66d, #20a351)`) with a `↗` glyph.

## 5. Icons

- The current convention is **Unicode glyphs in a span**, colored by `currentColor`. There is no icon library or SVG set.

  ```tsx
  <span className="nav-icon">▦</span>   {/* 16px, 18px wide box */}
  <div className="metric-icon">⌁</div>  {/* 34px tile, tinted by .tone-* parent */}
  ```

- Glyphs in use: `▦` overview, `◷` activity, `✦` posts/highlights, `▤` repositories, `◈` skills, `◎` roadmap, `⚙` preferences, `ⓘ` help, `⌕` search, `⌁` commits/repo, `→` CTA arrows, `+` create.
- The Figma file contains about 34 vector layers. If a design calls for a real icon that a glyph can't reasonably stand in for, export the SVG with `download_assets` to `public/icons/<kebab-case-name>.svg`. Render it inline or via `<img>` so it inherits size from `.nav-icon`/`.metric-icon`, and use `fill="currentColor"` so the tone classes still work. Don't add an icon npm package without asking.
- Decorative glyphs next to a text label need nothing extra. An icon-only button needs an `aria-label`.

## 6. Project structure

```
gitylink/                    repo root (README only)
└─ gitylink-app/             the Next.js app (run all commands here)
   ├─ app/
   │  ├─ layout.tsx          root layout, fonts, metadata
   │  ├─ (workspace)/        route group sharing the sidebar
   │  │  ├─ layout.tsx       <main.dashboard-page> + <Sidebar />
   │  │  ├─ page.tsx         Dashboard (/) — Figma 1:2
   │  │  ├─ activity/        Activity (/activity) — Figma 31:1723 (page.tsx + Activity.tsx client)
   │  │  └─ post-studio/     Post studio (/post-studio) — Figma 31:2090
   │  │     ├─ page.tsx      server page + metadata
   │  │     └─ PostStudio.tsx  client: editor, story picker, tabs, copy
   │  ├─ globals.css         tokens + all component styles + breakpoints
   │  └─ favicon.ico
   ├─ components/            Sidebar, SidebarNav (client), Topbar
   ├─ public/                static assets
   ├─ github.js              Octokit auth smoke test
   ├─ next.config.ts         Turbopack + Tailwind loader, cacheComponents
   ├─ .env.example           GITHUB_TOKEN etc.
   └─ AGENTS.md              Next 16 agent notes (auto-generated by next dev)
```

New screens go in `app/(workspace)/<route>/page.tsx`, using the routes already linked in `SidebarNav`: `/repositories`, `/skills`. Don't nest another `<main>` (the layout provides it). Don't use the dashboard-only `.hero-row` or `.stats-grid` inside `.page-content`, because they add their own 40px side padding; use `.page-heading` and `.kpi-grid` instead. Each page's CSS is a commented section in `globals.css` (`/* Post studio */`, `/* Activity */`, `/* Career roadmap */`). Edit those sections in place; don't replace the file wholesale. Until a screen is built, its link goes to a 404.

## Workflow for implementing a Figma node

1. Run `get_design_context` on the specific frame or node, not the page. Use `get_screenshot` for visual reference.
2. Treat the returned code (usually React + Tailwind) as a **spec, not code to paste**. Convert it to semantic markup with global classes in `globals.css`.
3. Replace raw colors with `var(--token)` and snap spacing, radius and type to the scales above.
4. Reuse existing classes or components (`.stat-card`, `.tag`, `.primary-btn`, `.heat-cell.level-n`, the sidebar) before creating new ones.
5. Download any images or icons into `public/`.
6. Check both breakpoints, then run `npm run lint` and `npm run build`.
