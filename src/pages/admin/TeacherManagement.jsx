import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { db } from "../../firebase";
import {
    collection, getDocs, doc, setDoc, deleteDoc, updateDoc,
    serverTimestamp, query, where, getDoc, deleteField,
} from "firebase/firestore";

const SUBJECTS = ["Accountancy", "Business Studies", "Economics"];
const CLASSES = ["Class 11", "Class 12", "Both"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_CYCLE = { "": "present", present: "absent", absent: "" };
const STATUS_COLORS = { present: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981", label: "P" }, absent: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444", label: "A" } };

const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #eee", outline: "none", fontSize: 14, boxSizing: "border-box", transition: "border 0.2s", fontFamily: "inherit" };
const EMPTY_FORM = { name: "", email: "", password: "", subject: "Accountancy", class: "Class 11" };

/* ════════════════════════════════════════════════
   ATTENDANCE CALENDAR MODAL
   ════════════════════════════════════════════════ */
function AttendanceCalendar({ teacher, onClose }) {
    const today = new Date();
    const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
    const [records, setRecords] = useState({});
    const [fetching, setFetching] = useState(true);   // initial load
    const [saving, setSaving] = useState(null);   // date string being saved
    const [toast, setToast] = useState(null);   // { msg, ok }

    const docRef = teacher ? doc(db, "teacher_attendance", teacher.id) : null;

    /* ── Load all attendance for this teacher on open ── */
    useEffect(() => {
        if (!teacher) return;
        setFetching(true);
        setRecords({});
        getDoc(docRef)
            .then(snap => { if (snap.exists()) setRecords(snap.data()); })
            .catch(e => console.error("[Attendance fetch]", e))
            .finally(() => setFetching(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teacher?.id]);

    const showToast = (msg, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 2500);
    };

    /* ── Toggle a day: none → present → absent → none ──
       Writes ONLY the changed field to Firestore (merge-safe). ── */
    const toggleDay = async (dateStr) => {
        if (saving) return;
        const current = records[dateStr] || "";
        const next = STATUS_CYCLE[current];

        // Optimistic UI update
        setRecords(prev => {
            const updated = { ...prev };
            if (next === "") delete updated[dateStr];
            else updated[dateStr] = next;
            return updated;
        });
        setSaving(dateStr);
        try {
            if (next === "") {
                // Remove just this field (don't nuke the whole doc)
                await setDoc(docRef, { [dateStr]: deleteField() }, { merge: true });
            } else {
                // Add / update just this field
                await setDoc(docRef, { [dateStr]: next }, { merge: true });
            }
            showToast("Saved ✓");
        } catch (e) {
            console.error("[Attendance save]", e);
            showToast("Save failed: " + e.message, false);
            // Revert optimistic update on error
            setRecords(prev => {
                const reverted = { ...prev };
                if (current === "") delete reverted[dateStr];
                else reverted[dateStr] = current;
                return reverted;
            });
        } finally { setSaving(null); }
    };

    const monthStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}`;

    /* Build calendar grid */
    const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay();
    const daysCount = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    /* Month stats */
    const monthRecords = Object.entries(records).filter(([k]) => k.startsWith(monthStr));
    const presentCount = monthRecords.filter(([, v]) => v === "present").length;
    const absentCount = monthRecords.filter(([, v]) => v === "absent").length;
    const totalDays = daysCount;

    const prevMonth = () => setViewDate(p => {
        if (p.month === 0) return { year: p.year - 1, month: 11 };
        return { ...p, month: p.month - 1 };
    });
    const nextMonth = () => setViewDate(p => {
        if (p.month === 11) return { year: p.year + 1, month: 0 };
        return { ...p, month: p.month + 1 };
    });

    if (!teacher) return null;

    return (
        /* Backdrop */
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            {/* Save toast */}
            {toast && (
                <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 13, background: toast.ok ? "#D1FAE5" : "#FEE2E2", color: toast.ok ? "#065F46" : "#991B1B", boxShadow: "0 8px 28px rgba(0,0,0,0.15)" }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 560, boxShadow: "0 24px 80px rgba(0,0,0,0.25)", overflow: "hidden" }}>

                {/* Modal header */}
                <div style={{ background: "linear-gradient(135deg,#6366f1,#8B5CF6)", padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Attendance Calendar</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{teacher.name}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{teacher.subject} · {teacher.class}</div>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>

                {/* Month stats */}
                <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #F3F4F6" }}>
                    {[
                        { label: "Present", count: presentCount, bg: "#D1FAE5", color: "#065F46", icon: "✓" },
                        { label: "Absent", count: absentCount, bg: "#FEE2E2", color: "#991B1B", icon: "✗" },
                        { label: "Unmarked", count: totalDays - presentCount - absentCount, bg: "#F9FAFB", color: "#6B7280", icon: "·" },
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

                {/* Calendar grid */}
                <div style={{ padding: "8px 16px 20px" }}>
                    {/* Day headers */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
                        {DAY_NAMES.map(d => (
                            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9CA3AF", padding: "4px 0" }}>{d}</div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                        {/* Empty cells for offset */}
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}

                        {/* Actual days */}
                        {Array.from({ length: daysCount }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const status = records[dateStr] || "";
                            const sc = STATUS_COLORS[status];
                            const isToday = dateStr === todayStr;
                            const isFuture = dateStr > todayStr;   // lexicographic YYYY-MM-DD comparison
                            const isSaving = saving === dateStr;

                            return (
                                <button key={day}
                                    onClick={() => !isFuture && toggleDay(dateStr)}
                                    title={isFuture ? "Cannot mark future dates" : `Click to toggle — ${status || "unmarked"}`}
                                    disabled={isFuture || isSaving}
                                    style={{
                                        border: isToday ? "2px solid #6366f1" : "2px solid transparent",
                                        borderRadius: 10,
                                        padding: "6px 2px",
                                        background: isFuture ? "#F3F4F6" : sc ? sc.bg : "#F9FAFB",
                                        cursor: isFuture ? "not-allowed" : isSaving ? "wait" : "pointer",
                                        opacity: isFuture ? 0.38 : 1,
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                                        transition: "all 0.14s",
                                        outline: "none",
                                    }}
                                    onMouseEnter={e => !sc && !isFuture && (e.currentTarget.style.background = "#EEF2FF")}
                                    onMouseLeave={e => !sc && !isFuture && (e.currentTarget.style.background = "#F9FAFB")}
                                >
                                    <span style={{ fontSize: 13, fontWeight: isToday ? 900 : 600, color: isFuture ? "#9CA3AF" : sc ? sc.text : "#374151" }}>{day}</span>
                                    {isFuture && <span style={{ fontSize: 9, color: "#D1D5DB" }}>🔒</span>}
                                    {!isFuture && sc && <span style={{ fontSize: 10, fontWeight: 800, color: sc.text }}>{sc.label}</span>}
                                    {!isFuture && !sc && <span style={{ fontSize: 10, color: "transparent" }}>·</span>}
                                </button>
                            );
                        })}

                    </div>
                </div>

                {/* Legend */}
                <div style={{ padding: "0 24px 20px", display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#9CA3AF" }}>
                    <span>🟢 P = Present</span>
                    <span>🔴 A = Absent</span>
                    <span>⬜ = Not marked</span>
                    <span>Click to cycle & auto-save</span>
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */
export default function TeacherManagement() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newTeacher, setNewTeacher] = useState(EMPTY_FORM);
    const [editing, setEditing] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [calTeacher, setCalTeacher] = useState(null); // teacher whose calendar is open
    const [err, setErr] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const loadTeachers = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "teachers"));
            setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { setErr("Failed to load: " + e.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadTeachers(); }, [loadTeachers]);

    const addTeacher = async () => {
        setErr(""); setSuccessMsg("");
        const { name, email, password } = newTeacher;
        if (!name || !email || !password) { setErr("Name, email and password are required."); return; }
        if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }

        const q = query(collection(db, "teachers"), where("email", "==", email));
        const existing = await getDocs(q);
        if (!existing.empty) { setErr("A teacher with this email already exists."); return; }

        setSaving(true);
        try {
            const id = `teacher_${Date.now()}`;
            const data = {
                name, email, password,
                subject: newTeacher.subject,
                class: newTeacher.class,
                role: "teacher",
                createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, "teachers", id), data);
            setTeachers(p => [...p, { id, ...data }]);
            setNewTeacher(EMPTY_FORM);
            setShowAdd(false);
            setSuccessMsg(`✅ ${name} added — they can log in at /login?role=teacher`);
        } catch (e) { setErr(e.message); }
        finally { setSaving(false); }
    };

    const saveEdit = async (id) => {
        try {
            await updateDoc(doc(db, "teachers", id), { class: editForm.class });
            setTeachers(p => p.map(t => t.id === id ? { ...t, class: editForm.class } : t));
            setEditing(null);
        } catch (e) { alert("Error: " + e.message); }
    };

    const remove = async (id) => {
        if (!window.confirm("Remove this teacher? They will no longer be able to log in.")) return;
        await deleteDoc(doc(db, "teachers", id));
        setTeachers(p => p.filter(t => t.id !== id));
    };

    return (
        <DashboardLayout>
            {calTeacher && <AttendanceCalendar teacher={calTeacher} onClose={() => setCalTeacher(null)} />}

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Teacher Management</h1>
                    <p style={{ color: "#888" }}>Manage teacher accounts and track attendance via the calendar</p>
                </div>
                <button onClick={() => { setShowAdd(!showAdd); setErr(""); setSuccessMsg(""); }}
                    style={{ padding: "12px 24px", borderRadius: 14, background: "#20C997", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                    {showAdd ? "✕ Close" : "➕ Add Teacher"}
                </button>
            </div>

            {/* Banners */}
            {successMsg && <div style={{ background: "#E6FCF5", color: "#20C997", border: "1px solid #b2eed9", borderRadius: 12, padding: "12px 18px", fontSize: 14, marginBottom: 16, fontWeight: 600 }}>{successMsg}</div>}
            {err && <div style={{ background: "#FFF0F0", color: "#FF6B6B", border: "1px solid #ffc2c2", borderRadius: 12, padding: "12px 18px", fontSize: 14, marginBottom: 16, fontWeight: 600 }}>{err}</div>}

            {/* Add form */}
            {showAdd && (
                <div style={{ background: "#f8f9ff", padding: 24, borderRadius: 20, marginBottom: 24, border: "2px solid #E6FCF5" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e", marginBottom: 4 }}>Add Teacher Account</div>
                    <p style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>
                        Teacher logs in at <code>/login?role=teacher</code> using the email + password you set here.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, alignItems: "flex-end" }}>
                        <div>
                            <label style={labelStyle}>Full Name *</label>
                            <input style={inputStyle} type="text" value={newTeacher.name}
                                onChange={e => setNewTeacher(p => ({ ...p, name: e.target.value }))}
                                onFocus={e => e.target.style.border = "2px solid #20C997"}
                                onBlur={e => e.target.style.border = "2px solid #eee"}
                                placeholder="Ms. Priya Sharma" />
                        </div>
                        <div>
                            <label style={labelStyle}>Email Address *</label>
                            <input style={inputStyle} type="email" value={newTeacher.email}
                                onChange={e => setNewTeacher(p => ({ ...p, email: e.target.value }))}
                                onFocus={e => e.target.style.border = "2px solid #20C997"}
                                onBlur={e => e.target.style.border = "2px solid #eee"}
                                placeholder="teacher@school.com" />
                        </div>
                        <div>
                            <label style={labelStyle}>Login Password *</label>
                            <input style={inputStyle} type="text" value={newTeacher.password}
                                onChange={e => setNewTeacher(p => ({ ...p, password: e.target.value }))}
                                onFocus={e => e.target.style.border = "2px solid #20C997"}
                                onBlur={e => e.target.style.border = "2px solid #eee"}
                                placeholder="e.g. Teacher@123" />
                        </div>
                        <div>
                            <label style={labelStyle}>Subject</label>
                            <select style={{ ...inputStyle, cursor: "pointer" }} value={newTeacher.subject}
                                onChange={e => setNewTeacher(p => ({ ...p, subject: e.target.value }))}>
                                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Class</label>
                            <select style={{ ...inputStyle, cursor: "pointer" }} value={newTeacher.class}
                                onChange={e => setNewTeacher(p => ({ ...p, class: e.target.value }))}>
                                {CLASSES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <button onClick={addTeacher} disabled={saving}
                            style={{ background: saving ? "#aaa" : "#20C997", color: "#fff", border: "none", padding: "12px 16px", borderRadius: 10, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", fontSize: 14 }}>
                            {saving ? "Saving…" : "✓ Add Teacher"}
                        </button>
                    </div>
                </div>
            )}

            {/* Teacher Table */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflowX: "auto" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "48px 0", color: "#888" }}>Loading…</div>
                ) : teachers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>👩‍🏫</div>
                        <div style={{ fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>No teachers yet</div>
                        <div style={{ color: "#999", fontSize: 14 }}>Click "Add Teacher" above to get started.</div>
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                            <tr style={{ background: "#f8f9ff" }}>
                                {["Teacher", "Email", "Password", "Subject", "Class", "Actions"].map(h => (
                                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.map(t => (
                                <tr key={t.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                    {/* Name */}
                                    <td style={{ padding: "14px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E6FCF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#20C997", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                                                {t.name?.[0] ?? "T"}
                                            </div>
                                            <span style={{ fontWeight: 700, color: "#1a1a2e", whiteSpace: "nowrap" }}>{t.name}</span>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td style={{ padding: "14px", color: "#555", fontSize: 13 }}>{t.email}</td>

                                    {/* Password */}
                                    <td style={{ padding: "14px" }}>
                                        <code style={{ background: "#f5f5f5", padding: "3px 10px", borderRadius: 8, fontSize: 12, color: "#666" }}>{t.password}</code>
                                    </td>

                                    {/* Subject */}
                                    <td style={{ padding: "14px", color: "#555", fontSize: 13 }}>{t.subject}</td>

                                    {/* Class — editable */}
                                    <td style={{ padding: "14px" }}>
                                        {editing === t.id
                                            ? <select value={editForm.class}
                                                onChange={e => setEditForm(p => ({ ...p, class: e.target.value }))}
                                                style={{ padding: "7px 10px", borderRadius: 8, border: "2px solid #20C997", fontSize: 13, outline: "none" }}>
                                                {CLASSES.map(c => <option key={c}>{c}</option>)}
                                            </select>
                                            : <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{t.class || "—"}</span>
                                        }
                                    </td>

                                    {/* Actions */}
                                    <td style={{ padding: "14px" }}>
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            {/* Attendance calendar button */}
                                            <button onClick={() => setCalTeacher(t)}
                                                style={{ padding: "6px 12px", borderRadius: 8, background: "#EEF2FF", color: "#4F46E5", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>
                                                📅 Attendance
                                            </button>

                                            {/* Edit / Save class */}
                                            {editing === t.id
                                                ? <button onClick={() => saveEdit(t.id)}
                                                    style={{ padding: "6px 14px", borderRadius: 8, background: "#20C997", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Save</button>
                                                : <button onClick={() => { setEditing(t.id); setEditForm({ class: t.class || "Class 11" }); }}
                                                    style={{ padding: "6px 12px", borderRadius: 8, background: "#E6FCF5", color: "#20C997", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Edit</button>
                                            }

                                            <button onClick={() => remove(t.id)}
                                                style={{ padding: "6px 12px", borderRadius: 8, background: "#FFF0F0", color: "#FF6B6B", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Remove</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardLayout>
    );
}
