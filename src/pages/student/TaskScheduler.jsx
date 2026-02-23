import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import useIsMobile from "../../hooks/useIsMobile";

const PRIORITIES = ["🔴 High", "🟡 Medium", "🟢 Low"];
const DIFFICULTIES = ["Hard", "Medium", "Easy"];
const ENERGY_LEVELS = ["Low", "Medium", "High"];

const generateSchedule = (tasks, hours, energy) => {
    if (!tasks.length) return [];
    const sorted = [...tasks].sort((a, b) => {
        const pa = PRIORITIES.indexOf(a.priority), pb = PRIORITIES.indexOf(b.priority);
        return pa - pb;
    });
    let remaining = hours;
    return sorted.filter(t => {
        if (remaining <= 0) return false;
        remaining -= Number(t.time) || 0.5;
        return true;
    });
};

export default function TaskScheduler() {
    const isMobile = useIsMobile(900);
    const [tasks, setTasks] = useState([
        { id: 1, name: "Solve 10 journal entries", priority: "🔴 High", difficulty: "Hard", time: 1, done: false },
        { id: 2, name: "Read Partnership chapter", priority: "🟡 Medium", difficulty: "Medium", time: 0.5, done: false },
    ]);
    const [form, setForm] = useState({ name: "", priority: "🟡 Medium", difficulty: "Medium", time: "" });
    const [mood, setMood] = useState({ energy: "Medium", hours: "4" });
    const [schedule, setSchedule] = useState(null);

    const addTask = () => {
        if (!form.name) return;
        setTasks(p => [...p, { ...form, id: Date.now(), done: false }]);
        setForm({ name: "", priority: "🟡 Medium", difficulty: "Medium", time: "" });
    };

    const toggleDone = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));

    const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid #eee", fontSize: 14, outline: "none", background: "#fafbff", boxSizing: "border-box", fontFamily: "var(--font-body)" };

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Task Scheduler</h1>
            <p style={{ color: "#888", marginBottom: 28 }}>Plan your study session with AI-assisted scheduling</p>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, marginBottom: 24 }}>
                {/* Add Task */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>➕ Add Task</div>
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>TASK NAME</label>
                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Solve journal entries" style={inputStyle}
                            onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                            onBlur={e => e.target.style.border = "2px solid #eee"} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>PRIORITY</label>
                            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ ...inputStyle, appearance: "none" }}>
                                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>DIFFICULTY</label>
                            <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} style={{ ...inputStyle, appearance: "none" }}>
                                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>ESTIMATED TIME (hours)</label>
                        <input type="number" min="0.5" step="0.5" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} placeholder="e.g. 1.5" style={inputStyle}
                            onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                            onBlur={e => e.target.style.border = "2px solid #eee"} />
                    </div>
                    <button onClick={addTask} style={{ width: "100%", padding: "13px", borderRadius: 12, background: "#3B5BDB", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer" }}>Add Task</button>
                </div>

                {/* Mood Check */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>😊 Mood Check</div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10 }}>ENERGY LEVEL</label>
                        <div style={{ display: "flex", gap: 10 }}>
                            {ENERGY_LEVELS.map((e, i) => {
                                const colors = ["#FFD43B", "#20C997", "#3B5BDB"];
                                return (
                                    <button key={e} onClick={() => setMood(p => ({ ...p, energy: e }))} style={{
                                        flex: 1, padding: "12px 0", borderRadius: 12, fontWeight: 700, fontSize: 14,
                                        background: mood.energy === e ? colors[i] : "#f8f9ff",
                                        color: mood.energy === e ? (e === "Low" ? "#333" : "#fff") : "#555",
                                        border: "2px solid " + (mood.energy === e ? colors[i] : "#eee"), cursor: "pointer", transition: "all 0.2s",
                                    }}>{e}</button>
                                );
                            })}
                        </div>
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>PLANNED STUDY HOURS</label>
                        <input type="number" min="1" max="12" value={mood.hours} onChange={e => setMood(p => ({ ...p, hours: e.target.value }))} placeholder="e.g. 4" style={inputStyle}
                            onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                            onBlur={e => e.target.style.border = "2px solid #eee"} />
                    </div>
                    <button onClick={() => setSchedule(generateSchedule(tasks, Number(mood.hours), mood.energy))} style={{ width: "100%", padding: "13px", borderRadius: 12, background: "linear-gradient(90deg,#20C997,#3B5BDB)", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer" }}>
                        ⚡ Generate Today's Schedule
                    </button>

                    {schedule && (
                        <div style={{ marginTop: 18, background: "#E6FCF5", borderRadius: 14, padding: 16 }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: "#20C997", marginBottom: 10 }}>📋 Your Optimised Schedule</div>
                            {schedule.length === 0
                                ? <p style={{ color: "#888", fontSize: 13 }}>No tasks fit within your available hours. Add more or increase study time.</p>
                                : schedule.map((t, i) => (
                                    <div key={i} style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 600, padding: "6px 0", borderBottom: i < schedule.length - 1 ? "1px dashed #b2eed9" : "none" }}>
                                        {i + 1}. {t.name} <span style={{ color: "#20C997" }}>({t.time}h)</span>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* Task List */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>✅ Task List</div>
                {tasks.length === 0 && <p style={{ color: "#aaa", fontSize: 14 }}>No tasks yet. Add one above!</p>}
                {tasks.map(t => (
                    <div key={t.id} onClick={() => toggleDone(t.id)} style={{
                        display: "flex", alignItems: "center", gap: 16, padding: "14px 16px",
                        borderRadius: 14, marginBottom: 8, cursor: "pointer", transition: "all 0.2s",
                        background: t.done ? "#f8fffe" : "#fafbff",
                        border: t.done ? "1.5px solid #b2eed9" : "1.5px solid #eee",
                    }}>
                        <div style={{
                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                            background: t.done ? "#20C997" : "#fff", border: "2.5px solid " + (t.done ? "#20C997" : "#ddd"),
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff",
                        }}>{t.done ? "✓" : ""}</div>
                        <div style={{ flex: 1, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#aaa" : "#1a1a2e", fontWeight: 600 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{t.priority}</div>
                        <div style={{ fontSize: 12, color: "#aaa" }}>{t.difficulty}</div>
                        <div style={{ fontSize: 12, color: "#3B5BDB", fontWeight: 700 }}>{t.time}h</div>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}
