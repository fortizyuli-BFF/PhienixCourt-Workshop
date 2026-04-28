// Pure matching function — no DOM, no fetch. Given user answers and the org
// dataset, returns scored matches with reasons. Unit-testable in isolation.

/**
 * @typedef {Object} Answers
 * @property {string|null}   situation  - one of: no-device, no-data, needs-skills, needs-account
 * @property {string|null}   region     - one of: north, centre, south, moves
 * @property {string[]}      needs      - subset of: under-18, no-id, no-fixed-address, lgbtq
 * @property {string|null}   urgency    - one of: today, month, looking
 */

const SITUATION_TO_TAGS = {
  "no-device":      ["no-device"],
  "no-data":        ["no-data"],
  "needs-skills":   ["needs-skills"],
  "needs-account":  ["needs-email", "needs-uc-account", "needs-id"]
};

const NEED_TO_TAG = {
  "under-18":         "under-18",
  "no-id":            "no-id",
  "no-fixed-address": "no-fixed-address",
  "lgbtq":            "lgbtq-friendly"
};

/**
 * Score a single org against the user's answers.
 * Returns { score, reasons[] } so the UI can show *why* it matched.
 */
export function scoreOrg(org, answers) {
  let score = 0;
  const reasons = [];

  // 1. Situation match (weight 3)
  if (answers.situation) {
    const wantTags = SITUATION_TO_TAGS[answers.situation] || [];
    const hits = wantTags.filter((t) => org.tags_situation?.includes(t));
    if (hits.length > 0) {
      score += 3;
      reasons.push(reasonForSituation(answers.situation));
    }
  }

  // 2. Safety / fit-tags (weight 2 if any match)
  if (answers.needs && answers.needs.length > 0) {
    const matchedSafe = answers.needs
      .map((n) => NEED_TO_TAG[n])
      .filter(Boolean)
      .filter((t) => org.tags_safe_for?.includes(t));
    if (matchedSafe.length > 0) {
      score += 2;
      if (matchedSafe.includes("under-18"))         reasons.push("Open to under-18s");
      else if (matchedSafe.includes("no-id"))       reasons.push("No ID needed");
      else if (matchedSafe.includes("no-fixed-address")) reasons.push("OK if you don't have an address");
      else if (matchedSafe.includes("lgbtq-friendly"))   reasons.push("Welcoming for women / LGBTQ+");
    }
  }

  // 3. Region match (weight 2)
  if (answers.region && answers.region !== "moves") {
    const inRegion = (org.locations || []).some((l) => l.region === answers.region);
    if (inRegion) {
      score += 2;
      reasons.push(`In your area (${humanRegion(answers.region)})`);
    }
  }

  // 4. Drop-in if urgent (weight 1)
  if (answers.urgency === "today" && org.drop_in) {
    score += 1;
    reasons.push("Drop-in — no appointment needed");
  }

  // 5. Hard filter: under-18 ineligible
  if (answers.needs?.includes("under-18") && org.open_to_under_18 === false) {
    score -= 5;
  }

  return { score, reasons };
}

/**
 * Rank all orgs against the answers. Returns the full sorted list with metadata.
 * Top-3 shown by default; the rest are surfaced under "show me the others".
 */
export function rankOrgs(orgs, answers) {
  const scored = orgs.map((org) => ({
    org,
    ...scoreOrg(org, answers)
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tiebreak: drop-ins first, then alphabetical
    if (a.org.drop_in !== b.org.drop_in) return a.org.drop_in ? -1 : 1;
    return a.org.name.localeCompare(b.org.name);
  });

  return scored.filter((s) => s.score > -5);
}

function reasonForSituation(situation) {
  switch (situation) {
    case "no-device":     return "Helps with phones/laptops";
    case "no-data":       return "Free Wi-Fi or data";
    case "needs-skills":  return "Helps with the skills you mentioned";
    case "needs-account": return "Helps set up email / UC / ID";
    default: return "Matches what you need";
  }
}

function humanRegion(r) {
  return { north: "north Camden", centre: "central Camden", south: "south Camden" }[r] || r;
}
