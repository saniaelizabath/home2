import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import useIsMobile from "../../hooks/useIsMobile";

const STATS = [
    { label: "Classes This Week", value: 8, icon: "📅", color: "#20C997", bg: "#E6FCF5" },
    { label: "Students Enrolled", value: 34, icon: "🎓", color: "#3B5BDB", bg: "#E8EEFF" },
    { label: "Assignments Uploaded", value: 5, icon: "📝", color: "#e67700", bg: "#FFF9DB" },
    { label: "Tests Evaluated", value: 12, icon: "✅", color: "#7048e8", bg: "#F3F0FF" },
];

const RECENT = [
    { action: "Class completed", detail: "Accountancy – Batch A", time: "1h ago", icon: "📅" },
    { action: "Marks uploaded", detail: "Trial Balance Test – 28 students", time: "3h ago", icon: "✅" },
    { action: "New message", detail: "Riya Mehta: Question on partnership", time: "5h ago", icon: "💬" },
];

export default function TeacherDashboard() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);

    return (
        <DashboardLayout>
            {/* Welcome banner */}
            <div style={{
                background: "linear-gradient(135deg,#20C997 0%,#12b886 100%)",
                borderRadius: 24, padding: "32px 36px", marginBottom: 28,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 16,
                boxShadow: "0 8px 32px #20C99733",
            }}>
                <div>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>👩‍🏫 Teacher Dashboard</div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
                        Hello, {user?.name?.split(" ")?.[0] ?? "Teacher"} 👋
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>You have 3 classes scheduled today. Let's make it count!</p>
                </div>
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "20px 28px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, color: "#fff", marginBottom: 4 }}>📚</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{user?.subject ?? "Accountancy"}</div>
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Your Subject</div>
                </div>
            </div>

            {/* Stats */}
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
                {/* Quick actions */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>⚡ Quick Actions</div>
                    {[
                        { icon: "📅", label: "Add Class", sub: "Schedule a new class", color: "#20C997", to: "/teacher/classes" },
                        { icon: "📁", label: "Upload Content", sub: "Notes, assignments, tests", color: "#3B5BDB", to: "/teacher/content" },
                        { icon: "📝", label: "Evaluate Tests", sub: "2 tests pending", color: "#e67700", to: "/teacher/evaluation" },
                        { icon: "📋", label: "Mark Attendance", sub: "Today's attendance pending", color: "#FF6B6B", to: "/teacher/attendance" },
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
                        <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: i < RECENT.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E6FCF5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{r.icon}</div>
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
