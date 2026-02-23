import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";

const STUDENTS = [
    "Riya Mehta", "Aditya Sharma", "Priya Nair", "Arjun Verma",
    "Sneha Patil", "Rohan Das", "Kavya Iyer", "Manish Gupta",
];

const TODAY = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function TeacherAttendance() {
    const [attendance, setAttendance] = useState(
        Object.fromEntries(STUDENTS.map(s => [s, null]))
    );
    const [submitted, setSubmitted] = useState(false);

    const mark = (name, status) => setAttendance(p => ({ ...p, [name]: status }));

    const presentCount = Object.values(attendance).filter(v => v === "present").length;
    const absentCount = Object.values(attendance).filter(v => v === "absent").length;
    const pending = Object.values(attendance).filter(v => v === null).length;

    const submit = () => {
        if (pending > 0) return;
        setSubmitted(true);
    };

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Mark Attendance</h1>
            <p style={{ color: "#888", marginBottom: 28 }}>📅 {TODAY}</p>

            {submitted ? (
                <div style={{ background: "#E6FCF5", borderRadius: 24, padding: 40, textAlign: "center", border: "1.5px solid #b2eed9" }}>
                    <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, color: "#20C997", marginBottom: 8 }}>Attendance Marked!</h2>
                    <p style={{ color: "#555" }}>Present: <strong>{presentCount}</strong> · Absent: <strong>{absentCount}</strong></p>
                    <button onClick={() => { setAttendance(Object.fromEntries(STUDENTS.map(s => [s, null]))); setSubmitted(false); }} style={{ marginTop: 20, padding: "12px 24px", borderRadius: 30, background: "#20C997", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>
                        Mark Again
                    </button>
                </div>
            ) : (
                <>
                    {/* Summary pills */}
                    <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                        {[
                            { label: `Present: ${presentCount}`, color: "#20C997", bg: "#E6FCF5" },
                            { label: `Absent: ${absentCount}`, color: "#FF6B6B", bg: "#FFF0F0" },
                            { label: `Pending: ${pending}`, color: "#888", bg: "#f8f9ff" },
                        ].map(p => (
                            <div key={p.label} style={{ padding: "8px 20px", borderRadius: 30, background: p.bg, color: p.color, fontWeight: 800, fontSize: 13 }}>{p.label}</div>
                        ))}
                    </div>

                    <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 20 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 18 }}>Accountancy – Batch A (8 students)</div>
                        {STUDENTS.map((name, i) => (
                            <div key={name} style={{
                                display: "flex", alignItems: "center", gap: 14, padding: "14px 0",
                                borderBottom: i < STUDENTS.length - 1 ? "1px solid #f5f5f5" : "none",
                            }}>
                                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#E6FCF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#20C997", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                                    {name[0]}
                                </div>
                                <div style={{ flex: 1, fontWeight: 700, color: "#1a1a2e" }}>{name}</div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => mark(name, "present")} style={{
                                        padding: "8px 18px", borderRadius: 20, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", transition: "all 0.2s",
                                        background: attendance[name] === "present" ? "#20C997" : "#f0faf6",
                                        color: attendance[name] === "present" ? "#fff" : "#20C997",
                                    }}>✅ Present</button>
                                    <button onClick={() => mark(name, "absent")} style={{
                                        padding: "8px 18px", borderRadius: 20, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", transition: "all 0.2s",
                                        background: attendance[name] === "absent" ? "#FF6B6B" : "#fff0f0",
                                        color: attendance[name] === "absent" ? "#fff" : "#FF6B6B",
                                    }}>❌ Absent</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={submit} disabled={pending > 0} style={{
                        padding: "14px 36px", borderRadius: 14, background: pending > 0 ? "#ccc" : "#20C997",
                        color: "#fff", fontWeight: 800, fontSize: 15, border: "none", cursor: pending > 0 ? "not-allowed" : "pointer",
                        boxShadow: pending > 0 ? "none" : "0 6px 20px #20C99744",
                    }}>
                        {pending > 0 ? `Mark all students first (${pending} pending)` : "✅ Submit Attendance"}
                    </button>
                </>
            )}
        </DashboardLayout>
    );
}
