import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import useIsMobile from "../../hooks/useIsMobile";

const TYPES = ["Public", "Group", "Individual"];
const GROUPS = ["All Students", "Class 11 Students", "Class 12 Students", "All Teachers"];

export default function Announcements() {
    const isMobile = useIsMobile(900);
    const [announcements, setAnnouncements] = useState([
        { id: 1, title: "Mid-term exam schedule", body: "Mid-term exams for Class 11 and 12 will be held from March 10-15. Please prepare accordingly.", type: "Public", date: "Feb 20" },
        { id: 2, title: "Revision class added", body: "An extra revision class for Accountancy Batch A has been added on Saturday 10 AM.", type: "Group", group: "Class 12 Students", date: "Feb 18" },
    ]);

    const [form, setForm] = useState({ title: "", body: "", type: "Public", group: "All Students", recipient: "" });

    const post = () => {
        if (!form.title || !form.body) return;
        setAnnouncements(p => [{ ...form, id: Date.now(), date: "Now" }, ...p]);
        setForm({ title: "", body: "", type: "Public", group: "All Students", recipient: "" });
    };

    const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)", transition: "border 0.2s" };

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Announcements</h1>
            <p style={{ color: "#888", marginBottom: 28 }}>Post announcements to students, teachers, or the entire platform</p>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.4fr", gap: 24, marginBottom: 28 }}>
                {/* Compose */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>📢 New Announcement</div>

                    <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>Target</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            {TYPES.map(t => (
                                <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))} style={{
                                    flex: 1, padding: "9px 0", borderRadius: 20, fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", transition: "all 0.2s",
                                    background: form.type === t ? "#FF6B6B" : "#f0f0f0",
                                    color: form.type === t ? "#fff" : "#666",
                                }}>{t}</button>
                            ))}
                        </div>
                    </div>

                    {form.type === "Group" && (
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>Select Group</label>
                            <select value={form.group} onChange={e => setForm(p => ({ ...p, group: e.target.value }))} style={{ ...inputStyle, appearance: "none" }}>
                                {GROUPS.map(g => <option key={g}>{g}</option>)}
                            </select>
                        </div>
                    )}

                    {form.type === "Individual" && (
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>Recipient Email</label>
                            <input value={form.recipient} onChange={e => setForm(p => ({ ...p, recipient: e.target.value }))} placeholder="student@example.com" style={inputStyle}
                                onFocus={e => e.target.style.border = "2px solid #FF6B6B"}
                                onBlur={e => e.target.style.border = "2px solid #eee"} />
                        </div>
                    )}

                    <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>Title</label>
                        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" style={inputStyle}
                            onFocus={e => e.target.style.border = "2px solid #FF6B6B"}
                            onBlur={e => e.target.style.border = "2px solid #eee"} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>Message</label>
                        <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={4} placeholder="Write your announcement here…" style={{ ...inputStyle, resize: "vertical" }}
                            onFocus={e => e.target.style.border = "2px solid #FF6B6B"}
                            onBlur={e => e.target.style.border = "2px solid #eee"} />
                    </div>

                    <button onClick={post} style={{ width: "100%", padding: "13px", borderRadius: 12, background: "#FF6B6B", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 6px 20px #FF6B6B44" }}>
                        📢 Post Announcement
                    </button>
                </div>

                {/* Feed */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflowY: "auto" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>📋 Posted Announcements</div>
                    {announcements.map(a => (
                        <div key={a.id} style={{ padding: "18px 0", borderBottom: "1px solid #f5f5f5" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                                <div style={{ fontWeight: 800, fontSize: 14, color: "#1a1a2e" }}>{a.title}</div>
                                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                    <span style={{
                                        padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800,
                                        background: a.type === "Public" ? "#E8EEFF" : a.type === "Group" ? "#E6FCF5" : "#FFF0F0",
                                        color: a.type === "Public" ? "#3B5BDB" : a.type === "Group" ? "#20C997" : "#FF6B6B",
                                    }}>{a.type}</span>
                                    <button onClick={() => setAnnouncements(p => p.filter(x => x.id !== a.id))} style={{ padding: "3px 8px", borderRadius: 8, background: "#FFF0F0", color: "#FF6B6B", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>✕</button>
                                </div>
                            </div>
                            {a.group && <div style={{ fontSize: 11, color: "#3B5BDB", fontWeight: 700, marginBottom: 6 }}>👥 {a.group}</div>}
                            <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 6 }}>{a.body}</div>
                            <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600 }}>{a.date}</div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
