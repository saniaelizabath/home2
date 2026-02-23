import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ROLE_META = {
    student: { icon: "🎓", accent: "#3B5BDB", label: "Student", light: "#E8EEFF" },
    teacher: { icon: "👩‍🏫", accent: "#20C997", label: "Teacher", light: "#E6FCF5" },
    admin: { icon: "🛡️", accent: "#FF6B6B", label: "Admin", light: "#FFF0F0" },
};

const ROLE_REDIRECT = {
    student: "/student/dashboard",
    teacher: "/teacher/dashboard",
    admin: "/admin/dashboard",
};

export default function LoginPage() {
    const [params] = useSearchParams();
    const role = params.get("role") ?? "student";
    const meta = ROLE_META[role] ?? ROLE_META.student;
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = e => {
        e.preventDefault();
        if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
        setError("");
        setLoading(true);
        // Simulate auth — replace with real API call
        setTimeout(() => {
            login({ name: form.email.split("@")[0], email: form.email, role });
            navigate(ROLE_REDIRECT[role]);
        }, 900);
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #0d1117 0%, #1a1a2e 60%, #0b1a40 100%)",
            padding: "24px", fontFamily: "var(--font-body)",
        }}>
            {/* Background dots */}
            <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

            <div style={{
                background: "#fff", borderRadius: 28,
                padding: "clamp(32px,5vw,56px)", maxWidth: 440, width: "100%",
                boxShadow: "0 32px 80px rgba(0,0,0,0.5)", position: "relative",
                animation: "slideUp 0.35s cubic-bezier(.4,0,.2,1)",
            }}>
                {/* Role badge */}
                <div style={{
                    background: meta.light, color: meta.accent,
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 20px", borderRadius: 30, fontSize: 13, fontWeight: 700,
                    marginBottom: 28, letterSpacing: "0.06em",
                }}>
                    {meta.icon} {meta.label} Login
                </div>

                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>
                    Welcome back
                </h1>
                <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>
                    Sign in to access your {meta.label.toLowerCase()} portal
                </p>

                {error && (
                    <div style={{ background: "#FFF0F0", color: "#FF6B6B", border: "1px solid #ffc2c2", borderRadius: 12, padding: "12px 16px", fontSize: 14, marginBottom: 20 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {["email", "password"].map(field => (
                        <div key={field} style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 8, textTransform: "capitalize" }}>{field}</label>
                            <input
                                name={field} type={field} value={form[field]} onChange={handleChange}
                                placeholder={field === "email" ? "you@example.com" : "••••••••"}
                                style={{
                                    width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15,
                                    border: `2px solid #eee`, outline: "none", transition: "border 0.2s",
                                    background: "#fafbff", fontFamily: "var(--font-body)", boxSizing: "border-box",
                                }}
                                onFocus={e => e.target.style.border = `2px solid ${meta.accent}`}
                                onBlur={e => e.target.style.border = "2px solid #eee"}
                            />
                        </div>
                    ))}

                    <button type="submit" disabled={loading} style={{
                        width: "100%", padding: "16px", borderRadius: 14, fontSize: 15, fontWeight: 800,
                        background: loading ? "#ccc" : meta.accent, color: "#fff", border: "none",
                        cursor: loading ? "not-allowed" : "pointer", marginTop: 8,
                        transition: "all 0.2s", boxShadow: `0 8px 28px ${meta.accent}44`,
                    }}
                        onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
                        onMouseLeave={e => e.currentTarget.style.transform = "none"}
                    >
                        {loading ? "Signing in…" : `Sign in as ${meta.label} →`}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#888" }}>
                    Don't have an account?{" "}
                    <Link to={`/signup?role=${role}`} style={{ color: meta.accent, fontWeight: 700, textDecoration: "none" }}>Sign up</Link>
                </p>
                <p style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: "#bbb" }}>
                    <Link to="/" style={{ color: "#bbb", textDecoration: "none" }}>← Back to home</Link>
                </p>
            </div>
        </div>
    );
}
