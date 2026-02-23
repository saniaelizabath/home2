import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";

const PROFILE_ITEMS = [
  { key: "name", label: "Name", icon: "ID", color: "#20C997", bg: "#E6FCF5" },
  { key: "email", label: "Email", icon: "@", color: "#3B5BDB", bg: "#E8EEFF" },
  { key: "phone", label: "Phone", icon: "PH", color: "#e67700", bg: "#FFF9DB" },
  { key: "subject", label: "Subject", icon: "SB", color: "#7048e8", bg: "#F3F0FF" },
];

export default function TeacherProfile() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 30,
            fontWeight: 900,
            color: "#1a1a2e",
            marginBottom: 6,
          }}
        >
          Teacher Profile
        </h1>
        <p style={{ color: "#888", marginBottom: 26 }}>
          Personal profile and teaching information
        </p>

        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#20C997,#0fa174)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 900,
              fontSize: 32,
            }}
          >
            {(user?.name?.[0] ?? "T").toUpperCase()}
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: 28,
                lineHeight: 1.1,
                color: "#1a1a2e",
              }}
            >
              {user?.name ?? "Teacher"}
            </h2>
            <p style={{ margin: "8px 0 0", color: "#64748B", fontWeight: 600 }}>
              {user?.subject ?? "Subject not set"}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
            gap: 14,
          }}
        >
          {PROFILE_ITEMS.map((item) => (
            <div
              key={item.key}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: item.bg,
                  color: item.color,
                  fontWeight: 800,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                {item.icon}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#94A3B8",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 5,
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>
                {user?.[item.key] || "-"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
