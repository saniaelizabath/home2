import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";

const INITIAL_SCHEDULES = [
    { id: 1, course: "Accountancy – Class 12", teacher: "Mr. Suresh Kumar", days: "Mon, Wed, Fri", time: "10:00 AM", batch: "Batch A" },
    { id: 2, course: "Business Studies – Class 11", teacher: "Ms. Priya Sharma", days: "Tue, Thu", time: "12:00 PM", batch: "Batch A" },
    { id: 3, course: "Accountancy – Class 11", teacher: "Mr. Suresh Kumar", days: "Tue, Thu", time: "4:00 PM", batch: "Batch B" },
];

const BLANK = { course: "", teacher: "", days: "", time: "", batch: "" };

export default function ClassScheduling() {
    const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(BLANK);

    const openAdd = () => { setForm(BLANK); setEditId(null); setShowModal(true); };
    const openEdit = s => { setForm(s); setEditId(s.id); setShowModal(true); };
    const deleteSchedule = id => setSchedules(p => p.filter(s => s.id !== id));
    const save = () => {
        if (editId) setSchedules(p => p.map(s => s.id === editId ? { ...form, id: editId } : s));
        else setSchedules(p => [...p, { ...form, id: Date.now() }]);
        setShowModal(false);
    };

    const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 11, border: "2px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)" };

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Class Scheduling</h1>
                    <p style={{ color: "#888" }}>Add, edit, and delete class schedules</p>
                </div>
                <button onClick={openAdd} style={{ padding: "12px 24px", borderRadius: 30, background: "#FF6B6B", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 4px 16px #FF6B6B44" }}>
                    + Add Schedule
                </button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
                {schedules.map(s => (
                    <div key={s.id} style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 4 }}>{s.course}</div>
                            <div style={{ fontSize: 13, color: "#888" }}>👩‍🏫 {s.teacher} · 📅 {s.days} · ⏰ {s.time} · 👥 {s.batch}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => openEdit(s)} style={{ padding: "8px 18px", borderRadius: 20, background: "#f0f2ff", color: "#3B5BDB", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Edit</button>
                            <button onClick={() => deleteSchedule(s.id)} style={{ padding: "8px 18px", borderRadius: 20, background: "#FFF0F0", color: "#FF6B6B", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowModal(false)}>
                    <div style={{ background: "#fff", borderRadius: 24, padding: 32, maxWidth: 480, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e", marginBottom: 20 }}>{editId ? "Edit Schedule" : "Add Schedule"}</div>
                        {[
                            { label: "Course", k: "course", placeholder: "Accountancy – Class 12" },
                            { label: "Teacher", k: "teacher", placeholder: "Mr. Suresh Kumar" },
                            { label: "Days", k: "days", placeholder: "Mon, Wed, Fri" },
                            { label: "Time", k: "time", placeholder: "10:00 AM" },
                            { label: "Batch", k: "batch", placeholder: "Batch A" },
                        ].map(f => (
                            <div key={f.k} style={{ marginBottom: 14 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>{f.label}</label>
                                <input value={form[f.k] ?? ""} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.placeholder} style={inputStyle}
                                    onFocus={e => e.target.style.border = "2px solid #FF6B6B"}
                                    onBlur={e => e.target.style.border = "2px solid #eee"} />
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "13px", borderRadius: 12, background: "#f0f0f0", color: "#666", border: "none", cursor: "pointer", fontWeight: 700 }}>Cancel</button>
                            <button onClick={save} style={{ flex: 2, padding: "13px", borderRadius: 12, background: "#FF6B6B", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800 }}>{editId ? "Save Changes" : "Add Schedule"}</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
