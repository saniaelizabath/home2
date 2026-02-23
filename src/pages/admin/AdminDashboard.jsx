import DashboardLayout from "../../components/shared/DashboardLayout";
import useIsMobile from "../../hooks/useIsMobile";

const STATS = [
    { label: "Total Students", value: 142, icon: "🎓", color: "#3B5BDB", bg: "#E8EEFF", delta: "+8 this month" },
    { label: "Total Teachers", value: 9, icon: "👩‍🏫", color: "#20C997", bg: "#E6FCF5", delta: "+1 pending approval" },
    { label: "Classes This Week", value: 38, icon: "📅", color: "#e67700", bg: "#FFF9DB", delta: "View schedule" },
    { label: "Active Courses", value: 4, icon: "📚", color: "#7048e8", bg: "#F3F0FF", delta: "CBSE 11 & 12" },
    { label: "Attendance Rate", value: "82%", icon: "📊", color: "#20C997", bg: "#E6FCF5", delta: "+2% vs last week" },
    { label: "Pending Approvals", value: 5, icon: "⏳", color: "#FF6B6B", bg: "#FFF0F0", delta: "Students + teachers" },
];

const RECENT = [
    { icon: "🎓", text: "3 new student registrations pending approval", time: "2h ago" },
    { icon: "👩‍🏫", text: "Ms. Kavya applied as Business Studies teacher", time: "5h ago" },
    { icon: "📧", text: "Monthly progress emails sent to 142 parents", time: "Yesterday" },
    { icon: "📅", text: "March schedule added by Mr. Suresh Kumar", time: "Yesterday" },
];

export default function AdminDashboard() {
    const isMobile = useIsMobile(900);

    return (
        <DashboardLayout>
            {/* Banner */}
            <div style={{
                background: "linear-gradient(135deg,#FF6B6B 0%,#c0392b 100%)",
                borderRadius: 24, padding: "32px 36px", marginBottom: 28,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 16,
                boxShadow: "0 8px 32px #FF6B6B33",
            }}>
                <div>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>🛡️ Admin Dashboard</div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>LedgerLearn Control Centre</h1>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>Manage students, teachers, schedules, and reports from one place.</p>
                </div>
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "20px 28px", textAlign: "center" }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", fontFamily: "var(--font-display)" }}>5</div>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 700 }}>Pending Approvals</div>
                </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 20, marginBottom: 28 }}>
                {STATS.map(s => (
                    <div key={s.label} style={{ background: "#fff", borderRadius: 20, padding: "22px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>{s.icon}</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: "var(--font-display)", marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{s.delta}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
                {/* Quick links */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>⚡ Quick Actions</div>
                    {[
                        { icon: "🎓", label: "Manage Students", sub: "Approve, edit, email parents", color: "#3B5BDB", to: "/admin/students" },
                        { icon: "👩‍🏫", label: "Manage Teachers", sub: "Approve & salary details", color: "#20C997", to: "/admin/teachers" },
                        { icon: "📅", label: "Class Scheduling", sub: "Add or edit schedules", color: "#e67700", to: "/admin/scheduling" },
                        { icon: "📢", label: "Announcements", sub: "Send public / group / individual", color: "#7048e8", to: "/admin/announcements" },
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
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{r.icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a2e" }}>{r.text}</div>
                            </div>
                            <div style={{ fontSize: 11, color: "#bbb", whiteSpace: "nowrap" }}>{r.time}</div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
