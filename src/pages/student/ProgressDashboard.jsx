import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import useIsMobile from "../../hooks/useIsMobile";

export default function ProgressDashboard() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);

    const current = Number(user?.currentAggregate ?? 0);
    const target = Number(user?.targetAggregate ?? 90);
    const progressPct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

    useEffect(() => {
        if (!user?.uid) { setLoading(false); return; }
        getDocs(
            query(collection(db, "testScores"),
                where("studentId", "==", user.uid),
                orderBy("submittedAt", "asc"))
        ).then(snap => {
            setScores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }).catch(console.error).finally(() => setLoading(false));
    }, [user?.uid]);

    const formatDate = (ts) => {
        if (!ts) return "—";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    // Build monthly chart data from scores
    const monthlyMap = {};
    scores.forEach(s => {
        const d = s.submittedAt?.toDate ? s.submittedAt.toDate() : new Date(s.submittedAt);
        const label = d.toLocaleDateString("en-IN", { month: "short" });
        if (!monthlyMap[label]) monthlyMap[label] = [];
        monthlyMap[label].push((s.score / s.max) * 100);
    });
    const monthlyData = Object.entries(monthlyMap).map(([label, vals]) => ({
        label, avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));
    const graphMax = monthlyData.length ? Math.max(...monthlyData.map(m => m.avg)) : 100;

    const maxScore = scores.length ? Math.max(...scores.map(s => s.score)) : 0;
    const bestPct = scores.length ? Math.max(...scores.map(s => Math.round((s.score / s.max) * 100))) : 0;

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Progress Dashboard</h1>
            <p style={{ color: "#888", marginBottom: 32 }}>Track your performance and goal progress</p>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 20, marginBottom: 32 }}>
                {[
                    { label: "Current Aggregate", value: current ? `${current}%` : "—", icon: "📊", color: "#3B5BDB", bg: "#E8EEFF" },
                    { label: "Target Aggregate", value: `${target}%`, icon: "🏆", color: "#e67700", bg: "#FFF9DB" },
                    { label: "Tests Taken", value: scores.length, icon: "📝", color: "#20C997", bg: "#E6FCF5" },
                    { label: "Best Score %", value: scores.length ? `${bestPct}%` : "—", icon: "⭐", color: "#FF6B6B", bg: "#FFF0F0" },
                ].map(s => (
                    <div key={s.label} style={{ background: "#fff", borderRadius: 20, padding: "22px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>{s.icon}</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: "var(--font-display)", marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, marginBottom: 24 }}>
                {/* Progress vs Goal */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>🎯 Progress vs Goal</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: "#888", fontWeight: 600 }}>
                        <span>Current: <strong style={{ color: "#3B5BDB" }}>{current}%</strong></span>
                        <span>Target: <strong style={{ color: "#e67700" }}>{target}%</strong></span>
                    </div>
                    <div style={{ background: "#f0f2ff", borderRadius: 30, height: 18, overflow: "hidden", marginBottom: 24 }}>
                        <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg,#3B5BDB,#7048e8)", borderRadius: 30, transition: "width 1s", position: "relative" }}>
                            <div style={{ position: "absolute", right: 8, top: 0, lineHeight: "18px", fontSize: 10, color: "#fff", fontWeight: 800 }}>{current}%</div>
                        </div>
                    </div>
                    <div style={{ color: "#888", fontSize: 14 }}>
                        {current >= target
                            ? <strong style={{ color: "#20C997" }}>🎉 You've reached your target!</strong>
                            : <>You need <strong style={{ color: "#3B5BDB" }}>{Math.max(0, target - current)}%</strong> more to reach your target!</>
                        }
                    </div>
                </div>

                {/* Monthly Performance chart */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>📈 Monthly Performance</div>
                    {monthlyData.length === 0 ? (
                        <div style={{ color: "#aaa", fontSize: 14 }}>No test score data yet. Your monthly chart will appear here after tests are graded.</div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
                            {monthlyData.map((m, i) => (
                                <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                    <div style={{ fontSize: 10, color: "#3B5BDB", fontWeight: 700 }}>{m.avg}%</div>
                                    <div style={{
                                        width: "100%", borderRadius: "6px 6px 0 0",
                                        height: `${(m.avg / graphMax) * 90}px`,
                                        background: i === monthlyData.length - 1 ? "linear-gradient(180deg,#3B5BDB,#7048e8)" : "linear-gradient(180deg,#c5d0ff,#dde5ff)",
                                    }} />
                                    <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600 }}>{m.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Test scores table */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>📋 Recent Test Scores</div>
                {loading ? (
                    <div style={{ color: "#aaa", fontSize: 14 }}>Loading scores…</div>
                ) : scores.length === 0 ? (
                    <div style={{ color: "#aaa", fontSize: 14 }}>No test scores yet. They'll appear here once your teacher grades your tests.</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                            <thead>
                                <tr style={{ background: "#f8f9ff" }}>
                                    {["Subject / Test", "Date", "Score", "Max", "Percentage", "Grade"].map(h => (
                                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#888", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {scores.map((t, i) => {
                                    const pct = Math.round((t.score / t.max) * 100);
                                    const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "D";
                                    const gradeColors = { "A+": "#20C997", "A": "#3B5BDB", "B": "#e67700", "C": "#FF6B6B", "D": "#aaa" };
                                    return (
                                        <tr key={t.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                            <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1a1a2e" }}>{t.testName || t.subject || "Test"}</td>
                                            <td style={{ padding: "14px 16px", color: "#888" }}>{formatDate(t.submittedAt)}</td>
                                            <td style={{ padding: "14px 16px", fontWeight: 700, color: "#3B5BDB" }}>{t.score}</td>
                                            <td style={{ padding: "14px 16px", color: "#888" }}>{t.max}</td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{ background: "#f0f2ff", borderRadius: 30, height: 8, flex: 1, overflow: "hidden" }}>
                                                        <div style={{ width: `${pct}%`, height: "100%", background: "#3B5BDB", borderRadius: 30 }} />
                                                    </div>
                                                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e", minWidth: 36 }}>{pct}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <span style={{ background: gradeColors[grade] + "22", color: gradeColors[grade], padding: "4px 14px", borderRadius: 20, fontWeight: 800, fontSize: 13 }}>{grade}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
