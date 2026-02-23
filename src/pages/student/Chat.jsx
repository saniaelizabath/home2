import { useState, useRef } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import useIsMobile from "../../hooks/useIsMobile";

const TEACHERS = [
    { id: 1, name: "Mr. Suresh Kumar", subject: "Accountancy", online: true, avatar: "S" },
    { id: 2, name: "Ms. Priya Sharma", subject: "Business Studies", online: false, avatar: "P" },
];

const INITIAL_MSGS = {
    1: [
        { from: "teacher", text: "Good morning! Do you have any doubts about today's topic?", time: "9:05 AM" },
        { from: "student", text: "Yes sir, I'm confused about the Goodwill valuation in the partnership chapter.", time: "9:08 AM" },
        { from: "teacher", text: "Great question! Let me explain. Goodwill is the excess purchase consideration over the net asset value...", time: "9:10 AM" },
    ],
    2: [
        { from: "teacher", text: "Hi! Feel free to ask any questions on Business Studies.", time: "Yesterday" },
    ],
};

export default function StudentChat() {
    const isMobile = useIsMobile(900);
    const [selected, setSelected] = useState(1);
    const [messages, setMessages] = useState(INITIAL_MSGS);
    const [input, setInput] = useState("");
    const [file, setFile] = useState(null);
    const fileRef = useRef();

    const send = () => {
        if (!input.trim() && !file) return;
        const msg = { from: "student", text: input || `📎 ${file.name}`, time: "Now", file: !!file };
        setMessages(p => ({ ...p, [selected]: [...(p[selected] ?? []), msg] }));
        setInput(""); setFile(null);
    };

    const teacher = TEACHERS.find(t => t.id === selected);

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Chat with Teachers</h1>
            <p style={{ color: "#888", marginBottom: 24 }}>Ask doubts and get personalised help</p>

            <div style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 20,
                height: isMobile ? "auto" : "calc(100vh - 200px)",
                minHeight: isMobile ? "auto" : 500,
            }}>
                {/* Teacher list */}
                <div style={{ width: isMobile ? "100%" : 260, background: "#fff", borderRadius: 20, padding: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", flexShrink: 0, overflowY: "auto", maxHeight: isMobile ? 260 : "none" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Your Teachers</div>
                    {TEACHERS.map(t => (
                        <div key={t.id} onClick={() => setSelected(t.id)} style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                            borderRadius: 14, cursor: "pointer", marginBottom: 6, transition: "all 0.2s",
                            background: selected === t.id ? "#E8EEFF" : "transparent",
                            border: selected === t.id ? "1.5px solid #3B5BDB" : "1.5px solid transparent",
                        }}>
                            <div style={{ position: "relative" }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#3B5BDB", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>{t.avatar}</div>
                                <div style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: t.online ? "#20C997" : "#ccc", border: "2px solid #fff" }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{t.name}</div>
                                <div style={{ fontSize: 11, color: "#888" }}>{t.subject}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chat panel */}
                <div style={{ flex: 1, background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: isMobile ? 420 : "auto" }}>
                    {/* Header */}
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#3B5BDB", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>{teacher?.avatar}</div>
                        <div>
                            <div style={{ fontWeight: 800, color: "#1a1a2e" }}>{teacher?.name}</div>
                            <div style={{ fontSize: 12, color: teacher?.online ? "#20C997" : "#aaa", fontWeight: 600 }}>{teacher?.online ? "● Online" : "● Offline"}</div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                        {(messages[selected] ?? []).map((msg, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: msg.from === "student" ? "flex-end" : "flex-start" }}>
                                <div style={{
                                    maxWidth: "70%", padding: "12px 18px", borderRadius: msg.from === "student" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                    background: msg.from === "student" ? "#3B5BDB" : "#f4f6fb",
                                    color: msg.from === "student" ? "#fff" : "#1a1a2e",
                                    fontSize: 14, lineHeight: 1.6, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                }}>
                                    {msg.text}
                                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: msg.from === "student" ? "right" : "left" }}>{msg.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 10, alignItems: "flex-end" }}>
                        {file && <div style={{ fontSize: 11, color: "#3B5BDB", fontWeight: 700, padding: "6px 12px", background: "#E8EEFF", borderRadius: 20 }}>📎 {file.name}</div>}
                        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                            placeholder="Type your doubt…" style={{
                                flex: 1, padding: "13px 18px", borderRadius: 30, border: "2px solid #eee",
                                fontSize: 14, outline: "none", fontFamily: "var(--font-body)",
                            }}
                            onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                            onBlur={e => e.target.style.border = "2px solid #eee"}
                        />
                        <button onClick={() => fileRef.current.click()} style={{ width: 44, height: 44, borderRadius: "50%", background: "#f0f2ff", border: "none", cursor: "pointer", fontSize: 18 }}>📎</button>
                        <input ref={fileRef} type="file" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
                        <button onClick={send} style={{ width: 44, height: 44, borderRadius: "50%", background: "#3B5BDB", border: "none", cursor: "pointer", color: "#fff", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
