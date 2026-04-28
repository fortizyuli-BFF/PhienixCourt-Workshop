// Camden Digital Lifeline — entry point.
// Wires routing, state, and view rendering together.

import { triageQuestions } from "./data.js?v=2";
import { rankOrgs } from "./match.js?v=2";
import {
  renderTriageQuestion,
  renderProgress,
  renderResults,
  renderOrgDetail,
  renderAllList
} from "./render.js?v=2";

const VIEWS = ["welcome", "triage", "results", "org", "safety", "all"];

const state = {
  orgs: [],
  loaded: false,
  triage: {
    qIndex: 0,
    answers: { situation: null, region: null, needs: [], urgency: null }
  }
};

const $ = (sel) => document.querySelector(sel);

/* ---------------------- bootstrap ---------------------- */

async function loadData() {
  // Served from project root via `npm run serve`, so /web/index.html reaches
  // the dataset at ../data/orgs.json. If you change the layout, change this path.
  const res = await fetch("../data/orgs.json");
  if (!res.ok) {
    throw new Error(`Could not load orgs (HTTP ${res.status}). Run \`npm run serve\` from the project root.`);
  }
  const data = await res.json();
  return data.orgs || [];
}

async function init() {
  const loadingEl = $("#loading");
  const errorEl = $("#error");
  try {
    state.orgs = await loadData();
    state.loaded = true;
    loadingEl.classList.add("hidden");
  } catch (err) {
    loadingEl.classList.add("hidden");
    errorEl.classList.remove("hidden");
    errorEl.textContent = err.message;
    return;
  }

  // Initial route
  handleRoute();
  window.addEventListener("hashchange", handleRoute);

  // Global click delegation for triage option buttons
  document.body.addEventListener("click", onBodyClick);
}

/* ---------------------- routing ---------------------- */

function handleRoute() {
  const hash = location.hash || "#welcome";
  const [view, param] = hash.replace(/^#/, "").split("/");

  if (!VIEWS.includes(view)) return showView("welcome");

  if (view === "triage") {
    state.triage.qIndex = 0;
    state.triage.answers = { situation: null, region: null, needs: [], urgency: null };
    showView("triage");
    renderCurrentQuestion();
    return;
  }

  if (view === "results") {
    showView("results");
    renderCurrentResults();
    return;
  }

  if (view === "org") {
    const org = state.orgs.find((o) => o.id === param);
    showView("org");
    renderOrgDetail($("#org-detail"), org);
    return;
  }

  if (view === "all") {
    showView("all");
    renderAllList($("#all-list"), state.orgs);
    return;
  }

  showView(view);
}

function showView(name) {
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.toggle("hidden", v.dataset.view !== name);
  });
  // Move focus to the view's heading for screen-reader users
  const heading = document.querySelector(`[data-view="${name}"] h1`);
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: false });
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

/* ---------------------- triage ---------------------- */

function renderCurrentQuestion() {
  const q = triageQuestions[state.triage.qIndex];
  const current = state.triage.answers[q.id];
  renderProgress($(".progress"), state.triage.qIndex);
  renderTriageQuestion($("#triage-question"), state.triage.qIndex, current, onTriageSelect);
}

function onTriageSelect(value) {
  const q = triageQuestions[state.triage.qIndex];

  if (value === "__continue__") {
    return advanceTriage();
  }

  if (q.type === "multi") {
    const arr = state.triage.answers[q.id] || [];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    state.triage.answers[q.id] = next;
    return renderCurrentQuestion(); // re-render to show selection
  }

  state.triage.answers[q.id] = value;
  // Auto-advance for single-select after a short pause for tactile feedback
  renderCurrentQuestion();
  setTimeout(advanceTriage, 250);
}

function advanceTriage() {
  if (state.triage.qIndex < triageQuestions.length - 1) {
    state.triage.qIndex += 1;
    renderCurrentQuestion();
  } else {
    location.hash = "#results";
  }
}

function backTriage() {
  if (state.triage.qIndex > 0) {
    state.triage.qIndex -= 1;
    renderCurrentQuestion();
  } else {
    location.hash = "#welcome";
  }
}

function skipTriage() {
  const q = triageQuestions[state.triage.qIndex];
  state.triage.answers[q.id] = q.type === "multi" ? [] : null;
  advanceTriage();
}

/* ---------------------- results ---------------------- */

function renderCurrentResults() {
  const ranked = rankOrgs(state.orgs, state.triage.answers);
  renderResults($("#results-intro"), $("#results-list"), $("#results-rest"), ranked, state.triage.answers);
}

/* ---------------------- click delegation ---------------------- */

function onBodyClick(e) {
  const target = e.target.closest("[data-action]");
  if (!target) return;

  switch (target.dataset.action) {
    case "triage-back":
      e.preventDefault();
      backTriage();
      break;
    case "triage-skip":
      e.preventDefault();
      skipTriage();
      break;
    case "screenshot-help":
      e.preventDefault();
      $("#save-modal").showModal();
      break;
    case "close-modal":
      e.preventDefault();
      $("#save-modal").close();
      break;
  }
}

init();
