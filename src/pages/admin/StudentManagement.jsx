import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { db } from "../../firebase";
import { collection, onSnapshot, updateDoc, deleteDoc, doc, arrayRemove } from "firebase/firestore";
import useIsMobile from "../../hooks/useIsMobile";

/* ─── Slide Toggle ─────────────────────────────────────────── */
function SlideToggle({ enabled, onToggle }) {
    return (
        <button
            onClick={onToggle}
            title={enabled ? "Click to revoke access" : "Click to grant access"}
            style={{
                position: "relative", width: 52, height: 28, borderRadius: 99,
                background: enabled ? "#20C997" : "#E5E7EB",
                border: "none", cursor: "pointer", flexShrink: 0,
                transition: "background 0.25s",
                padding: 0, outline: "none",
            }}
        >
            <span style={{
                position: "absolute", top: 3, left: enabled ? 27 : 3,
                width: 22, height: 22, borderRadius: "50%", background: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                transition: "left 0.25s",
                display: "block",
            }} />
        </button>
    );
}

export default function StudentManagement() {
    const isMobile = useIsMobile(900);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState(null); // id currently being toggled

    /* ── Real-time student list ── */
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "students"), snap => {
            setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, err => { console.error(err); setLoading(false); });
        return () => unsub();
    }, []);

    /* ── Toggle approval ── */
    const toggleApproval = async (s) => {
        const newStatus = s.status === "active" ? "pending" : "active";
        setToggling(s.id);
        try {
            await updateDoc(doc(db, "students", s.id), { status: newStatus });
            // onSnapshot will update state automatically
        } catch (e) { alert("Error: " + e.message); }
        finally { setToggling(null); }
    };

    /* ── Edit ── */
    const saveEdit = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, "students", editingId), {
                name: editForm.name, phone: editForm.phone,
                course: editForm.course, class: editForm.class,
            });
            setEditingId(null);
        } catch (e) { console.error(e); alert("Error: " + e.message); }
        finally { setSaving(false); }
    };

    /* ── Delete ── */
    const remove = async (s) => {
        if (!confirm(`Delete student ${s.name}? This cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, "students", s.id));
            if (s.courseId) {
                await updateDoc(doc(db, "courses", s.courseId), { enrolledStudents: arrayRemove(s.id) });
            }
        } catch (e) { alert("Error: " + e.message); }
    };

    const filtered = students.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.course?.toLowerCase().includes(search.toLowerCase())
    );

    const approved = filtered.filter(s => s.status === "active").length;
    const pending = filtered.filter(s => s.status !== "active").length;

    return (
        <DashboardLayout>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 4 }}>Student Management</h1>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, color: "#888" }}>{students.length} registered</span>
                        <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#E6FCF5", color: "#20C997" }}>✓ {approved} approved</span>
                        {pending > 0 && <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#FFF9DB", color: "#e67700" }}>⏳ {pending} pending</span>}
                    </div>
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="🔍 Search by name, email, course…"
                    style={{ padding: "12px 18px", borderRadius: 30, border: "2px solid #eee", fontSize: 14, outline: "none", width: isMobile ? "100%" : 280 }} />
            </div>

            <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>Loading students…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>No students found.</div>
                ) : filtered.map((s, i) => (
                    <div key={s.id}>
                        {editingId === s.id ? (
                            /* ── Inline edit form ── */
                            <div style={{ padding: "20px 24px", background: "#f8f9ff", borderBottom: "1px solid #f0f0f0" }}>
                                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 12 }}>
                                    {[["Name", "name"], ["Phone", "phone"], ["Course", "course"], ["Class", "class"]].map(([label, key]) => (
                                        <div key={key}>
                                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4 }}>{label.toUpperCase()}</label>
                                            <input value={editForm[key] || ""} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #eee", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button onClick={saveEdit} disabled={saving} style={{ padding: "10px 22px", borderRadius: 12, background: "#3B5BDB", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
                                        {saving ? "Saving…" : "Save"}
                                    </button>
                                    <button onClick={() => setEditingId(null)} style={{ padding: "10px 22px", borderRadius: 12, background: "#f0f2ff", color: "#3B5BDB", fontWeight: 700, border: "none", cursor: "pointer" }}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            /* ── Student row ── */
                            <div style={{ display: "flex", alignItems: "center", padding: "16px 24px", borderBottom: i < filtered.length - 1 ? "1px solid #f5f5f5" : "none", gap: 14, flexWrap: "wrap" }}>
                                {/* Avatar */}
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: s.status === "active" ? "#E6FCF5" : "#FFF9DB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: s.status === "active" ? "#20C997" : "#e67700", flexShrink: 0 }}>
                                    {(s.name || "S")[0].toUpperCase()}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, color: "#1a1a2e" }}>{s.name}</div>
                                    <div style={{ fontSize: 12, color: "#888" }}>{s.email} · {s.course} · {s.class}</div>
                                </div>

                                {/* Approval toggle */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: s.status === "active" ? "#20C997" : "#9CA3AF", minWidth: 52, textAlign: "right" }}>
                                        {toggling === s.id ? "…" : s.status === "active" ? "Approved" : "Pending"}
                                    </span>
                                    <SlideToggle
                                        enabled={s.status === "active"}
                                        onToggle={() => !toggling && toggleApproval(s)}
                                    />
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => { setEditingId(s.id); setEditForm(s); }} style={{ padding: "7px 14px", borderRadius: 20, background: "#E8EEFF", color: "#3B5BDB", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>Edit</button>
                                    <button onClick={() => remove(s)} style={{ padding: "7px 14px", borderRadius: 20, background: "#FFF0F0", color: "#FF6B6B", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>Delete</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{ marginTop: 12, fontSize: 12, color: "#9CA3AF", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>⬅ Slide left = revoke access</span>
                <span>Slide right ➡ = grant full access</span>
                <span>· Changes apply immediately</span>
            </div>
        </DashboardLayout>
    );
}
