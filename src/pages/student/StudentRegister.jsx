import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useIsMobile from "../../hooks/useIsMobile";

const COURSES = ["Accountancy", "Business Studies", "Both Subjects"];
const CLASSES = ["Class 11", "Class 12"];
const SUBJECTS = ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"];
const STUDY_TIMES = ["Morning", "Afternoon", "Night"];
const STUDY_PLANS = ["Difficult → Easy", "Easy → Difficult", "Priority-Based"];
const FOCUS_LEVELS = ["Low", "Medium", "High"];

function StepDot({ active, done, n }) {
    return (
        <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: done ? "#20C997" : active ? "#3B5BDB" : "#eee",
            color: done ? "#fff" : active ? "#fff" : "#bbb",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14, transition: "all 0.3s", flexShrink: 0,
        }}>{done ? "✓" : n}</div>
    );
}

export default function StudentRegister() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const isMobile = useIsMobile(900);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: "", email: "", phone: "", parentEmail: "", parentPhone: "",
        course: "", class: "",
        favSubject: "", studyTime: "", dailyHours: "", studyPlan: "", focusLevel: "",
        currentAggregate: "", targetAggregate: "",
    });

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const inputStyle = {
        width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 15,
        border: "2px solid #eee", outline: "none", background: "#fafbff",
        fontFamily: "var(--font-body)", boxSizing: "border-box", transition: "border 0.2s",
    };

    const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 7 };

    const selectStyle = { ...inputStyle, cursor: "pointer", appearance: "none" };

    const Field = ({ label, k, type = "text", placeholder = "" }) => (
        <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>{label}</label>
            <input type={type} value={form[k]} onChange={e => set(k, e.target.value)}
                placeholder={placeholder} style={inputStyle}
                onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                onBlur={e => e.target.style.border = "2px solid #eee"}
            />
        </div>
    );

    const handleSubmit = () => {
        login({ name: form.name, email: form.email, role: "student", ...form });
        navigate("/student/dashboard");
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg,#0d1117 0%,#1a1a2e 60%,#0b1a40 100%)",
            padding: "32px 24px", fontFamily: "var(--font-body)",
        }}>
            <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

            <div style={{ background: "#fff", borderRadius: 28, padding: "clamp(28px,5vw,52px)", maxWidth: 560, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
                {/* Step indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
                    <StepDot n={1} active={step === 1} done={step > 1} />
                    <div style={{ flex: 1, height: 3, background: step > 1 ? "#20C997" : "#eee", transition: "background 0.4s" }} />
                    <StepDot n={2} active={step === 2} done={step > 2} />
                </div>

                {step === 1 && (
                    <>
                        <div style={{ background: "#E8EEFF", color: "#3B5BDB", display: "inline-flex", gap: 8, alignItems: "center", padding: "7px 18px", borderRadius: 30, fontWeight: 700, fontSize: 13, marginBottom: 24 }}>
                            🎓 Step 1 of 2 — Basic Details
                        </div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, color: "#1a1a2e", marginBottom: 28 }}>Create Your Account</h2>

                        <Field label="Full Name" k="name" placeholder="Riya Mehta" />
                        <Field label="Email Address" k="email" type="email" placeholder="riya@example.com" />
                        <Field label="Phone Number" k="phone" type="tel" placeholder="+91 9876543210" />
                        <Field label="Parent's Email" k="parentEmail" type="email" placeholder="parent@example.com" />
                        <Field label="Parent's Phone Number" k="parentPhone" type="tel" placeholder="+91 9876543211" />

                        <div style={{ marginBottom: 18 }}>
                            <label style={labelStyle}>Course Planning to Enrol</label>
                            <select value={form.course} onChange={e => set("course", e.target.value)} style={selectStyle}>
                                <option value="">Select course…</option>
                                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div style={{ marginBottom: 28 }}>
                            <label style={labelStyle}>Class</label>
                            <select value={form.class} onChange={e => set("class", e.target.value)} style={selectStyle}>
                                <option value="">Select class…</option>
                                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <button onClick={() => setStep(2)} style={{
                            width: "100%", padding: "15px", borderRadius: 14, fontWeight: 800, fontSize: 15,
                            background: "#3B5BDB", color: "#fff", border: "none", cursor: "pointer",
                            boxShadow: "0 8px 28px #3B5BDB44",
                        }}>Next → Learning Preferences</button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div style={{ background: "#E8EEFF", color: "#3B5BDB", display: "inline-flex", gap: 8, alignItems: "center", padding: "7px 18px", borderRadius: 30, fontWeight: 700, fontSize: 13, marginBottom: 24 }}>
                            📚 Step 2 of 2 — Learning Preferences
                        </div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, color: "#1a1a2e", marginBottom: 28 }}>Personalise Your Learning</h2>

                        <div style={{ marginBottom: 18 }}>
                            <label style={labelStyle}>Favourite Subject</label>
                            <select value={form.favSubject} onChange={e => set("favSubject", e.target.value)} style={selectStyle}>
                                <option value="">Select…</option>
                                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: 18 }}>
                            <label style={labelStyle}>Preferred Study Time</label>
                            <div style={{ display: "flex", gap: 10 }}>
                                {STUDY_TIMES.map(t => (
                                    <button key={t} onClick={() => set("studyTime", t)} style={{
                                        flex: 1, padding: "12px 0", borderRadius: 12, fontWeight: 700, fontSize: 14,
                                        background: form.studyTime === t ? "#3B5BDB" : "#f0f2ff",
                                        color: form.studyTime === t ? "#fff" : "#3B5BDB",
                                        border: "2px solid " + (form.studyTime === t ? "#3B5BDB" : "#dde"),
                                        cursor: "pointer", transition: "all 0.2s",
                                    }}>{t}</button>
                                ))}
                            </div>
                        </div>

                        <Field label="Avg Hours Spent Daily on Learning" k="dailyHours" type="number" placeholder="e.g. 3" />

                        <div style={{ marginBottom: 18 }}>
                            <label style={labelStyle}>Study Plan Preference</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {STUDY_PLANS.map(p => (
                                    <button key={p} onClick={() => set("studyPlan", p)} style={{
                                        padding: "12px 16px", borderRadius: 12, textAlign: "left", fontWeight: 700, fontSize: 14,
                                        background: form.studyPlan === p ? "#E8EEFF" : "#f8f9ff",
                                        color: form.studyPlan === p ? "#3B5BDB" : "#555",
                                        border: "2px solid " + (form.studyPlan === p ? "#3B5BDB" : "#eee"),
                                        cursor: "pointer", transition: "all 0.2s",
                                    }}>{form.studyPlan === p ? "✓ " : ""}{p}</button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: 18 }}>
                            <label style={labelStyle}>Focus Level</label>
                            <div style={{ display: "flex", gap: 10 }}>
                                {FOCUS_LEVELS.map((f, i) => {
                                    const colors = ["#FFD43B", "#20C997", "#3B5BDB"];
                                    return (
                                        <button key={f} onClick={() => set("focusLevel", f)} style={{
                                            flex: 1, padding: "12px 0", borderRadius: 12, fontWeight: 700, fontSize: 14,
                                            background: form.focusLevel === f ? colors[i] : "#f8f9ff",
                                            color: form.focusLevel === f ? (f === "Low" ? "#333" : "#fff") : "#555",
                                            border: "2px solid " + (form.focusLevel === f ? colors[i] : "#eee"),
                                            cursor: "pointer", transition: "all 0.2s",
                                        }}>{f}</button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 28 }}>
                            <div>
                                <label style={labelStyle}>Current Average (%)</label>
                                <input type="number" value={form.currentAggregate} onChange={e => set("currentAggregate", e.target.value)}
                                    placeholder="e.g. 72" style={inputStyle} min="0" max="100"
                                    onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                                    onBlur={e => e.target.style.border = "2px solid #eee"} />
                            </div>
                            <div>
                                <label style={labelStyle}>Target Aggregate (%)</label>
                                <input type="number" value={form.targetAggregate} onChange={e => set("targetAggregate", e.target.value)}
                                    placeholder="e.g. 90" style={inputStyle} min="0" max="100"
                                    onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                                    onBlur={e => e.target.style.border = "2px solid #eee"} />
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={() => setStep(1)} style={{
                                flex: 1, padding: "15px", borderRadius: 14, fontWeight: 700, fontSize: 15,
                                background: "#f0f2ff", color: "#3B5BDB", border: "2px solid #dde", cursor: "pointer",
                            }}>← Back</button>
                            <button onClick={handleSubmit} style={{
                                flex: 2, padding: "15px", borderRadius: 14, fontWeight: 800, fontSize: 15,
                                background: "#3B5BDB", color: "#fff", border: "none", cursor: "pointer",
                                boxShadow: "0 8px 28px #3B5BDB44",
                            }}>🚀 Create Student Account</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
