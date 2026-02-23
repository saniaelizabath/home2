import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import useIsMobile from "../../hooks/useIsMobile";

const STUDENTS = [
    { id: 1, name: "Riya Mehta", class: "Class 12", online: true, avatar: "R" },
    { id: 2, name: "Aditya Sharma", class: "Class 11", online: true, avatar: "A" },
    { id: 3, name: "Priya Nair", class: "Class 12", online: false, avatar: "P" },
    { id: 4, name: "Arjun Verma", class: "Class 11", online: false, avatar: "V" },
];

const INITIAL_MSGS = {
    1: [
        { from: "student", text: "Sir, I have a doubt in partnership P&L account.", time: "10:05 AM" },
        { from: "teacher", text: "Sure Riya, please share the question.", time: "10:07 AM" },
    ],
    2: [{ from: "student", text: "When is the next test sir?", time: "Yesterday" }],
    3: [], 4: [],
};

export default function TeacherChat() {
    const isMobile = useIsMobile(900);
    const [selected, setSelected] = useState(1);
    const [messages, setMessages] = useState(INITIAL_MSGS);
    const [input, setInput] = useState("");

    const send = () => {
        if (!input.trim()) return;
        setMessages(p => ({ ...p, [selected]: [...(p[selected] ?? []), { from: "teacher", text: input, time: "Now" }] }));
        setInput("");
    };

    const student = STUDENTS.find(s => s.id === selected);

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Student Chat</h1>
            <p style={{ color: "#888", marginBottom: 24 }}>One-to-one chat with your students</p>

            <div style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 20,
                height: isMobile ? "auto" : "calc(100vh - 210px)",
                minHeight: isMobile ? "auto" : 480,
            }}>
                {/* Student list */}
                <div style={{ width: isMobile ? "100%" : 260, background: "#fff", borderRadius: 20, padding: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", flexShrink: 0, overflowY: "auto", maxHeight: isMobile ? 260 : "none" }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Students</div>
                    {STUDENTS.map(s => (
                        <div key={s.id} onClick={() => setSelected(s.id)} style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                            borderRadius: 14, cursor: "pointer", marginBottom: 6, transition: "all 0.2s",
                            background: selected === s.id ? "#E6FCF5" : "transparent",
                            border: selected === s.id ? "1.5px solid #20C997" : "1.5px solid transparent",
                        }}>
                            <div style={{ position: "relative" }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#20C997", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>{s.avatar}</div>
                                <div style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: s.online ? "#20C997" : "#ccc", border: "2px solid #fff" }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: "#888" }}>{s.class}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chat */}
                <div style={{ flex: 1, background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: isMobile ? 420 : "auto" }}>
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#20C997", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>{student?.avatar}</div>
                        <div>
                            <div style={{ fontWeight: 800, color: "#1a1a2e" }}>{student?.name}</div>
                            <div style={{ fontSize: 12, color: student?.online ? "#20C997" : "#aaa", fontWeight: 600 }}>{student?.online ? "● Online" : "● Offline"}</div>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                        {(messages[selected] ?? []).map((msg, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: msg.from === "teacher" ? "flex-end" : "flex-start" }}>
                                <div style={{
                                    maxWidth: "70%", padding: "12px 18px",
                                    borderRadius: msg.from === "teacher" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                    background: msg.from === "teacher" ? "#20C997" : "#f4f6fb",
                                    color: msg.from === "teacher" ? "#fff" : "#1a1a2e",
                                    fontSize: 14, lineHeight: 1.6,
                                }}>
                                    {msg.text}
                                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: msg.from === "teacher" ? "right" : "left" }}>{msg.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 10 }}>
                        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                            placeholder="Type a message…" style={{
                                flex: 1, padding: "13px 18px", borderRadius: 30, border: "2px solid #eee",
                                fontSize: 14, outline: "none", fontFamily: "var(--font-body)",
                            }}
                            onFocus={e => e.target.style.border = "2px solid #20C997"}
                            onBlur={e => e.target.style.border = "2px solid #eee"}
                        />
                        <button onClick={send} style={{ width: 44, height: 44, borderRadius: "50%", background: "#20C997", border: "none", cursor: "pointer", color: "#fff", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
