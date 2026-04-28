// Triage question definitions for Camden Digital Lifeline.
// Edit here to change wording or options; everything downstream (matching,
// rendering, progress dots) updates automatically.

export const triageQuestions = [
  {
    id: "situation",
    type: "single",
    title: "What's the biggest thing in the way right now?",
    sub: "Pick the one that fits best. There's no wrong answer — you can always change it.",
    options: [
      { value: "no-device",       label: "I don't have a phone or laptop I can use",          tags: ["no-device"] },
      { value: "no-data",         label: "I have a phone but no data or Wi-Fi",                tags: ["no-data"] },
      { value: "needs-skills",    label: "I'm not sure how to do something online",            tags: ["needs-skills"] },
      { value: "needs-account",   label: "I need to sort an email, Universal Credit or ID",    tags: ["needs-email", "needs-uc-account", "needs-id"] }
    ]
  },
  {
    id: "region",
    type: "single",
    title: "Where in Camden are you most days?",
    sub: "We'll show closer places first.",
    options: [
      { value: "north",  label: "North — Kentish Town, Tufnell Park, Camden Town",      region: "north" },
      { value: "centre", label: "Centre — Holborn, Bloomsbury, King's Cross, Euston",   region: "centre" },
      { value: "south",  label: "South — Covent Garden, Holborn, Strand",               region: "south" },
      { value: "moves",  label: "I move around a lot, or not sure",                     region: "any" }
    ]
  },
  {
    id: "needs",
    type: "multi",
    title: "Anything else that should fit?",
    sub: "Tap any that apply. Skip if none.",
    options: [
      { value: "under-18",        label: "I'm under 18",                                       tags: ["under-18"] },
      { value: "no-id",           label: "I don't have ID right now",                          tags: ["no-id"] },
      { value: "no-fixed-address",label: "I don't have a fixed address",                       tags: ["no-fixed-address"] },
      { value: "lgbtq",           label: "I'd prefer somewhere that's good for women / LGBTQ+ people", tags: ["lgbtq-friendly"] }
    ]
  },
  {
    id: "urgency",
    type: "single",
    title: "How urgent is this?",
    sub: "We'll prioritise drop-ins if it's today.",
    options: [
      { value: "today", label: "Today or this week" },
      { value: "month", label: "In the next month or so" },
      { value: "looking", label: "I'm just looking around" }
    ]
  }
];
