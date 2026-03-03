import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
    collection, query, where, getDocs, addDoc, updateDoc, deleteDoc,
    doc, serverTimestamp, orderBy,
} from "firebase/firestore";
import useIsMobile from "../../hooks/useIsMobile";

const PRIORITIES = ["🔴 High", "🟡 Medium", "🟢 Low"];
const DIFFICULTIES = ["Hard", "Medium", "Easy"];
const ENERGY_LEVELS = ["Low", "Medium", "High"];

function generateScheduleLocally(tasks, hours, energy) {
    const factor = energy === "High" ? 1 : energy === "Low" ? 0.7 : 0.85;
    const available = Number(hours) * factor;
    const sorted = [...tasks].sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority));
    let used = 0;
    const result = [];
    let time = 9; // start at 9 AM
    for (const t of sorted) {
        const dur = Number(t.timeRequired) || 0.5;
        if (used + dur > available) continue;
        const startH = Math.floor(time), startM = (time % 1) * 60;
        const endTime = time + dur;
        const endH = Math.floor(endTime), endM = (endTime % 1) * 60;
        result.push({
            taskName: t.taskName || t.name,
            startTime: `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
            endTime: `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`,
            priority: t.priority,
            reason: `${t.priority} priority, ${t.difficulty || "Medium"} difficulty`,
        });
        used += dur;
        time = endTime + 0.25; // 15 min break
    }
    return result;
}

export default function TaskScheduler() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ taskName: "", priority: "🟡 Medium", difficulty: "Medium", timeRequired: "" });
    const [mood, setMood] = useState({ energy: "Medium", hours: "4" });
    const [schedule, setSchedule] = useState(null);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (!user?.uid) { setLoading(false); return; }
        getDocs(query(collection(db, "tasks"),
            where("studentId", "==", user.uid),
            where("completed", "==", false),
            orderBy("createdAt", "desc")))
            .then(snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user?.uid]);

    const addTask = async () => {
        if (!form.taskName.trim() || !user?.uid) return;
        setAdding(true);
        try {
            const ref = await addDoc(collection(db, "tasks"), {
                ...form, studentId: user.uid,
                completed: false, createdAt: serverTimestamp(),
            });
            setTasks(p => [{ id: ref.id, ...form, completed: false }, ...p]);
            setForm({ taskName: "", priority: "🟡 Medium", difficulty: "Medium", timeRequired: "" });
        } catch (e) { console.error(e); }
        finally { setAdding(false); }
    };

    const toggleDone = async (task) => {
        try {
            await updateDoc(doc(db, "tasks", task.id), { completed: true });
            setTasks(p => p.filter(t => t.id !== task.id));
        } catch (e) { console.error(e); }
    };

    const generateSchedule = () => {
        const result = generateScheduleLocally(tasks, mood.hours, mood.energy);
        setSchedule(result);
    };

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
                        <input value={form.taskName} onChange={e => setForm(p => ({ ...p, taskName: e.target.value }))}
                            placeholder="e.g. Solve journal entries" style={inputStyle}
                            onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                            onBlur={e => e.target.style.border = "2px solid #eee"} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
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
                        <input type="number" min="0.5" step="0.5" value={form.timeRequired}
                            onChange={e => setForm(p => ({ ...p, timeRequired: e.target.value }))}
                            placeholder="e.g. 1.5" style={inputStyle}
                            onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                            onBlur={e => e.target.style.border = "2px solid #eee"} />
                    </div>
                    <button onClick={addTask} disabled={adding} style={{ width: "100%", padding: "13px", borderRadius: 12, background: "#3B5BDB", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", opacity: adding ? 0.7 : 1 }}>
                        {adding ? "Adding…" : "Add Task"}
                    </button>
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
                        <input type="number" min="1" max="12" value={mood.hours} onChange={e => setMood(p => ({ ...p, hours: e.target.value }))}
                            placeholder="e.g. 4" style={inputStyle}
                            onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                            onBlur={e => e.target.style.border = "2px solid #eee"} />
                    </div>
                    <button onClick={generateSchedule} style={{ width: "100%", padding: "13px", borderRadius: 12, background: "linear-gradient(90deg,#20C997,#3B5BDB)", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer" }}>
                        ⚡ Generate Today's Schedule
                    </button>

                    {schedule !== null && (
                        <div style={{ marginTop: 18, background: "#E6FCF5", borderRadius: 14, padding: 16 }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: "#20C997", marginBottom: 10 }}>📋 Your Optimised Schedule</div>
                            {schedule.length === 0
                                ? <p style={{ color: "#888", fontSize: 13 }}>No tasks fit in your available hours. Add more tasks or increase study time.</p>
                                : schedule.map((s, i) => (
                                    <div key={i} style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 600, padding: "8px 0", borderBottom: i < schedule.length - 1 ? "1px dashed #b2eed9" : "none" }}>
                                        <span style={{ color: "#20C997", fontWeight: 800 }}>{s.startTime}–{s.endTime}</span> · {s.taskName}
                                        <div style={{ fontSize: 11, color: "#888", fontWeight: 400 }}>{s.reason}</div>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* Task List */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>✅ Pending Tasks</div>
                {loading && <div style={{ color: "#aaa", fontSize: 14 }}>Loading tasks…</div>}
                {!loading && tasks.length === 0 && <p style={{ color: "#aaa", fontSize: 14 }}>No pending tasks. Add one above!</p>}
                {tasks.map(t => (
                    <div key={t.id} onClick={() => toggleDone(t)} style={{
                        display: "flex", alignItems: "center", gap: 16, padding: "14px 16px",
                        borderRadius: 14, marginBottom: 8, cursor: "pointer", transition: "all 0.2s",
                        background: "#fafbff", border: "1.5px solid #eee",
                    }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: "#fff", border: "2.5px solid #ddd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }} />
                        <div style={{ flex: 1, fontWeight: 600, color: "#1a1a2e" }}>{t.taskName || t.name}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{t.priority}</div>
                        <div style={{ fontSize: 12, color: "#aaa" }}>{t.difficulty}</div>
                        <div style={{ fontSize: 12, color: "#3B5BDB", fontWeight: 700 }}>{t.timeRequired}h</div>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}
