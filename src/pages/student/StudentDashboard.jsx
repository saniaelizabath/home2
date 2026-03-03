import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import useIsMobile from "../../hooks/useIsMobile";

/* ─── Static dashboard data ─── */
const STATS = [
    { label: "Classes This Week", value: 6, icon: "📅", color: "#3B5BDB", bg: "#E8EEFF" },
    { label: "Assignments Pending", value: 3, icon: "📝", color: "#e67700", bg: "#FFF9DB" },
    { label: "Avg Score (Last Test)", value: "78%", icon: "📊", color: "#FF6B6B", bg: "#FFF0F0" },
];
const RECENT = [
    { action: "Uploaded assignment", detail: "Journal Entry Practice", time: "2h ago", icon: "📎" },
    { action: "Class scheduled", detail: "Accountancy – Batch A", time: "4h ago", icon: "📅" },
    { action: "Marks uploaded", detail: "Trial Balance Test", time: "Yesterday", icon: "✅" },
];

const PRIORITY_MAP = {
    normal: { icon: "📌", color: "#3B5BDB", bg: "#E8EEFF", label: "Normal" },
    important: { icon: "⚠️", color: "#e67700", bg: "#FFF9DB", label: "Important" },
    urgent: { icon: "🚨", color: "#c92a2a", bg: "#FFF0F0", label: "Urgent" },
};

/* ─── Announcement filtering for students ─── */
function isForStudent(ann, user) {
    const t = ann.audience?.type;
    const f = ann.audience?.filters || {};

    if (t === "everyone") return true;
    if (t !== "students") return false;

    // Individual targeting
    if (f.userId) return f.userId === user?.uid;

    // Class/subject filter — if filters set, user must match at least one
    const classMatch = !f.classes?.length || f.classes.some(c => c === user?.class);
    const subjectMatch = !f.subjects?.length || f.subjects.some(s =>
        user?.course?.toLowerCase().includes(s.toLowerCase()) ||
        user?.subject?.toLowerCase().includes(s.toLowerCase())
    );
    return classMatch && subjectMatch;
}

/* ─── Announcement Card ─── */
function AnnouncementCard({ ann, userId, onMarkRead }) {
    const [expanded, setExpanded] = useState(false);
    const isRead = ann.isRead?.[userId] === true;
    const pr = PRIORITY_MAP[ann.priority] || PRIORITY_MAP.normal;
    const ts = ann.createdAt?.toDate?.();
    const dateStr = ts ? ts.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

    return (
        <div style={{
            background: isRead ? "#fff" : "#F0F4FF",
            border: `2px solid ${isRead ? "#f0f0f0" : "#3B5BDB"}`,
            borderRadius: 16, padding: "18px 20px", marginBottom: 12,
            transition: "all 0.2s",
        }}>
            {/* Header badges */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                {!isRead && (
                    <span style={{ background: "#3B5BDB", color: "#fff", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        🔵 New
                    </span>
                )}
                <span style={{ background: pr.bg, color: pr.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {pr.icon} {pr.label}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#aaa" }}>{dateStr}</span>
            </div>

            {/* Title + body */}
            <div onClick={() => setExpanded(p => !p)} style={{ cursor: "pointer" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 6 }}>{ann.title}</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7, overflow: "hidden", maxHeight: expanded ? "none" : "2.8em" }}>
                    {ann.message}
                </div>
                {ann.message?.length > 120 && (
                    <div style={{ fontSize: 12, color: "#3B5BDB", fontWeight: 700, marginTop: 4 }}>
                        {expanded ? "▲ Show less" : "▼ Read more"}
                    </div>
                )}
            </div>

            {/* Mark as read */}
            {!isRead && (
                <div style={{ marginTop: 12, textAlign: "right" }}>
                    <button onClick={() => onMarkRead(ann.id)} style={{
                        padding: "6px 16px", borderRadius: 20, background: "#E8EEFF", color: "#3B5BDB",
                        fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer",
                    }}>
                        ✓ Mark as read
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─── Main Component ─── */
export default function StudentDashboard() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const pct = 78;

    const [announcements, setAnnouncements] = useState([]);
    const [annLoading, setAnnLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    /* Real-time announcements */
    useEffect(() => {
        const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q,
            snap => {
                const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setAnnouncements(all.filter(a => isForStudent(a, user)));
                setAnnLoading(false);
            },
            err => { console.error(err); setAnnLoading(false); }
        );
        return () => unsub();
    }, [user?.uid]);

    const markAsRead = async (annId) => {
        if (!user?.uid) return;
        try {
            await updateDoc(doc(db, "announcements", annId), {
                [`isRead.${user.uid}`]: true,
            });
        } catch (e) { console.error(e); }
    };

    const unreadCount = announcements.filter(a => !a.isRead?.[user?.uid]).length;
    const displayed = showAll ? announcements : announcements.slice(0, 3);

    return (
        <DashboardLayout>
            {/* Welcome banner */}
            <div style={{
                background: "linear-gradient(135deg,#3B5BDB 0%,#7048e8 100%)",
                borderRadius: 24, padding: "32px 36px", marginBottom: 28,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 16, boxShadow: "0 8px 32px #3B5BDB33",
            }}>
                <div>
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>🎓 Student Portal</div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
                        Good morning, {user?.name?.split(" ")?.[0] ?? "Student"} 👋
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
                        You're on track toward your {user?.targetAggregate ?? 90}% goal. Keep it up!
                    </p>
                </div>
                <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "20px 28px", textAlign: "center" }}>
                    <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", fontFamily: "var(--font-display)" }}>{pct}%</div>
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700 }}>Current Average</div>
                </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 20, marginBottom: 28 }}>
                {STATS.map(s => (
                    <div key={s.label} style={{ background: "#fff", borderRadius: 20, padding: "22px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>{s.icon}</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: "var(--font-display)", marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Announcements section ── */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e" }}>📢 Announcements</div>
                        {unreadCount > 0 && (
                            <span style={{ background: "#c92a2a", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {announcements.length > 3 && (
                        <button onClick={() => setShowAll(p => !p)} style={{ background: "none", border: "none", color: "#3B5BDB", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                            {showAll ? "Show less ▲" : `View all ${announcements.length} ▼`}
                        </button>
                    )}
                </div>

                {annLoading ? (
                    <div style={{ textAlign: "center", padding: 32, color: "#aaa" }}>
                        <div style={{ width: 32, height: 32, border: "3px solid #E8EEFF", borderTop: "3px solid #3B5BDB", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        Loading announcements…
                    </div>
                ) : announcements.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 32, color: "#aaa", fontSize: 14 }}>📭 No announcements for you right now</div>
                ) : (
                    displayed.map(a => (
                        <AnnouncementCard key={a.id} ann={a} userId={user?.uid} onMarkRead={markAsRead} />
                    ))
                )}
            </div>

            {/* Quick links + Recent activity */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
                {/* Quick links */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>⚡ Quick Access</div>
                    {[
                        { icon: "📅", label: "Today's Classes", sub: "2 classes scheduled", color: "#3B5BDB", to: "/student/classes" },
                        { icon: "✅", label: "Pending Tasks", sub: "3 tasks due soon", color: "#e67700", to: "/student/tasks" },
                        { icon: "💬", label: "Chat with Teachers", sub: "1 unread message", color: "#20C997", to: "/student/chat" },
                        { icon: "📈", label: "View Progress", sub: "Updated today", color: "#7048e8", to: "/student/progress" },
                    ].map(q => (
                        <a key={q.label} href={q.to} style={{
                            display: "flex", gap: 14, alignItems: "center", padding: "13px 14px",
                            borderRadius: 14, marginBottom: 8, textDecoration: "none",
                            background: "#fafbff", border: "1.5px solid #eee", transition: "all 0.2s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = q.color + "11"; e.currentTarget.style.border = `1.5px solid ${q.color}44`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#fafbff"; e.currentTarget.style.border = "1.5px solid #eee"; }}
                        >
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: q.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{q.icon}</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{q.label}</div>
                                <div style={{ fontSize: 12, color: "#888" }}>{q.sub}</div>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Recent activity */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>🕓 Recent Activity</div>
                    {RECENT.map((r, i) => (
                        <div key={i} style={{ display: "flex", gap: 14, padding: "13px 0", borderBottom: i < RECENT.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0f2ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{r.icon}</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{r.action}</div>
                                <div style={{ fontSize: 12, color: "#888" }}>{r.detail}</div>
                            </div>
                            <div style={{ fontSize: 11, color: "#bbb", marginLeft: "auto", whiteSpace: "nowrap" }}>{r.time}</div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
