# Ascendume relaunch plan

Agreed 2026-11-18. Check-in: **2027-01-04**.

## Goal

Get Ascendume in front of real users. If nobody uses it, it is still a solid
portfolio piece. It is free: no pricing, no billing, no plans.

## Users

Students and new grads in any field, applying for full-time roles or
internships. CS students and new grads are the first audience and the launch
channel, but nothing in the product is CS-only. Jake's resume template is the
only format.

## Product

### Two entry points, one builder

Both routes land in the same builder with the same review panel.

- **Review my resume** (primary CTA): the user uploads a PDF, it is parsed into
  the builder fields, and a review runs straight away.
- **Build one with AI**: the user starts empty and answers a section-by-section
  interview. The AI drafts bullets only from those answers.

### Review

- Runs only when the user clicks "Review my resume". After any edit, the panel
  is marked outdated. It never re-scores automatically.
- Shows a category breakdown with findings tied to specific bullets. An overall
  score is shown, but it is the least prominent element.
- The rubric lives in code as explicit criteria (see [Rubric](#rubric)).
  Deterministic checks run first. The LLM handles only judgment calls and must
  cite the bullet each finding is about.

### No fabrication

The AI never invents a claim, number, or metric that is not in the user's
input.

- **Asking for numbers**: when a bullet has no measurable outcome, the AI asks
  a targeted question on that bullet ("Roughly how many users / requests / %
  improvement?"). It rewrites using only the answer. If the user skips, the
  bullet stays as it is.
- **Guided interview**: plain questions per section ("What was your role? What
  did you build? What changed because of it, and roughly how much?"). It treats
  class projects, hackathons, clubs, and labs as real material for students with
  thin experience.
- Both flows use one engine, and every rewrite is a diff the user accepts or
  rejects.
- The "enhance all" button and its endpoint are removed.

### Access

| | Guest | Signed in |
|---|---|---|
| Builder, live preview | ✓ | ✓ |
| PDF + `.tex` export | ✓ | ✓ |
| Deterministic rubric checks (in browser) | ✓ | ✓ |
| Draft kept in the browser | ✓ | carries over on sign-up |
| Cloud save | | ✓ |
| PDF upload + parse | | ✓ |
| LLM review, interview, rewrites | | ✓ |

- **Sign-in**: GitHub, Google, and Microsoft (personal and work/school accounts),
  with email/password as the fallback.
- **AI cost control**: every AI route requires a session. Each user gets daily
  caps counted in the DB (starting point: 3 full reviews and 30 bullet rewrites
  per day). Rewrites use a cheaper current mini model, and scoring uses a
  stronger model.

### Skills

Skills become categories the user names (`Label: items` rows, matching Jake's
template). The defaults are CS-style labels, and users can rename them (e.g.
"CAD / Lab / Software"). This replaces the fixed `technical` / `frameworks`
columns.

### Trust

- A plain-English privacy note covering what is stored, that resume text goes
  to OpenAI only when the user clicks review, interview, or rewrite, and that
  nothing is used for training.
- A working "delete my account and data" button.
- The analytics events listed under [Measuring](#measuring), and nothing else.

### Landing page

- Remove the Free/Pro pricing section and say "free" plainly.
- Two CTAs, in this order: **Review my resume** and **Build one with AI**.
  They replace "Get Started → sign-in".
- The copy speaks to "students and new grads". CS examples and screenshots are
  fine, but it does not say "for CS students".

## Milestones

Do these in order, at whatever pace the week allows. The only fixed date is
the check-in. If time runs short, drop work below the cut line first.

### 1. Cleanup and foundations
- [x] Require a session on `app/api/ai/enhance-all/route.ts`, which is
      currently unauthenticated, until it is replaced in milestone 4
- [x] Remove the pricing section from `app/(marketing)/landing-page.tsx`
- [x] Fix `CLAUDE.md` and `AGENTS.md`. They describe a `resumes/[id]/export/`
      route, an `ai/enhance/` streaming route, `@react-pdf/renderer`, and a
      `db/schema.ts` path, none of which exist
- [x] Delete dead files: `components/pdf-preview.tsx`,
      `scripts/bundle-texlive.sh`. Check `@napi-rs/canvas` is still needed
- [x] Switch skills to categories the user names (schema, migration, context,
      LaTeX output)
- [x] Split `components/ResumeBuilder.tsx` only where later milestones need
      room. No broad refactor
      (Done 2026-11-18. `pdf-preview.tsx` was the landing hero image, so it was
      inlined into the landing page rather than dropped. Skills moved to a
      `skill_categories` table; the skills editor now lives in
      `components/builder/`.)

### 2. Open the door
- [x] Guest mode: `/new` works without an account, with the draft kept in the
      browser and carried over on sign-up
- [x] `.tex` export (download the generated source)
- [x] GitHub, Google, and Microsoft OAuth through better-auth, with email
      kept as the fallback
- [x] Landing page with two CTAs and the broader copy
      (Done 2026-11-18. "Review my resume" goes through sign-up to the
      dashboard upload until milestone 3 adds the review route. OAuth providers
      show only when their credentials are set.)

### 3. Review
- [ ] Rubric module with criteria as data (see [Rubric](#rubric))
- [ ] Deterministic checks running in the browser
- [ ] LLM judgment pass that cites bullets
- [ ] Review panel with category breakdown, findings tied to bullets, the
      outdated state, and a "Review my resume" button
- [ ] Review route: upload → parse → builder → review

### 4. Fixing and writing
- [ ] Ask-for-numbers flow on flagged bullets
- [ ] Guided interview for the build route
- [ ] Shared rewrite engine with accept/reject diffs. Remove "enhance all"
- [ ] Daily AI caps in the DB, and the model split (mini for rewrites, stronger
      for scoring)

### 5. Trust and measurement
- [ ] Privacy note page
- [ ] Account and data deletion
- [ ] Analytics events

### 6. Testing
- [ ] Agent tests with the three personas (see [Agent testing](#agent-testing)).
      Record findings below
- [ ] Put it in front of any real users available
- [ ] Fix what they hit

### 7. Public post
- [ ] University CS Discords and clubs, r/csMajors, r/cscareerquestions

**— cut line —**

### 8. `.tex` import
- [ ] Paste or upload a Jake's-template `.tex` file and map it straight into
      the builder fields

## Rubric

The core is field-agnostic. Field-specific add-ons (tech stack listed, GitHub
link present) are out of scope for this relaunch.

| Category | Check | Kind |
|---|---|---|
| Impact | Bullet has a measurable outcome (number, %, scale) | deterministic flag → asks for the number |
| Impact | Bullet describes a result, not just a duty | LLM |
| Language | Bullet starts with an action verb | deterministic |
| Language | No weak or filler phrasing ("responsible for", "helped with") | deterministic |
| Clarity | Bullet is one line to two lines and readable on its own | deterministic length + LLM |
| Length | Fits on one page | deterministic (compiled page count) |
| Consistency | Date formats, tense (past for past roles), punctuation | deterministic |
| Completeness | Contact info present, every entry has dates | deterministic |
| ATS-safety | No content the template can't render cleanly | deterministic |
| Relevance | Summary and skills support the experience shown | LLM |

Each criterion has an id, category, check, reason shown to the user, and kind.
The LLM may only return findings for LLM-kind criteria and must include the
bullet id.

## Measuring

The analytics events are listed below. They use Vercel Analytics or Plausible,
plus DB counts, and contain no resume content.

1. `visited`
2. `resume_started` (with route: build or review)
3. `resume_imported`
4. `review_run`
5. `rewrite_accepted`
6. `exported` (pdf or tex)

## Success criteria (2027-01-04)

**Keep going** if at least 25 people who are not friends export a PDF, and at
least 5 of them come back within a week. **Otherwise**, write it up as a
portfolio piece and shelve it.

## Agent testing

Run each persona against a local build with browser tools. Each one reports
where it got stuck or confused.

1. **No resume**: a student with no resume uses the guided build.
2. **Clean Jake's PDF**: a student uploads a well-formed Jake's resume and
   reviews it.
3. **Messy PDF**: a student uploads a two-column PDF exported from Word, to
   hit parser edge cases.

### Findings

_(record here)_
