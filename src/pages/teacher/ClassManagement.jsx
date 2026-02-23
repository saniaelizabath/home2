import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import useIsMobile from "../../hooks/useIsMobile";

const CLASSES = [
    { id: 1, subject: "Accountancy", batch: "Batch A", day: "Mon, Wed, Fri", time: "10:00 AM", link: "https://meet.google.com/abc-def-ghi", type: "Google Meet" },
    { id: 2, subject: "Accountancy", batch: "Batch B", day: "Tue, Thu", time: "4:00 PM", link: "https://zoom.us/j/123456", type: "Zoom" },
    { id: 3, subject: "Business Studies", batch: "Batch A", day: "Mon, Wed", time: "12:00 PM", link: "https://meet.google.com/xyz-uvw", type: "Google Meet" },
];

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TeacherClassManagement() {
    const isMobile = useIsMobile(900);
    const [classes, setClasses] = useState(CLASSES);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ subject: "", batch: "", day: "", time: "", link: "", type: "Google Meet" });

    const openAdd = () => { setForm({ subject: "", batch: "", day: "", time: "", link: "", type: "Google Meet" }); setEditItem(null); setShowModal(true); };
    const openEdit = c => { setForm(c); setEditItem(c.id); setShowModal(true); };
    const deleteClass = id => setClasses(p => p.filter(c => c.id !== id));

    const save = () => {
        if (editItem) {
            setClasses(p => p.map(c => c.id === editItem ? { ...form, id: editItem } : c));
        } else {
            setClasses(p => [...p, { ...form, id: Date.now() }]);
        }
        setShowModal(false);
    };

    const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid #eee", fontSize: 14, outline: "none", background: "#fafbff", boxSizing: "border-box", fontFamily: "var(--font-body)", transition: "border 0.2s" };

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Class Management</h1>
                    <p style={{ color: "#888" }}>Manage your class schedule and meeting links</p>
                </div>
                <button onClick={openAdd} style={{ padding: "12px 24px", borderRadius: 30, background: "#20C997", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 4px 16px #20C99744" }}>
                    + Add Class
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, marginBottom: 24 }}>
                {/* Calendar */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 18 }}>
                        📅 {now.toLocaleString("default", { month: "long" })} {now.getFullYear()}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                        {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#aaa", padding: "4px 0" }}>{d}</div>)}
                        {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                            <div key={d} style={{
                                textAlign: "center", padding: "8px 2px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                                background: d === now.getDate() ? "#20C997" : "#f8f9ff",
                                color: d === now.getDate() ? "#fff" : "#1a1a2e",
                            }}>{d}</div>
                        ))}
                    </div>
                </div>

                {/* Class list */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 18 }}>🎥 Your Classes</div>
                    {classes.map(c => (
                        <div key={c.id} style={{ padding: "14px 0", borderBottom: "1px solid #f5f5f5" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{c.subject} – {c.batch}</div>
                                    <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>📅 {c.day} · ⏰ {c.time}</div>
                                    <a href={c.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#20C997", fontWeight: 700, textDecoration: "none" }}>🔗 {c.type} Link</a>
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={() => openEdit(c)} style={{ padding: "6px 12px", borderRadius: 10, background: "#E6FCF5", color: "#20C997", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Edit</button>
                                    <button onClick={() => deleteClass(c.id)} style={{ padding: "6px 12px", borderRadius: 10, background: "#FFF0F0", color: "#FF6B6B", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowModal(false)}>
                    <div style={{ background: "#fff", borderRadius: 24, padding: 32, maxWidth: 480, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e", marginBottom: 20 }}>{editItem ? "Edit Class" : "Add New Class"}</div>
                        {[
                            { label: "Subject", k: "subject", placeholder: "Accountancy" },
                            { label: "Batch", k: "batch", placeholder: "Batch A" },
                            { label: "Days", k: "day", placeholder: "Mon, Wed, Fri" },
                            { label: "Time", k: "time", placeholder: "10:00 AM" },
                            { label: "Meeting Link", k: "link", placeholder: "https://meet.google.com/..." },
                        ].map(f => (
                            <div key={f.k} style={{ marginBottom: 14 }}>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>{f.label.toUpperCase()}</label>
                                <input value={form[f.k] ?? ""} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.placeholder} style={inputStyle}
                                    onFocus={e => e.target.style.border = "2px solid #20C997"}
                                    onBlur={e => e.target.style.border = "2px solid #eee"} />
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "13px", borderRadius: 12, background: "#f0f0f0", color: "#666", border: "none", cursor: "pointer", fontWeight: 700 }}>Cancel</button>
                            <button onClick={save} style={{ flex: 2, padding: "13px", borderRadius: 12, background: "#20C997", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800 }}>{editItem ? "Save Changes" : "Add Class"}</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
