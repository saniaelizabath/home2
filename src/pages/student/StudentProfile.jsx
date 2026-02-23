import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";

const SYLLABUS = {
    Accountancy: ["Journal Entries", "Ledger & Trial Balance", "Financial Statements", "Partnership Accounts", "Ratio Analysis", "Cash Flow Statement"],
    "Business Studies": ["Nature of Business", "Forms of Organisation", "Management Principles", "Business Finance", "Marketing", "Consumer Protection"],
    "Both Subjects": ["All Accountancy Topics", "All Business Studies Topics"],
};

export default function StudentProfile() {
    const { user } = useAuth();
    const [syllabusOpen, setSyllabusOpen] = useState(false);

    const course = user?.course ?? "Accountancy";
    const topics = SYLLABUS[course] ?? SYLLABUS.Accountancy;

    const infoItems = [
        { label: "Email", value: user?.email ?? "—", icon: "✉️" },
        { label: "Phone", value: user?.phone ?? "—", icon: "📱" },
        { label: "Class", value: user?.class ?? "—", icon: "🏫" },
        { label: "Focus Level", value: user?.focusLevel ?? "—", icon: "🎯" },
        { label: "Preferred Study Time", value: user?.studyTime ?? "—", icon: "🕓" },
        { label: "Target Aggregate", value: user?.targetAggregate ? `${user.targetAggregate}%` : "—", icon: "🏆" },
    ];

    return (
        <DashboardLayout>
            <div style={{ maxWidth: 760 }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>My Profile</h1>
                    <p style={{ color: "#888", fontSize: 15 }}>Your personal details and enrolled course information</p>
                </div>

                {/* Profile card */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 24, display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg,#3B5BDB,#7048e8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#fff", fontWeight: 900, flexShrink: 0 }}>
                        {user?.name?.[0]?.toUpperCase() ?? "S"}
                    </div>
                    <div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>{user?.name ?? "Student Name"}</h2>
                        <div style={{ display: "inline-flex", gap: 8, alignItems: "center", background: "#E8EEFF", color: "#3B5BDB", padding: "6px 16px", borderRadius: 30, fontSize: 13, fontWeight: 700 }}>
                            🎓 {course}
                        </div>
                    </div>
                </div>

                {/* Info grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16, marginBottom: 24 }}>
                    {infoItems.map(item => (
                        <div key={item.label} style={{ background: "#fff", borderRadius: 18, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                            <div style={{ fontSize: 20, marginBottom: 8 }}>{item.icon}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>{item.value}</div>
                        </div>
                    ))}
                </div>

                {/* Syllabus button */}
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 4 }}>📚 Course Syllabus</div>
                            <div style={{ color: "#888", fontSize: 14 }}>{course} syllabus overview</div>
                        </div>
                        <button onClick={() => setSyllabusOpen(p => !p)} style={{
                            padding: "10px 24px", borderRadius: 30, background: "#3B5BDB", color: "#fff",
                            border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
                        }}>
                            {syllabusOpen ? "Close ✕" : "View Syllabus →"}
                        </button>
                    </div>
                    {syllabusOpen && (
                        <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 10 }}>
                            {topics.map((t, i) => (
                                <div key={i} style={{ background: "#E8EEFF", color: "#3B5BDB", padding: "8px 18px", borderRadius: 30, fontSize: 13, fontWeight: 700 }}>
                                    📖 {t}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
