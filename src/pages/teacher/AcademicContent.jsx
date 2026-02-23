import { useState, useRef } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";

const TABS = ["Notes", "Assignments", "Tests"];

const initialContent = {
    Notes: [
        { id: 1, name: "Chapter 3 – Journal Entries.pdf", size: "1.2 MB", date: "Feb 20" },
        { id: 2, name: "Partnership Accounts Notes.docx", size: "890 KB", date: "Feb 18" },
    ],
    Assignments: [
        { id: 1, name: "Trial Balance Exercise.pdf", size: "450 KB", date: "Feb 22" },
    ],
    Tests: [
        { id: 1, name: "Chapter 3 MCQ Test.pdf", size: "320 KB", date: "Feb 21" },
    ],
};

export default function AcademicContent() {
    const [activeTab, setActiveTab] = useState("Notes");
    const [content, setContent] = useState(initialContent);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef();

    const handleFile = (file) => {
        if (!file) return;
        const newItem = { id: Date.now(), name: file.name, size: (file.size / 1024).toFixed(0) + " KB", date: "Now" };
        setContent(p => ({ ...p, [activeTab]: [...p[activeTab], newItem] }));
    };

    const deleteItem = (id) => setContent(p => ({ ...p, [activeTab]: p[activeTab].filter(i => i.id !== id) }));

    const ICONS = { Notes: "📄", Assignments: "📝", Tests: "🧪" };
    const COLORS = { Notes: "#3B5BDB", Assignments: "#e67700", Tests: "#FF6B6B" };
    const BGRDS = { Notes: "#E8EEFF", Assignments: "#FFF9DB", Tests: "#FFF0F0" };

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Academic Content</h1>
            <p style={{ color: "#888", marginBottom: 28 }}>Upload and manage your notes, assignments, and tests</p>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                {TABS.map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} style={{
                        padding: "10px 24px", borderRadius: 30, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s",
                        background: activeTab === t ? COLORS[t] : "#fff",
                        color: activeTab === t ? "#fff" : COLORS[t],
                        border: `2px solid ${COLORS[t]}44`,
                        boxShadow: activeTab === t ? `0 4px 16px ${COLORS[t]}33` : "none",
                    }}>
                        {ICONS[t]} {t}
                    </button>
                ))}
            </div>

            {/* Upload zone */}
            <div
                onClick={() => fileRef.current.click()}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                style={{
                    border: `2.5px dashed ${dragOver ? COLORS[activeTab] : "#d0d5e8"}`,
                    borderRadius: 20, padding: "36px 20px", textAlign: "center",
                    cursor: "pointer", marginBottom: 24, transition: "all 0.2s",
                    background: dragOver ? BGRDS[activeTab] : "#fafbff",
                }}
            >
                <div style={{ fontSize: 40, marginBottom: 10 }}>{ICONS[activeTab]}</div>
                <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 15, marginBottom: 6 }}>
                    Drop your {activeTab.toLowerCase()} file here, or <span style={{ color: COLORS[activeTab] }}>click to browse</span>
                </div>
                <div style={{ fontSize: 12, color: "#aaa" }}>Supports PDF, DOCX, PPTX, images</div>
                <input ref={fileRef} type="file" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>

            {/* File list */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 16 }}>Uploaded {activeTab}</div>
                {content[activeTab].length === 0 && <p style={{ color: "#aaa", fontSize: 14 }}>No {activeTab.toLowerCase()} uploaded yet.</p>}
                {content[activeTab].map((item, i) => (
                    <div key={item.id} style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "14px 0",
                        borderBottom: i < content[activeTab].length - 1 ? "1px solid #f5f5f5" : "none",
                    }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: BGRDS[activeTab], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                            {ICONS[activeTab]}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: "#888" }}>{item.size} · Uploaded {item.date}</div>
                        </div>
                        <button onClick={() => deleteItem(item.id)} style={{ padding: "7px 14px", borderRadius: 10, background: "#FFF0F0", color: "#FF6B6B", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}
