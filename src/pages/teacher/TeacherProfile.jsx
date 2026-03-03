import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function TeacherProfile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tid = user?.id || user?.uid;
    if (!tid) { setLoading(false); return; }
    getDoc(doc(db, "teachers", tid))
      .then(snap => {
        if (snap.exists()) {
          setProfile(snap.data());
          setForm(snap.data());
        } else {
          setProfile(user);
          setForm(user);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id, user?.uid, user]);

  const save = async () => {
    const tid = user?.id || user?.uid;
    if (!tid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "teachers", tid), {
        name: form.name,
        phone: form.phone,
        subject: form.subject,
        email: form.email,
      });
      setProfile(f => ({ ...f, ...form }));
      // Also update the local storage user context so header shows updated name
      if (login && user) {
        login({ ...user, ...form });
      }
      setEditing(false);
    } catch (e) {
      console.error(e);
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const data = profile ?? user ?? {};

  if (loading) {
    return <DashboardLayout><div style={{ padding: 40, color: "#aaa" }}>Loading profile…</div></DashboardLayout>;
  }

  const fieldStyle = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid #eee", fontSize: 14, outline: "none", background: "#fafbff", boxSizing: "border-box", fontFamily: "var(--font-body)" };

  return (
    <DashboardLayout>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>My Profile</h1>
      <p style={{ color: "#888", marginBottom: 32 }}>Your teacher account details</p>

      <div style={{ maxWidth: 600 }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 24 }}>
          {/* Avatar + name */}
          <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 28 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#20C997,#3B5BDB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#fff", fontWeight: 900, flexShrink: 0 }}>
              {(data.name || "T")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#1a1a2e" }}>{data.name}</div>
              <div style={{ fontSize: 13, color: "#888" }}>{data.subject || "Subject not set"}</div>
            </div>
          </div>

          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Full Name", key: "name" },
                { label: "Email", key: "email", type: "email" },
                { label: "Phone", key: "phone" },
                { label: "Subject", key: "subject" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>{f.label.toUpperCase()}</label>
                  <input type={f.type || "text"} value={form[f.key] || ""}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={fieldStyle}
                    onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                    onBlur={e => e.target.style.border = "2px solid #eee"} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, padding: "13px", borderRadius: 12, background: "#3B5BDB", color: "#fff", fontWeight: 800, border: "none", cursor: "pointer" }}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "13px", borderRadius: 12, background: "#f0f2ff", color: "#3B5BDB", fontWeight: 800, border: "none", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              {[
                { label: "Email", value: data.email, icon: "✉️" },
                { label: "Phone", value: data.phone, icon: "📱" },
                { label: "Subject", value: data.subject, icon: "📚" },
              ].map(f => f.value && (
                <div key={f.label} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid #f5f5f5", alignItems: "center" }}>
                  <span style={{ fontSize: 20 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: "#aaa", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{f.label}</div>
                    <div style={{ fontWeight: 700, color: "#1a1a2e", marginTop: 2 }}>{f.value}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => setEditing(true)} style={{ marginTop: 24, padding: "12px 28px", borderRadius: 30, background: "#3B5BDB", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
                ✏️ Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
