# Coding Guidelines

Rules for working on this project. They are guidelines, not dogma: if a rule
does not apply, explain why in the report instead of following it blindly.
When in doubt, ask before writing code.

> **AI sessions (Claude, Codex, …): read this file in full before touching any
> code, and follow these rules in every task, always** — folder structure (§0,
> §2), simplicity, surgical changes, verification, reporting. A rule is skipped
> only for a stated reason, explained in the end-of-work report (§8), never
> silently.

---

## 0. Structure: responsibility first, numbers as warning lights

**Principle.** Every folder has **one responsibility**, and its name says which.
A package is a folder with `__init__.py`; a module is a file. The structure must
make it obvious *where* new code goes, not impress.

**Practical rules.**

- **Python backend**: organize by responsibility, not by file kind. Group into a
  package when a domain has several modules or when the root becomes a flat list
  of files with no hierarchy. Do not create a package for a single small module:
  a file first, extract later.
- **Warning threshold**: a folder with **more than 7 entries** (modules and
  sub-packages together, `__init__.py`, `__main__.py` and non-Python files
excluded) is the signal that one more level is needed. The number is a warning
  light, not a target: **never split just to reach the number**.
- **Exceptions**: going over the threshold is allowed when the modules genuinely
  share one responsibility. In that case write the reason in the package
  `__init__.py` docstring, prefixed with `Exception: ...`, and mention it in the
  report.
- **`__init__.py`**: minimal, with a one-line docstring stating the package's
  responsibility. It exposes the public API, not every symbol.
- **No import cycles** between packages. A lower-level package never imports from
  a higher-level one.
- **Entry point**: `backend/main.py`, started as `uvicorn main:app --app-dir backend`.
  It is an external contract (`Makefile`, `Dockerfile`, `deploy/Dockerfile.prod`).
  Do not move or rename it without updating those three places and the deploy in
  the same commit.
- **Frontend JS**: tests live next to the sources (`*.test.js` in the same feature
  folder). Do not force the `tests/unit/` layout on the frontend: the runner uses
  the globs in `frontend/package.json` and tests import modules through relative
  paths.
- **Backend tests**: `tests/` at the backend root. As packages grow, `tests/` may
  mirror the structure (`tests/unit/...`). For now it stays flat: moving tests
  without a concrete reason is noise.

**How it is checked.** `make check` (see §7) must pass before every commit. Any
new automated structure rule must fail with a message that explains *what* to
move, not just *that* something is wrong.

---

## 1. Think before coding

Do not assume. Do not hide confusion. Surface the tradeoffs.

Before implementing:

- State your assumptions. If uncertain, ask.
- If several interpretations exist, present them: do not pick one silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what is confusing. Ask.
- Decide **where** a thing belongs before writing it: prefer the structurally
  right placement over the smallest diff (a rule put in the wrong section must
  be moved twice, and every move touches history).

---

## 2. Folders mirror the site

The repo is split by **what is delivered**, and both frontend and backend
mirror the **audiences of the site**. A new file goes into the folder of the audience it
serves, never into a generic "misc" folder.

- **Repo**: `backend/` (FastAPI), `frontend/` (React app), `deploy/` (server
  config), `docs-md/` (documentation). One build serves everything: FastAPI serves the React app on
  the bare domain (public site) and on every space subdomain.
- **Frontend features follow the subdomains**: `features/equipe/` (one
  subfolder per équipe page), `features/residents/`, `features/benevoles/`,
  `features/partenaires/`, `features/public/` (home, site pages, bilan, public
  form). A feature used by several spaces stays at `features/` root
  (`auth`, `chatbot`, `traces`).
- **Backend follows the same spaces, with the frontend's names**:
  `backend/equipe/<page>` mirrors `features/equipe/<page>` (`bilans`, `funding`,
  `prospection`, `quotes`, `messages`, `profiles`, `site`, `opportunities`),
  `backend/residents/`, `backend/public/` (forms anyone can send). What several
  spaces use stays at `backend/` root (`accounts`, `agents`, `agenda`, `ai`,
  `core`, `sharing`, `mailer`, `ranking`, `demo`). A space with no server code
  of its own (today `benevoles`, `partenaires`) gets no folder until it needs one.
- **`shared/`** holds what every audience uses: `components/`, `data/`, `lib/`,
  `styles/` — named for the responsibility (styles), not the technology (css).
- **Folders nest freely** (`equipe/requests/components/…`), with the same
  warning threshold as §0: more than ~7 entries in a folder is the signal for
  one more level — a warning light, never split just to hit the number.
- Adding a page or feature: create its folder under its audience, then wire it
  into the entry point and the CSS index **in the same commit**.

---

## 3. Simplicity first

Minimum code that solves the problem. Nothing speculative.

- No feature beyond what was asked.
- No abstraction for code used only once.
- No flexibility or configurability that was not requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask yourself: "would a senior engineer call this overcomplicated?" If yes,
  simplify.

**Functions.** Aim for **one thing**, readable without scrolling, at a single
level of abstraction. The indicative limit is ~25 lines: if you go far over it,
the function does too much and must be split **by responsibility**, not to make a
number fit. At most **5 functions per page**.

---

## 4. Surgical changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Do not improve adjacent code, comments or formatting.
- Do not refactor what is not broken.
- Match the existing style, even if you would do it differently.
- If you notice unrelated dead code, **report it** in `TECH_DEBT.md`: do not delete
  it.

When your changes create orphans:

- Remove imports, variables and functions that **your** changes made unused.

**The test:** every changed line must trace back directly to the request.

---

## 5. Goal-driven execution

Define verifiable success criteria. Iterate until they are met.

Turn tasks into verifiable goals:

- "Add validation" -> "Write tests for invalid inputs, then make them pass".
- "Fix the bug" -> "Write a test that reproduces it, then make it pass".
- "Refactor X" -> "Make sure the tests pass before and after".

For multi-step tasks, state a short plan:

1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]

Strong criteria let you iterate on your own. Weak criteria ("make it work") need
constant clarification.

---

## 6. When a refactor is worth it

A refactor is done **only** if it solves a concrete problem: duplicated code,
mixed responsibilities, fragile tests, an unmanageable folder. "Align the
packages" is not a concrete problem.

Before a refactor:

- Write **why** it is needed (the observable problem).
- Check that the tests cover the behaviour you are about to touch.
- If a module is patched with `monkeypatch.setattr(module, "function", ...)`, know
  that moving it into a package **breaks the patch** unless the tests are updated
  in the same commit. If you do not want to touch the tests, do not move it.
- One commit per refactor, with green tests before and after.
- If the refactor brings no measurable benefit, **stop** and report it.

---

## 7. Tools and verification

- **Dependencies**: `uv` for Python, `npm` for the frontend.
- **Python style**: imports go at the top of each file. Repeating an import
  across files is normal Python, not duplication — do not "fix" it. Never add
  imports inside functions unless avoiding a genuine circular dependency.
- **Gate before every commit**: `make check` -- `uv lock --check`, `ruff check`,
  `ruff format --check`, `pytest`, JS tests, frontend build.
- **Ruff**: errors in the code you touch must be fixed; pre-existing ones
  elsewhere go into `TECH_DEBT.md`, never fixed silently.
- **Commits**: small, with a message that says *what* and *why*. One commit per
  verifiable unit of work.
- **Technical debt**: anything you find but do not fix goes into `TECH_DEBT.md`,
  with the file, the kind of problem and the condition to address it.

---

## 8. End-of-work report

When you finish, report:

- **What** you changed and **why**.
- **How** you verified it (commands, outcomes).
- What is **left open** or risky.
- If you deviated from these rules, **say so** and explain why.

---

## 9. Comments and docstrings

Comments and docstrings are documentation, not code: judge them separately.

- Keep the ones that explain the **why**: contracts, invariants, decisions and
  traps a reader cannot see in the code (a monkeypatch that breaks when a
  function moves, a one-way sync, hand-tuned geometry).
- Shorten or drop the ones that only restate what the name already says.
- A stale comment that contradicts the code is worse than no comment: when a
  change invalidates a comment, update or remove it in the same commit.
