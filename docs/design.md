# How this prototype was designed

> **What this document is.** This is the design plan Claude produced on the
> fly during the 45-minute Somers Town workshop on 28 April 2026, after
> 7 multiple-choice clarifying questions about scope, audience, and
> ambition. No code had been written yet. Everything that ships in the
> rest of this repo is the execution of the plan below.
>
> **Read this if you want to see how an AI tool can take a fuzzy
> neighbourhood-challenge brief ("help an 18-year-old care leaver in
> Camden") and produce a buildable spec — the questions it asked, the
> trade-offs it surfaced, and the things it deliberately cut from scope.**
>
> A few open questions in §11 below have been resolved by the build —
> notably, MVP captures nothing (privacy-first), branding is
> Phoenix Court / Bloomsbury Football, and English-only is acknowledged
> as the first thing to add in v2.

---

# Plan: "Camden Digital Lifeline" — workshop prototype

A printed booklet + QR-triggered triage web app that helps a young care leaver in Camden find the right digital-inclusion service for *their* situation in under 60 seconds.

---

## 1. Context

**Why this exists.** A care leaver who has just turned 18 in Camden faces a stacked deck: digital exclusion (no device, no data, no email, no skills), unemployment, and unstable tenancy. The three problems compound — most employment, housing, and benefits services *assume* digital access. Provision exists in Camden, but it is fragmented across council teams, libraries, charities, and national programmes. Today, a young person typically learns about services by accident or through a single keyworker. If that keyworker is unavailable, momentum is lost.

**What this prototype proves.** That a young person can hold a small printed booklet (handed to them on Day One of leaving care, in a drop-in, at New Horizon, or by their Personal Advisor), scan one QR code, answer 3–5 simple questions, and immediately see the **two or three most relevant Camden services for their specific situation** — with calling, mapping, and "what to expect when I get there" baked in.

**Audience.** The young person directly. Trauma-informed, low-reading-age, mobile-first, no account, no shame.

**Output ambition.** Workshop prototype only. The goal is a credible, demonstrable artefact (printed booklet + working web app + curated dataset for the digital category) — *not* a pilot to hand to real young people. That comes later.

**MVP category.** Digital inclusion only (devices, data/Wi-Fi, basic skills, online ID & accounts, tech help). Employment and housing come in v2/v3 once the pattern is validated.

---

## 2. The user journey

```
[ Care leaver receives booklet ]
            │
            ▼
[ Scans the back-cover QR with their phone ]
            │
            ▼
[ Welcome screen — warm, plain language, "this is private, nothing is saved" ]
            │
            ▼
[ Triage: 4 questions, multiple-choice, ~30 seconds ]
            │
            ▼
[ Top 3 matches — each with: what they do, where, how to get there,
   what to expect, eligibility plain-English, "Call now" / "WhatsApp" / "Open in Maps" ]
            │
            ▼
[ "Save these 3" → screenshot prompt OR send to my own number via WhatsApp link ]
```

**Anti-goals (explicit YAGNI):**
- No user accounts, no sign-in, no profile saving on a server.
- No analytics that identify a person. Only anonymous aggregate counters at most.
- No chatbot, no AI Q&A. Rule-based matching only.
- No native app.
- No employment or housing data in MVP.
- No multilingual support in MVP (note as known gap; Camden has a large non-English-first population).

---

## 3. Components

### 3.1 The printed booklet (`/booklet/`)

A6 or A5, 16–20 pages, full-colour, designed for pocketability.

- **Cover** — warm illustration, title like *"Camden — your starting points"*, the QR.
- **Inside cover** — *"How to use this"*: scan the QR for personalised matches, or flip through if you can't.
- **Pages 1–2** — *"You don't have to do this in order. Pick what's lightest first."* Trauma-informed framing.
- **Pages 3–N** — One organisation per page (or two compact). Each card uses the same template as the web profile so paper and screen feel coherent.
- **Back cover** — Big QR + short text: *"Answer 4 quick questions, see the best 3 places for you. Nothing is saved."*

The booklet is **generated from the same JSON dataset as the web app**, via a build script — so the paper and the screen never drift.

### 3.2 The triage web app (`/web/`)

A static, single-page web app. No backend. Hosted on Netlify or Vercel free tier. Loads in <1s on 3G.

- One JSON file (`orgs.json`) is bundled with the page.
- Triage questions and matching are pure client-side JavaScript.
- No cookies. No localStorage by default (offer it only as opt-in *"keep my answers on this phone"*).
- No third-party scripts (no Google Analytics, no Facebook pixel, no fonts from Google).

### 3.3 The organisation dataset (`/data/orgs.json`)

The single source of truth for both the booklet and the web app. ~15–25 entries for the digital MVP.

---

## 4. Data model

```json
{
  "id": "camden-libraries-tech-help",
  "name": "Camden Libraries — Tech Help drop-ins",
  "category": "digital",
  "subcategories": ["devices", "wifi", "skills", "id-and-accounts"],
  "what_they_do_plain": "Free Wi-Fi, computers you can use, and someone to help you set up email, Universal Credit accounts, or learn the basics. No appointment.",
  "what_to_expect": "Walk in. Ask at the desk for tech help. Sessions are usually 30 minutes. You don't need a library card to use a computer for short visits.",
  "eligibility_plain": "Anyone. You don't need an address or ID.",
  "free": true,
  "drop_in": true,
  "appointment_required": false,
  "open_to_under_18": true,
  "locations": [
    {
      "name": "Holborn Library",
      "postcode": "WC1X 8PA",
      "lat": 51.524,
      "lon": -0.117,
      "hours_plain": "Mon–Fri 10–7, Sat 10–5"
    }
  ],
  "contact": {
    "phone": "020 7974 4444",
    "whatsapp": null,
    "website": "https://www.camden.gov.uk/libraries"
  },
  "tags_situation": ["no-device", "no-data", "needs-skills", "needs-email", "needs-uc-account"],
  "tags_safe_for": ["under-18", "no-id", "no-fixed-address", "lgbtq-friendly"],
  "last_verified": "2026-04-28",
  "source": "https://www.camden.gov.uk/digital-inclusion"
}
```

The `tags_situation` and `tags_safe_for` arrays are what the triage questionnaire matches against.

---

## 5. Triage questionnaire (the core UX)

Four questions, plain language, multiple choice, with a "skip" on each.

1. **What's the biggest thing in the way right now?** *(pick one)*
   - I don't have a phone or laptop I can use → `no-device`
   - I have a phone but no data / no Wi-Fi → `no-data`
   - I'm not sure how to do something online (UC, email, applications) → `needs-skills`
   - I need to get an email / ID / online account sorted → `needs-email` / `needs-id`

2. **Where in Camden are you most days?** *(pick one — used to sort by walking distance)*
   - North (Kentish Town, Tufnell Park, Camden Town)
   - Centre (Holborn, Bloomsbury, King's Cross)
   - South (Covent Garden, Holborn) / I move around / Don't know

3. **Anything we should know so we only show places that fit?** *(multi-select, optional)*
   - I'm under 18
   - I don't have ID right now
   - I don't have a fixed address
   - I'd prefer somewhere that's good for women / LGBTQ+ people

4. **How urgent is this?** *(pick one)*
   - Today / this week
   - In the next month
   - I'm just looking around

**Matching logic (v1, pure rule-based):**

```
score(org) =
    +3 if user's #1 situation tag is in org.tags_situation
    +2 if any of user's #3 safety tags are in org.tags_safe_for
    +2 if any org.location is in the user's region
    +1 if org.drop_in and user said "today/this week"
    -5 if user is under 18 and !org.open_to_under_18
sort desc, take top 3
```

Show the top 3 with a clear *"why this matches you"* line ("Drop-in today, no appointment, no ID needed").

---

## 6. Tech stack

Optimised for "a small team can build and ship this in a workshop":

- **Framework:** [Astro](https://astro.build) — static-by-default, near-zero JS, accessible defaults, easy print stylesheets. Alternative: vanilla HTML + a single `app.js`. *Avoid* Next.js / React app router for this; overkill.
- **Styling:** Tailwind CSS, with a tight design-token file (max 8 colours, 2 typefaces). Warm, not clinical. High contrast, body text 18px+, line height 1.6.
- **Data:** A single `data/orgs.json` checked into git. No database.
- **Hosting:** Netlify or Vercel free tier. Custom subdomain optional (e.g. `camden.{phoenix-court-or-bloomsbury-football}.org`).
- **Booklet generation:** A Node script (`scripts/build-booklet.mjs`) reads `orgs.json` and renders an HTML print layout; print to PDF via headless Chromium (`@sparticuz/chromium` or local `puppeteer`). Designer can override final layout in Figma/InDesign for the workshop demo if needed.
- **QR generation:** `qrcode` npm package; one master QR for the back cover plus optional per-org QRs on each page (deep links to that org's profile).
- **Privacy:** No third-party JS. Self-hosted fonts. No analytics in prototype; if needed, [Plausible](https://plausible.io) or [Umami](https://umami.is) (cookie-less, GDPR-clean).
- **Accessibility target:** WCAG 2.2 AA, manually checked with axe DevTools and a real screen reader (VoiceOver iOS).

---

## 7. Privacy, safeguarding, and trauma-informed design

These are non-negotiable for this audience.

- **No data leaves the device.** Triage answers live in memory only. The "save my 3 matches" feature uses the share sheet (WhatsApp to self / screenshot) — not a server.
- **No login, no email capture.** Ever.
- **Plain language, not jargon.** Reading age 11. No words like "cohort", "intervention", "service-user". Test with a real young person if at all possible during the workshop.
- **No shame framing.** "You don't have to do this in order. Pick what's lightest first." Avoid "vulnerable", "at risk", "hard-to-reach".
- **Show eligibility upfront.** A young person who walks 40 minutes to a service that turns them away will not try again. Each card states what's needed and what isn't.
- **Safe-exit / quick-leave.** A subtle "Go to BBC News" button on every page. (Standard for women's-aid-style sites; same logic applies for some care-leaver scenarios.)
- **No "rate this service" prompts.** Adds cognitive load and creates exclusion vibes.
- **Safeguarding signpost.** A persistent footer link: *"In danger right now? Tap here."* → page with 999, Childline (under-18s), Samaritans, Camden out-of-hours social care.

---

## 8. Build plan (phased, ~2–3 weeks part-time)

### Phase A — Research & data (3–5 days)
1. Compile candidate org list for the digital MVP. Start points:
   - Camden Council Digital Inclusion strategy & hardware/data scheme
   - Camden Libraries (Holborn, Swiss Cottage, Kentish Town, Queen's Crescent, Pancras Square + 7 others) — tech-help drop-ins
   - Camden Adult Community Learning (free digital skills)
   - Good Things Foundation Online Centres Network — Camden delivery partners
   - New Horizon Youth Centre (Holborn) — broad young-person support incl. digital
   - Single Homeless Project (SHP) — Camden services
   - Catch22 — Camden care-leaver delivery
   - Centrepoint — digital element of housing programmes
   - Voluntary Action Camden — hub for finding smaller orgs
   - Citizens Advice Camden — UC online help
   - Drive Forward Foundation — employment but with digital prerequisites
   - Coram Voice / Become / A National Voice — care-leaver-specific advocacy with digital relevance
2. For each candidate, fill the data model fields. **Verify by phone or website** before adding (`last_verified` date is required). Aim 15–25 entries — quality over breadth.
3. Tag each entry against the situation/safety taxonomy from §5.

### Phase B — Web prototype (3–5 days)
4. Scaffold Astro project, set up Tailwind, design tokens, type scale.
5. Build the welcome → triage → results flow with hard-coded test data.
6. Implement the matching function in plain TypeScript with unit tests.
7. Wire `orgs.json` in, build org-profile pages (deep-linkable).
8. Pass axe accessibility checks; manual VoiceOver run.
9. Deploy to Netlify; configure custom subdomain if available.

### Phase C — Booklet (3–4 days)
10. Design print layout (one Astro page with print stylesheet, A5).
11. Build `scripts/build-booklet.mjs` to render PDF from `orgs.json`.
12. Generate master QR (back cover) + per-org QRs.
13. First print proof — review for legibility, warmth, voice.
14. Second pass with a designer if available; otherwise iterate the HTML/CSS.

### Phase D — Workshop demo (1–2 days)
15. Print 5–10 booklets.
16. Prepare a 5-minute walkthrough: hold the booklet, scan, do triage, show match.
17. Capture honest "what's missing" notes for v2 (employment + housing categories).

---

## 9. Critical files / artefacts to be created

```
PhienixCourt Workshop/
├── data/
│   └── orgs.json                    # Single source of truth (Phase A)
├── web/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.astro          # Welcome
│   │   │   ├── triage.astro         # 4-question flow
│   │   │   ├── results.astro        # Top 3 matches
│   │   │   └── org/[id].astro       # Per-org deep-link page
│   │   ├── lib/
│   │   │   ├── match.ts             # Scoring function (unit-tested)
│   │   │   └── types.ts
│   │   └── styles/
│   │       └── tokens.css           # Colour, type, spacing
│   ├── astro.config.mjs
│   └── package.json
├── booklet/
│   ├── layout.astro                 # Print stylesheet
│   └── output/
│       └── camden-digital-lifeline.pdf
├── scripts/
│   ├── build-booklet.mjs            # JSON → PDF
│   └── generate-qrs.mjs             # Master + per-org QRs
└── README.md                        # How to run, build, print
```

---

## 10. Verification

End-to-end check before declaring the prototype done:

1. **Data integrity** — every org in `orgs.json` has `last_verified` within the past 30 days, a working phone number, and a postcode that resolves on Google Maps.
2. **Matching unit tests** — at least 6 fixtures (e.g. "under-18 + no device + north Camden + urgent") with the expected top-3 hard-coded.
3. **Web walkthrough on a real phone** — load the deployed URL on a low-end Android over a throttled 3G connection. Time to results <10 seconds. No console errors.
4. **Accessibility scan** — axe DevTools clean on every page; VoiceOver completes the triage successfully.
5. **Booklet print proof** — A5 print at 100%, body text legible at arm's length, QR scans on first try from 30cm with a 3-year-old phone.
6. **Cross-medium check** — the same five orgs render with the same wording in the booklet and on the web profile pages.
7. **Privacy audit** — open Network tab during the full flow; confirm zero requests to third-party domains and zero requests carrying user answers.
8. **Trauma-informed read-through** — read every line aloud asking *"would I want to read this if I'd just turned 18 and lost my placement?"*. Cut anything that fails.

---

## 11. Open questions to resolve before / during build

- **Do we want to *capture* triage answers, or just use them to recommend?** I've designed the MVP to be privacy-first: nothing leaves the device. But you said *"for us to understand their needs"* — if "us" means the workshop team wants to learn from anonymised aggregate patterns (e.g. "70% of scans selected 'no device'"), we'd add a tiny opt-in *"can we count this anonymously?"* toggle and a cookieless analytics endpoint. Worth deciding up front because it changes the privacy story we tell on the welcome screen.
- **Branding.** Is this Phoenix Court, Bloomsbury Football, neither, both? Affects logo, colours, tone, and which subdomain it lives at.
- **Designer access.** Is there a designer on the workshop team for the booklet? If not, the build script's HTML output will be the final design.
- **Is there an existing Camden care-leaver point of contact who'd review the org list and language for accuracy/safeguarding?** Even informal review materially raises the prototype's credibility.
- **Distribution narrative for the demo.** Who do we *imagine* hands the booklet over — Personal Advisor, drop-in worker, library staff? Worth nailing for the workshop story.
- **Languages.** English-only is an explicit MVP cut, but worth naming as the first thing we'd add in v2.

---

## 12. What v2 looks like (out of scope, for context only)

Once digital MVP works: add **employment** and **housing** as additional categories with their own `tags_situation`. The triage gains a "what kind of help?" question first. The data model and matching engine don't change. This is why MVP is digital-only — it's the smallest end-to-end slice that proves the whole pattern.
