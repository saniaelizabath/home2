/**
 * deploy-rules.mjs
 * Pushes firestore.rules to Firebase via the Firestore REST API.
 * Run with: node deploy-rules.mjs
 */
import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ── Read the service account key ──────────────────────────────
// Try common locations
let serviceAccount;
const candidates = [
    "./service-account.json",
    "./firebase-service-account.json",
    "./firebase_config.json",
];
for (const p of candidates) {
    try { serviceAccount = JSON.parse(readFileSync(p, "utf8")); break; }
    catch { }
}

if (!serviceAccount) {
    console.error("❌  No service account JSON found. Tried:", candidates.join(", "));
    console.error("    Please download it from Firebase Console → Project Settings → Service Accounts.");
    process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });

// ── Read rules file ────────────────────────────────────────────
const rules = readFileSync("./firestore.rules", "utf8");
console.log("📄  Rules file loaded, length:", rules.length);

// ── Deploy via Firebase REST API ───────────────────────────────
const projectId = "tuitionapp-b354c";
const { GoogleAuth } = await import("google-auth-library").catch(() => {
    console.error("❌  google-auth-library not found. Run: npm install google-auth-library");
    process.exit(1);
});

const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});
const client = await auth.getClient();
const token = await client.getAccessToken();

const url = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`;
const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
        source: { files: [{ name: "firestore.rules", content: rules }] },
    }),
});

const data = await res.json();
if (!res.ok) {
    console.error("❌  Ruleset creation failed:", JSON.stringify(data, null, 2));
    process.exit(1);
}

const rulesetName = data.name;
console.log("✅  Ruleset created:", rulesetName);

// Attach to the Firestore release
const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`;
const relRes = await fetch(releaseUrl, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ release: { name: `projects/${projectId}/releases/cloud.firestore`, rulesetName } }),
});

const relData = await relRes.json();
if (!relRes.ok) {
    console.error("❌  Release update failed:", JSON.stringify(relData, null, 2));
    process.exit(1);
}

console.log("🚀  Rules deployed successfully!");
console.log("    Release:", relData.name);
