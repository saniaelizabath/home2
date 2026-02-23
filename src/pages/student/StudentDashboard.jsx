import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import useIsMobile from "../../hooks/useIsMobile";

const STATS = [
    { label: "Classes This Week", value: 6, icon: "📅", color: "#3B5BDB", bg: "#E8EEFF" },
    { label: "Assignments Pending", value: 3, icon: "📝", color: "#e67700", bg: "#FFF9DB" },
    { label: "Students Enrolled", value: 28, icon: "🎓", color: "#20C997", bg: "#E6FCF5" },
    { label: "Avg Score (Last Test)", value: "78%", icon: "📊", color: "#FF6B6B", bg: "#FFF0F0" },
];

const RECENT = [
    { action: "Uploaded assignment", detail: "Journal Entry Practice", time: "2h ago", icon: "📎" },
    { action: "Class scheduled", detail: "Accountancy – Batch A", time: "4h ago", icon: "📅" },
    { action: "Marks uploaded", detail: "Trial Balance Test", time: "Yesterday", icon: "✅" },
];

export default function StudentDashboard() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const pct = 78;

    return (
        <DashboardLayout>
            {/* Welcome banner */}
            <div style={{
                background: "linear-gradient(135deg,#3B5BDB 0%,#7048e8 100%)",
                borderRadius: 24, padding: "32px 36px", marginBottom: 28,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 16,
                boxShadow: "0 8px 32px #3B5BDB33",
            }}>
                <div>
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>🎓 Student Portal</div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
                        Good morning, {user?.name?.split(" ")?.[0] ?? "Student"} 👋
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>You're on track toward your {user?.targetAggregate ?? 90}% goal. Keep it up!</p>
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
                            display: "flex", gap: 14, alignItems: "center", padding: "13px 14px", borderRadius: 14,
                            marginBottom: 8, textDecoration: "none", transition: "all 0.2s",
                            background: "#fafbff", border: "1.5px solid #eee",
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
