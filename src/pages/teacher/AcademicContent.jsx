import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebase";
import {
    collection, query, where, getDocs, addDoc,
    serverTimestamp, doc, updateDoc, deleteDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import useIsMobile from "../../hooks/useIsMobile";

/* ─── Constants ── */
const CLASS_OPTS = ["Class 11", "Class 12"];

const SUB_META = {
    "Accountancy": { bg: "#EEF2FF", color: "#4F46E5", icon: "📒" },
    "Business Studies": { bg: "#E6FCF5", color: "#0D9488", icon: "📊" },
    "Economics": { bg: "#FFF7ED", color: "#C2410C", icon: "📈" },
};

export default function AcademicContent() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);

    // Teacher profile fields (stored in AuthContext / teacher Firestore doc)
    const teacherSubject = user?.subject || "";
    const meta = SUB_META[teacherSubject] || { bg: "#E8EEFF", color: "#3B5BDB", icon: "📚" };

    // Filter state
    const [selectedClass, setSelectedClass] = useState(CLASS_OPTS[0]);

    // Syllabus (from courses collection)
    const [syllabus, setSyllabus] = useState(null);
    const [syllabusLoading, setSyllabusLoading] = useState(false);
    const [syllabusOpen, setSyllabusOpen] = useState(false);

    // Content tabs
    const [activeTab, setActiveTab] = useState("notes");
    const [notes, setNotes] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [tests, setTests] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Forms
    const [notesForm, setNotesForm] = useState({ title: "", id: null });
    const [assignForm, setAssignForm] = useState({ title: "", description: "", dueDate: "", id: null });
    const [testForm, setTestForm] = useState({ title: "", link: "", availableFrom: "", availableTo: "", id: null });

    /* ── courseId: unique per subject+class ── */
    const courseKey = `${teacherSubject}__${selectedClass}`;

    /* ── Load matching syllabus doc whenever subject/class changes ── */
    useEffect(() => {
        if (!teacherSubject) return;
        setSyllabusLoading(true);
        const fetch = async () => {
            try {
                let snap = await getDocs(query(collection(db, "courses"),
                    where("subject", "==", teacherSubject),
                    where("class", "==", selectedClass)));
                if (snap.empty) {
                    snap = await getDocs(query(collection(db, "courses"),
                        where("subject", "==", teacherSubject),
                        where("class", "==", "Both")));
                }
                setSyllabus(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
            } catch (e) { console.error(e); setSyllabus(null); }
            finally { setSyllabusLoading(false); }
        };
        fetch();
    }, [teacherSubject, selectedClass]);

    /* ── Load notes / assignments / tests for this course key ── */
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const [n, a, t] = await Promise.all([
                    getDocs(query(collection(db, "notes"), where("courseKey", "==", courseKey))),
                    getDocs(query(collection(db, "assignments"), where("courseKey", "==", courseKey))),
                    getDocs(query(collection(db, "tests"), where("courseKey", "==", courseKey))),
                ]);
                setNotes(n.docs.map(d => ({ id: d.id, ...d.data() })));
                setAssignments(a.docs.map(d => ({ id: d.id, ...d.data() })));
                setTests(t.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) { console.error(e); }
        };
        fetchContent();
    }, [courseKey]);

    /* ── Upload/Update note ── */
    const saveNote = async (file) => {
        if (!notesForm.title.trim()) { alert("Enter a title."); return; }
        if (file && file.size > 30 * 1024 * 1024) { alert("File is too large! Please keep it under 30MB."); return; }

        setUploading(true);
        setUploadProgress(0);
        try {
            let fileURL = notesForm.fileURL;
            let fileName = notesForm.fileName;

            if (file) {
                const storageRef = ref(storage, `notes/${courseKey}/${Date.now()}_${file.name}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                await new Promise((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                        },
                        (error) => reject(error),
                        async () => {
                            fileURL = await getDownloadURL(uploadTask.snapshot.ref);
                            fileName = file.name;
                            resolve();
                        }
                    );
                });
            }

            if (!fileURL && !notesForm.id) { alert("Please select a file."); setUploading(false); return; }

            if (notesForm.id) {
                await updateDoc(doc(db, "notes", notesForm.id), {
                    title: notesForm.title, ...(fileURL && { fileURL, fileName })
                });
                setNotes(p => p.map(n => n.id === notesForm.id ? { ...n, title: notesForm.title, ...(fileURL && { fileURL, fileName }) } : n));
            } else {
                const newDoc = await addDoc(collection(db, "notes"), {
                    courseKey, subject: teacherSubject, class: selectedClass,
                    teacherId: user.uid || user.id, title: notesForm.title,
                    fileURL, fileName, uploadedAt: serverTimestamp(),
                });
                setNotes(p => [{ id: newDoc.id, title: notesForm.title, fileURL, fileName }, ...p]);
            }
            setNotesForm({ title: "", id: null });
        } catch (e) { alert("Upload failed: " + e.message); }
        finally { setUploading(false); }
    };

    /* ── Upload/Update assignment ── */
    const saveAssignment = async (file) => {
        if (!assignForm.title.trim()) { alert("Enter title."); return; }
        if (file && file.size > 30 * 1024 * 1024) { alert("File is too large! Please keep it under 30MB."); return; }

        setUploading(true);
        setUploadProgress(0);
        try {
            let fileURL = assignForm.fileURL;
            let fileName = assignForm.fileName;

            if (file) {
                const storageRef = ref(storage, `assignments/${courseKey}/${Date.now()}_${file.name}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                await new Promise((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                        },
                        (error) => reject(error),
                        async () => {
                            fileURL = await getDownloadURL(uploadTask.snapshot.ref);
                            fileName = file.name;
                            resolve();
                        }
                    );
                });
            }

            if (assignForm.id) {
                await updateDoc(doc(db, "assignments", assignForm.id), {
                    title: assignForm.title,
                    description: assignForm.description,
                    dueDate: assignForm.dueDate ? new Date(assignForm.dueDate) : null,
                    ...(fileURL && { fileURL, fileName })
                });
                setAssignments(p => p.map(a => a.id === assignForm.id ? { ...a, title: assignForm.title, description: assignForm.description, dueDate: assignForm.dueDate, ...(fileURL && { fileURL, fileName }) } : a));
            } else {
                const newDoc = await addDoc(collection(db, "assignments"), {
                    courseKey, subject: teacherSubject, class: selectedClass,
                    teacherId: user.uid || user.id, title: assignForm.title,
                    description: assignForm.description, dueDate: assignForm.dueDate ? new Date(assignForm.dueDate) : null,
                    fileURL: fileURL || null, fileName: fileName || null, createdAt: serverTimestamp(),
                });
                setAssignments(p => [...p, { id: newDoc.id, title: assignForm.title, description: assignForm.description, dueDate: assignForm.dueDate, fileURL: fileURL || null, fileName: fileName || null }]);
            }
            setAssignForm({ title: "", description: "", dueDate: "", id: null });
        } catch (e) { alert("Upload failed: " + e.message); }
        finally { setUploading(false); }
    };

    /* ── Add/Update test ── */
    const saveTest = async () => {
        if (!testForm.title.trim()) { alert("Enter test title."); return; }
        setUploading(true);
        try {
            if (testForm.id) {
                await updateDoc(doc(db, "tests", testForm.id), {
                    title: testForm.title, link: testForm.link,
                    availableFrom: testForm.availableFrom ? new Date(testForm.availableFrom) : null,
                    availableTo: testForm.availableTo ? new Date(testForm.availableTo) : null,
                });
                setTests(p => p.map(t => t.id === testForm.id ? { ...t, title: testForm.title, link: testForm.link, availableFrom: testForm.availableFrom, availableTo: testForm.availableTo } : t));
            } else {
                const newDoc = await addDoc(collection(db, "tests"), {
                    courseKey, subject: teacherSubject, class: selectedClass,
                    teacherId: user.uid || user.id, title: testForm.title, link: testForm.link,
                    availableFrom: testForm.availableFrom ? new Date(testForm.availableFrom) : null,
                    availableTo: testForm.availableTo ? new Date(testForm.availableTo) : null,
                    createdAt: serverTimestamp(),
                });
                setTests(p => [...p, { id: newDoc.id, title: testForm.title, link: testForm.link, availableFrom: testForm.availableFrom, availableTo: testForm.availableTo }]);
            }
            setTestForm({ title: "", link: "", availableFrom: "", availableTo: "", id: null });
        } catch (e) { alert("Error: " + e.message); }
        finally { setUploading(false); }
    };

    const handleDelete = async (collectionName, id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await deleteDoc(doc(db, collectionName, id));
            if (collectionName === "notes") setNotes(p => p.filter(i => i.id !== id));
            if (collectionName === "assignments") setAssignments(p => p.filter(i => i.id !== id));
            if (collectionName === "tests") setTests(p => p.filter(i => i.id !== id));
        } catch (e) { alert("Delete failed: " + e.message); }
    };

    const formatDateForInput = (dateObj) => {
        if (!dateObj) return "";
        let d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
        if (isNaN(d.getTime())) return "";
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    const tabStyle = t => ({
        padding: "10px 22px", borderRadius: 30, fontWeight: 700, fontSize: 14,
        border: "none", cursor: "pointer", transition: "all 0.2s",
        background: activeTab === t ? "#3B5BDB" : "#f0f2ff",
        color: activeTab === t ? "#fff" : "#3B5BDB",
    });
    const inp = {
        width: "100%", padding: "10px 14px", borderRadius: 10,
        border: "2px solid #E5E7EB", fontSize: 13, outline: "none",
        boxSizing: "border-box", fontFamily: "inherit", background: "#fafbff",
        transition: "border 0.15s",
    };
    const fo = e => e.target.style.border = "2px solid #3B5BDB";
    const bl = e => e.target.style.border = "2px solid #E5E7EB";

    return (
        <DashboardLayout>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 4 }}>Academic Content</h1>
            <p style={{ color: "#888", marginBottom: 24 }}>Upload notes, assignments, and create tests for your students</p>

            {/* ── Teacher subject + class filter ── */}
            <div style={{ background: "#fff", borderRadius: 18, padding: "18px 22px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
                {/* Subject badge (read-only — from teacher profile) */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Subject</div>
                    {teacherSubject ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 20, fontWeight: 700, fontSize: 13, background: meta.bg, color: meta.color }}>
                            {meta.icon} {teacherSubject}
                        </span>
                    ) : (
                        <span style={{ color: "#FF6B6B", fontSize: 13 }}>⚠️ Subject not set — ask admin to update your profile</span>
                    )}
                </div>

                {/* Class selector */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Class</div>
                    <div style={{ display: "flex", gap: 8 }}>
                        {CLASS_OPTS.map(cl => (
                            <button key={cl} onClick={() => setSelectedClass(cl)} style={{
                                padding: "7px 18px", borderRadius: 20, fontWeight: 700, fontSize: 13,
                                border: "2px solid", cursor: "pointer", transition: "all 0.15s",
                                borderColor: selectedClass === cl ? "#6366f1" : "#E5E7EB",
                                background: selectedClass === cl ? "#EEF2FF" : "#F9FAFB",
                                color: selectedClass === cl ? "#4F46E5" : "#374151",
                            }}>{cl}</button>
                        ))}
                    </div>
                </div>

                {/* Current scope tag */}
                <div style={{ marginLeft: "auto", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                    Showing content for<br />
                    <strong style={{ color: "#1F2937" }}>{teacherSubject || "—"} · {selectedClass}</strong>
                </div>
            </div>

            {/* ── Syllabus accordion ── */}
            <div style={{ background: "#fff", borderRadius: 18, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: syllabusOpen ? "1px solid #F3F4F6" : "none" }}
                    onClick={() => setSyllabusOpen(o => !o)}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#1F2937", marginBottom: 3 }}>📖 Course Syllabus</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                            {syllabusLoading ? "Loading…"
                                : syllabus ? `${syllabus.chapters?.length || 0} chapters`
                                    : "Not added yet — admin needs to add syllabus in Course Management"}
                        </div>
                    </div>
                    <span style={{ fontSize: 16, color: "#9CA3AF" }}>{syllabusOpen ? "▲" : "▼"}</span>
                </div>
                {syllabusOpen && (
                    <div style={{ padding: "16px 22px" }}>
                        {!syllabus ? (
                            <div style={{ textAlign: "center", color: "#9CA3AF", padding: "16px 0" }}>No syllabus found for {teacherSubject} · {selectedClass}</div>
                        ) : (
                            <>
                                {syllabus.description && (
                                    <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#374151" }}>
                                        {syllabus.description}
                                    </div>
                                )}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                                    {(syllabus.chapters || []).map((ch, i) => (
                                        <div key={i} style={{ borderRadius: 12, padding: "12px 14px", border: `2px solid ${meta.bg}`, background: "#FAFAFA" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: ch.description ? 5 : 0 }}>
                                                <span style={{ width: 22, height: 22, borderRadius: "50%", background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                                                <span style={{ fontWeight: 700, fontSize: 13, color: "#1F2937" }}>{ch.name}</span>
                                            </div>
                                            {ch.description && <div style={{ fontSize: 11, color: "#9CA3AF", paddingLeft: 29 }}>{ch.description}</div>}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                <button style={tabStyle("notes")} onClick={() => setActiveTab("notes")}>📝 Notes</button>
                <button style={tabStyle("assignments")} onClick={() => setActiveTab("assignments")}>📋 Assignments</button>
                <button style={tabStyle("tests")} onClick={() => setActiveTab("tests")}>🧪 Tests</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
                {/* ── Upload / create panel ── */}
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 18 }}>
                        {activeTab === "notes" ? (notesForm.id ? "✏️ Edit Notes" : "📤 Upload Notes")
                            : activeTab === "assignments" ? (assignForm.id ? "✏️ Edit Assignment" : "📤 Upload Assignment")
                                : (testForm.id ? "✏️ Edit Test" : "➕ Create Test")}
                    </div>

                    {activeTab === "notes" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>TITLE *</label>
                                <input value={notesForm.title} onChange={e => setNotesForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Partnership Notes" style={inp} onFocus={fo} onBlur={bl} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>FILE (PDF / DOC) {notesForm.id ? "(Leave blank to keep current)" : "*"}</label>
                                <label style={{ display: "block", padding: 18, borderRadius: 12, border: "2px dashed #3B5BDB", textAlign: "center", cursor: uploading ? "not-allowed" : "pointer", background: "#f0f4ff", fontSize: 13, color: "#3B5BDB" }}>
                                    {uploading && uploadProgress > 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                                            <div style={{ width: "100%", background: "#E5E7EB", borderRadius: 4, height: 6, overflow: "hidden" }}>
                                                <div style={{ width: `${uploadProgress}%`, background: "#3B5BDB", height: "100%", transition: "width 0.2s ease" }}></div>
                                            </div>
                                            <span>Uploading: {Math.round(uploadProgress)}%</span>
                                        </div>
                                    ) : uploading ? "Starting Upload..." : "Click to select file (Max 30MB)"}
                                    <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" style={{ display: "none" }} onChange={e => saveNote(e.target.files[0])} disabled={uploading} />
                                </label>
                            </div>
                            {notesForm.id && (
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button onClick={() => saveNote(null)} disabled={uploading} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#3B5BDB", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>Save Name Only</button>
                                    <button onClick={() => setNotesForm({ title: "", id: null })} disabled={uploading} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#f3f4f6", color: "#374151", fontWeight: 700, border: "none", cursor: "pointer" }}>Cancel</button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "assignments" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>TITLE *</label>
                                <input value={assignForm.title} onChange={e => setAssignForm(p => ({ ...p, title: e.target.value }))} placeholder="Assignment title" style={inp} onFocus={fo} onBlur={bl} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>DESCRIPTION</label>
                                <textarea value={assignForm.description} onChange={e => setAssignForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Instructions…" style={{ ...inp, resize: "vertical" }} onFocus={fo} onBlur={bl} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>DUE DATE</label>
                                <input type="datetime-local" value={assignForm.dueDate} onChange={e => setAssignForm(p => ({ ...p, dueDate: e.target.value }))} style={{ ...inp, colorScheme: "light" }} />
                            </div>
                            <label style={{ display: "block", padding: 18, borderRadius: 12, border: "2px dashed #3B5BDB", textAlign: "center", cursor: uploading ? "not-allowed" : "pointer", background: "#f0f4ff", fontSize: 13, color: "#3B5BDB" }}>
                                {uploading && uploadProgress > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                                        <div style={{ width: "100%", background: "#E5E7EB", borderRadius: 4, height: 6, overflow: "hidden" }}>
                                            <div style={{ width: `${uploadProgress}%`, background: "#3B5BDB", height: "100%", transition: "width 0.2s ease" }}></div>
                                        </div>
                                        <span>Uploading... {Math.round(uploadProgress)}%</span>
                                    </div>
                                ) : uploading ? "Starting Upload..." : assignForm.id ? "Click to upload a new replacement file" : "Click to upload assignment file (Max 30MB)"}
                                <input type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={e => saveAssignment(e.target.files[0])} disabled={uploading} />
                            </label>
                            {assignForm.id && (
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button onClick={() => saveAssignment(null)} disabled={uploading} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#3B5BDB", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>Save Without New File</button>
                                    <button onClick={() => setAssignForm({ title: "", description: "", dueDate: "", id: null })} disabled={uploading} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#f3f4f6", color: "#374151", fontWeight: 700, border: "none", cursor: "pointer" }}>Cancel</button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "tests" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>TITLE *</label>
                                <input value={testForm.title} onChange={e => setTestForm(p => ({ ...p, title: e.target.value }))} placeholder="Test title" style={inp} onFocus={fo} onBlur={bl} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>TEST LINK (Google Form etc.)</label>
                                <input value={testForm.link} onChange={e => setTestForm(p => ({ ...p, link: e.target.value }))} placeholder="https://forms.google.com/…" style={inp} onFocus={fo} onBlur={bl} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>AVAILABLE FROM</label>
                                    <input type="datetime-local" value={testForm.availableFrom} onChange={e => setTestForm(p => ({ ...p, availableFrom: e.target.value }))} style={{ ...inp, colorScheme: "light" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>AVAILABLE UNTIL</label>
                                    <input type="datetime-local" value={testForm.availableTo} onChange={e => setTestForm(p => ({ ...p, availableTo: e.target.value }))} style={{ ...inp, colorScheme: "light" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={saveTest} disabled={uploading} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#FF6B6B", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
                                    {uploading ? "Saving…" : testForm.id ? "Update Test" : "Create Test"}
                                </button>
                                {testForm.id && (
                                    <button onClick={() => setTestForm({ title: "", link: "", availableFrom: "", availableTo: "", id: null })} disabled={uploading} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#f3f4f6", color: "#374151", fontWeight: 700, border: "none", cursor: "pointer" }}>Cancel</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── List panel ── */}
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 18 }}>
                        {activeTab === "notes" ? "📚 Uploaded Notes" : activeTab === "assignments" ? "📋 Assignments" : "🧪 Tests"}
                    </div>

                    {activeTab === "notes" && (notes.length === 0
                        ? <div style={{ color: "#aaa", fontSize: 14 }}>No notes uploaded for {teacherSubject} · {selectedClass} yet.</div>
                        : notes.map((n, i) => (
                            <div key={n.id || i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: i < notes.length - 1 ? "1px solid #f0f0f0" : "none", pointerEvents: uploading ? "none" : "auto", opacity: uploading ? 0.6 : 1 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E8EEFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📄</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{n.title}</div>
                                    <div style={{ fontSize: 12, color: "#aaa" }}>{n.fileName}</div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <a href={n.fileURL} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#3B5BDB", fontWeight: 700, padding: "5px 10px", background: "#f0f4ff", borderRadius: 12, textDecoration: "none" }}>View</a>
                                    <button onClick={() => setNotesForm({ title: n.title, id: n.id, fileURL: n.fileURL, fileName: n.fileName })} style={{ fontSize: 12, color: "#374151", fontWeight: 700, padding: "5px 10px", background: "#f3f4f6", borderRadius: 12, border: "none", cursor: "pointer" }}>Edit</button>
                                    <button onClick={() => handleDelete("notes", n.id)} style={{ fontSize: 12, color: "#FF6B6B", fontWeight: 700, padding: "5px 10px", background: "#FFF0F0", borderRadius: 12, border: "none", cursor: "pointer" }}>Del</button>
                                </div>
                            </div>
                        ))
                    )}

                    {activeTab === "assignments" && (assignments.length === 0
                        ? <div style={{ color: "#aaa", fontSize: 14 }}>No assignments yet for {teacherSubject} · {selectedClass}.</div>
                        : assignments.map((a, i) => (
                            <div key={a.id || i} style={{ padding: "12px 0", borderBottom: i < assignments.length - 1 ? "1px solid #f0f0f0" : "none", pointerEvents: uploading ? "none" : "auto", opacity: uploading ? 0.6 : 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{a.title}</div>
                                        <div style={{ fontSize: 12, color: "#888" }}>{a.description}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button onClick={() => setAssignForm({ title: a.title, description: a.description || "", dueDate: formatDateForInput(a.dueDate), id: a.id, fileURL: a.fileURL || null, fileName: a.fileName || null })} style={{ fontSize: 11, color: "#374151", fontWeight: 700, padding: "4px 8px", background: "#f3f4f6", borderRadius: 10, border: "none", cursor: "pointer" }}>Edit</button>
                                        <button onClick={() => handleDelete("assignments", a.id)} style={{ fontSize: 11, color: "#FF6B6B", fontWeight: 700, padding: "4px 8px", background: "#FFF0F0", borderRadius: 10, border: "none", cursor: "pointer" }}>Del</button>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                                    {a.fileURL && <a href={a.fileURL} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#3B5BDB", fontWeight: 700, textDecoration: "none" }}>📎 View File</a>}
                                    {a.dueDate && <span style={{ fontSize: 11, color: "#9ca3af" }}>Due: {new Date(a.dueDate?.toDate ? a.dueDate.toDate() : a.dueDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>}
                                </div>
                            </div>
                        ))
                    )}

                    {activeTab === "tests" && (tests.length === 0
                        ? <div style={{ color: "#aaa", fontSize: 14 }}>No tests yet for {teacherSubject} · {selectedClass}.</div>
                        : tests.map((t, i) => (
                            <div key={t.id || i} style={{ padding: "12px 0", borderBottom: i < tests.length - 1 ? "1px solid #f0f0f0" : "none", pointerEvents: uploading ? "none" : "auto", opacity: uploading ? 0.6 : 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{t.title}</div>
                                        <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                                            {t.availableFrom && <span>From: {new Date(t.availableFrom?.toDate ? t.availableFrom.toDate() : t.availableFrom).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })} </span>}
                                            {t.availableTo && <span>Until: {new Date(t.availableTo?.toDate ? t.availableTo.toDate() : t.availableTo).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button onClick={() => setTestForm({ title: t.title, link: t.link || "", availableFrom: formatDateForInput(t.availableFrom), availableTo: formatDateForInput(t.availableTo), id: t.id })} style={{ fontSize: 11, color: "#374151", fontWeight: 700, padding: "4px 8px", background: "#f3f4f6", borderRadius: 10, border: "none", cursor: "pointer" }}>Edit</button>
                                        <button onClick={() => handleDelete("tests", t.id)} style={{ fontSize: 11, color: "#FF6B6B", fontWeight: 700, padding: "4px 8px", background: "#FFF0F0", borderRadius: 10, border: "none", cursor: "pointer" }}>Del</button>
                                    </div>
                                </div>
                                {t.link && <a href={t.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#FF6B6B", fontWeight: 700, display: "inline-block", marginTop: 8, textDecoration: "none" }}>🔗 Open Link</a>}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
