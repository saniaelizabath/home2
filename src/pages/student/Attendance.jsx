import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_META = {
    present: { bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7", icon: "✅", label: "P" },
    absent: { bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5", icon: "❌", label: "A" },
    late: { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D", icon: "⏰", label: "L" },
};

export default function StudentAttendance() {
    const { user } = useAuth();
    const [records, setRecords] = useState({});   // { "2026-03-01": "present", ... }
    const [loading, setLoading] = useState(true);
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const [viewYear, setViewYear] = useState(new Date().getFullYear());

    /* ── Fetch this student's attendance doc once ── */
    useEffect(() => {
        if (!user?.id && !user?.uid) { setLoading(false); return; }
        const studentId = user.id || user.uid;
        getDoc(doc(db, "student_attendance", studentId))
            .then(snap => { if (snap.exists()) setRecords(snap.data()); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user?.id, user?.uid]);

    /* ── Calendar helpers ── */
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayStr = (() => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; })();

    /* ── Month stats ── */
    const monthEntries = Object.entries(records).filter(([k]) => k.startsWith(monthStr));
    const presentDays = monthEntries.filter(([, v]) => v === "present").length;
    const absentDays = monthEntries.filter(([, v]) => v === "absent").length;
    const lateDays = monthEntries.filter(([, v]) => v === "late").length;
    const totalMarked = presentDays + absentDays + lateDays;
    const pct = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : null;

    const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
    const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>My Attendance</h1>
            <p style={{ color: "#888", marginBottom: 28 }}>Attendance marked by your teacher — updated in real time</p>

            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <button onClick={prevMonth} style={{ background: "#f0f2ff", border: "none", borderRadius: 10, width: 38, height: 38, cursor: "pointer", fontSize: 16, fontWeight: 800, color: "#3B5BDB" }}>‹</button>
                <span style={{ fontWeight: 800, fontSize: 17, color: "#1a1a2e" }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
                <button onClick={nextMonth} style={{ background: "#f0f2ff", border: "none", borderRadius: 10, width: 38, height: 38, cursor: "pointer", fontSize: 16, fontWeight: 800, color: "#3B5BDB" }}>›</button>
            </div>

            {/* Stats cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 16, marginBottom: 28 }}>
                {[
                    { label: "Present", value: presentDays, color: "#065F46", bg: "#D1FAE5", icon: "✅" },
                    { label: "Absent", value: absentDays, color: "#991B1B", bg: "#FEE2E2", icon: "❌" },
                    { label: "Late", value: lateDays, color: "#92400E", bg: "#FEF3C7", icon: "⏰" },
                    { label: "Attendance %", value: pct !== null ? `${pct}%` : "—", color: pct === null ? "#9CA3AF" : pct >= 75 ? "#065F46" : "#991B1B", bg: pct === null ? "#F9FAFB" : pct >= 75 ? "#D1FAE5" : "#FEE2E2", icon: "📊" },
                ].map(s => (
                    <div key={s.label} style={{ background: "#fff", borderRadius: 20, padding: "20px 18px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                        <div style={{ width: 42, height: 42, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>{s.icon}</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Calendar */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 24 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 20 }}>📅 {MONTH_NAMES[viewMonth]} {viewYear}</div>

                {loading ? (
                    <div style={{ color: "#aaa", textAlign: "center", padding: "32px 0" }}>Loading attendance…</div>
                ) : (
                    <>
                        {/* Day headers */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                            {DAYS.map((d, i) => (
                                <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9CA3AF", paddingBottom: 6 }}>{d}</div>
                            ))}
                            {/* Empty offset cells */}
                            {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}

                            {/* Day cells */}
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                const status = records[dateStr] || null;
                                const meta = STATUS_META[status] || null;
                                const isToday = dateStr === todayStr;

                                return (
                                    <div key={day} style={{
                                        textAlign: "center", padding: "10px 4px", borderRadius: 12,
                                        fontSize: 13, fontWeight: 700,
                                        background: meta ? meta.bg : "#F9FAFB",
                                        color: meta ? meta.color : "#D1D5DB",
                                        border: isToday ? "2px solid #3B5BDB" : meta ? `1.5px solid ${meta.border}` : "1.5px solid #E5E7EB",
                                    }}>
                                        {day}
                                        <div style={{ fontSize: 12, marginTop: 3 }}>
                                            {meta ? meta.icon : "—"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {totalMarked === 0 && (
                            <div style={{ marginTop: 24, color: "#aaa", fontSize: 14, textAlign: "center" }}>
                                No attendance has been marked for this month yet.
                            </div>
                        )}

                        {/* Legend */}
                        <div style={{ display: "flex", gap: 20, marginTop: 24, flexWrap: "wrap" }}>
                            {[
                                { label: "Present", color: "#065F46", bg: "#D1FAE5", border: "#6EE7B7" },
                                { label: "Absent", color: "#991B1B", bg: "#FEE2E2", border: "#FCA5A5" },
                                { label: "Late", color: "#92400E", bg: "#FEF3C7", border: "#FCD34D" },
                                { label: "Not marked", color: "#9CA3AF", bg: "#F9FAFB", border: "#E5E7EB" },
                            ].map(l => (
                                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6B7280", fontWeight: 600 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 4, background: l.bg, border: `1.5px solid ${l.border}` }} />
                                    {l.label}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Low attendance warning */}
            {pct !== null && pct < 75 && (
                <div style={{ background: "#FEE2E2", border: "1.5px solid #FCA5A5", borderRadius: 20, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ fontSize: 28 }}>⚠️</div>
                    <div>
                        <div style={{ fontWeight: 800, color: "#991B1B", marginBottom: 4 }}>Low Attendance Warning</div>
                        <div style={{ fontSize: 14, color: "#6B7280" }}>Your attendance this month is {pct}% — below the 75% requirement. Please attend classes regularly.</div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
