import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SUBJECTS = ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"];

export default function TeacherRegister() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "" });
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const inputStyle = {
        width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 15,
        border: "2px solid #eee", outline: "none", background: "#fafbff",
        fontFamily: "var(--font-body)", boxSizing: "border-box", transition: "border 0.2s",
    };

    const handleSubmit = e => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            login({ ...form, role: "teacher" });
            navigate("/teacher/dashboard");
        }, 900);
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg,#0d1117 0%,#1a1a2e 60%,#0b2a20 100%)",
            padding: "32px 24px", fontFamily: "var(--font-body)",
        }}>
            <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

            <div style={{ background: "#fff", borderRadius: 28, padding: "clamp(28px,5vw,52px)", maxWidth: 520, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
                <div style={{ background: "#E6FCF5", color: "#20C997", display: "inline-flex", gap: 8, alignItems: "center", padding: "7px 18px", borderRadius: 30, fontWeight: 700, fontSize: 13, marginBottom: 24 }}>
                    👩‍🏫 Teacher Registration
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, color: "#1a1a2e", marginBottom: 8 }}>Join as a Teacher</h2>
                <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>Fill in your details to create your teacher account</p>

                <form onSubmit={handleSubmit}>
                    {[
                        { label: "Full Name", k: "name", type: "text", placeholder: "Mr. Suresh Kumar" },
                        { label: "Email Address", k: "email", type: "email", placeholder: "teacher@example.com" },
                        { label: "Phone Number", k: "phone", type: "tel", placeholder: "+91 9876543210" },
                    ].map(f => (
                        <div key={f.k} style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 7 }}>{f.label}</label>
                            <input type={f.type} value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                                placeholder={f.placeholder} style={inputStyle}
                                onFocus={e => e.target.style.border = "2px solid #20C997"}
                                onBlur={e => e.target.style.border = "2px solid #eee"} />
                        </div>
                    ))}

                    <div style={{ marginBottom: 28 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 7 }}>Subject Handled</label>
                        <select value={form.subject} onChange={e => set("subject", e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                            <option value="">Select subject…</option>
                            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        width: "100%", padding: "15px", borderRadius: 14, fontWeight: 800, fontSize: 15,
                        background: loading ? "#ccc" : "#20C997", color: "#fff", border: "none",
                        cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 8px 28px #20C99744",
                    }}>
                        {loading ? "Creating account…" : "🚀 Create Teacher Account"}
                    </button>
                </form>
            </div>
        </div>
    );
}
