// Generate QR-code SVGs for the printed booklet.
//
// Reads:  ../data/orgs.json
// Writes: ../booklet/qrs/<id>.svg     — one per organisation, deep-link to the org page
//         ../booklet/qrs/_master.svg  — cover QR, deep-link to the welcome screen
//
// The base URL is configurable via the env var BOOKLET_BASE_URL — change this
// before printing real booklets so the QR codes resolve to your hosted prototype.
//
//   BOOKLET_BASE_URL="https://camden-digital-lifeline.example" npm run qr
//
// For the workshop demo the default is the local dev server (npm run serve),
// which is fine for paper proofs but will not work outside your laptop.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import QRCode from "qrcode";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "data", "orgs.json");
const OUT_DIR = join(__dirname, "..", "booklet", "qrs");

const BASE = process.env.BOOKLET_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000/web";

const QR_OPTS = {
  type: "svg",
  errorCorrectionLevel: "M",  // M is plenty for short URLs and tolerates print smudge
  margin: 2,
  width: 320
};

async function run() {
  const data = JSON.parse(await readFile(DATA_PATH, "utf8"));
  await mkdir(OUT_DIR, { recursive: true });

  // Master QR — points at the welcome / triage entry point
  const masterUrl = `${BASE}/#welcome`;
  await writeFile(join(OUT_DIR, "_master.svg"), await QRCode.toString(masterUrl, QR_OPTS));
  console.log(`✓ Master QR → ${masterUrl}`);

  // Per-org QRs
  for (const org of data.orgs) {
    const url = `${BASE}/#org/${org.id}`;
    const svg = await QRCode.toString(url, QR_OPTS);
    await writeFile(join(OUT_DIR, `${org.id}.svg`), svg);
    console.log(`✓ ${org.id} → ${url}`);
  }

  console.log(`\nDone. ${data.orgs.length + 1} QR codes written to booklet/qrs/`);
  console.log(`Base URL used: ${BASE}`);
  if (BASE.startsWith("http://localhost")) {
    console.log("⚠ Localhost base URL — these QRs only work on your machine. Set BOOKLET_BASE_URL before printing for real.");
  }
}

run().catch((err) => {
  console.error("Failed to generate QRs:", err);
  process.exit(1);
});
