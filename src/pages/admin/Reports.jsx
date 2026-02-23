import DashboardLayout from "../../components/shared/DashboardLayout";

const BATCHES = [
    { name: "Accountancy – Class 12 – Batch A", students: 18, avgScore: 76, topScore: 94, attendance: 82 },
    { name: "Accountancy – Class 11 – Batch B", students: 16, avgScore: 71, topScore: 89, attendance: 78 },
    { name: "Business Studies – Class 12 – Batch A", students: 22, avgScore: 80, topScore: 97, attendance: 88 },
];

const SENT_EMAILS = [
    { batch: "Accountancy – Class 12", date: "Feb 1", type: "Monthly Progress Report" },
    { batch: "Business Studies – Class 12", date: "Feb 1", type: "Monthly Progress Report" },
    { batch: "All Students", date: "Jan 15", type: "Mid-term Marks Summary" },
];

export default function Reports() {
    const downloadCSV = () => {
        const rows = [
            ["Batch", "Students", "Avg Score", "Top Score", "Attendance"],
            ...BATCHES.map(b => [b.name, b.students, `${b.avgScore}%`, `${b.topScore}%`, `${b.attendance}%`]),
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "performance_report.csv";
        a.click();
    };

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Reports & Analytics</h1>
                    <p style={{ color: "#888" }}>Platform-wide performance and progress data</p>
                </div>
                <button onClick={downloadCSV} style={{ padding: "12px 24px", borderRadius: 30, background: "#3B5BDB", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 4px 16px #3B5BDB44" }}>
                    ⬇️ Export CSV
                </button>
            </div>

            {/* Batch performance cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20, marginBottom: 28 }}>
                {BATCHES.map(b => (
                    <div key={b.name} style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#1a1a2e", marginBottom: 16 }}>{b.name}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                            {[
                                { label: "Students", value: b.students, color: "#3B5BDB" },
                                { label: "Avg Score", value: `${b.avgScore}%`, color: "#20C997" },
                                { label: "Top Score", value: `${b.topScore}%`, color: "#7048e8" },
                                { label: "Attendance", value: `${b.attendance}%`, color: b.attendance >= 75 ? "#20C997" : "#FF6B6B" },
                            ].map(s => (
                                <div key={s.label} style={{ padding: "12px 14px", borderRadius: 12, background: "#f8f9ff" }}>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: "var(--font-display)" }}>{s.value}</div>
                                    <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                        {/* Progress bar */}
                        <div style={{ fontSize: 11, color: "#888", fontWeight: 700, marginBottom: 6 }}>AVG SCORE</div>
                        <div style={{ background: "#f0f2ff", borderRadius: 30, height: 8 }}>
                            <div style={{ height: 8, borderRadius: 30, background: "linear-gradient(90deg,#3B5BDB,#7048e8)", width: `${b.avgScore}%`, transition: "width 0.5s" }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Email log */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 18 }}>📧 Auto-Email Log</div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f8f9ff" }}>
                                {["Batch", "Email Type", "Sent On"].map(h => (
                                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SENT_EMAILS.map((e, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{e.batch}</td>
                                    <td style={{ padding: "12px 14px", color: "#555", fontSize: 13 }}>{e.type}</td>
                                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#888" }}>{e.date} 2026</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
