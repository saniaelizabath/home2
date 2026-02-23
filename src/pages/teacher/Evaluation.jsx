import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";

const STUDENTS = [
    { id: 1, name: "Riya Mehta", test: "Accountancy Ch.3 Test", max: 50, score: null },
    { id: 2, name: "Aditya Sharma", test: "Accountancy Ch.3 Test", max: 50, score: null },
    { id: 3, name: "Priya Nair", test: "Accountancy Ch.3 Test", max: 50, score: null },
    { id: 4, name: "Arjun Verma", test: "Accountancy Ch.3 Test", max: 50, score: null },
];

export default function Evaluation() {
    const [scores, setScores] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const setScore = (id, val) => setScores(p => ({ ...p, [id]: val }));

    const submit = () => {
        if (Object.keys(scores).length < STUDENTS.length) return;
        setSubmitted(true);
    };

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Evaluation</h1>
            <p style={{ color: "#888", marginBottom: 28 }}>Evaluate tests and upload marks for your students</p>

            {submitted ? (
                <div style={{ background: "#E6FCF5", borderRadius: 24, padding: 40, textAlign: "center", border: "1.5px solid #b2eed9" }}>
                    <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, color: "#20C997", marginBottom: 8 }}>Marks Uploaded!</h2>
                    <p style={{ color: "#555", fontSize: 15 }}>All student scores have been submitted successfully. Students will be notified.</p>
                    <button onClick={() => { setSubmitted(false); setScores({}); }} style={{ marginTop: 20, padding: "12px 24px", borderRadius: 30, background: "#20C997", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>
                        Evaluate Another Test
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 6 }}>📝 Accountancy – Chapter 3 Test</div>
                        <div style={{ fontSize: 13, color: "#888", marginBottom: 22 }}>Enter marks for each student out of 50</div>

                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "#f8f9ff" }}>
                                        {["Student", "Test", "Max Marks", "Score Obtained", "Percentage"].map(h => (
                                            <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {STUDENTS.map((s, i) => {
                                        const sc = scores[s.id];
                                        const pct = sc !== undefined ? Math.round((Number(sc) / s.max) * 100) : null;
                                        return (
                                            <tr key={s.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                                <td style={{ padding: "14px 16px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#20C997", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>{s.name[0]}</div>
                                                        <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{s.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "14px 16px", color: "#888", fontSize: 13 }}>{s.test}</td>
                                                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1a1a2e" }}>{s.max}</td>
                                                <td style={{ padding: "14px 16px" }}>
                                                    <input type="number" min="0" max={s.max} value={sc ?? ""} onChange={e => setScore(s.id, e.target.value)}
                                                        placeholder="—" style={{
                                                            width: 80, padding: "8px 12px", borderRadius: 10, border: "2px solid #eee",
                                                            fontSize: 14, outline: "none", fontWeight: 700, textAlign: "center",
                                                        }}
                                                        onFocus={e => e.target.style.border = "2px solid #20C997"}
                                                        onBlur={e => e.target.style.border = "2px solid #eee"}
                                                    />
                                                </td>
                                                <td style={{ padding: "14px 16px" }}>
                                                    {pct !== null && (
                                                        <span style={{
                                                            padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 800,
                                                            background: pct >= 80 ? "#E6FCF5" : pct >= 60 ? "#E8EEFF" : "#FFF0F0",
                                                            color: pct >= 80 ? "#20C997" : pct >= 60 ? "#3B5BDB" : "#FF6B6B",
                                                        }}>{pct}%</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                            <button onClick={submit} style={{
                                padding: "13px 32px", borderRadius: 14, background: "#20C997", color: "#fff",
                                fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer",
                                boxShadow: "0 6px 20px #20C99744",
                            }}>
                                ✅ Upload Marks
                            </button>
                        </div>
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
