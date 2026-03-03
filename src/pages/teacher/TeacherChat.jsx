import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebase";
import {
    collection, query, where, orderBy, onSnapshot,
    addDoc, getDocs, serverTimestamp, doc, writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import useIsMobile from "../../hooks/useIsMobile";

export default function TeacherChat() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const [students, setStudents] = useState([]);
    const [chats, setChats] = useState({});
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [file, setFile] = useState(null);
    const [sending, setSending] = useState(false);
    const fileRef = useRef();
    const bottomRef = useRef();

    // Fetch students assigned to this teacher's courses
    useEffect(() => {
        if (!user?.uid) return;
        getDocs(query(collection(db, "students"))).then(snap => {
            setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, [user?.uid]);

    // Existing chats for this teacher
    useEffect(() => {
        if (!user?.uid) return;
        getDocs(query(collection(db, "chats"), where("participants", "array-contains", user.uid)))
            .then(snap => {
                const map = {};
                snap.docs.forEach(d => {
                    const data = d.data();
                    const student = data.participants.find(p => p !== user.uid);
                    if (student) map[student] = d.id;
                });
                setChats(map);
            });
    }, [user?.uid]);

    // Real-time messages
    useEffect(() => {
        const chatId = selectedStudentId ? chats[selectedStudentId] : null;
        if (!chatId) { setMessages([]); return; }
        const q = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("timestamp", "asc"));
        const unsub = onSnapshot(q, async snap => {
            setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            const batch = writeBatch(db);
            snap.docs.forEach(d => {
                if (d.data().receiverId === user.uid && !d.data().read)
                    batch.update(doc(db, "messages", d.id), { read: true });
            });
            await batch.commit();
        });
        return () => unsub();
    }, [selectedStudentId, chats, user?.uid]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const getOrCreateChat = async (studentId) => {
        if (chats[studentId]) return chats[studentId];
        const ref = await addDoc(collection(db, "chats"), { participants: [user.uid, studentId], createdAt: serverTimestamp() });
        setChats(p => ({ ...p, [studentId]: ref.id }));
        return ref.id;
    };

    const send = async () => {
        if (!input.trim() && !file) return;
        setSending(true);
        try {
            const chatId = await getOrCreateChat(selectedStudentId);
            let fileURL = null, fileName = null;
            if (file) {
                const storageRef = ref(storage, `chats/${chatId}/${file.name}`);
                fileURL = await getDownloadURL((await uploadBytes(storageRef, file)).ref);
                fileName = file.name;
            }
            await addDoc(collection(db, "messages"), {
                chatId, senderId: user.uid, receiverId: selectedStudentId,
                text: input.trim() || null, fileURL, fileName,
                timestamp: serverTimestamp(), read: false,
            });
            setInput(""); setFile(null);
        } catch (e) { console.error(e); }
        finally { setSending(false); }
    };

    const formatTime = ts => {
        if (!ts) return "";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Student Chat</h1>
            <p style={{ color: "#888", marginBottom: 24 }}>Communicate with your students</p>

            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 20, height: isMobile ? "auto" : "calc(100vh - 200px)", minHeight: 500 }}>
                {/* Student list */}
                <div style={{ width: isMobile ? "100%" : 260, background: "#fff", borderRadius: 20, padding: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", flexShrink: 0, overflowY: "auto", maxHeight: isMobile ? 260 : "none" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Students</div>
                    {students.length === 0 && <div style={{ color: "#aaa", fontSize: 13 }}>No students enrolled yet.</div>}
                    {students.map(s => (
                        <div key={s.id} onClick={() => setSelectedStudentId(s.id)} style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                            borderRadius: 14, cursor: "pointer", marginBottom: 6,
                            background: selectedStudentId === s.id ? "#E8EEFF" : "transparent",
                            border: selectedStudentId === s.id ? "1.5px solid #3B5BDB" : "1.5px solid transparent",
                        }}>
                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#20C997", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>
                                {(s.name || "S")[0].toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: "#888" }}>{s.course}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chat area */}
                <div style={{ flex: 1, background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {selectedStudent ? (
                        <>
                            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#20C997", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>{(selectedStudent.name || "S")[0].toUpperCase()}</div>
                                <div>
                                    <div style={{ fontWeight: 800, color: "#1a1a2e" }}>{selectedStudent.name}</div>
                                    <div style={{ fontSize: 12, color: "#888" }}>{selectedStudent.course}</div>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                                {messages.length === 0 && <div style={{ textAlign: "center", color: "#aaa", fontSize: 14, marginTop: 40 }}>No messages yet. Start the conversation! 👋</div>}
                                {messages.map(msg => (
                                    <div key={msg.id} style={{ display: "flex", justifyContent: msg.senderId === user.uid ? "flex-end" : "flex-start" }}>
                                        <div style={{
                                            maxWidth: "70%", padding: "12px 18px",
                                            borderRadius: msg.senderId === user.uid ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                            background: msg.senderId === user.uid ? "#20C997" : "#f4f6fb",
                                            color: msg.senderId === user.uid ? "#fff" : "#1a1a2e", fontSize: 14, lineHeight: 1.6,
                                        }}>
                                            {msg.fileURL ? <a href={msg.fileURL} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>📎 {msg.fileName || "File"}</a> : msg.text}
                                            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: "right" }}>{formatTime(msg.timestamp)}</div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>
                            <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 10, alignItems: "flex-end" }}>
                                {file && <div style={{ fontSize: 11, color: "#20C997", fontWeight: 700, padding: "6px 12px", background: "#E6FCF5", borderRadius: 20 }}>📎 {file.name}</div>}
                                <input value={input} onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                                    placeholder="Type a message…"
                                    style={{ flex: 1, padding: "13px 18px", borderRadius: 30, border: "2px solid #eee", fontSize: 14, outline: "none" }} />
                                <button onClick={() => fileRef.current.click()} style={{ width: 44, height: 44, borderRadius: "50%", background: "#f0f2ff", border: "none", cursor: "pointer", fontSize: 18 }}>📎</button>
                                <input ref={fileRef} type="file" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
                                <button onClick={send} disabled={sending} style={{ width: 44, height: 44, borderRadius: "50%", background: "#20C997", border: "none", cursor: "pointer", color: "#fff", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>Select a student to chat</div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
