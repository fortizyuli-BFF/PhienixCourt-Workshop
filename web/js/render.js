// View renderers. Pure-ish: take state, return DOM-mutating instructions.
// Kept dependency-free; uses a tiny `el` helper for safe text/attr handling
// (no innerHTML with user data).

import { triageQuestions } from "./data.js";

/* --------------------------------------------------------------------------
   tiny DOM helpers (no innerHTML to keep XSS-safe even though all input is
   from the same domain — good habit)
   -------------------------------------------------------------------------- */

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/* --------------------------------------------------------------------------
   Triage question
   -------------------------------------------------------------------------- */

export function renderTriageQuestion(container, qIndex, currentValue, onSelect) {
  const q = triageQuestions[qIndex];
  clear(container);

  container.appendChild(el("h2", {}, q.title));
  if (q.sub) container.appendChild(el("p", { class: "sub" }, q.sub));

  const list = el("ul", { class: "option-list", role: q.type === "multi" ? "group" : "radiogroup" });

  q.options.forEach((opt) => {
    const isSelected = q.type === "multi"
      ? Array.isArray(currentValue) && currentValue.includes(opt.value)
      : currentValue === opt.value;

    const button = el("button", {
      type: "button",
      class: `option ${isSelected ? "is-selected" : ""}`,
      "aria-pressed": q.type === "multi" ? String(isSelected) : null,
      role: q.type === "multi" ? "checkbox" : "radio",
      "aria-checked": String(isSelected),
      dataset: { value: opt.value }
    },
      el("span", { class: `option-mark ${q.type === "multi" ? "option-checkbox" : ""}`, "aria-hidden": "true" }),
      el("span", {}, opt.label)
    );
    button.addEventListener("click", () => onSelect(opt.value));
    list.appendChild(el("li", {}, button));
  });

  container.appendChild(list);

  // Continue button for multi-select questions (so user can pick 0, 1, or many)
  if (q.type === "multi") {
    const actions = el("div", { class: "triage-multi-actions" },
      el("button", {
        type: "button",
        class: "btn btn-primary",
        onclick: () => onSelect("__continue__")
      }, "Continue")
    );
    container.appendChild(actions);
  }
}

export function renderProgress(progressEl, qIndex) {
  const steps = progressEl.querySelectorAll(".progress-step");
  steps.forEach((s, i) => {
    s.classList.toggle("is-done", i < qIndex);
    s.classList.toggle("is-active", i === qIndex);
  });
}

/* --------------------------------------------------------------------------
   Results
   -------------------------------------------------------------------------- */

export function renderResults(introEl, listEl, restEl, ranked, answers) {
  // Intro
  clear(introEl);
  introEl.appendChild(document.createTextNode(buildResultsIntro(answers)));

  // Top 3
  clear(listEl);
  const top = ranked.slice(0, 3);
  if (top.length === 0) {
    listEl.appendChild(el("li", { class: "org-card" },
      el("p", {}, "We couldn't find a great match. Try the libraries — they accept anyone, no ID needed."))
    );
  }
  top.forEach(({ org, reasons, score }) => {
    listEl.appendChild(renderOrgCard(org, { reasons, score }));
  });

  // Rest
  clear(restEl);
  ranked.slice(3).forEach(({ org, reasons }) => {
    restEl.appendChild(renderOrgCard(org, { reasons, compact: true }));
  });
}

function buildResultsIntro(answers) {
  const bits = [];
  if (answers.situation === "no-device") bits.push("you don't have a device you can use");
  if (answers.situation === "no-data") bits.push("you've got a phone but no data");
  if (answers.situation === "needs-skills") bits.push("you'd like help with skills");
  if (answers.situation === "needs-account") bits.push("you need to set up an email, UC, or ID");
  if (answers.region && answers.region !== "moves") bits.push(`you're in ${({north:"north", centre:"central", south:"south"})[answers.region]} Camden`);
  if (answers.urgency === "today") bits.push("you'd like help this week");

  if (bits.length === 0) return "Here are some good places to start.";
  return `Because ${bits.join(", ")}, these places fit best:`;
}

function renderOrgCard(org, { reasons = [], compact = false } = {}) {
  const li = el("li", { class: `org-card ${compact ? "compact" : ""}` });

  if (reasons.length > 0 && !compact) {
    li.appendChild(el("span", { class: "match-reason" }, reasons[0]));
  }
  li.appendChild(el("h3", { class: "org-name" },
    el("a", { href: `#org/${org.id}` }, org.name)
  ));
  if (!compact) {
    li.appendChild(el("p", { class: "org-summary" }, org.what_they_do_plain));
  }

  // Chips
  const chips = el("div", { class: "chips" });
  if (org.drop_in) chips.appendChild(chip("Drop-in", "good"));
  if (!org.drop_in && org.appointment_required) chips.appendChild(chip("By appointment"));
  if (org.free) chips.appendChild(chip("Free", "good"));
  if (org.open_to_under_18) chips.appendChild(chip("Under 18 OK", "good"));
  if (org.verification_status === "draft") chips.appendChild(chip("Draft entry", "warn"));
  if (org.verification_status === "needs-verification") chips.appendChild(chip("Needs verifying", "warn"));
  li.appendChild(chips);

  // Action row (only on non-compact cards)
  if (!compact) {
    const actions = el("div", { class: "action-row" });
    if (org.contact?.phone) {
      actions.appendChild(el("a", { class: "btn btn-secondary", href: `tel:${digits(org.contact.phone)}` }, `Call ${org.contact.phone}`));
    }
    const firstLoc = org.locations?.[0];
    if (firstLoc?.postcode) {
      const q = encodeURIComponent(`${firstLoc.address || ""} ${firstLoc.postcode}`.trim());
      actions.appendChild(el("a", { class: "btn btn-link", href: `https://maps.apple.com/?q=${q}`, target: "_blank", rel: "noopener" }, "Open in Maps"));
    }
    if (org.contact?.website) {
      actions.appendChild(el("a", { class: "btn btn-link", href: org.contact.website, target: "_blank", rel: "noopener" }, "Website"));
    }
    li.appendChild(actions);

    if (firstLoc) {
      li.appendChild(el("p", { class: "org-meta" },
        `${firstLoc.name || "Camden"} · ${firstLoc.hours_plain || "Hours vary"}`
      ));
    }
  }

  return li;
}

function chip(text, variant = "") { return el("span", { class: `chip ${variant}` }, text); }
function digits(s) { return String(s).replace(/[^\d+]/g, ""); }

/* --------------------------------------------------------------------------
   Single org detail (deep-link from booklet QR)
   -------------------------------------------------------------------------- */

export function renderOrgDetail(container, org) {
  clear(container);
  if (!org) {
    container.appendChild(el("p", {}, "We couldn't find that place. Try the home page."));
    return;
  }

  container.appendChild(el("h1", { class: "org-name" }, org.name));

  if (org.verification_status !== "verified") {
    container.appendChild(el("div", { class: "error" },
      "Heads up: this entry hasn't been phone-verified yet. Confirm details before going."
    ));
  }

  container.appendChild(el("p", { class: "lede" }, org.what_they_do_plain));

  // What to expect
  container.appendChild(el("section", { class: "detail-block" },
    el("h2", {}, "What to expect"),
    el("p", {}, org.what_to_expect)
  ));

  // Eligibility
  container.appendChild(el("section", { class: "detail-block" },
    el("h2", {}, "Who's it for?"),
    el("p", {}, org.eligibility_plain)
  ));

  // Locations
  if (org.locations?.length) {
    const locWrap = el("section", { class: "detail-block" }, el("h2", {}, "Where"));
    org.locations.forEach((loc) => {
      const card = el("div", { class: "location-card" });
      card.appendChild(el("p", { class: "name" }, loc.name));
      if (loc.address) card.appendChild(el("p", { class: "address" }, `${loc.address}, ${loc.postcode}`));
      if (loc.hours_plain) card.appendChild(el("p", { class: "address" }, loc.hours_plain));
      if (loc.postcode) {
        const q = encodeURIComponent(`${loc.address || ""} ${loc.postcode}`.trim());
        card.appendChild(el("a", { class: "btn btn-link", href: `https://maps.apple.com/?q=${q}`, target: "_blank", rel: "noopener" }, "Open in Maps"));
      }
      locWrap.appendChild(card);
    });
    container.appendChild(locWrap);
  }

  // Actions
  const actions = el("div", { class: "action-row" });
  if (org.contact?.phone) {
    actions.appendChild(el("a", { class: "btn btn-primary", href: `tel:${digits(org.contact.phone)}` }, `Call ${org.contact.phone}`));
  }
  if (org.contact?.website) {
    actions.appendChild(el("a", { class: "btn btn-secondary", href: org.contact.website, target: "_blank", rel: "noopener" }, "Website"));
  }
  container.appendChild(actions);

  // Last verified
  container.appendChild(el("p", { class: "org-meta" },
    `Last checked: ${org.last_verified || "unknown"}. ${org.verification_notes || ""}`
  ));
}
