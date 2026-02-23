import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";

const INITIAL_STUDENTS = [
    { id: 1, name: "Riya Mehta", email: "riya@example.com", course: "Accountancy", class: "Class 12", status: "approved", parentEmail: "riya.parent@example.com" },
    { id: 2, name: "Aditya Sharma", email: "aditya@example.com", course: "Business Studies", class: "Class 11", status: "pending", parentEmail: "aditya.parent@example.com" },
    { id: 3, name: "Priya Nair", email: "priya@example.com", course: "Both Subjects", class: "Class 12", status: "approved", parentEmail: "priya.parent@example.com" },
    { id: 4, name: "Arjun Verma", email: "arjun@example.com", course: "Accountancy", class: "Class 11", status: "pending", parentEmail: "arjun.parent@example.com" },
];

export default function StudentManagement() {
    const [students, setStudents] = useState(INITIAL_STUDENTS);
    const [emailSent, setEmailSent] = useState({});
    const [search, setSearch] = useState("");

    const approve = id => setStudents(p => p.map(s => s.id === id ? { ...s, status: "approved" } : s));
    const remove = id => setStudents(p => p.filter(s => s.id !== id));
    const sendEmail = id => setEmailSent(p => ({ ...p, [id]: true }));

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Student Management</h1>
                    <p style={{ color: "#888" }}>Approve registrations, manage schedules, and email parents</p>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 20 }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search students…"
                    style={{ padding: "12px 18px", borderRadius: 30, border: "2px solid #eee", fontSize: 14, outline: "none", width: "100%", maxWidth: 400, boxSizing: "border-box", fontFamily: "var(--font-body)" }}
                    onFocus={e => e.target.style.border = "2px solid #FF6B6B"}
                    onBlur={e => e.target.style.border = "2px solid #eee"} />
            </div>

            <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                        <tr style={{ background: "#f8f9ff" }}>
                            {["Student", "Email", "Course", "Class", "Status", "Monthly Approval", "Parent Email", "Actions"].map(h => (
                                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((s, i) => (
                            <tr key={s.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                <td style={{ padding: "14px 14px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E8EEFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B5BDB", fontWeight: 800, fontSize: 13 }}>{s.name[0]}</div>
                                        <span style={{ fontWeight: 700, color: "#1a1a2e", whiteSpace: "nowrap" }}>{s.name}</span>
                                    </div>
                                </td>
                                <td style={{ padding: "14px 14px", color: "#888", fontSize: 12 }}>{s.email}</td>
                                <td style={{ padding: "14px 14px", color: "#555", fontSize: 12, whiteSpace: "nowrap" }}>{s.course}</td>
                                <td style={{ padding: "14px 14px", color: "#555", fontSize: 12 }}>{s.class}</td>
                                <td style={{ padding: "14px 14px" }}>
                                    <span style={{
                                        padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800,
                                        background: s.status === "approved" ? "#E6FCF5" : "#FFF9DB",
                                        color: s.status === "approved" ? "#20C997" : "#e67700",
                                    }}>{s.status === "approved" ? "✅ Approved" : "⏳ Pending"}</span>
                                </td>
                                <td style={{ padding: "14px 14px" }}>
                                    {s.status === "pending"
                                        ? <button onClick={() => approve(s.id)} style={{ padding: "7px 14px", borderRadius: 20, background: "#3B5BDB", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>Enable Classes</button>
                                        : <span style={{ fontSize: 11, color: "#20C997", fontWeight: 700 }}>✅ Active</span>
                                    }
                                </td>
                                <td style={{ padding: "14px 14px" }}>
                                    <button onClick={() => sendEmail(s.id)} style={{
                                        padding: "7px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                                        background: emailSent[s.id] ? "#E6FCF5" : "#f0f2ff",
                                        color: emailSent[s.id] ? "#20C997" : "#3B5BDB",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {emailSent[s.id] ? "✅ Sent" : "📧 Send Progress"}
                                    </button>
                                </td>
                                <td style={{ padding: "14px 14px" }}>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button style={{ padding: "6px 12px", borderRadius: 8, background: "#f0f2ff", color: "#3B5BDB", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Edit</button>
                                        <button onClick={() => remove(s.id)} style={{ padding: "6px 12px", borderRadius: 8, background: "#FFF0F0", color: "#FF6B6B", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
