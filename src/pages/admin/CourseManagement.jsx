import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";

const INITIAL_COURSES = [
    { id: 1, name: "Accountancy – Class 11", chapters: 10, students: 68, status: "active" },
    { id: 2, name: "Accountancy – Class 12", chapters: 10, students: 74, status: "active" },
    { id: 3, name: "Business Studies – Class 11", chapters: 10, students: 45, status: "active" },
    { id: 4, name: "Business Studies – Class 12", chapters: 12, students: 52, status: "active" },
];

export default function CourseManagement() {
    const [courses, setCourses] = useState(INITIAL_COURSES);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: "", chapters: "", students: "", status: "active" });

    const openAdd = () => { setForm({ name: "", chapters: "", students: "", status: "active" }); setEditId(null); setShowModal(true); };
    const openEdit = c => { setForm(c); setEditId(c.id); setShowModal(true); };
    const save = () => {
        if (editId) setCourses(p => p.map(c => c.id === editId ? { ...form, id: editId } : c));
        else setCourses(p => [...p, { ...form, id: Date.now(), chapters: Number(form.chapters), students: Number(form.students) }]);
        setShowModal(false);
    };

    const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 11, border: "2px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)" };

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Course Management</h1>
                    <p style={{ color: "#888" }}>Add and update courses offered on the platform</p>
                </div>
                <button onClick={openAdd} style={{ padding: "12px 24px", borderRadius: 30, background: "#7048e8", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 4px 16px #7048e844" }}>
                    + Add Course
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
                {courses.map(c => (
                    <div key={c.id} style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", border: "1.5px solid #f0f0f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 16, background: "#F3F0FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📚</div>
                            <span style={{ padding: "4px 12px", borderRadius: 20, background: "#E6FCF5", color: "#20C997", fontSize: 11, fontWeight: 800 }}>● Active</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 12 }}>{c.name}</div>
                        <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
                            <div><div style={{ fontSize: 18, fontWeight: 900, color: "#7048e8", fontFamily: "var(--font-display)" }}>{c.chapters}</div><div style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>Chapters</div></div>
                            <div><div style={{ fontSize: 18, fontWeight: 900, color: "#3B5BDB", fontFamily: "var(--font-display)" }}>{c.students}</div><div style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>Students</div></div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => openEdit(c)} style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#F3F0FF", color: "#7048e8", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Edit</button>
                            <button onClick={() => setCourses(p => p.filter(x => x.id !== c.id))} style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#FFF0F0", color: "#FF6B6B", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Remove</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowModal(false)}>
                    <div style={{ background: "#fff", borderRadius: 24, padding: 32, maxWidth: 440, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e", marginBottom: 20 }}>{editId ? "Edit Course" : "Add Course"}</div>
                        {[
                            { label: "Course Name", k: "name", placeholder: "Accountancy – Class 11" },
                            { label: "Number of Chapters", k: "chapters", placeholder: "10", type: "number" },
                            { label: "No. of Students", k: "students", placeholder: "60", type: "number" },
                        ].map(f => (
                            <div key={f.k} style={{ marginBottom: 14 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>{f.label}</label>
                                <input type={f.type ?? "text"} value={form[f.k] ?? ""} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.placeholder} style={inputStyle}
                                    onFocus={e => e.target.style.border = "2px solid #7048e8"}
                                    onBlur={e => e.target.style.border = "2px solid #eee"} />
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "13px", borderRadius: 12, background: "#f0f0f0", color: "#666", border: "none", cursor: "pointer", fontWeight: 700 }}>Cancel</button>
                            <button onClick={save} style={{ flex: 2, padding: "13px", borderRadius: 12, background: "#7048e8", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800 }}>{editId ? "Save" : "Add Course"}</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
