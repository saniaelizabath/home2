/**
 * Run once to seed mock announcements into Firestore.
 * Usage: node src/scripts/seedAnnouncements.mjs
 *
 * Requires: firebase-admin installed
 *   npm install -D firebase-admin
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// ── Firebase Admin init ───────────────────────────────────────
// Option A: set GOOGLE_APPLICATION_CREDENTIALS env var pointing to your service account JSON
// Option B: replace the cert(...) call with your service account object directly

initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS || "./service-account.json"),
    projectId: "tuitionapp-b354c",
});

const db = getFirestore();

// ── Mock data ─────────────────────────────────────────────────
const MOCK_ANNOUNCEMENTS = [
    {
        audienceType: "everyone",
        targetId: null,
        targetLabel: null,
        title: "Welcome to Commerce Academy 2025–26! 🎉",
        body: "Dear students and teachers, we are excited to kick off the new academic year. Please log in to your respective dashboards to check your timetables, course materials, and upcoming tests. Wishing everyone a productive year ahead!",
        priority: "high",
        pinned: false,
        createdByName: "Admin",
    },
    {
        audienceType: "students",
        targetId: null,
        targetLabel: null,
        title: "Unit Test 1 Schedule Released 📅",
        body: "Unit Test 1 will be conducted from 5th March to 10th March. Accountancy test is on 5th March (10 AM) and Business Studies is on 7th March (10 AM). Syllabus has been uploaded to your profile page. Please prepare accordingly.",
        priority: "urgent",
        pinned: true,
        createdByName: "Admin",
    },
    {
        audienceType: "course",
        targetId: "accountancy",
        targetLabel: "Accountancy",
        title: "Partnership Accounts — Extra Class Added",
        body: "An extra doubt-clearing session for Partnership Accounts has been scheduled for this Saturday, 1st March at 11 AM on Google Meet. The meeting link will be shared on your Class Dashboard. Attendance is highly recommended.",
        priority: "normal",
        pinned: false,
        createdByName: "Admin",
    },
    {
        audienceType: "subject",
        targetId: "Business Studies",
        targetLabel: "Business Studies",
        title: "Case Study Practice Material Uploaded 📂",
        body: "Practice case studies for Chapter 5 (Organising) and Chapter 7 (Directing) have been uploaded to the Notes section. Please revise them before the upcoming class. Contact your teacher via Chat if you have doubts.",
        priority: "normal",
        pinned: false,
        createdByName: "Admin",
    },
    {
        audienceType: "teachers",
        targetId: null,
        targetLabel: null,
        title: "Staff Meeting — 28th February at 5 PM",
        body: "All teachers are requested to attend the monthly staff meeting on 28th February at 5:00 PM (Google Meet). Agenda: mid-term progress review, attendance policy update, and test paper submission deadlines. Please confirm attendance via WhatsApp group.",
        priority: "high",
        pinned: false,
        createdByName: "Admin",
    },
    {
        audienceType: "everyone",
        targetId: null,
        targetLabel: null,
        title: "Public Holiday Notice — 17th March",
        body: "The academy will remain closed on 17th March (Holi). All classes scheduled for that day stand rescheduled. Teachers will update revised timings on the Class Dashboard by 14th March. Enjoy the festival!",
        priority: "normal",
        pinned: false,
        createdByName: "Admin",
    },
];

// ── Seed ──────────────────────────────────────────────────────
async function seed() {
    console.log("Seeding announcements to Firestore…");

    const now = Timestamp.now();
    const col = db.collection("announcements");

    for (const ann of MOCK_ANNOUNCEMENTS) {
        const docRef = await col.add({
            ...ann,
            createdBy: "admin",
            createdAt: now,
        });
        console.log(`  ✓ ${ann.title.slice(0, 50)}… → ${docRef.id}`);
    }

    console.log(`\nDone! ${MOCK_ANNOUNCEMENTS.length} announcements added to Firestore collection "announcements".`);
    process.exit(0);
}

seed().catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
