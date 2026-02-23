import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import useIsMobile from "../../hooks/useIsMobile";

const TEST_SCORES = [
    { subject: "Journal Entries", date: "Feb 3", max: 50, score: 44 },
    { subject: "Trial Balance", date: "Feb 10", max: 50, score: 38 },
    { subject: "Partnership Accounts", date: "Feb 17", max: 100, score: 82 },
    { subject: "Business Finance", date: "Feb 20", max: 50, score: 45 },
    { subject: "Ratio Analysis", date: "Feb 22", max: 50, score: 40 },
];

const MONTHS_DATA = [68, 72, 75, 79, 82, 86];
const MONTH_LABELS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

export default function ProgressDashboard() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const current = Number(user?.currentAggregate ?? 72);
    const target = Number(user?.targetAggregate ?? 90);
    const progressPct = Math.min((current / target) * 100, 100);

    const maxScore = Math.max(...TEST_SCORES.map(t => t.score));
    const graphMax = Math.max(...MONTHS_DATA);

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Progress Dashboard</h1>
            <p style={{ color: "#888", marginBottom: 32 }}>Track your performance and goal progress</p>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 20, marginBottom: 32 }}>
                {[
                    { label: "Current Aggregate", value: `${current}%`, icon: "📊", color: "#3B5BDB", bg: "#E8EEFF" },
                    { label: "Target Aggregate", value: `${target}%`, icon: "🏆", color: "#e67700", bg: "#FFF9DB" },
                    { label: "Tests Taken", value: TEST_SCORES.length, icon: "📝", color: "#20C997", bg: "#E6FCF5" },
                    { label: "Best Score", value: `${maxScore}`, icon: "⭐", color: "#FF6B6B", bg: "#FFF0F0" },
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
                        You need <strong style={{ color: "#3B5BDB" }}>{Math.max(0, target - current)}%</strong> more to reach your target!
                    </div>
                </div>

                {/* Performance graph */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>📈 Monthly Performance</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
                        {MONTHS_DATA.map((v, i) => (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                <div style={{ fontSize: 10, color: "#3B5BDB", fontWeight: 700 }}>{v}%</div>
                                <div style={{
                                    width: "100%", borderRadius: "6px 6px 0 0",
                                    height: `${(v / graphMax) * 90}px`,
                                    background: i === MONTHS_DATA.length - 1
                                        ? "linear-gradient(180deg,#3B5BDB,#7048e8)"
                                        : "linear-gradient(180deg,#c5d0ff,#dde5ff)",
                                }} />
                                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600 }}>{MONTH_LABELS[i]}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Test scores table */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>📋 Recent Test Scores</div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                            <tr style={{ background: "#f8f9ff" }}>
                                {["Subject", "Date", "Score", "Max", "Percentage", "Grade"].map(h => (
                                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#888", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {TEST_SCORES.map((t, i) => {
                                const pct = Math.round((t.score / t.max) * 100);
                                const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "D";
                                const gradeColors = { "A+": "#20C997", "A": "#3B5BDB", "B": "#e67700", "C": "#FF6B6B", "D": "#aaa" };
                                return (
                                    <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                        <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1a1a2e" }}>{t.subject}</td>
                                        <td style={{ padding: "14px 16px", color: "#888" }}>{t.date}</td>
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
            </div>
        </DashboardLayout>
    );
}
