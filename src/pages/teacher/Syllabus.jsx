import { useState, useRef } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";

const COURSES = ["Accountancy – Class 11", "Accountancy – Class 12", "Business Studies – Class 11", "Business Studies – Class 12"];

const initialSyllabus = {
    "Accountancy – Class 11": { file: "Acc11_Syllabus.pdf", date: "Jan 15" },
    "Accountancy – Class 12": { file: "Acc12_Syllabus.pdf", date: "Jan 15" },
    "Business Studies – Class 11": null,
    "Business Studies – Class 12": null,
};

export default function TeacherSyllabus() {
    const [syllabus, setSyllabus] = useState(initialSyllabus);
    const [activeTab, setActiveTab] = useState(COURSES[0]);
    const fileRef = useRef();

    const handleFile = (file) => {
        if (!file) return;
        setSyllabus(p => ({ ...p, [activeTab]: { file: file.name, date: "Now" } }));
    };

    const remove = () => setSyllabus(p => ({ ...p, [activeTab]: null }));

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Syllabus</h1>
            <p style={{ color: "#888", marginBottom: 28 }}>Upload the syllabus for each course</p>

            {/* Course tabs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
                {COURSES.map(c => (
                    <button key={c} onClick={() => setActiveTab(c)} style={{
                        padding: "9px 20px", borderRadius: 30, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                        background: activeTab === c ? "#20C997" : "#fff",
                        color: activeTab === c ? "#fff" : "#20C997",
                        border: "2px solid #20C99744",
                    }}>{c}</button>
                ))}
            </div>

            <div style={{ background: "#fff", borderRadius: 24, padding: 36, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", maxWidth: 600 }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a2e", marginBottom: 8 }}>📚 {activeTab}</div>
                <div style={{ color: "#888", fontSize: 14, marginBottom: 28 }}>Upload the syllabus PDF for this course</div>

                {syllabus[activeTab] ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, background: "#E6FCF5", border: "1.5px solid #b2eed9" }}>
                        <div style={{ fontSize: 36 }}>📄</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{syllabus[activeTab].file}</div>
                            <div style={{ fontSize: 12, color: "#888" }}>Uploaded {syllabus[activeTab].date}</div>
                        </div>
                        <button onClick={() => fileRef.current.click()} style={{ padding: "8px 16px", borderRadius: 10, background: "#3B5BDB", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Replace</button>
                        <button onClick={remove} style={{ padding: "8px 16px", borderRadius: 10, background: "#FFF0F0", color: "#FF6B6B", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Remove</button>
                    </div>
                ) : (
                    <div onClick={() => fileRef.current.click()} style={{
                        border: "2.5px dashed #b2eed9", borderRadius: 20, padding: "48px 20px", textAlign: "center",
                        cursor: "pointer", background: "#f8fffe",
                    }}>
                        <div style={{ fontSize: 44, marginBottom: 12 }}>📄</div>
                        <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 15, marginBottom: 6 }}>
                            Click to upload syllabus for <span style={{ color: "#20C997" }}>{activeTab}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#aaa" }}>PDF, DOCX supported</div>
                    </div>
                )}
                <input ref={fileRef} type="file" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>

            {/* Overview */}
            <div style={{ marginTop: 24, background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 16 }}>📋 All Courses Overview</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
                    {COURSES.map(c => (
                        <div key={c} style={{ padding: "14px 16px", borderRadius: 14, background: syllabus[c] ? "#E6FCF5" : "#f8f9ff", border: `1.5px solid ${syllabus[c] ? "#b2eed9" : "#eee"}` }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e", marginBottom: 4 }}>{c}</div>
                            <div style={{ fontSize: 12, color: syllabus[c] ? "#20C997" : "#aaa", fontWeight: 600 }}>
                                {syllabus[c] ? `✅ ${syllabus[c].file}` : "⬜ Not uploaded"}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
