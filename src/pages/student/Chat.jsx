import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebase";
import {
    collection, query, where, orderBy, onSnapshot,
    addDoc, getDocs, serverTimestamp, doc, updateDoc, writeBatch, getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import useIsMobile from "../../hooks/useIsMobile";

export default function StudentChat() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const [teachers, setTeachers] = useState([]);
    const [chats, setChats] = useState({});        // { teacherId: chatId }
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [file, setFile] = useState(null);
    const [sending, setSending] = useState(false);
    const fileRef = useRef();
    const bottomRef = useRef();

    // Fetch approved teachers
    useEffect(() => {
        getDocs(query(collection(db, "teachers"), where("status", "==", "approved")))
            .then(snap => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setTeachers(list);
                if (list.length > 0) setSelectedTeacherId(list[0].id);
            });
    }, []);

    // Load or find existing chats for this student
    useEffect(() => {
        if (!user?.uid) return;
        getDocs(query(collection(db, "chats"), where("participants", "array-contains", user.uid)))
            .then(snap => {
                const map = {};
                snap.docs.forEach(d => {
                    const data = d.data();
                    const otherId = data.participants.find(p => p !== user.uid);
                    if (otherId) map[otherId] = d.id;
                });
                setChats(map);
            });
    }, [user?.uid]);

    // Real-time message listener for active chat
    useEffect(() => {
        const chatId = selectedTeacherId ? chats[selectedTeacherId] : null;
        if (!chatId) { setMessages([]); return; }
        const q = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("timestamp", "asc"));
        const unsub = onSnapshot(q, async snap => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMessages(msgs);
            // Mark unread messages as read
            const batch = writeBatch(db);
            snap.docs.forEach(d => {
                if (d.data().receiverId === user.uid && !d.data().read) {
                    batch.update(doc(db, "messages", d.id), { read: true });
                }
            });
            await batch.commit();
        });
        return () => unsub();
    }, [selectedTeacherId, chats, user?.uid]);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getOrCreateChat = async (teacherId) => {
        if (chats[teacherId]) return chats[teacherId];
        const newChat = await addDoc(collection(db, "chats"), {
            participants: [user.uid, teacherId],
            createdAt: serverTimestamp(),
        });
        setChats(p => ({ ...p, [teacherId]: newChat.id }));
        return newChat.id;
    };

    const send = async () => {
        if (!input.trim() && !file) return;
        if (!selectedTeacherId || !user?.uid) return;
        setSending(true);
        try {
            const chatId = await getOrCreateChat(selectedTeacherId);
            let fileURL = null;
            let fileName = null;
            if (file) {
                const storageRef = ref(storage, `chats/${chatId}/${file.name}`);
                const snap = await uploadBytes(storageRef, file);
                fileURL = await getDownloadURL(snap.ref);
                fileName = file.name;
            }
            await addDoc(collection(db, "messages"), {
                chatId, senderId: user.uid, receiverId: selectedTeacherId,
                text: input.trim() || null, fileURL, fileName,
                timestamp: serverTimestamp(), read: false,
            });
            setInput(""); setFile(null);
        } catch (e) {
            console.error("Send failed:", e);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (ts) => {
        if (!ts) return "";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Chat with Teachers</h1>
            <p style={{ color: "#888", marginBottom: 24 }}>Ask doubts and get personalised help</p>

            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 20, height: isMobile ? "auto" : "calc(100vh - 200px)", minHeight: isMobile ? "auto" : 500 }}>
                {/* Teacher list */}
                <div style={{ width: isMobile ? "100%" : 260, background: "#fff", borderRadius: 20, padding: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", flexShrink: 0, overflowY: "auto", maxHeight: isMobile ? 260 : "none" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Your Teachers</div>
                    {teachers.length === 0 && <div style={{ color: "#aaa", fontSize: 13 }}>No approved teachers yet.</div>}
                    {teachers.map(t => (
                        <div key={t.id} onClick={() => setSelectedTeacherId(t.id)} style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                            borderRadius: 14, cursor: "pointer", marginBottom: 6, transition: "all 0.2s",
                            background: selectedTeacherId === t.id ? "#E8EEFF" : "transparent",
                            border: selectedTeacherId === t.id ? "1.5px solid #3B5BDB" : "1.5px solid transparent",
                        }}>
                            <div style={{ position: "relative" }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#3B5BDB", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>
                                    {(t.name || "T")[0].toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{t.name}</div>
                                <div style={{ fontSize: 11, color: "#888" }}>{t.subject || t.subjects?.join(", ")}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chat panel */}
                <div style={{ flex: 1, background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: isMobile ? 420 : "auto" }}>
                    {selectedTeacher ? (
                        <>
                            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#3B5BDB", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>
                                    {(selectedTeacher.name || "T")[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: "#1a1a2e" }}>{selectedTeacher.name}</div>
                                    <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600 }}>{selectedTeacher.subject || selectedTeacher.subjects?.join(", ")}</div>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                                {messages.length === 0 && (
                                    <div style={{ textAlign: "center", color: "#aaa", fontSize: 14, marginTop: 40 }}>
                                        No messages yet. Say hello! 👋
                                    </div>
                                )}
                                {messages.map(msg => (
                                    <div key={msg.id} style={{ display: "flex", justifyContent: msg.senderId === user.uid ? "flex-end" : "flex-start" }}>
                                        <div style={{
                                            maxWidth: "70%", padding: "12px 18px",
                                            borderRadius: msg.senderId === user.uid ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                            background: msg.senderId === user.uid ? "#3B5BDB" : "#f4f6fb",
                                            color: msg.senderId === user.uid ? "#fff" : "#1a1a2e",
                                            fontSize: 14, lineHeight: 1.6, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                        }}>
                                            {msg.fileURL ? (
                                                <a href={msg.fileURL} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>📎 {msg.fileName || "File"}</a>
                                            ) : msg.text}
                                            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: msg.senderId === user.uid ? "right" : "left" }}>
                                                {formatTime(msg.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 10, alignItems: "flex-end" }}>
                                {file && <div style={{ fontSize: 11, color: "#3B5BDB", fontWeight: 700, padding: "6px 12px", background: "#E8EEFF", borderRadius: 20 }}>📎 {file.name}</div>}
                                <input value={input} onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                                    placeholder="Type your doubt…"
                                    style={{ flex: 1, padding: "13px 18px", borderRadius: 30, border: "2px solid #eee", fontSize: 14, outline: "none", fontFamily: "var(--font-body)" }}
                                    onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                                    onBlur={e => e.target.style.border = "2px solid #eee"}
                                />
                                <button onClick={() => fileRef.current.click()} style={{ width: 44, height: 44, borderRadius: "50%", background: "#f0f2ff", border: "none", cursor: "pointer", fontSize: 18 }}>📎</button>
                                <input ref={fileRef} type="file" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
                                <button onClick={send} disabled={sending} style={{ width: 44, height: 44, borderRadius: "50%", background: "#3B5BDB", border: "none", cursor: "pointer", color: "#fff", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", opacity: sending ? 0.6 : 1 }}>→</button>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>Select a teacher to start chatting</div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
