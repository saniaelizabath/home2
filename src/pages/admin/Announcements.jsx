import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
    collection, getDocs, addDoc, deleteDoc, updateDoc, doc,
    query, orderBy, onSnapshot, serverTimestamp, writeBatch,
} from "firebase/firestore";
import useIsMobile from "../../hooks/useIsMobile";

/* ─── Constants ──────────────────────────────────────────── */
const CLASSES = ["Class 11", "Class 12"];
const SUBJECTS = ["Accountancy", "Business Studies"];

const PRIORITIES = [
    { value: "normal", label: "Normal", icon: "📌", color: "#3B5BDB", bg: "#E8EEFF" },
    { value: "important", label: "Important", icon: "⚠️", color: "#e67700", bg: "#FFF9DB" },
    { value: "urgent", label: "Urgent", icon: "🚨", color: "#c92a2a", bg: "#FFF0F0" },
];

const AUDIENCE_OPTS = [
    { value: "everyone", label: "🌐 Everyone", sub: "Students + Teachers" },
    { value: "students", label: "👩‍🎓 Students", sub: "Filter by class / subject / name" },
    { value: "teachers", label: "👨‍🏫 Teachers", sub: "Filter by class / subject / name" },
];

const MOCK_DATA = [
    {
        title: "Welcome to Commerce Academy 2025–26! 🎉",
        message: "Dear students and teachers, we are excited to kick off the new academic year. Please log in to your dashboards to check timetables, course materials, and upcoming tests. Wishing everyone a productive year ahead!",
        priority: "important",
        audience: { type: "everyone", filters: { classes: [], subjects: [], userId: null, userName: null } },
        status: "sent", scheduledAt: null, isRead: {}, createdByName: "Admin",
    },
    {
        title: "Unit Test 1 Schedule Released 📅",
        message: "Unit Test 1 will be conducted from 5th March to 10th March. Accountancy test is on 5th March (10 AM) and Business Studies is on 7th March (10 AM). Syllabus has been uploaded to your profile page.",
        priority: "urgent",
        audience: { type: "students", filters: { classes: [], subjects: [], userId: null, userName: null } },
        status: "sent", scheduledAt: null, isRead: {}, createdByName: "Admin",
    },
    {
        title: "Partnership Accounts — Extra Class Added",
        message: "An extra doubt-clearing session has been scheduled for this Saturday, 1st March at 11 AM. The meeting link will be shared on your Class Dashboard. Attendance is highly recommended.",
        priority: "normal",
        audience: { type: "students", filters: { classes: ["Class 12"], subjects: ["Accountancy"], userId: null, userName: null } },
        status: "sent", scheduledAt: null, isRead: {}, createdByName: "Admin",
    },
    {
        title: "Case Study Practice Material Uploaded 📂",
        message: "Practice case studies for Chapter 5 (Organising) and Chapter 7 (Directing) have been uploaded to the Notes section. Please revise them before the upcoming class.",
        priority: "normal",
        audience: { type: "students", filters: { classes: [], subjects: ["Business Studies"], userId: null, userName: null } },
        status: "sent", scheduledAt: null, isRead: {}, createdByName: "Admin",
    },
    {
        title: "Staff Meeting — 28th February at 5 PM",
        message: "All teachers are requested to attend the monthly staff meeting on 28th February at 5:00 PM via Google Meet. Agenda: mid-term review, attendance policy update, and test paper submission deadlines.",
        priority: "important",
        audience: { type: "teachers", filters: { classes: [], subjects: [], userId: null, userName: null } },
        status: "sent", scheduledAt: null, isRead: {}, createdByName: "Admin",
    },
    {
        title: "Public Holiday Notice — 17th March",
        message: "The academy will remain closed on 17th March (Holi). All classes stand rescheduled. Teachers will update revised timings on the Class Dashboard by 14th March.",
        priority: "normal",
        audience: { type: "everyone", filters: { classes: [], subjects: [], userId: null, userName: null } },
        status: "sent", scheduledAt: null, isRead: {}, createdByName: "Admin",
    },
];

/* ─── Toast ─────────────────────────────────────────────── */
function Toast({ toasts }) {
    return (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    padding: "14px 20px", borderRadius: 14, fontWeight: 700, fontSize: 14,
                    background: t.type === "success" ? "#E6FCF5" : t.type === "error" ? "#FFF0F0" : "#E8EEFF",
                    color: t.type === "success" ? "#20C997" : t.type === "error" ? "#c92a2a" : "#3B5BDB",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1.5px solid currentColor",
                    animation: "slideIn 0.3s ease",
                }}>
                    {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : "ℹ "}{t.msg}
                </div>
            ))}
            <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        </div>
    );
}

/* ─── MultiSelect pill dropdown ─────────────────────────── */
function MultiSelect({ options, value, onChange, placeholder }) {
    const [open, setOpen] = useState(false);
    const ref = useRef();
    useEffect(() => {
        const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    const toggle = (opt) => onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
    return (
        <div ref={ref} style={{ position: "relative" }}>
            <div onClick={() => setOpen(p => !p)} style={{
                minHeight: 44, padding: "8px 14px", borderRadius: 10,
                border: "2px solid #eee", background: "#fafbff", cursor: "pointer",
                display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontSize: 14,
            }}>
                {value.length === 0
                    ? <span style={{ color: "#aaa" }}>{placeholder}</span>
                    : value.map(v => (
                        <span key={v} style={{ background: "#E8EEFF", color: "#3B5BDB", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                            {v} <span onClick={e => { e.stopPropagation(); toggle(v); }} style={{ marginLeft: 4, cursor: "pointer", opacity: 0.7 }}>×</span>
                        </span>
                    ))
                }
                <span style={{ marginLeft: "auto", color: "#aaa", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
            </div>
            {open && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "2px solid #E8EEFF", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 100, maxHeight: 220, overflowY: "auto" }}>
                    {options.map(opt => (
                        <div key={opt} onClick={() => toggle(opt)} style={{
                            padding: "10px 16px", cursor: "pointer", fontSize: 14,
                            fontWeight: value.includes(opt) ? 700 : 400,
                            background: value.includes(opt) ? "#E8EEFF" : "transparent",
                            color: value.includes(opt) ? "#3B5BDB" : "#333",
                            display: "flex", alignItems: "center", gap: 8,
                        }}>
                            <span style={{ width: 18, height: 18, borderRadius: 4, border: "2px solid", borderColor: value.includes(opt) ? "#3B5BDB" : "#ddd", background: value.includes(opt) ? "#3B5BDB" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, flexShrink: 0 }}>
                                {value.includes(opt) && "✓"}
                            </span>
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function Announcements() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);

    const [view, setView] = useState("compose");
    const [announcements, setAnnouncements] = useState([]);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [filterType, setFilterType] = useState("all");
    const [expandedId, setExpandedId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [updating, setUpdating] = useState(false);

    const defaultForm = {
        title: "", message: "", priority: "normal",
        audienceType: "everyone",
        filterClasses: [], filterSubjects: [], filterUserId: "",
    };
    const [form, setForm] = useState(defaultForm);

    /* ── Toast helper ── */
    const toast = (msg, type = "success") => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    };

    /* ── Fetch students + teachers ── */
    useEffect(() => {
        getDocs(collection(db, "students")).then(s => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        getDocs(collection(db, "teachers")).then(s => setTeachers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    /* ── Real-time announcements listener ── */
    useEffect(() => {
        const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q,
            snap => { setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
            err => { console.error(err); setLoading(false); }
        );
        return () => unsub();
    }, []);

    /* ── Seed mock data ── */
    const seedMock = async () => {
        setSeeding(true);
        try {
            const batch = writeBatch(db);
            MOCK_DATA.forEach(m => {
                const ref = doc(collection(db, "announcements"));
                batch.set(ref, { ...m, createdBy: user?.uid || "admin", createdAt: serverTimestamp() });
            });
            await batch.commit();
            toast("6 mock announcements seeded to Firestore ✓");
            setView("history");
        } catch (e) {
            toast("Seeding failed: " + e.message, "error");
        } finally { setSeeding(false); }
    };

    /* ── Audience preview text ── */
    const audiencePreview = () => {
        const { audienceType, filterClasses, filterSubjects, filterUserId } = form;
        if (audienceType === "everyone") return "Everyone (all students + teachers)";
        const student = students.find(s => s.id === filterUserId);
        const teacher = teachers.find(t => t.id === filterUserId);
        if (filterUserId && (student || teacher)) return `Individual — ${student?.name || teacher?.name}`;
        const parts = [];
        if (filterClasses.length) parts.push(filterClasses.join(", "));
        if (filterSubjects.length) parts.push(filterSubjects.join(", "));
        const base = audienceType === "students" ? "Students" : "Teachers";
        return parts.length ? `${base} → ${parts.join(" | ")}` : `All ${base}`;
    };

    /* ── Submit ── */
    const handleSubmit = async () => {
        if (!form.title.trim() || !form.message.trim()) { toast("Please fill in title and message", "error"); return; }
        if ((form.audienceType === "students" || form.audienceType === "teachers") && !confirm(`Send to: ${audiencePreview()}?`)) return;

        setSaving(true);
        try {
            const student = students.find(s => s.id === form.filterUserId);
            const teacher = teachers.find(t => t.id === form.filterUserId);
            await addDoc(collection(db, "announcements"), {
                title: form.title.trim(),
                message: form.message.trim(),
                priority: form.priority,
                audience: {
                    type: form.audienceType,
                    filters: {
                        classes: form.filterClasses,
                        subjects: form.filterSubjects,
                        userId: form.filterUserId || null,
                        userName: student?.name || teacher?.name || null,
                    },
                },
                isRead: {},
                status: "sent",
                scheduledAt: null,
                createdBy: user?.uid || "admin",
                createdByName: user?.name || "Admin",
                createdAt: serverTimestamp(),
            });
            toast("Announcement posted successfully!");
            setForm(defaultForm);
            setView("history");
        } catch (e) {
            toast("Failed to post: " + e.message, "error");
        } finally { setSaving(false); }
    };

    /* ── Delete ── */
    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "announcements", id));
            setDeleteConfirm(null);
            toast("Announcement deleted");
        } catch (e) {
            toast("Delete failed: " + e.message, "error");
        }
    };

    /* ── Edit helpers ── */
    const handleStartEdit = (a) => {
        setEditingId(a.id);
        setExpandedId(null);
        setEditForm({
            title: a.title || "",
            message: a.message || "",
            priority: a.priority || "normal",
            audienceType: a.audience?.type || "everyone",
            filterClasses: a.audience?.filters?.classes || [],
            filterSubjects: a.audience?.filters?.subjects || [],
            filterUserId: a.audience?.filters?.userId || "",
        });
    };

    const handleUpdate = async () => {
        if (!editForm.title.trim() || !editForm.message.trim()) { toast("Title and message required", "error"); return; }
        setUpdating(true);
        try {
            const student = students.find(s => s.id === editForm.filterUserId);
            const teacher = teachers.find(t => t.id === editForm.filterUserId);
            await updateDoc(doc(db, "announcements", editingId), {
                title: editForm.title.trim(),
                message: editForm.message.trim(),
                priority: editForm.priority,
                audience: {
                    type: editForm.audienceType,
                    filters: {
                        classes: editForm.filterClasses,
                        subjects: editForm.filterSubjects,
                        userId: editForm.filterUserId || null,
                        userName: student?.name || teacher?.name || null,
                    },
                },
                updatedAt: serverTimestamp(),
            });
            setEditingId(null);
            toast("Announcement updated ✓");
        } catch (e) {
            toast("Update failed: " + e.message, "error");
        } finally { setUpdating(false); }
    };

    /* ── Helpers ── */
    const priorityInfo = (p) => PRIORITIES.find(x => x.value === p) || PRIORITIES[0];

    const audienceSummary = (ann) => {
        const t = ann.audience?.type;
        const f = ann.audience?.filters || {};
        if (t === "everyone") return "🌐 Everyone";
        if (f.userName) return `👤 ${f.userName}`;
        const base = t === "students" ? "👩‍🎓 Students" : "👨‍🏫 Teachers";
        const parts = [...(f.classes || []), ...(f.subjects || [])];
        return parts.length ? `${base} — ${parts.join(", ")}` : `${base} (all)`;
    };

    const formatDate = (ts) => {
        if (!ts) return "—";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const filtered = filterType === "all" ? announcements : announcements.filter(a => a.audience?.type === filterType);

    /* ─── Shared styles ─── */
    const inputStyle = {
        width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #eee",
        fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafbff", fontFamily: "inherit",
    };
    const focus = e => (e.target.style.border = "2px solid #3B5BDB");
    const blur = e => (e.target.style.border = "2px solid #eee");

    /* ═══════════════════════ RENDER ════════════════════════ */
    return (
        <DashboardLayout>
            <Toast toasts={toasts} />

            {/* ── Delete confirm modal ── */}
            {deleteConfirm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e", marginBottom: 8 }}>Delete Announcement?</div>
                        <div style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>This cannot be undone.</div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: 14, borderRadius: 12, background: "#c92a2a", color: "#fff", fontWeight: 800, border: "none", cursor: "pointer" }}>Delete</button>
                            <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: 14, borderRadius: 12, background: "#f0f2ff", color: "#3B5BDB", fontWeight: 800, border: "none", cursor: "pointer" }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Page header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 4 }}>📢 Announcements</h1>
                    <p style={{ color: "#888" }}>Create and manage notices for your students and teachers</p>
                </div>
                <button onClick={seedMock} disabled={seeding} style={{ padding: "10px 20px", borderRadius: 30, background: "#FFF9DB", color: "#e67700", fontWeight: 700, border: "2px solid #e67700", cursor: "pointer", fontSize: 13 }}>
                    {seeding ? "Seeding…" : "🌱 Seed Mock Data"}
                </button>
            </div>

            {/* ── View toggle ── */}
            <div style={{ display: "flex", gap: 0, marginBottom: 28, background: "#f0f2ff", borderRadius: 30, padding: 4, width: "fit-content" }}>
                {[["compose", "✍️ Create Announcement"], ["history", "📋 History"]].map(([v, l]) => (
                    <button key={v} onClick={() => { setView(v); setEditingId(null); }} style={{
                        padding: "10px 24px", borderRadius: 26, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", transition: "all 0.2s",
                        background: view === v ? "#3B5BDB" : "transparent",
                        color: view === v ? "#fff" : "#3B5BDB",
                        boxShadow: view === v ? "0 4px 14px rgba(59,91,219,0.3)" : "none",
                    }}>{l}</button>
                ))}
            </div>

            {/* ══════ COMPOSE ══════ */}
            {view === "compose" && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 24, alignItems: "start" }}>

                    {/* Form card */}
                    <div style={{ background: "#fff", borderRadius: 24, padding: isMobile ? 20 : 32, boxShadow: "0 4px 32px rgba(0,0,0,0.07)" }}>

                        {/* Title */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Announcement Title *</label>
                            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Unit Test 1 Schedule Released"
                                style={{ ...inputStyle, fontWeight: 600, fontSize: 16 }} onFocus={focus} onBlur={blur} />
                        </div>

                        {/* Message */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Message *</label>
                            <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                rows={6} placeholder="Write your announcement message here…"
                                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} onFocus={focus} onBlur={blur} />
                            <div style={{ textAlign: "right", fontSize: 11, color: "#ccc", marginTop: 4 }}>{form.message.length} characters</div>
                        </div>

                        {/* Audience */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>Send To *</label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                                {AUDIENCE_OPTS.map(opt => (
                                    <label key={opt.value} style={{
                                        display: "flex", alignItems: "center", gap: 10, padding: "14px 12px",
                                        borderRadius: 14, cursor: "pointer", userSelect: "none",
                                        border: `2px solid ${form.audienceType === opt.value ? "#3B5BDB" : "#eee"}`,
                                        background: form.audienceType === opt.value ? "#E8EEFF" : "#fafbff",
                                        transition: "all 0.15s",
                                    }}>
                                        <input type="radio" name="aud" value={opt.value} checked={form.audienceType === opt.value}
                                            onChange={() => setForm(p => ({ ...p, audienceType: opt.value, filterClasses: [], filterSubjects: [], filterUserId: "" }))}
                                            style={{ accentColor: "#3B5BDB", flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{opt.label}</div>
                                            <div style={{ fontSize: 11, color: "#888" }}>{opt.sub}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Sub-filters for Students / Teachers */}
                        {(form.audienceType === "students" || form.audienceType === "teachers") && (
                            <div style={{ background: "#f8f9ff", borderRadius: 16, padding: 20, marginBottom: 20, border: "1.5px solid #E8EEFF" }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#3B5BDB", marginBottom: 14 }}>
                                    {form.audienceType === "students" ? "👩‍🎓 Student Filters" : "👨‍🏫 Teacher Filters"}
                                    <span style={{ fontWeight: 400, color: "#888", marginLeft: 8 }}>(leave empty = all)</span>
                                </div>

                                {/* Class + Subject row */}
                                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>CLASS</label>
                                        <MultiSelect options={CLASSES} value={form.filterClasses}
                                            onChange={v => setForm(p => ({ ...p, filterClasses: v }))}
                                            placeholder="All classes (11 & 12)" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>SUBJECT</label>
                                        <MultiSelect options={SUBJECTS} value={form.filterSubjects}
                                            onChange={v => setForm(p => ({ ...p, filterSubjects: v }))}
                                            placeholder="All subjects" />
                                    </div>
                                </div>

                                {/* Individual Student picker */}
                                {form.audienceType === "students" && (
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>
                                            INDIVIDUAL STUDENT <span style={{ fontWeight: 400 }}>(optional — overrides class/subject)</span>
                                        </label>
                                        <select value={form.filterUserId}
                                            onChange={e => setForm(p => ({ ...p, filterUserId: e.target.value }))}
                                            style={{ ...inputStyle, background: "#fff" }}>
                                            <option value="">— All students (no individual filter) —</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.email}</option>)}
                                            {students.length === 0 && <option disabled>No students registered yet</option>}
                                        </select>
                                    </div>
                                )}

                                {/* Individual Teacher picker */}
                                {form.audienceType === "teachers" && (
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>
                                            INDIVIDUAL TEACHER <span style={{ fontWeight: 400 }}>(optional — overrides class/subject)</span>
                                        </label>
                                        <select value={form.filterUserId}
                                            onChange={e => setForm(p => ({ ...p, filterUserId: e.target.value }))}
                                            style={{ ...inputStyle, background: "#fff" }}>
                                            <option value="">— All teachers (no individual filter) —</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.email}</option>)}
                                            {teachers.length === 0 && <option disabled>No teachers registered yet</option>}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Priority */}
                        <div style={{ marginBottom: 28 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>Priority</label>
                            <div style={{ display: "flex", gap: 10 }}>
                                {PRIORITIES.map(p => (
                                    <button key={p.value} type="button" onClick={() => setForm(f => ({ ...f, priority: p.value }))} style={{
                                        flex: 1, padding: "12px 0", borderRadius: 12, border: "2px solid", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                                        borderColor: form.priority === p.value ? p.color : "#eee",
                                        background: form.priority === p.value ? p.bg : "#fafbff",
                                        color: form.priority === p.value ? p.color : "#aaa",
                                    }}>{p.icon} {p.label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <button onClick={handleSubmit} disabled={saving} style={{
                            width: "100%", padding: 15, borderRadius: 16,
                            background: saving ? "#aaa" : "linear-gradient(135deg,#3B5BDB,#4c6ef5)",
                            color: "#fff", fontWeight: 800, fontSize: 16, border: "none",
                            cursor: saving ? "not-allowed" : "pointer",
                            boxShadow: saving ? "none" : "0 6px 20px rgba(59,91,219,0.35)",
                        }}>
                            {saving ? "Posting…" : "📢 Send Announcement"}
                        </button>
                    </div>

                    {/* ── Preview sidebar ── */}
                    <div style={{ position: isMobile ? "static" : "sticky", top: 24 }}>
                        <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 16 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: "#1a1a2e", marginBottom: 16 }}>👁 Live Preview</div>
                            <div style={{ background: "#f8f9ff", borderRadius: 14, padding: 16, border: "1.5px solid #E8EEFF" }}>
                                <div style={{ marginBottom: 10 }}>
                                    {(() => {
                                        const pr = priorityInfo(form.priority); return (
                                            <span style={{ background: pr.bg, color: pr.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{pr.icon} {pr.label}</span>
                                        );
                                    })()}
                                </div>
                                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 8 }}>
                                    {form.title || <span style={{ color: "#ccc" }}>Announcement title…</span>}
                                </div>
                                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginBottom: 12 }}>
                                    {form.message || <span style={{ color: "#ccc" }}>Your message will appear here…</span>}
                                </div>
                                <div style={{ fontSize: 12, color: "#aaa", borderTop: "1px solid #eee", paddingTop: 10 }}>
                                    📨 <strong style={{ color: "#3B5BDB" }}>{audiencePreview()}</strong>
                                </div>
                            </div>
                        </div>
                        <div style={{ background: "linear-gradient(135deg,#3B5BDB,#4c6ef5)", borderRadius: 20, padding: 20, color: "#fff" }}>
                            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>💡 Tips</div>
                            {["Use Urgent priority for time-sensitive notices like test schedules",
                                "Leave class/subject empty to reach all students or all teachers",
                                "Pick an individual student or teacher to send a personal notice",
                            ].map((t, i) => (
                                <div key={i} style={{ fontSize: 12, opacity: 0.85, marginBottom: 8, paddingLeft: 12, position: "relative" }}>
                                    <span style={{ position: "absolute", left: 0 }}>·</span>{t}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ HISTORY ══════ */}
            {view === "history" && (
                <div>
                    {/* Stats */}
                    <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
                        {[
                            { label: "Total", value: announcements.length, color: "#3B5BDB" },
                            { label: "Urgent", value: announcements.filter(a => a.priority === "urgent").length, color: "#c92a2a" },
                            { label: "Important", value: announcements.filter(a => a.priority === "important").length, color: "#e67700" },
                        ].map(s => (
                            <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "14px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", display: "flex", gap: 10, alignItems: "center" }}>
                                <span style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</span>
                                <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>{s.label}</span>
                            </div>
                        ))}
                        <button onClick={() => setView("compose")} style={{ marginLeft: "auto", padding: "12px 24px", borderRadius: 30, background: "#3B5BDB", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 13 }}>
                            + New Announcement
                        </button>
                    </div>

                    {/* Filter tabs */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                        {[["all", "All"], ["everyone", "🌐 Everyone"], ["students", "👩‍🎓 Students"], ["teachers", "👨‍🏫 Teachers"]].map(([v, l]) => (
                            <button key={v} onClick={() => setFilterType(v)} style={{
                                padding: "8px 18px", borderRadius: 30, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
                                background: filterType === v ? "#3B5BDB" : "#f0f2ff",
                                color: filterType === v ? "#fff" : "#3B5BDB",
                            }}>{l}</button>
                        ))}
                    </div>

                    {/* List */}
                    {loading ? (
                        <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
                            <div style={{ width: 40, height: 40, border: "4px solid #E8EEFF", borderTop: "4px solid #3B5BDB", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                            Loading announcements…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", color: "#aaa" }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>No announcements yet</div>
                            <div style={{ fontSize: 13 }}>Click "✍️ Create Announcement" or seed mock data to get started</div>
                        </div>
                    ) : filtered.map(a => {
                        const pr = priorityInfo(a.priority);
                        const readCount = Object.values(a.isRead || {}).filter(Boolean).length;
                        const isExpanded = expandedId === a.id;
                        const isEditing = editingId === a.id;
                        return (
                            <div key={a.id} style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: isEditing ? "0 8px 36px rgba(59,91,219,0.15)" : "0 4px 20px rgba(0,0,0,0.06)", marginBottom: 14, border: isEditing ? "2px solid #3B5BDB" : `1.5px solid ${a.priority === "urgent" ? "#FFD8D8" : "#f0f0f0"}`, transition: "all 0.2s" }}>

                                {/* Badges row — always visible */}
                                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                                    <span style={{ background: isEditing ? priorityInfo(editForm.priority)?.bg : pr.bg, color: isEditing ? priorityInfo(editForm.priority)?.color : pr.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                                        {isEditing ? priorityInfo(editForm.priority)?.icon : pr.icon} {isEditing ? priorityInfo(editForm.priority)?.label : pr.label}
                                    </span>
                                    <span style={{ background: "#f0f2ff", color: "#3B5BDB", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{audienceSummary(a)}</span>
                                    {isEditing && <span style={{ background: "#E8EEFF", color: "#3B5BDB", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✏️ Editing</span>}
                                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#aaa", flexShrink: 0 }}>{formatDate(a.createdAt)}</span>
                                </div>

                                {/* ── INLINE EDIT FORM ── */}
                                {isEditing ? (
                                    <div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>Title</label>
                                            <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                                                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #3B5BDB", fontSize: 15, fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>Message</label>
                                            <textarea value={editForm.message} onChange={e => setEditForm(p => ({ ...p, message: e.target.value }))}
                                                rows={4} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #3B5BDB", fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", fontFamily: "inherit" }} />
                                        </div>
                                        {/* Priority */}
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>Priority</label>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                {PRIORITIES.map(p => (
                                                    <button key={p.value} type="button" onClick={() => setEditForm(f => ({ ...f, priority: p.value }))} style={{
                                                        flex: 1, padding: "9px 0", borderRadius: 10, border: "2px solid", fontWeight: 700, fontSize: 12, cursor: "pointer",
                                                        borderColor: editForm.priority === p.value ? p.color : "#eee",
                                                        background: editForm.priority === p.value ? p.bg : "#fafbff",
                                                        color: editForm.priority === p.value ? p.color : "#aaa",
                                                    }}>{p.icon} {p.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Audience sub-filters */}
                                        {(editForm.audienceType === "students" || editForm.audienceType === "teachers") && (
                                            <div style={{ background: "#f8f9ff", borderRadius: 12, padding: 16, marginBottom: 12, border: "1.5px solid #E8EEFF" }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: "#3B5BDB", marginBottom: 10, textTransform: "uppercase" }}>Audience Filters</div>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                                                    <div>
                                                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6 }}>CLASS</label>
                                                        <MultiSelect options={CLASSES} value={editForm.filterClasses}
                                                            onChange={v => setEditForm(p => ({ ...p, filterClasses: v }))} placeholder="All classes" />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6 }}>SUBJECT</label>
                                                        <MultiSelect options={SUBJECTS} value={editForm.filterSubjects}
                                                            onChange={v => setEditForm(p => ({ ...p, filterSubjects: v }))} placeholder="All subjects" />
                                                    </div>
                                                </div>
                                                {editForm.audienceType === "students" && (
                                                    <select value={editForm.filterUserId} onChange={e => setEditForm(p => ({ ...p, filterUserId: e.target.value }))}
                                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #eee", fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" }}>
                                                        <option value="">— All students —</option>
                                                        {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.email}</option>)}
                                                    </select>
                                                )}
                                                {editForm.audienceType === "teachers" && (
                                                    <select value={editForm.filterUserId} onChange={e => setEditForm(p => ({ ...p, filterUserId: e.target.value }))}
                                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #eee", fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" }}>
                                                        <option value="">— All teachers —</option>
                                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.email}</option>)}
                                                    </select>
                                                )}
                                            </div>
                                        )}
                                        {/* Edit action buttons */}
                                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                            <button onClick={handleUpdate} disabled={updating} style={{ flex: 1, padding: "11px", borderRadius: 12, background: updating ? "#aaa" : "#3B5BDB", color: "#fff", fontWeight: 800, border: "none", cursor: updating ? "not-allowed" : "pointer", fontSize: 14 }}>
                                                {updating ? "Saving…" : "💾 Save Changes"}
                                            </button>
                                            <button onClick={() => setEditingId(null)} style={{ padding: "11px 20px", borderRadius: 12, background: "#f0f2ff", color: "#3B5BDB", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 14 }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── NORMAL VIEW ── */
                                    <div onClick={() => setExpandedId(isExpanded ? null : a.id)} style={{ cursor: "pointer" }}>
                                        <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 8 }}>{a.title}</div>
                                        <div style={{ fontSize: 14, color: "#555", lineHeight: 1.75, overflow: "hidden", maxHeight: isExpanded ? "none" : "3.8em" }}>{a.message}</div>
                                        {a.message?.length > 160 && (
                                            <div style={{ fontSize: 13, color: "#3B5BDB", fontWeight: 700, marginTop: 6 }}>
                                                {isExpanded ? "▲ Show less" : "▼ Read more"}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Footer — always visible when not editing */}
                                {!isEditing && (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid #f5f5f5", flexWrap: "wrap", gap: 8 }}>
                                        <div style={{ fontSize: 12, color: "#aaa" }}>
                                            By <strong style={{ color: "#555" }}>{a.createdByName || "Admin"}</strong>
                                            <span style={{ marginLeft: 16 }}>👁 <strong style={{ color: "#555" }}>{readCount}</strong> read</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button onClick={() => handleStartEdit(a)} style={{ padding: "7px 18px", borderRadius: 20, background: "#E8EEFF", color: "#3B5BDB", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>
                                                ✏️ Edit
                                            </button>
                                            <button onClick={() => setDeleteConfirm(a.id)} style={{ padding: "7px 18px", borderRadius: 20, background: "#FFF0F0", color: "#c92a2a", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>
                                                🗑 Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </DashboardLayout>
    );
}
