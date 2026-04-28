# Camden Digital Lifeline — workshop prototype

A printed booklet + QR-triggered triage web app that helps a young Camden care
leaver find the right digital-inclusion service for their situation in under
a minute. Designed for a Phoenix Court / Bloomsbury Football workshop demo.

> **This is a prototype, not a pilot.** Every organisation entry is marked
> `draft` or `needs-verification`. Phone-confirm everything before you put it
> in front of a real young person.

## What's in here

```
.
├── data/
│   └── orgs.json                # The single source of truth: 11 Camden digital-inclusion orgs
├── web/
│   ├── index.html               # Single-page app: welcome → triage → results → org detail
│   ├── styles/main.css
│   ├── js/
│   │   ├── app.js               # Routing, state, view glue
│   │   ├── data.js              # Triage question definitions
│   │   ├── match.js             # Pure scoring function (unit-tested)
│   │   └── render.js            # DOM templates
│   └── tests/
│       └── match.test.mjs       # Node test runner — 8 tests, no deps
├── booklet/
│   ├── booklet.html             # A5 print layout — open in Chrome and Save as PDF
│   └── qrs/                     # Generated QR SVGs (master + per-org)
├── scripts/
│   └── generate-qrs.mjs         # Generates the QR SVGs from orgs.json
├── package.json
└── README.md
```

## Quick start

You need **Node 18+** and a modern browser.

```bash
# 1. Install (just the dev dep `qrcode` for the QR generator)
npm install

# 2. Generate the QR code SVGs (defaults to localhost; see "Printing" below for real URLs)
npm run qr

# 3. Serve everything from the project root
npm run serve

# 4. Open the demo
#    Web app:  http://localhost:3000/web/
#    Booklet:  http://localhost:3000/booklet/booklet.html
```

## Running the tests

The matching logic is pure and runs on Node's built-in test runner:

```bash
npm test
```

Should print `pass 8 / fail 0`. If you change weights in `web/js/match.js` or
add new orgs, run this and update fixtures as needed.

## Printing the booklet

The `booklet/booklet.html` page is laid out for A5 print.

1. Decide where the QR codes will point. The default is `http://localhost:3000/web`,
   which only resolves on your laptop. For anything beyond a workshop laptop demo,
   re-generate the QRs with the public URL of the deployed web app:

   ```bash
   BOOKLET_BASE_URL="https://your-deployed-site.example" npm run qr
   ```

2. Open `http://localhost:3000/booklet/booklet.html` in **Chrome**. (Safari's
   print engine is fussier about `@page` rules.)

3. **File → Print** (or ⌘P).

4. Settings:
   - **Destination:** Save as PDF (or your printer)
   - **Paper size:** A5
   - **Margins:** Default (the page itself controls margins)
   - **Background graphics:** ON (this is critical — without it, the chips and
     QR-block backgrounds disappear)
   - **Scale:** 100%

5. Save the PDF. Each `.page` becomes one page; you'll get 14 in total
   (cover + how-to + 11 org cards + back cover).

For physical printing: A5 saddle-stitched booklets work well at most local
print shops. If the printer needs imposition (folding & stapling), hand them
the single-page-per-sheet PDF — they'll handle the spread.

## Editing the data

`data/orgs.json` is the canonical dataset. Edit it and:

- The **web app** picks up changes on page reload (no build step).
- The **booklet** picks up changes on page reload.
- The **QR codes** only regenerate when you re-run `npm run qr` — and you only
  need to do this when an `id` changes or an org is added/removed.

### Org entry verification status

| Status               | What it means                                              |
| -------------------- | ---------------------------------------------------------- |
| `verified`           | Phone or visit confirmed within 30 days. Pilot-ready.      |
| `needs-verification` | From public sources, not phone-checked. Confirm before use.|
| `draft`              | Placeholder for the prototype demo. Likely contains errors.|

Warning chips render in both the web app and the booklet so a young person
isn't sent somewhere we haven't checked.

### Tag taxonomy

The matching function uses two tag sets per org:

- **`tags_situation`** — what the org actually helps with.
  Values: `no-device`, `no-data`, `needs-skills`, `needs-email`, `needs-uc-account`, `needs-id`.
- **`tags_safe_for`** — equity / accessibility flags surfaced to the matcher.
  Values: `under-18`, `no-id`, `no-fixed-address`, `lgbtq-friendly`.

The matching weights are in `web/js/match.js`:

```
+3 if user's situation is in org.tags_situation
+2 if any of user's needs are in org.tags_safe_for
+2 if any org location matches user's region
+1 if drop-in and user said "today/this week"
-5 if user is under-18 and org is adults-only
```

## What this prototype is not

- **Not a pilot.** Don't hand the booklet to a real young person without
  phone-confirming every entry first.
- **Not a service.** No accounts, no analytics, no server-side storage. The
  triage answers stay on the device by design.
- **Not multilingual.** English-only. Camden has a large non-English-first
  population — this is the first thing to add in a pilot.
- **Not full-coverage.** Digital category only. Employment and housing are
  the next two categories to add (the data model and matcher don't change).

## Design notes

- **Trauma-informed copy.** Reading age ~11. No jargon. No shame framing.
  Eligibility shown upfront. "Quick leave" button on every page.
- **Privacy-first.** No third-party scripts. No fonts from CDNs. No analytics.
  No localStorage by default. Triage answers exist in memory only.
- **Accessibility.** WCAG 2.2 AA target. 18px+ body, generous line-height,
  high contrast, keyboard-navigable, screen-reader-friendly.

## Open questions

These were flagged in the design plan and still need answers before pilot:

1. **Capture vs. recommend.** The MVP doesn't store anything. If the workshop
   team wants anonymised aggregate insight ("70% of scans selected 'no device'"),
   we'd add an opt-in cookieless counter — and the welcome screen's privacy
   line would need to change accordingly.
2. **Branding.** Phoenix Court? Bloomsbury Football? Co-branded? This affects
   the logo, the colour palette, and the deployed subdomain.
3. **Camden care-leaver point of contact.** Even an informal review of the org
   list and language by Camden's leaving-care team would materially raise the
   prototype's credibility for the workshop demo.
4. **Distribution narrative.** Who hands the booklet over? Personal Advisor?
   Drop-in worker? Library staff? Worth nailing for the workshop pitch.

## Credits

- Plan: see `~/.claude/plans/i-m-an-18-year-composed-prism.md`
- Built for a Phoenix Court / Bloomsbury Football workshop, April 2026.
