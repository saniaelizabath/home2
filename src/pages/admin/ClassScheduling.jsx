import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
    collection, addDoc, deleteDoc, updateDoc, doc,
    query, onSnapshot, getDocs, Timestamp,
} from "firebase/firestore";
import useIsMobile from "../../hooks/useIsMobile";

/* ─── Helpers ─────────────────────────────────────────────── */
const CLASS_OPTS = ["Class 11", "Class 12", "Individual"];
const SUBJECTS = ["Accountancy", "Business Studies", "Economics", "Both"];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "15", "30", "45"];

function pad(n) { return String(n).padStart(2, "0"); }
function buildTime(h, m, ampm) { return `${pad(h)}:${pad(m)} ${ampm}`; }

function parseTime(timeStr) {
    // "10:30 AM" → { hour:"10", minute:"30", ampm:"AM" }
    if (!timeStr) return { hour: "10", minute: "00", ampm: "AM" };
    const [hm, ampm] = timeStr.split(" ");
    const [hour, minute] = (hm || "10:00").split(":");
    return { hour: hour || "10", minute: minute || "00", ampm: ampm || "AM" };
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function tsToStr(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ─── Toast ───────────────────────────────────────────────── */
function Toast({ toasts }) {
    return (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    padding: "14px 22px", borderRadius: 14, fontWeight: 700, fontSize: 14,
                    background: t.type === "success" ? "#E6FCF5" : "#FFF0F0",
                    color: t.type === "success" ? "#20C997" : "#c92a2a",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.13)", border: "1.5px solid currentColor",
                    animation: "slideIn 0.3s ease",
                }}>
                    {t.type === "success" ? "✓ " : "✕ "}{t.msg}
                </div>
            ))}
            <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
        </div>
    );
}

/* ─── Normalise student subject to one of SUBJECTS ─────── */
const SUBJECTS_LOWER = ["accountancy", "business studies", "economics"];
function resolveSubject(student) {
    const raw = (student?.favSubject || student?.course || student?.subject || "").toLowerCase();
    if (!raw) return "";
    // Map to one of the 4 pill options
    if (raw.includes("account")) return "Accountancy";
    if (raw.includes("business")) return "Business Studies";
    if (raw.includes("econ")) return "Economics";
    if (raw.includes("both") || raw.includes("all")) return "Both";
    return ""; // unknown — leave blank so admin can pick manually
}

/* ─── Student Picker autocomplete ──────────────────── */
function StudentPicker({ value, onChange, onSelect, students }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value || "");

    useEffect(() => { setQuery(value || ""); }, [value]);

    const matches = query.trim().length > 0
        ? students.filter(s =>
            (s.name || "").toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8)
        : [];

    const select = (student) => {
        setQuery(student.name);
        onChange(student.name);       // update name field
        onSelect && onSelect(student); // pass full object for subject auto-fill
        setOpen(false);
    };

    return (
        <div style={{ position: "relative", marginTop: 10 }}>
            <div style={{ position: "relative" }}>
                <span style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    fontSize: 15, pointerEvents: "none",
                }}>🔍</span>
                <input
                    value={query}
                    onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
                    onFocus={e => { setOpen(true); e.target.style.border = "2px solid #6366f1"; }}
                    onBlur={e => { setTimeout(() => setOpen(false), 150); e.target.style.border = "2px solid #E5E7EB"; }}
                    placeholder="Type student name to search…"
                    style={{
                        width: "100%", padding: "11px 14px 11px 36px",
                        borderRadius: 10, border: "2px solid #E5E7EB", fontSize: 13,
                        outline: "none", boxSizing: "border-box", background: "#F9FAFB",
                        fontFamily: "Inter, Poppins, sans-serif", color: "#1F2937", transition: "border 0.15s",
                    }}
                />
            </div>

            {open && matches.length > 0 && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
                    background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
                    border: "1.5px solid #E5E7EB", overflow: "hidden",
                }}>
                    {matches.map((s, i) => (
                        <div key={s.id || i}
                            onMouseDown={() => select(s)}
                            style={{
                                padding: "10px 16px", cursor: "pointer", display: "flex",
                                alignItems: "center", gap: 10, transition: "background 0.1s",
                                borderBottom: i < matches.length - 1 ? "1px solid #F3F4F6" : "none",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#EEF2FF"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                        >
                            <span style={{
                                width: 32, height: 32, borderRadius: "50%", background: "#EEF2FF",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 14, flexShrink: 0,
                            }}>🎓</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#1F2937" }}>{s.name}</div>
                                {(s.class || s.email) && (
                                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                                        {s.class ? `${s.class}` : ""}{s.class && s.email ? " · " : ""}{s.email || ""}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {students.length === 0 && (
                        <div style={{ padding: "12px 16px", fontSize: 12, color: "#9CA3AF" }}>No students found in database</div>
                    )}
                </div>
            )}
            {open && query.trim().length > 0 && matches.length === 0 && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
                    background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
                    border: "1.5px solid #E5E7EB", padding: "12px 16px",
                    fontSize: 12, color: "#9CA3AF",
                }}>
                    No students match "{query}" — name will be saved as typed
                </div>
            )}
        </div>
    );
}

/* ─── Field wrapper ───────────────────────────────────────── */
function Field({ icon, label, children }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
                <span style={{ fontSize: 15 }}>{icon}</span>{label}
            </label>
            {children}
        </div>
    );
}

/* ─── Class type badge ────────────────────────────────────── */
function TypeBadge({ type }) {
    const m = {
        "Class 11": { bg: "#F0FDF4", color: "#16A34A", icon: "📗" },
        "Class 12": { bg: "#EEF2FF", color: "#4F46E5", icon: "📘" },
        "Individual": { bg: "#FDF4FF", color: "#9333EA", icon: "👤" },
    }[type] || { bg: "#F3F4F6", color: "#374151", icon: "📅" };
    return (
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: m.bg, color: m.color, whiteSpace: "nowrap" }}>
            {m.icon} {type}
        </span>
    );
}

/* ═══════════════ SCHEDULE FORM (Add / Edit) ═══════════════ */
function ScheduleForm({ initial, teachers, students, onSave, onCancel, saving, isMobile }) {
    const emptyForm = {
        classType: "Class 11", studentName: "", teacherName: "", subject: "",
        topic: "", date: "", hour: "10", minute: "00", ampm: "AM", meetingLink: "",
    };
    const [form, setForm] = useState(initial || emptyForm);

    // If editing and initial changes (shouldn't normally), sync
    useEffect(() => { if (initial) setForm(initial); }, [JSON.stringify(initial)]);

    const inp = {
        width: "100%", padding: "11px 14px", borderRadius: 10, border: "2px solid #E5E7EB",
        fontSize: 13, outline: "none", boxSizing: "border-box", background: "#F9FAFB",
        fontFamily: "Inter, Poppins, sans-serif", color: "#1F2937", transition: "border 0.15s",
    };
    const onFocus = e => (e.target.style.border = "2px solid #6366f1");
    const onBlur = e => (e.target.style.border = "2px solid #E5E7EB");

    return (
        <div style={{ background: "#fff", borderRadius: 20, padding: isMobile ? 20 : 32, boxShadow: "0 4px 28px rgba(0,0,0,0.09)", marginBottom: 32, border: "2px solid #EEF2FF" }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#1F2937", marginBottom: 22 }}>
                {initial ? "✏️ Edit Scheduled Class" : "✍️ Schedule a New Class"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 24px" }}>
                {/* Class type */}
                <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                    <Field icon="🎓" label="Class / Audience">
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {CLASS_OPTS.map(opt => (
                                <label key={opt} style={{
                                    display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
                                    borderRadius: 30, cursor: "pointer", fontWeight: 700, fontSize: 12,
                                    border: "2px solid", transition: "all 0.15s",
                                    borderColor: form.classType === opt ? "#6366f1" : "#E5E7EB",
                                    background: form.classType === opt ? "#EEF2FF" : "#F9FAFB",
                                    color: form.classType === opt ? "#4F46E5" : "#6B7280",
                                }}>
                                    <input type="radio" name="classType" value={opt}
                                        checked={form.classType === opt}
                                        onChange={() => setForm(p => ({ ...p, classType: opt, studentName: "" }))}
                                        style={{ accentColor: "#6366f1" }} />
                                    {opt === "Class 11" ? "📗 Class 11" : opt === "Class 12" ? "📘 Class 12" : "👤 Individual"}
                                </label>
                            ))}
                        </div>
                        {form.classType === "Individual" && (
                            <>
                                <StudentPicker
                                    value={form.studentName}
                                    onChange={val => setForm(p => ({ ...p, studentName: val }))}
                                    onSelect={student => {
                                        const subj = resolveSubject(student);
                                        setForm(p => ({
                                            ...p,
                                            studentName: student.name,
                                            ...(subj && { subject: subj }),
                                        }));
                                    }}
                                    students={students}
                                />
                                {/* Auto-linked subject hint */}
                                {form.studentName && form.subject && (
                                    <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6B7280" }}>
                                        <span style={{ background: "#EEF2FF", padding: "2px 10px", borderRadius: 10, fontWeight: 700, color: "#4F46E5" }}>
                                            📚 {form.subject}
                                        </span>
                                        <span>auto-linked from student profile · you can change it below</span>
                                    </div>
                                )}
                            </>
                        )}
                    </Field>
                </div>

                {/* Teacher */}
                <Field icon="👨‍🏫" label="Teacher">
                    {teachers.length > 0 ? (
                        <select value={form.teacherName}
                            onChange={e => setForm(p => ({ ...p, teacherName: e.target.value }))}
                            style={{ ...inp }} onFocus={onFocus} onBlur={onBlur}>
                            <option value="">— Select teacher —</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.name}>{t.name}{t.subject ? ` (${t.subject})` : ""}</option>
                            ))}
                        </select>
                    ) : (
                        <input value={form.teacherName}
                            onChange={e => setForm(p => ({ ...p, teacherName: e.target.value }))}
                            placeholder="e.g. Mrs. Sharma"
                            style={inp} onFocus={onFocus} onBlur={onBlur} />
                    )}
                </Field>

                {/* Subject */}
                <Field icon="📚" label="Subject">
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {SUBJECTS.map(s => (
                            <button key={s} type="button"
                                onClick={() => setForm(p => ({ ...p, subject: p.subject === s ? "" : s }))}
                                style={{
                                    padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                                    cursor: "pointer", border: "2px solid",
                                    borderColor: form.subject === s ? "#6366f1" : "#E5E7EB",
                                    background: form.subject === s ? "#EEF2FF" : "#F9FAFB",
                                    color: form.subject === s ? "#4F46E5" : "#6B7280",
                                }}>{s}</button>
                        ))}
                    </div>
                </Field>

                {/* Topic */}
                <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                    <Field icon="📝" label="Topic / Chapter">
                        <input value={form.topic}
                            onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                            placeholder="e.g. Partnership Accounts — Chapter 3"
                            style={inp} onFocus={onFocus} onBlur={onBlur} />
                    </Field>
                </div>

                {/* Date */}
                <Field icon="📅" label="Date">
                    <input type="date" value={form.date}
                        onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                        style={{ ...inp, colorScheme: "light" }} onFocus={onFocus} onBlur={onBlur} />
                </Field>

                {/* Time */}
                <Field icon="🕐" label="Time (12-hr)">
                    <div style={{ display: "flex", gap: 8 }}>
                        <select value={form.hour} onChange={e => setForm(p => ({ ...p, hour: e.target.value }))}
                            style={{ ...inp, flex: 1 }} onFocus={onFocus} onBlur={onBlur}>
                            {HOURS.map(h => <option key={h} value={h}>{pad(h)}</option>)}
                        </select>
                        <select value={form.minute} onChange={e => setForm(p => ({ ...p, minute: e.target.value }))}
                            style={{ ...inp, flex: 1 }} onFocus={onFocus} onBlur={onBlur}>
                            {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={form.ampm} onChange={e => setForm(p => ({ ...p, ampm: e.target.value }))}
                            style={{ ...inp, flex: 1 }} onFocus={onFocus} onBlur={onBlur}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </select>
                    </div>
                </Field>

                {/* Meeting link */}
                <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                    <Field icon="🔗" label="Meeting Link (Zoom / Google Meet)">
                        <input value={form.meetingLink} type="url"
                            onChange={e => setForm(p => ({ ...p, meetingLink: e.target.value }))}
                            placeholder="https://meet.google.com/abc-def-ghi"
                            style={inp} onFocus={onFocus} onBlur={onBlur} />
                    </Field>
                </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button onClick={() => onSave(form)} disabled={saving} style={{
                    flex: 1, padding: "13px 0", borderRadius: 12,
                    background: saving ? "#aaa" : "linear-gradient(135deg,#6366f1,#8B5CF6)",
                    color: "#fff", fontWeight: 800, fontSize: 14,
                    border: "none", cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: saving ? "none" : "0 6px 20px rgba(99,102,241,0.4)",
                    transition: "all 0.2s",
                }}>
                    {saving ? "Saving…" : (initial ? "💾 Save Changes" : "📅 Schedule Class")}
                </button>
                {onCancel && (
                    <button onClick={onCancel} style={{
                        padding: "13px 24px", borderRadius: 12, background: "#F3F4F6",
                        color: "#374151", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
                    }}>Cancel</button>
                )}
            </div>
        </div>
    );
}

/* ═══════════════ MAIN COMPONENT ══════════════════════════ */
export default function ClassScheduling() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);

    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);  // for Individual autocomplete
    const [classes, setClasses] = useState([]);
    const [saving, setSaving] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [listFilter, setListFilter] = useState("all");
    const [teacherFilter, setTeacherFilter] = useState("all");
    const [subjectFilter, setSubjectFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [customDate, setCustomDate] = useState("");
    const [listLoading, setListLoading] = useState(true);

    // UI mode: "add" | "edit" | null (collapsed)
    const [mode, setMode] = useState(null);
    const [editingClass, setEditingClass] = useState(null); // class doc being edited

    // Delete confirmation
    const [deleteId, setDeleteId] = useState(null);

    /* ── Toast helper ── */
    const toast = (msg, type = "success") => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    };

    /* ── Fetch teachers & students ── */
    useEffect(() => {
        getDocs(collection(db, "teachers"))
            .then(s => setTeachers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        getDocs(collection(db, "students"))
            .then(s => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    /* ── Real-time classes (no orderBy → sort client-side) ── */
    useEffect(() => {
        const q = query(collection(db, "scheduled_classes"));
        const unsub = onSnapshot(q,
            snap => {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                docs.sort((a, b) => {
                    const ta = a.createdAt?.seconds ?? 0;
                    const tb = b.createdAt?.seconds ?? 0;
                    return tb - ta; // newest first
                });
                setClasses(docs);
                setListLoading(false);
            },
            err => { console.error("Firestore:", err.message); setListLoading(false); }
        );
        return () => unsub();
    }, []);

    /* ── Validate form ── */
    const isClassPast = (dateStr, timeStr) => {
        if (!dateStr || !timeStr) return false;
        // Construct native Date
        const { hour, minute, ampm } = parseTime(timeStr);
        let h = parseInt(hour, 10);
        if (ampm === "PM" && h < 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;

        const classDate = new Date(`${dateStr}T${pad(h)}:${pad(minute)}:00`);
        return classDate < new Date();
    };

    /* ── Filtered list ── */
    const todayStr = new Date().toISOString().split("T")[0];
    const filtered = classes.filter(c => {
        if (listFilter !== "all" && c.classType !== listFilter) return false;
        if (teacherFilter !== "all" && c.teacherName !== teacherFilter) return false;
        if (subjectFilter !== "all" && c.subject !== subjectFilter) return false;

        if (dateFilter === "today") {
            if (c.date !== todayStr || isClassPast(c.date, c.time)) return false;
        } else if (dateFilter === "upcoming") {
            if (c.date <= todayStr) return false;
        } else if (dateFilter === "past") {
            if (!isClassPast(c.date, c.time)) return false;
        } else if (dateFilter === "custom") {
            if (customDate && c.date !== customDate) return false;
        }
        return true;
    });

    const validate = (form) => {
        if (!form.teacherName.trim()) { toast("Teacher name is required", "error"); return false; }
        if (form.classType === "Individual" && !form.studentName.trim()) { toast("Student name required for Individual", "error"); return false; }
        if (!form.topic.trim()) { toast("Topic is required", "error"); return false; }
        if (!form.date) { toast("Please pick a date", "error"); return false; }
        if (!form.meetingLink.trim()) { toast("Meeting link is required", "error"); return false; }

        if (isClassPast(form.date, buildTime(form.hour, form.minute, form.ampm))) {
            toast("Cannot schedule a class in the past", "error");
            return false;
        }

        return true;
    };

    /* ── Add ── */
    const handleAdd = async (form) => {
        if (!validate(form)) return;
        setSaving(true);
        try {
            const selectedTeacher = teachers.find(t => t.name === form.teacherName.trim());
            await addDoc(collection(db, "scheduled_classes"), {
                classType: form.classType,
                studentName: form.classType === "Individual" ? form.studentName.trim() : null,
                teacherName: form.teacherName.trim(),
                teacherUid: selectedTeacher?.uid || selectedTeacher?.id || null,
                subject: form.subject,
                topic: form.topic.trim(),
                date: form.date,
                time: buildTime(form.hour, form.minute, form.ampm),
                meetingLink: form.meetingLink.trim(),
                createdBy: user?.uid || "admin",
                createdAt: Timestamp.now(),
            });
            toast("Class scheduled successfully! 🎉");
            setMode(null);
        } catch (e) { toast("Failed to schedule: " + e.message, "error"); }
        finally { setSaving(false); }
    };

    /* ── Edit (update existing doc) ── */
    const handleEdit = async (form) => {
        if (!validate(form) || !editingClass) return;
        setSaving(true);
        try {
            const selectedTeacher = teachers.find(t => t.name === form.teacherName.trim());
            await updateDoc(doc(db, "scheduled_classes", editingClass.id), {
                classType: form.classType,
                studentName: form.classType === "Individual" ? form.studentName.trim() : null,
                teacherName: form.teacherName.trim(),
                teacherUid: selectedTeacher?.uid || selectedTeacher?.id || null,
                subject: form.subject,
                topic: form.topic.trim(),
                date: form.date,
                time: buildTime(form.hour, form.minute, form.ampm),
                meetingLink: form.meetingLink.trim(),
                updatedBy: user?.uid || "admin",
                updatedAt: Timestamp.now(),
            });
            toast("Class updated ✓ — changes reflected for teacher & student instantly!");
            setMode(null);
            setEditingClass(null);
        } catch (e) { toast("Update failed: " + e.message, "error"); }
        finally { setSaving(false); }
    };

    /* ── Delete ── */
    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "scheduled_classes", id));
            setDeleteId(null);
            toast("Class removed");
        } catch (e) { toast("Delete failed: " + e.message, "error"); }
    };

    /* ── Open edit form ── */
    const openEdit = (c) => {
        const { hour, minute, ampm } = parseTime(c.time);
        setEditingClass(c);
        setMode("edit");
        // Scroll form into view
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    };

    /* ── Initial form state for edit ── */
    const editInitial = editingClass ? {
        classType: editingClass.classType || "Class 11",
        studentName: editingClass.studentName || "",
        teacherName: editingClass.teacherName || "",
        subject: editingClass.subject || "",
        topic: editingClass.topic || "",
        date: editingClass.date || "",
        meetingLink: editingClass.meetingLink || "",
        ...parseTime(editingClass.time),
    } : null;

    /* ═══════════ TABLE CELL STYLE ═══════════ */
    const th = {
        padding: "12px 16px", fontWeight: 700, fontSize: 11, color: "#6B7280",
        textTransform: "uppercase", letterSpacing: "0.06em", background: "#F9FAFB",
        whiteSpace: "nowrap", textAlign: "left", borderBottom: "2px solid #F3F4F6",
    };
    const td = {
        padding: "13px 16px", fontSize: 13, color: "#374151",
        borderBottom: "1px solid #F3F4F6", verticalAlign: "middle",
        background: "#fff",
    };

    /* ═══════════════ RENDER ═══════════════ */
    return (
        <DashboardLayout>
            <Toast toasts={toasts} />

            {/* Delete confirm modal */}
            {deleteId && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 340, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
                        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>Remove this class?</div>
                        <div style={{ color: "#888", marginBottom: 24, fontSize: 13 }}>This cannot be undone. Teachers and students will no longer see it.</div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#EF4444", color: "#fff", fontWeight: 800, border: "none", cursor: "pointer" }}>Remove</button>
                            <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#F3F4F6", color: "#374151", fontWeight: 700, border: "none", cursor: "pointer" }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Page Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: "Inter, Poppins, sans-serif", fontSize: 28, fontWeight: 900, color: "#1F2937", marginBottom: 4 }}>
                        📅 Class Scheduling
                    </h1>
                    <p style={{ color: "#9CA3AF", fontSize: 13 }}>Schedule and edit live classes — changes appear instantly for teachers and students.</p>
                </div>
                <button
                    onClick={() => { setMode(mode === "add" ? null : "add"); setEditingClass(null); }}
                    style={{
                        padding: "12px 24px", borderRadius: 30, fontWeight: 800, fontSize: 14,
                        background: mode === "add" ? "#F3F4F6" : "linear-gradient(135deg,#6366f1,#8B5CF6)",
                        color: mode === "add" ? "#374151" : "#fff",
                        border: "none", cursor: "pointer",
                        boxShadow: mode === "add" ? "none" : "0 6px 20px rgba(99,102,241,0.4)",
                        transition: "all 0.2s",
                    }}>
                    {mode === "add" ? "✕ Cancel" : "+ Schedule Class"}
                </button>
            </div>

            {/* ── Add / Edit Form (collapsible) ── */}
            {(mode === "add" || mode === "edit") && (
                <ScheduleForm
                    key={mode === "edit" ? editingClass?.id : "new"}
                    initial={mode === "edit" ? editInitial : null}
                    teachers={teachers}
                    students={students}
                    onSave={mode === "edit" ? handleEdit : handleAdd}
                    onCancel={() => { setMode(null); setEditingClass(null); }}
                    saving={saving}
                    isMobile={isMobile}
                />
            )}

            {/* ── Scheduled Classes Table ── */}
            <div>
                {/* Header + Filters Box */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: "#1F2937" }}>📋 Scheduled Classes</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{classes.length} total · real-time from Firestore</div>
                    </div>

                    <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #E5E7EB" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 6 }}>🎓 Class Type</label>
                                <select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", fontFamily: "Inter, Poppins, sans-serif", color: "#1F2937" }} value={listFilter} onChange={e => setListFilter(e.target.value)}>
                                    <option value="all">All Classes</option>
                                    <option value="Class 11">Class 11 (📗)</option>
                                    <option value="Class 12">Class 12 (📘)</option>
                                    <option value="Individual">Individual (👤)</option>
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 6 }}>👨‍🏫 Teacher</label>
                                <select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", fontFamily: "Inter, Poppins, sans-serif", color: "#1F2937" }} value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)}>
                                    <option value="all">All Teachers</option>
                                    {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 6 }}>📚 Subject</label>
                                <select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", fontFamily: "Inter, Poppins, sans-serif", color: "#1F2937" }} value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
                                    <option value="all">All Subjects</option>
                                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 6 }}>📅 Date</label>
                                <select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", fontFamily: "Inter, Poppins, sans-serif", color: "#1F2937" }} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                                    <option value="all">All Dates</option>
                                    <option value="today">Today</option>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="past">Past</option>
                                    <option value="custom">Custom Date…</option>
                                </select>
                            </div>
                            {dateFilter === "custom" && (
                                <div style={{ flex: 1, minWidth: 140 }}>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 6 }}>📌 Select Date</label>
                                    <input type="date" style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", fontFamily: "Inter, Poppins, sans-serif", color: "#1F2937", boxSizing: "border-box" }} value={customDate} onChange={e => setCustomDate(e.target.value)} />
                                </div>
                            )}
                            <div style={{ flexShrink: 0 }}>
                                <button onClick={() => {
                                    setListFilter("all");
                                    setTeacherFilter("all");
                                    setSubjectFilter("all");
                                    setDateFilter("all");
                                    setCustomDate("");
                                }} style={{ padding: "0 16px", borderRadius: 10, background: "#F3F4F6", color: "#374151", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", height: 41, display: "flex", alignItems: "center" }}>
                                    ↻ Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {listLoading ? (
                    <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>
                        <div style={{ width: 36, height: 36, border: "4px solid #EEF2FF", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        Loading classes…
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", color: "#9CA3AF" }}>
                        <div style={{ fontSize: 48, marginBottom: 14 }}>🗓️</div>
                        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: "#1F2937" }}>No classes scheduled yet</div>
                        <div style={{ fontSize: 13 }}>Click "+ Schedule Class" above to get started</div>
                    </div>
                ) : (
                    /* ── TABLE ── */
                    <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                                <thead>
                                    <tr>
                                        {["#", "Class", "Topic", "Teacher", "Subject", "Date", "Time", "Meeting", "Added", "Actions"].map(h => (
                                            <th key={h} style={th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((c, idx) => {
                                        const isEven = idx % 2 === 0;
                                        const rowTd = { ...td, background: isEven ? "#fff" : "#FAFBFF" };
                                        return (
                                            <tr key={c.id}
                                                onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = "#F5F3FF")}
                                                onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(tdEl => tdEl.style.background = isEven ? "#fff" : "#FAFBFF")}
                                                style={{ transition: "background 0.1s" }}>

                                                {/* # */}
                                                <td style={{ ...rowTd, width: 40, color: "#9CA3AF", fontWeight: 700, fontSize: 12 }}>
                                                    {idx + 1}
                                                </td>

                                                {/* Class */}
                                                <td style={rowTd}>
                                                    <TypeBadge type={c.classType} />
                                                    {c.classType === "Individual" && c.studentName && (
                                                        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{c.studentName}</div>
                                                    )}
                                                </td>

                                                {/* Topic */}
                                                <td style={{ ...rowTd, maxWidth: 200 }}>
                                                    <div style={{ fontWeight: 700, color: "#1F2937", fontSize: 13 }}>{c.topic}</div>
                                                </td>

                                                {/* Teacher */}
                                                <td style={rowTd}>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>👨‍🏫 {c.teacherName || "—"}</div>
                                                </td>

                                                {/* Subject */}
                                                <td style={rowTd}>
                                                    {c.subject ? (
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", background: "#F3F4F6", padding: "3px 10px", borderRadius: 10 }}>
                                                            {c.subject}
                                                        </span>
                                                    ) : "—"}
                                                </td>

                                                {/* Date */}
                                                <td style={{ ...rowTd, whiteSpace: "nowrap" }}>
                                                    <div style={{ fontWeight: 700, fontSize: 13 }}>📅 {formatDate(c.date)}</div>
                                                </td>

                                                {/* Time */}
                                                <td style={{ ...rowTd, whiteSpace: "nowrap" }}>
                                                    🕐 {c.time || "—"}
                                                </td>

                                                {/* Meeting */}
                                                <td style={rowTd}>
                                                    {c.meetingLink ? (
                                                        <a href={c.meetingLink} target="_blank" rel="noreferrer" style={{
                                                            display: "inline-flex", alignItems: "center", gap: 5,
                                                            padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                                            background: "linear-gradient(135deg,#6366f1,#8B5CF6)",
                                                            color: "#fff", textDecoration: "none", whiteSpace: "nowrap",
                                                        }}>🔗 Join</a>
                                                    ) : "—"}
                                                </td>

                                                {/* Added */}
                                                <td style={{ ...rowTd, fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>
                                                    {tsToStr(c.createdAt)}{c.updatedAt && (<><br /><span style={{ color: "#6366f1" }}>edited {tsToStr(c.updatedAt)}</span></>)}
                                                </td>

                                                {/* Actions */}
                                                <td style={{ ...rowTd, whiteSpace: "nowrap" }}>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button
                                                            onClick={() => openEdit(c)}
                                                            style={{
                                                                padding: "6px 14px", borderRadius: 20, fontWeight: 700, fontSize: 12,
                                                                background: "#EEF2FF", color: "#4F46E5", border: "none", cursor: "pointer",
                                                                transition: "background 0.15s",
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = "#e0e7ff"}
                                                            onMouseLeave={e => e.currentTarget.style.background = "#EEF2FF"}
                                                        >✏️ Edit</button>
                                                        <button
                                                            onClick={() => setDeleteId(c.id)}
                                                            style={{
                                                                padding: "6px 14px", borderRadius: 20, fontWeight: 700, fontSize: 12,
                                                                background: "#FEF2F2", color: "#EF4444", border: "none", cursor: "pointer",
                                                                transition: "background 0.15s",
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                                                            onMouseLeave={e => e.currentTarget.style.background = "#FEF2F2"}
                                                        >🗑 Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Table footer */}
                        <div style={{ padding: "12px 20px", borderTop: "1px solid #F3F4F6", fontSize: 12, color: "#9CA3AF", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                            <span>Showing {filtered.length} of {classes.length} classes</span>
                            <span style={{ color: "#6366f1", fontWeight: 700 }}>✓ Edits reflect instantly for all teachers & students</span>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
