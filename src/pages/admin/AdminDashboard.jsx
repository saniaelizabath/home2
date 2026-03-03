import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, courses: 0 });
    const [loading, setLoading] = useState(true);
    const [recent, setRecent] = useState([]);

    useEffect(() => {
        // 4 real-time listeners — count docs as they change
        const unsubs = [
            onSnapshot(collection(db, "students"), s => setStats(p => ({ ...p, students: s.size }))),
            onSnapshot(collection(db, "teachers"), s => setStats(p => ({ ...p, teachers: s.size }))),
            onSnapshot(collection(db, "scheduled_classes"), s => setStats(p => ({ ...p, classes: s.size }))),
            onSnapshot(collection(db, "courses"), s => setStats(p => ({ ...p, courses: s.size }))),
        ];

        // Also fetch recent students once (sorted by createdAt)
        const unsubStudents = onSnapshot(collection(db, "students"), snap => {
            setRecent(
                snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                    .slice(0, 5)
            );
            setLoading(false);
        }, err => { console.error(err); setLoading(false); });

        return () => { unsubs.forEach(u => u()); unsubStudents(); };
    }, []);

    const statCards = [
        { label: "Total Students", value: stats.students, icon: "👩‍🎓", color: "#3B5BDB", bg: "#E8EEFF" },
        { label: "Teachers", value: stats.teachers, icon: "👨‍🏫", color: "#20C997", bg: "#E6FCF5" },
        { label: "Classes Scheduled", value: stats.classes, icon: "📅", color: "#e67700", bg: "#FFF9DB" },
        { label: "Courses", value: stats.courses, icon: "📚", color: "#FF6B6B", bg: "#FFF0F0" },
    ];

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Admin Dashboard</h1>
            <p style={{ color: "#888", marginBottom: 32 }}>Real-time overview of Commerce Academy</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 20, marginBottom: 32 }}>
                {statCards.map(c => (
                    <div key={c.label} style={{ background: "#fff", borderRadius: 20, padding: "24px 22px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>{c.icon}</div>
                        <div style={{ fontSize: 36, fontWeight: 900, color: c.color, fontFamily: "var(--font-display)", marginBottom: 4 }}>
                            {loading ? "…" : c.value}
                        </div>
                        <div style={{ fontSize: 13, color: "#aaa", fontWeight: 600 }}>{c.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>🆕 Recent Student Signups</div>
                {loading ? (
                    <div style={{ color: "#aaa", fontSize: 14 }}>Loading…</div>
                ) : recent.length === 0 ? (
                    <div style={{ color: "#aaa", fontSize: 14 }}>No students signed up yet.</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                            <thead>
                                <tr style={{ background: "#f8f9ff" }}>
                                    {["Student", "Course", "Email", "Status"].map(h => (
                                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#888", fontSize: 12, textTransform: "uppercase" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                        <td style={{ padding: "14px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#E8EEFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#3B5BDB" }}>
                                                    {(s.name || "S")[0].toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{s.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "14px 16px", color: "#888" }}>{s.course}</td>
                                        <td style={{ padding: "14px 16px", color: "#888" }}>{s.email}</td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <span style={{ background: s.status === "active" ? "#E6FCF5" : "#FFF9DB", color: s.status === "active" ? "#20C997" : "#e67700", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                                                {s.status || "registered"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
