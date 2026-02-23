import DashboardLayout from "../../components/shared/DashboardLayout";

const ATTENDANCE_DATA = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    status: [0, 6, 13, 20, 27].includes(i) ? "holiday" : Math.random() > 0.15 ? "present" : "absent",
}));

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const total = ATTENDANCE_DATA.filter(d => d.status !== "holiday").length;
const present = ATTENDANCE_DATA.filter(d => d.status === "present").length;
const absent = ATTENDANCE_DATA.filter(d => d.status === "absent").length;
const pct = Math.round((present / total) * 100);

export default function StudentAttendance() {
    const firstDay = 1; // Feb 2026 starts on Sunday

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Attendance</h1>
            <p style={{ color: "#888", marginBottom: 28 }}>Your attendance record for February 2026</p>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 20, marginBottom: 28 }}>
                {[
                    { label: "Present Days", value: present, color: "#20C997", bg: "#E6FCF5", icon: "✅" },
                    { label: "Absent Days", value: absent, color: "#FF6B6B", bg: "#FFF0F0", icon: "❌" },
                    { label: "Total Classes", value: total, color: "#3B5BDB", bg: "#E8EEFF", icon: "📅" },
                    { label: "Attendance %", value: `${pct}%`, color: pct >= 75 ? "#20C997" : "#FF6B6B", bg: pct >= 75 ? "#E6FCF5" : "#FFF0F0", icon: "📊" },
                ].map(s => (
                    <div key={s.label} style={{ background: "#fff", borderRadius: 20, padding: "22px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>{s.icon}</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: "var(--font-display)", marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Monthly calendar */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 24 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>📅 February 2026</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                    {DAYS.map(d => (
                        <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#aaa", padding: "4px 0" }}>{d}</div>
                    ))}
                    {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
                    {ATTENDANCE_DATA.map(({ day, status }) => (
                        <div key={day} style={{
                            textAlign: "center", padding: "10px 4px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                            background:
                                status === "present" ? "#E6FCF5" :
                                    status === "absent" ? "#FFF0F0" :
                                        "#f8f9ff",
                            color:
                                status === "present" ? "#20C997" :
                                    status === "absent" ? "#FF6B6B" :
                                        "#bbb",
                            border: `1.5px solid ${status === "present" ? "#b2eed9" : status === "absent" ? "#ffc2c2" : "#eee"}`,
                        }}>
                            {day}
                            <div style={{ fontSize: 10, marginTop: 2 }}>
                                {status === "present" ? "✅" : status === "absent" ? "❌" : "—"}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
                    {[
                        { label: "Present", color: "#20C997", bg: "#E6FCF5" },
                        { label: "Absent", color: "#FF6B6B", bg: "#FFF0F0" },
                        { label: "Holiday", color: "#bbb", bg: "#f8f9ff" },
                    ].map(l => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#666", fontWeight: 600 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: l.bg, border: `1.5px solid ${l.color}` }} />
                            {l.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Attendance warning */}
            {pct < 75 && (
                <div style={{ background: "#FFF0F0", border: "1.5px solid #ffc2c2", borderRadius: 20, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ fontSize: 28 }}>⚠️</div>
                    <div>
                        <div style={{ fontWeight: 800, color: "#FF6B6B", marginBottom: 4 }}>Low Attendance Warning</div>
                        <div style={{ fontSize: 14, color: "#888" }}>Your attendance is below 75%. Please attend classes regularly to avoid academic penalties.</div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
