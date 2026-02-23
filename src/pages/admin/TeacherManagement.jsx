import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";

const INITIAL_TEACHERS = [
    { id: 1, name: "Mr. Suresh Kumar", email: "suresh@example.com", subject: "Accountancy", status: "approved", salary: 45000, attendance: 22 },
    { id: 2, name: "Ms. Priya Sharma", email: "priya.t@example.com", subject: "Business Studies", status: "approved", salary: 42000, attendance: 20 },
    { id: 3, name: "Ms. Kavya R.", email: "kavya@example.com", subject: "Business Studies", status: "pending", salary: null, attendance: null },
];

export default function TeacherManagement() {
    const [teachers, setTeachers] = useState(INITIAL_TEACHERS);
    const [editing, setEditing] = useState(null);
    const [editForm, setEditForm] = useState({});

    const approve = id => setTeachers(p => p.map(t => t.id === id ? { ...t, status: "approved" } : t));
    const remove = id => setTeachers(p => p.filter(t => t.id !== id));
    const startEdit = t => { setEditing(t.id); setEditForm({ salary: t.salary ?? "", attendance: t.attendance ?? "" }); };
    const saveEdit = id => {
        setTeachers(p => p.map(t => t.id === id ? { ...t, salary: Number(editForm.salary), attendance: Number(editForm.attendance) } : t));
        setEditing(null);
    };

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Teacher Management</h1>
            <p style={{ color: "#888", marginBottom: 28 }}>Approve teachers, manage salary & attendance details</p>

            <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                        <tr style={{ background: "#f8f9ff" }}>
                            {["Teacher", "Email", "Subject", "Status", "Salary (₹)", "Attendance Days", "Actions"].map(h => (
                                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {teachers.map(t => (
                            <tr key={t.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                <td style={{ padding: "14px 14px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E6FCF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#20C997", fontWeight: 800, fontSize: 13 }}>{t.name[0]}</div>
                                        <span style={{ fontWeight: 700, color: "#1a1a2e", whiteSpace: "nowrap" }}>{t.name}</span>
                                    </div>
                                </td>
                                <td style={{ padding: "14px 14px", color: "#888", fontSize: 12 }}>{t.email}</td>
                                <td style={{ padding: "14px 14px", color: "#555", fontSize: 12 }}>{t.subject}</td>
                                <td style={{ padding: "14px 14px" }}>
                                    {t.status === "pending"
                                        ? <button onClick={() => approve(t.id)} style={{ padding: "6px 14px", borderRadius: 20, background: "#20C997", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Approve</button>
                                        : <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: "#E6FCF5", color: "#20C997" }}>✅ Approved</span>
                                    }
                                </td>
                                <td style={{ padding: "14px 14px" }}>
                                    {editing === t.id
                                        ? <input type="number" value={editForm.salary} onChange={e => setEditForm(p => ({ ...p, salary: e.target.value }))} style={{ width: 100, padding: "7px 10px", borderRadius: 8, border: "2px solid #20C997", fontSize: 13, outline: "none" }} />
                                        : <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{t.salary ? `₹${t.salary.toLocaleString()}` : "—"}</span>
                                    }
                                </td>
                                <td style={{ padding: "14px 14px" }}>
                                    {editing === t.id
                                        ? <input type="number" value={editForm.attendance} onChange={e => setEditForm(p => ({ ...p, attendance: e.target.value }))} style={{ width: 80, padding: "7px 10px", borderRadius: 8, border: "2px solid #20C997", fontSize: 13, outline: "none" }} />
                                        : <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{t.attendance ?? "—"}</span>
                                    }
                                </td>
                                <td style={{ padding: "14px 14px" }}>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {editing === t.id
                                            ? <button onClick={() => saveEdit(t.id)} style={{ padding: "6px 14px", borderRadius: 8, background: "#20C997", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Save</button>
                                            : <button onClick={() => startEdit(t)} style={{ padding: "6px 12px", borderRadius: 8, background: "#E6FCF5", color: "#20C997", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Edit</button>
                                        }
                                        <button onClick={() => remove(t.id)} style={{ padding: "6px 12px", borderRadius: 8, background: "#FFF0F0", color: "#FF6B6B", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Delete</button>
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
