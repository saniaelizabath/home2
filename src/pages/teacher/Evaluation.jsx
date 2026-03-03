import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
    collection, query, where, getDocs, updateDoc, doc, orderBy, getDoc,
} from "firebase/firestore";
import useIsMobile from "../../hooks/useIsMobile";

export default function Evaluation() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [grading, setGrading] = useState({}); // { submissionId: { marks, feedback } }
    const [saving, setSaving] = useState({});
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        if (!user?.uid) { setLoading(false); return; }

        const fetchSubmissions = async () => {
            try {
                // Get courses this teacher teaches
                const courseSnap = await getDocs(query(collection(db, "courses"), where("teacherIds", "array-contains", user.uid)));
                // Also try by teacherId field on assignments
                const assignSnap = await getDocs(query(collection(db, "assignments"), where("teacherId", "==", user.uid)));
                const assignIds = assignSnap.docs.map(d => d.id);

                if (assignIds.length === 0) { setLoading(false); return; }

                // Fetch submissions for this teacher's assignments
                const subSnap = await getDocs(query(collection(db, "submissions"), where("assignmentId", "in", assignIds)));
                const subs = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Enrich with student names and assignment titles
                const enriched = await Promise.all(subs.map(async s => {
                    const [assignDoc, studentDoc] = await Promise.all([
                        getDoc(doc(db, "assignments", s.assignmentId)).catch(() => null),
                        getDoc(doc(db, "students", s.studentId)).catch(() => null),
                    ]);
                    return {
                        ...s,
                        assignmentTitle: assignDoc?.data()?.title || s.assignmentId,
                        studentName: studentDoc?.data()?.name || s.studentId,
                    };
                }));
                setSubmissions(enriched);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchSubmissions();
    }, [user?.uid]);

    const saveGrade = async (subId) => {
        const grade = grading[subId];
        if (!grade?.marks) { alert("Enter marks first."); return; }
        setSaving(p => ({ ...p, [subId]: true }));
        try {
            await updateDoc(doc(db, "submissions", subId), {
                marks: Number(grade.marks),
                feedback: grade.feedback || "",
            });
            setSubmissions(p => p.map(s => s.id === subId ? { ...s, marks: Number(grade.marks), feedback: grade.feedback } : s));
            setGrading(p => { const n = { ...p }; delete n[subId]; return n; });
        } catch (e) { console.error(e); alert("Error: " + e.message); }
        finally { setSaving(p => ({ ...p, [subId]: false })); }
    };

    const filtered = filter === "graded" ? submissions.filter(s => s.marks != null) :
        filter === "pending" ? submissions.filter(s => s.marks == null) : submissions;

    const formatDate = ts => {
        if (!ts) return "—";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Evaluation</h1>
            <p style={{ color: "#888", marginBottom: 24 }}>Grade student assignment submissions</p>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                {[["all", "All Submissions"], ["pending", "⏳ Pending"], ["graded", "✓ Graded"]].map(([v, l]) => (
                    <button key={v} onClick={() => setFilter(v)} style={{
                        padding: "8px 20px", borderRadius: 30, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
                        background: filter === v ? "#3B5BDB" : "#f0f2ff", color: filter === v ? "#fff" : "#3B5BDB",
                    }}>{l}</button>
                ))}
            </div>

            {loading ? (
                <div style={{ color: "#aaa", padding: 40, textAlign: "center" }}>Loading submissions…</div>
            ) : filtered.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", color: "#aaa", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                    <div style={{ fontWeight: 700 }}>No {filter === "pending" ? "pending" : filter === "graded" ? "graded" : ""} submissions yet.</div>
                </div>
            ) : filtered.map((s, i) => (
                <div key={s.id} style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", display: "flex", gap: 8, alignItems: "center" }}>
                                {s.studentName}
                                {s.status === "Late" && <span style={{ background: "#FFF0F0", color: "#FF6B6B", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Late</span>}
                            </div>
                            <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{s.assignmentTitle} · Submitted: {formatDate(s.submittedAt)}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            {s.marks != null && <span style={{ background: "#E6FCF5", color: "#20C997", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✓ Graded: {s.marks}</span>}
                            <a href={s.fileURL} target="_blank" rel="noreferrer" style={{ padding: "8px 16px", borderRadius: 20, background: "#E8EEFF", color: "#3B5BDB", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>📄 View File</a>
                        </div>
                    </div>

                    {/* Grade form */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "120px 1fr auto", gap: 10, alignItems: "flex-end" }}>
                        <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4 }}>MARKS</label>
                            <input type="number" min="0"
                                value={grading[s.id]?.marks ?? s.marks ?? ""}
                                onChange={e => setGrading(p => ({ ...p, [s.id]: { ...p[s.id], marks: e.target.value } }))}
                                placeholder="e.g. 42"
                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4 }}>FEEDBACK</label>
                            <input
                                value={grading[s.id]?.feedback ?? s.feedback ?? ""}
                                onChange={e => setGrading(p => ({ ...p, [s.id]: { ...p[s.id], feedback: e.target.value } }))}
                                placeholder="Great work! / Needs improvement…"
                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                            />
                        </div>
                        <button onClick={() => saveGrade(s.id)} disabled={saving[s.id]} style={{ padding: "11px 22px", borderRadius: 12, background: "#20C997", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                            {saving[s.id] ? "Saving…" : "Save Grade"}
                        </button>
                    </div>
                </div>
            ))}
        </DashboardLayout>
    );
}
