import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../../hooks/useIsMobile";

const ROLES = [
    {
        key: "student",
        icon: "🎓",
        title: "Student",
        desc: "Access your classes, progress, assignments and more",
        accent: "#3B5BDB",
        light: "#E8EEFF",
        bg: "linear-gradient(135deg,#E8EEFF 0%,#c5d0ff 100%)",
    },
    {
        key: "teacher",
        icon: "👩‍🏫",
        title: "Teacher",
        desc: "Manage classes, content, evaluations and student chats",
        accent: "#20C997",
        light: "#E6FCF5",
        bg: "linear-gradient(135deg,#E6FCF5 0%,#b2eed9 100%)",
    },
    {
        key: "admin",
        icon: "🛡️",
        title: "Admin",
        desc: "Oversee students, teachers, schedules and reports",
        accent: "#FF6B6B",
        light: "#FFF0F0",
        bg: "linear-gradient(135deg,#FFF0F0 0%,#ffc2c2 100%)",
    },
];

export default function RoleSelectModal({ onClose }) {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(null);
    const isMobile = useIsMobile(900);

    const pick = (role, action) => {
        navigate(`/${action}?role=${role}`);
        onClose?.();
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(10,12,30,0.82)",
            backdropFilter: "blur(10px)",
            display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "center",
            padding: isMobile ? "14px" : "24px",
            animation: "fadeIn 0.25s ease",
        }}
            onClick={onClose}
        >
            <div style={{
                background: "#fff", borderRadius: 28,
                padding: isMobile ? "22px 16px" : "clamp(28px,5vw,52px)",
                maxWidth: 780, width: "100%",
                maxHeight: isMobile ? "94vh" : "90vh",
                overflowY: "auto",
                boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
                animation: "slideUp 0.3s cubic-bezier(.4,0,.2,1)",
            }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3B5BDB", marginBottom: 10 }}>
                        🎓 LedgerLearn Portal
                    </div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, color: "#1a1a2e", marginBottom: 8 }}>
                        Who are you?
                    </h2>
                    <p style={{ color: "#888", fontSize: 15 }}>
                        Choose your role to continue to the right portal
                    </p>
                </div>

                {/* Role cards */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
                    {ROLES.map(r => (
                        <div key={r.key}
                            onMouseEnter={() => setHovered(r.key)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                background: hovered === r.key ? r.bg : "#f8f9ff",
                                border: `2px solid ${hovered === r.key ? r.accent : "#eee"}`,
                                borderRadius: 20, padding: "28px 20px", textAlign: "center",
                                cursor: "pointer", transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                                transform: hovered === r.key ? "translateY(-6px)" : "none",
                                boxShadow: hovered === r.key ? `0 16px 40px ${r.accent}28` : "0 2px 12px rgba(0,0,0,0.05)",
                            }}
                        >
                            <div style={{ fontSize: 44, marginBottom: 12 }}>{r.icon}</div>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#1a1a2e", marginBottom: 8 }}>{r.title}</div>
                            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 20 }}>{r.desc}</p>
                            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                                <button onClick={() => pick(r.key, "login")} style={{
                                    padding: "8px 18px", borderRadius: 30, fontSize: 13, fontWeight: 700,
                                    background: r.accent, color: "#fff", border: "none", cursor: "pointer",
                                    transition: "opacity 0.2s",
                                }}>Login</button>
                                <button onClick={() => pick(r.key, "signup")} style={{
                                    padding: "8px 18px", borderRadius: 30, fontSize: 13, fontWeight: 700,
                                    background: "transparent", color: r.accent,
                                    border: `2px solid ${r.accent}`, cursor: "pointer",
                                    transition: "opacity 0.2s",
                                }}>Sign Up</button>
                            </div>
                        </div>
                    ))}
                </div>

                <button onClick={onClose} style={{
                    display: "block", margin: "0 auto",
                    background: "none", border: "none", color: "#aaa",
                    cursor: "pointer", fontSize: 14,
                }}>✕ Close</button>
            </div>
        </div>
    );
}
