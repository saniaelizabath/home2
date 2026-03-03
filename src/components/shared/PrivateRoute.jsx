import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * PrivateRoute — wraps any route that requires authentication.
 *
 * Props:
 *   role  — the required role string ("student" | "teacher" | "admin")
 *   children — the page/component to render when auth passes
 *
 * Behaviour:
 *   1. While Firebase is still resolving (authReady = false), show a spinner.
 *   2. If no user is logged in → redirect to /login?role=<role>
 *   3. If a user IS logged in but has the WRONG role → redirect to their dashboard.
 *   4. If role === "student" and status !== "active" → show the "not approved" screen.
 *   5. Otherwise, render children normally.
 */
export default function PrivateRoute({ role, children }) {
    const { user, role: userRole, authReady } = useAuth();

    // Still waiting for Firebase Auth to confirm session
    if (!authReady) {
        return (
            <div style={{
                minHeight: "100vh", display: "flex", alignItems: "center",
                justifyContent: "center", background: "linear-gradient(135deg, #0d1117 0%, #1a1a2e 100%)",
                fontFamily: "sans-serif",
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        border: "4px solid rgba(255,255,255,0.1)",
                        borderTop: "4px solid #4C6EF5",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 16px",
                    }} />
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Loading…</div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        );
    }

    // Not logged in → send to login for the requested portal
    if (!user) {
        return <Navigate to={`/login?role=${role}`} replace />;
    }

    // Logged in with wrong role → redirect to their own dashboard
    if (userRole && userRole !== role) {
        const dashMap = { student: "/student/dashboard", teacher: "/teacher/dashboard", admin: "/admin/dashboard" };
        return <Navigate to={dashMap[userRole] ?? "/"} replace />;
    }

    // Student approval gate — show blocked screen if not yet approved
    if (role === "student" && user.status !== "active") {
        return (
            <div style={{
                minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, #0d1117 0%, #1a1a2e 60%, #0b1a40 100%)",
                fontFamily: "sans-serif", padding: 24, position: "relative", overflow: "hidden",
            }}>
                {/* Subtle dot grid */}
                <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

                <div style={{
                    background: "#fff", borderRadius: 28, padding: "48px 36px", maxWidth: 440,
                    width: "100%", textAlign: "center", boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
                    position: "relative",
                }}>
                    {/* Lock icon */}
                    <div style={{
                        width: 88, height: 88, borderRadius: "50%",
                        background: "linear-gradient(135deg,#FFF9DB,#FFF0F0)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 44, margin: "0 auto 24px",
                        boxShadow: "0 8px 32px rgba(230,119,0,0.15)",
                    }}>
                        🔒
                    </div>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFF9DB", color: "#e67700", padding: "5px 14px", borderRadius: 30, fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
                        ⏳ Approval Pending
                    </div>

                    <h2 style={{ fontSize: 24, fontWeight: 900, color: "#1a1a2e", marginBottom: 12, lineHeight: 1.2 }}>
                        Account Not Approved Yet
                    </h2>
                    <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 28 }}>
                        You are not approved by the admin yet.<br />
                        Please contact your admin and they will enable your account.
                    </p>

                    <div style={{ background: "#F9FAFB", borderRadius: 16, padding: "18px 20px", marginBottom: 28, textAlign: "left" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Your Account Details</div>
                        <div style={{ fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>{user.name}</div>
                        <div style={{ fontSize: 13, color: "#6B7280" }}>{user.email}</div>
                    </div>

                    <button
                        onClick={() => {
                            // Clear session so they can log out cleanly
                            window.location.href = "/login?role=student";
                        }}
                        style={{
                            width: "100%", padding: 14, borderRadius: 14, fontWeight: 800, fontSize: 14,
                            background: "linear-gradient(135deg,#3B5BDB,#4c6ef5)", color: "#fff",
                            border: "none", cursor: "pointer", boxShadow: "0 8px 28px #3B5BDB44",
                        }}
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return children;
}
