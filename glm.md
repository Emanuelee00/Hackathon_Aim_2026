# glm.md — work log of the Claude (GLM) session of 20 November 2026

Everything done in this session, newest at the bottom. Each entry lands with a
push; commit hashes refer to `main2`. Working rules: `docs-md/Guide.md` (§0–§9),
Italian in chat only, English in the repo, French untouched (site language).

## 1. Review and inventory

- Reviewed the whole project (FastAPI backend, React frontend, deploy on a GCP
  VM, public Jamstack site) and listed everything demo-related that is NOT in
  production: `backend/demo/` + `demo_responses.json` (only on Vercel or
  `MARTHE_DEMO=1`), the AI itself (`MARTHE_AI=0` in prod, Nemotron switch on
  `main2`), demo accounts (`accounts/seed_demo.py`, `comptes.txt`), the
  `chezmarthe/` prototype, `make qr` artifacts — and flagged the flip side:
  fake profiles and the « Données de démonstration » label ship inside the
  production bundle (later fixed behind `VITE_DEMO=off`, not activated).

## 2. Repo organization

- Root documents moved to `docs-md/` (business plan, guide, production plan,
  pitch, problems, tech debt, TODO, session context, both demo QR codes, the
  « Espaces Chez Marthe » PDF); 12 git renames, cross-references updated
  (README, seed_demo docstring, chatbot knowledge file, session context).
- `comptes.txt` moved into the demo folder, renamed `chezmarthe-demo/`.
- Docker files kept at the root on purpose (build context is the root; the
  production compose already lives in `deploy/` pointing back at
  `Dockerfile.prod`).
- `chezmarthe-demo/CLAUDE.md` copied to `docs-md/CLAUDE-PROTOTIPO.md` as a
  dated backup of the association's real data (spaces, prices, identity).
- Verified the demo folder needs nothing from the rest of the project and the
  rest needs nothing from it (only a docstring mention, a ruff exclusion and
  `.vercelignore`).

## 3. Verification and fixes (`make check`)

- Fixed 45 import-order lint errors left by the backend/frontend move;
  excluded `chezmarthe-demo/` from ruff (4 pre-existing prototype errors).
- Found and fixed a real CORS bug: the Makefile exported
  `PUBLIC_SITE_ORIGINS` as an empty string when `.env` is missing, which
  silently disabled CORS for every `make`-launched run; same hardening for
  `CANONICAL_DOMAIN` / `OLD_DOMAINS` in `main.py`.
- Final state: 140 backend tests, 116 frontend tests, build, jamstack build,
  ruff — all green.

## 4. App-layer refactor (`frontend/src/app`)

- `ResidentApp.jsx` deleted: `residents.` now uses `PublicShell` like the
  other spaces (prop `mainClassName=""` keeps its layout).
- `useHashPage` and `useMediaQuery` extracted to `shared/lib/`;
  `navigation` moved out of `Sidebar.jsx` into `shared/data/navigation.js`.
- Demo data behind one flag: `SHOW_DEMO_DATA` in `shared/lib/demo.js`
  (`VITE_DEMO=off`); store fallbacks and the demo label respect it. Behavior
  unchanged until a build sets it; TODO carries the activation task.
- `store.jsx`: the six server-backed pieces of state now go through one
  `useStored(key, fallback, validate, ready, onError)` hook (was 4 repetitions
  per key); the public `useStore` API is unchanged.
- Modal system in `App.jsx`: the nested-ternary title plus six conditional
  blocks became a `MODALS` registry (one definition per window type).

## 5. Guide and documentation

- `docs-md/Guide.md`: AI preamble (follow the rules every task, never skip
  silently); §2 « Folders mirror the site » with free nesting and the ~7-entry
  warning threshold for frontend folders too; §3 « max 5 functions per page »;
  §7 Python import style (top of file, repeated imports are normal, no
  function-level imports); §9 « Comments and docstrings » as its own section
  (keep the why/contracts, prune the rest, fix stale comments in the same
  commit); §1 bullet « decide where a thing belongs before writing it ».
- `CODEX.md` merged into the Guide (its three unique rules) and deleted;
  README and BUSINESS_PLAN now point to `docs-md/Guide.md`.
- TODO: task to hide demo data in production (`VITE_DEMO=off` in
  `Dockerfile.prod` + Vercel) and a task to evaluate whether backend
  docstrings/comments help an AI session (keep the why, prune the noise).

## 6. Prototype (`chezmarthe-demo/src`) split

- One subfolder per file kind: `pages/` (markup only), `css/` (common + one
  sheet per page), `js/` (nav.js + one script per page); `build.py` assembles.
- Verified the rebuilt `index.html` pages are byte-identical; the prototype's
  CLAUDE.md documents the new layout.

## 7. Frontend features follow the site

- `features/equipe/` (19 features), `features/residents/`,
  `features/benevoles/`, `features/partenaires/`, `features/public/`
  (landing, site-pages, feedback, public-request); `auth`, `chatbot`,
  `traces` stay shared at `features/` root.
- 641 relative imports rewritten via record-before/resolve-after script;
  test runner glob covers the new depth; the backend mirror test path fixed.

## 8. Landing refactor

- `Landing.jsx` went from 666 mixed lines to a ~95-line composition with one
  package per site section under `sections/`: hero (typewriter), lieu
  (PlaceMap arrow geometry), equipe (team + pillars wave), evenements
  (WeekProgramme, FeaturedEvent, agenda.js), espaces (cards + request block),
  partenaires (PartnerRow + useAutoScroll), impliquer, contact.
- `Brand` and `SiteFooter` in their own files; `SignIn`, `SitePage`,
  `PublicShell` import them directly.
- `home.css` (1874 lines) split into seven thematic sheets cut at
  brace-depth-0 boundaries and imported by the `home.css` aggregator in the
  original order; concatenation verified byte-identical, so the cascade is
  untouched. `sections/` holds 8 folders: the site's 8 anchors.

## 9. Prospection seed data

- `prospectionData.js` (1722 lines) became the public entry re-exporting
  `data/index.js`; the sheets live in `data/{repertoire,calls,strategy,
  additions,contacts,patrons}.js`. Same named exports, consumers and tests
  unchanged; the order-dependent contact research passes stay whole in
  `contacts.js`.

## 10. Language sweep

- Italian removed from repo code and build files (comments, pyproject note,
  Makefile messages); French kept for site content and team documents;
  commit messages in English.

## 11. Session memory

- Saved durable rules to memory: `docs-md/Guide.md` is append-only (additions
  only, explicit user order required for anything else), and the language
  rules above.

## 12. More factoring (autonomous pass)

- Guide §9 « Comments and docstrings » moved to its own section (out of §3,
  with the user's explicit go-ahead); §1 gained « decide where a thing belongs
  before writing it » after the §3→§9 lesson.
- Makefile: last Italian comments and message translated (French kept).
- `prospectionData.js` split into the `data/` subpackage (see §9).
- `App.jsx`: `PageContent`'s 18-branch if-chain became a `PAGES` registry in
  the same style as `MODALS` — adding a page is now one entry.
- Deliberately NOT factored, with reasons: date helpers duplicated in exactly
  two places as one-liners (§3 forbids the abstraction), `PlaceMap.jsx` (230
  cohesive lines of one animation), backend `messages.py` / `gcal.py` /
  `facturation/routes.py` (documented decisions in TECH_DEBT, incl. the
  monkeypatch constraint), `fonts.css` (generated data).

## Pushes

- `dae7f59` repo docs/organization + CORS fix + app-layer refactor + TODO task
- `0e7ac94` prototype split + frontend audience reorganization + Guide §2
- `eb6f475` Guide preamble, nesting threshold, CODEX merge, landing start
- `30b68f0` landing section packages (JSX)
- `7f4a366` home.css thematic sheets + Guide §1 placement bullet
- `a9…` prospection data subpackage + Guide §9 + Makefile sweep
- (next) PAGES registry in App.jsx + this log
