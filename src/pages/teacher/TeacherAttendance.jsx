import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
    collection, getDocs, query, where,
    doc, getDoc, setDoc, deleteField,
} from "firebase/firestore";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_CYCLE = { "": "present", present: "absent", absent: "late", late: "" };
const STATUS_META = {
    present: { bg: "#D1FAE5", text: "#065F46", label: "P", dot: "#10B981" },
    absent: { bg: "#FEE2E2", text: "#991B1B", label: "A", dot: "#EF4444" },
    late: { bg: "#FEF3C7", text: "#92400E", label: "L", dot: "#F59E0B" },
};

const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
})();

/* ═══════════════════════════════════════════════════
   PER-STUDENT ATTENDANCE CALENDAR MODAL
   ═══════════════════════════════════════════════════ */
function StudentCalendar({ student, onClose }) {
    const today = new Date();
    const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
    const [records, setRecords] = useState({});
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(null);
    const [toast, setToast] = useState(null);

    const docRef = student ? doc(db, "student_attendance", student.id) : null;

    useEffect(() => {
        if (!student) return;
        setFetching(true);
        setRecords({});
        getDoc(docRef)
            .then(snap => { if (snap.exists()) setRecords(snap.data()); })
            .catch(e => console.error("[Fetch]", e))
            .finally(() => setFetching(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [student?.id]);

    const showToast = (msg, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 2500);
    };

    /* Toggle: none → present → absent → late → none */
    const toggleDay = async (dateStr) => {
        if (saving || dateStr > todayStr) return;
        const current = records[dateStr] || "";
        const next = STATUS_CYCLE[current];

        setRecords(prev => {
            const u = { ...prev };
            if (next === "") delete u[dateStr];
            else u[dateStr] = next;
            return u;
        });
        setSaving(dateStr);
        try {
            if (next === "") {
                await setDoc(docRef, { [dateStr]: deleteField() }, { merge: true });
            } else {
                await setDoc(docRef, { [dateStr]: next }, { merge: true });
            }
            showToast("Saved ✓");
        } catch (e) {
            console.error("[Save]", e);
            showToast("Save failed: " + e.message, false);
            setRecords(prev => {
                const u = { ...prev };
                if (current === "") delete u[dateStr];
                else u[dateStr] = current;
                return u;
            });
        } finally { setSaving(null); }
    };

    const monthStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}`;
    const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay();
    const daysCount = new Date(viewDate.year, viewDate.month + 1, 0).getDate();

    const monthEntries = Object.entries(records).filter(([k]) => k.startsWith(monthStr));
    const presentCount = monthEntries.filter(([, v]) => v === "present").length;
    const absentCount = monthEntries.filter(([, v]) => v === "absent").length;
    const lateCount = monthEntries.filter(([, v]) => v === "late").length;

    const prevMonth = () => setViewDate(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
    const nextMonth = () => setViewDate(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });

    if (!student) return null;

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            {/* Toast */}
            {toast && (
                <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 13, background: toast.ok ? "#D1FAE5" : "#FEE2E2", color: toast.ok ? "#065F46" : "#991B1B", boxShadow: "0 8px 28px rgba(0,0,0,0.15)" }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 560, boxShadow: "0 24px 80px rgba(0,0,0,0.25)", overflow: "hidden" }}>

                {/* Header */}
                <div style={{ background: "linear-gradient(135deg,#3B5BDB,#6366f1)", padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Student Attendance</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{student.name}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{student.email} · {student.class}</div>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>

                {/* Stats bar */}
                <div style={{ display: "flex", borderBottom: "1px solid #F3F4F6" }}>
                    {[
                        { label: "Present", count: presentCount, bg: "#D1FAE5", color: "#065F46" },
                        { label: "Absent", count: absentCount, bg: "#FEE2E2", color: "#991B1B" },
                        { label: "Late", count: lateCount, bg: "#FEF3C7", color: "#92400E" },
                    ].map(s => (
                        <div key={s.label} style={{ flex: 1, padding: "14px 0", textAlign: "center", background: s.bg }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.count}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: s.color, opacity: 0.8 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Month nav */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 8px" }}>
                    <button onClick={prevMonth} style={{ background: "#F3F4F6", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 800, fontSize: 16 }}>‹</button>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1F2937" }}>{MONTH_NAMES[viewDate.month]} {viewDate.year}</div>
                    <button onClick={nextMonth} style={{ background: "#F3F4F6", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 800, fontSize: 16 }}>›</button>
                </div>

                {/* Calendar */}
                <div style={{ padding: "8px 16px 20px" }}>
                    {fetching ? (
                        <div style={{ textAlign: "center", padding: "24px 0", color: "#9CA3AF", fontSize: 13 }}>Loading…</div>
                    ) : (
                        <>
                            {/* Day headers */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
                                {DAY_NAMES.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9CA3AF", padding: "4px 0" }}>{d}</div>)}
                            </div>

                            {/* Day cells */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}

                                {Array.from({ length: daysCount }).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                    const status = records[dateStr] || "";
                                    const meta = STATUS_META[status] || null;
                                    const isToday = dateStr === todayStr;
                                    const isFuture = dateStr > todayStr;
                                    const isSaving = saving === dateStr;

                                    return (
                                        <button key={day}
                                            onClick={() => !isFuture && toggleDay(dateStr)}
                                            disabled={isFuture || isSaving}
                                            title={isFuture ? "Cannot mark future dates" : `${dateStr} — ${status || "unmarked"} (click to cycle)`}
                                            style={{
                                                border: isToday ? "2px solid #3B5BDB" : "2px solid transparent",
                                                borderRadius: 10, padding: "6px 2px",
                                                background: isFuture ? "#F3F4F6" : meta ? meta.bg : "#F9FAFB",
                                                cursor: isFuture ? "not-allowed" : isSaving ? "wait" : "pointer",
                                                opacity: isFuture ? 0.38 : 1,
                                                display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                                                transition: "all 0.14s", outline: "none",
                                            }}
                                            onMouseEnter={e => !meta && !isFuture && (e.currentTarget.style.background = "#EEF2FF")}
                                            onMouseLeave={e => !meta && !isFuture && (e.currentTarget.style.background = "#F9FAFB")}
                                        >
                                            <span style={{ fontSize: 13, fontWeight: isToday ? 900 : 600, color: isFuture ? "#9CA3AF" : meta ? meta.text : "#374151" }}>{day}</span>
                                            {isFuture && <span style={{ fontSize: 9, color: "#D1D5DB" }}>🔒</span>}
                                            {!isFuture && meta && <span style={{ fontSize: 10, fontWeight: 800, color: meta.text }}>{meta.label}</span>}
                                            {!isFuture && !meta && <span style={{ fontSize: 9, color: "transparent" }}>·</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Legend */}
                <div style={{ padding: "0 24px 20px", display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#9CA3AF" }}>
                    <span>🟢 P=Present</span>
                    <span>🔴 A=Absent</span>
                    <span>🟡 L=Late</span>
                    <span>Click to cycle · Auto-saves</span>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   MAIN TEACHER ATTENDANCE PAGE
   ═══════════════════════════════════════════════════ */
export default function TeacherAttendance() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [calStudent, setCalStudent] = useState(null);

    /* Fetch students matching this teacher's class */
    useEffect(() => {
        const teacherId = user?.id || user?.uid;
        if (!teacherId) {
            console.log("[Attendance] No teacher ID found in user context yet.", user);
            setLoading(false);
            return;
        }

        const teacherClass = user.class;
        console.log(`[Attendance] Teacher: ${user.name}, class: ${teacherClass}`);

        if (teacherClass === undefined) {
            console.log("[Attendance] Waiting for teacher class to load...");
            return;
        }

        setLoading(true);
        const fetchStudents = async () => {
            try {
                let q;
                if (teacherClass === "Both") {
                    console.log("[Attendance] Fetching all students (Both classes)");
                    q = collection(db, "students");
                } else if (teacherClass) {
                    console.log(`[Attendance] Fetching students matching class: "${teacherClass}"`);
                    q = query(collection(db, "students"), where("class", "==", teacherClass));
                } else {
                    console.warn("[Attendance] Teacher has no assigned class. Defaulting to all students.");
                    q = collection(db, "students");
                }

                const snap = await getDocs(q);
                const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                console.log(`[Attendance] Found ${results.length} students.`);
                setStudents(results);
            } catch (e) {
                console.error("[Attendance] Fetch Error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [user?.id, user?.uid, user?.class]);

    const filtered = students.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            {calStudent && <StudentCalendar student={calStudent} onClose={() => setCalStudent(null)} />}

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Mark Attendance</h1>
                    <p style={{ color: "#888" }}>
                        {user?.class ? `Showing students from ${user.class === "Both" ? "all classes" : user.class}` : "All students"}
                        {" · "}{students.length} students
                    </p>
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="🔍 Search students…"
                    style={{ padding: "11px 18px", borderRadius: 30, border: "2px solid #eee", fontSize: 14, outline: "none", width: 240 }} />
            </div>

            {/* Student list */}
            <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: "48px 0", textAlign: "center", color: "#aaa" }}>Loading students…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: "48px 0", textAlign: "center" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍🎓</div>
                        <div style={{ fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>No students found</div>
                        <div style={{ color: "#999", fontSize: 14 }}>
                            {students.length === 0
                                ? "No students are enrolled in your class yet."
                                : "Try a different search term."}
                        </div>
                    </div>
                ) : filtered.map((s, i) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", borderBottom: i < filtered.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                        {/* Avatar */}
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#E8EEFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#3B5BDB", fontSize: 16, flexShrink: 0 }}>
                            {(s.name || "S")[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: "#1a1a2e" }}>{s.name}</div>
                            <div style={{ fontSize: 12, color: "#888" }}>{s.email} · {s.class}</div>
                        </div>

                        {/* Open calendar */}
                        <button onClick={() => setCalStudent(s)}
                            style={{ padding: "8px 18px", borderRadius: 20, background: "#EEF2FF", color: "#3B5BDB", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                            📅 Mark Attendance
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 12, fontSize: 12, color: "#9CA3AF" }}>
                Click "📅 Mark Attendance" to open the calendar for any student. Changes auto‑save instantly.
            </div>
        </DashboardLayout>
    );
}
