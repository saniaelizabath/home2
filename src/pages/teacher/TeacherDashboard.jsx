import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
    collection, getDocs, doc, query, where, orderBy, onSnapshot, updateDoc, getDoc,
} from "firebase/firestore";

const PRIORITY_MAP = {
    normal: { icon: "📌", color: "#3B5BDB", bg: "#E8EEFF", label: "Normal" },
    important: { icon: "⚠️", color: "#e67700", bg: "#FFF9DB", label: "Important" },
    urgent: { icon: "🚨", color: "#c92a2a", bg: "#FFF0F0", label: "Urgent" },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* ─── Announcement filtering for teachers ─── */
function isForTeacher(ann, user) {
    const t = ann.audience?.type;
    const f = ann.audience?.filters || {};
    if (t === "everyone") return true;
    if (t !== "teachers") return false;
    if (f.userId) return f.userId === (user?.id || user?.uid);
    const classMatch = !f.classes?.length || f.classes.some(c => c === user?.class);
    const subjectMatch = !f.subjects?.length || f.subjects.some(s =>
        user?.subject?.toLowerCase().includes(s.toLowerCase()) ||
        user?.course?.toLowerCase().includes(s.toLowerCase()) ||
        (user?.name || "").toLowerCase().includes(s.toLowerCase())
    );
    return classMatch && subjectMatch;
}

/* ─── My Attendance Calendar (Read-only) ─── */
function MyAttendanceCalendar({ records, loading }) {
    const [viewDate, setViewDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });

    const prevMonth = () => setViewDate(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
    const nextMonth = () => setViewDate(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });

    const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay();
    const daysCount = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
    const monthStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}`;

    return (
        <div style={{ background: "#fff", borderRadius: 24, padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", height: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", margin: 0 }}>📅 My Attendance</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={prevMonth} style={{ width: 28, height: 28, borderRadius: "50%", background: "#f8f9ff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>◀</button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 100, textAlign: "center" }}>{MONTH_NAMES[viewDate.month]} {viewDate.year}</span>
                    <button onClick={nextMonth} style={{ width: 28, height: 28, borderRadius: "50%", background: "#f8f9ff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>▶</button>
                </div>
            </div>

            {loading ? (
                <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 14 }}>Loading calendar…</div>
            ) : (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
                        {DAY_NAMES.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: "#aaa" }}>{d}</div>)}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                        {Array.from({ length: firstDay }).map((_, i) => <div key={"b" + i} />)}
                        {Array.from({ length: daysCount }).map((_, i) => {
                            const d = i + 1;
                            const dStr = `${monthStr}-${String(d).padStart(2, "0")}`;
                            const status = records[dStr];
                            const isPresent = status === "present";
                            const isAbsent = status === "absent";

                            return (
                                <div key={d} style={{
                                    height: 38, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                    borderRadius: 10, fontSize: 12, fontWeight: 700,
                                    background: isPresent ? "#D1FAE5" : isAbsent ? "#FEE2E2" : "#f8f9ff",
                                    color: isPresent ? "#065F46" : isAbsent ? "#991B1B" : "#555",
                                    position: "relative"
                                }}>
                                    {d}
                                    {(isPresent || isAbsent) && <div style={{
                                        position: "absolute", bottom: 4, width: 4, height: 4, borderRadius: "50%",
                                        background: isPresent ? "#10B981" : "#EF4444"
                                    }} />}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: 20, display: "flex", gap: 16, fontSize: 11, fontWeight: 700 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} /> Present</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} /> Absent</div>
                        <div style={{ marginLeft: "auto", color: "#6366f1" }}>Admin Marked</div>
                    </div>
                </>
            )}
        </div>
    );
}

/* ─── Announcement Card ─── */
function AnnouncementCard({ ann, userId, onMarkRead }) {
    const [expanded, setExpanded] = useState(false);
    const isRead = ann.isRead?.[userId] === true;
    const pr = PRIORITY_MAP[ann.priority] || PRIORITY_MAP.normal;
    const ts = ann.createdAt?.toDate?.();
    const dateStr = ts ? ts.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

    return (
        <div style={{
            background: isRead ? "#fff" : "#F0F9F5",
            border: `2px solid ${isRead ? "#f0f0f0" : "#20C997"}`,
            borderRadius: 16, padding: "18px 20px", marginBottom: 12,
            transition: "all 0.2s",
        }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                {!isRead && <span style={{ background: "#20C997", color: "#fff", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🔔 New</span>}
                <span style={{ background: pr.bg, color: pr.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{pr.icon} {pr.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#aaa" }}>{dateStr}</span>
            </div>
            <div onClick={() => setExpanded(p => !p)} style={{ cursor: "pointer" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 6 }}>{ann.title}</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7, overflow: "hidden", maxHeight: expanded ? "none" : "2.8em" }}>{ann.message}</div>
                {ann.message?.length > 120 && <div style={{ fontSize: 12, color: "#20C997", fontWeight: 700, marginTop: 4 }}>{expanded ? "▲ Show less" : "▼ Read more"}</div>}
            </div>
            {!isRead && (
                <div style={{ marginTop: 12, textAlign: "right" }}>
                    <button onClick={() => onMarkRead(ann.id)} style={{ padding: "6px 16px", borderRadius: 20, background: "#E6FCF5", color: "#20C997", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>✓ Mark as read</button>
                </div>
            )}
        </div>
    );
}

/* ─── Main Component ─── */
export default function TeacherDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ students: 0, classes: 0, assignments: 0, pendingGrades: 0 });
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState([]);
    const [annLoading, setAnnLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    const [schedule, setSchedule] = useState([]);
    const [schedLoading, setSchedLoading] = useState(true);
    const [attRecords, setAttRecords] = useState({});
    const [attLoading, setAttLoading] = useState(true);

    const [students, setStudents] = useState([]);
    const [stuLoading, setStuLoading] = useState(true);

    /* Fetch dashboard stats corrected */
    useEffect(() => {
        const tid = user?.id || user?.uid;
        if (!tid) { setLoading(false); setStuLoading(false); return; }
        const fetchStatsAndStudents = async () => {
            try {
                console.log(`[Dashboard] Fetching students for teacher: ${user.name}, class: ${user.class}`);
                // Filter students by teacher's class
                let studentQ = collection(db, "students");
                if (user.class && user.class !== "Both") {
                    studentQ = query(collection(db, "students"), where("class", "==", user.class));
                }

                // Query classes where teacher is assigned (scheduled_classes, teacherUid)
                const [schedSnap, assignSnap, studentSnap] = await Promise.all([
                    getDocs(query(collection(db, "scheduled_classes"), where("teacherUid", "==", tid))),
                    getDocs(query(collection(db, "assignments"), where("teacherId", "==", tid))),
                    getDocs(studentQ),
                ]);

                const studentList = studentSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                console.log(`[Dashboard] Found ${studentList.length} students for class ${user.class}`);
                setStudents(studentList);

                const assignIds = assignSnap.docs.map(d => d.id);
                let pendingGrades = 0;
                if (assignIds.length > 0) {
                    const subSnap = await getDocs(query(collection(db, "submissions"), where("assignmentId", "in", assignIds.slice(0, 10))));
                    pendingGrades = subSnap.docs.filter(d => d.data().marks == null).length;
                }
                setStats({ students: studentSnap.size, classes: schedSnap.size, assignments: assignSnap.size, pendingGrades });
            } catch (e) {
                console.error("Stats/Students Fetch Error:", e);
            }
            finally {
                setLoading(false);
                setStuLoading(false);
            }
        };
        fetchStatsAndStudents();
    }, [user?.id, user?.uid, user?.class]);

    /* Real-time schedule for teacher */
    useEffect(() => {
        const tid = user?.id || user?.uid;
        if (!tid) return;
        const q = query(collection(db, "scheduled_classes"), where("teacherUid", "==", tid));
        const unsub = onSnapshot(q, snap => {
            const now = new Date().toISOString().split("T")[0];
            const upcoming = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .filter(c => c.date >= now)
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 5);
            setSchedule(upcoming);
            setSchedLoading(false);
        }, err => { console.error("Schedule Error:", err); setSchedLoading(false); });
        return () => unsub();
    }, [user?.id, user?.uid]);

    /* Fetch teacher's own attendance */
    useEffect(() => {
        const tid = user?.id || user?.uid;
        if (!tid) return;
        getDoc(doc(db, "teacher_attendance", tid)).then(snap => {
            if (snap.exists()) setAttRecords(snap.data());
            setAttLoading(false);
        }).catch(e => { console.error("Attendance Error:", e); setAttLoading(false); });
    }, [user?.id, user?.uid]);

    /* Real-time announcements */
    useEffect(() => {
        const tid = user?.id || user?.uid;
        const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, snap => {
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAnnouncements(all.filter(a => isForTeacher(a, user)));
            setAnnLoading(false);
        });
        return () => unsub();
    }, [user?.id, user?.uid, user?.class]);

    const markAsRead = async (annId) => {
        const tid = user?.id || user?.uid;
        if (!tid) return;
        try {
            await updateDoc(doc(db, "announcements", annId), { [`isRead.${tid}`]: true });
        } catch (e) { console.error(e); }
    };

    const myUid = user?.id || user?.uid;
    const unreadCount = announcements.filter(a => !a.isRead?.[myUid]).length;
    const displayedAnns = showAll ? announcements : announcements.slice(0, 3);

    const cards = [
        { label: "Our Students", value: stats.students, icon: "👩‍🎓", color: "#3B5BDB", bg: "#E8EEFF" },
        { label: "Sessions", value: stats.classes, icon: "📅", color: "#20C997", bg: "#E6FCF5" },
        { label: "Assignments", value: stats.assignments, icon: "📋", color: "#e67700", bg: "#FFF9DB" },
        { label: "Pending", value: stats.pendingGrades, icon: "⏳", color: "#FF6B6B", bg: "#FFF0F0" },
    ];

    return (
        <DashboardLayout>
            {/* Header Area */}
            <div style={{
                background: "linear-gradient(135deg,#20C997 0%,#3B5BDB 100%)",
                borderRadius: 24, padding: "clamp(24px, 5vw, 36px)", marginBottom: 28,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 20, boxShadow: "0 8px 32px rgba(32,201,151,0.25)",
            }}>
                <div style={{ flex: "1 1 300px" }}>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 800, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>👨‍🏫 Academy Teacher</div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 900, color: "#fff", marginBottom: 8, margin: 0 }}>
                        Welcome, {user?.name?.split(" ")?.[0] ?? "Teacher"} 👋
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 6 }}>{user?.class || "Assigned"} Class · {user?.subject || "Expert"}</p>
                </div>
                {unreadCount > 0 && (
                    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "14px 22px", textAlign: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{unreadCount}</div>
                        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 800, marginTop: 4 }}>UPDATES</div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16, marginBottom: 28 }}>
                {cards.map(c => (
                    <div key={c.label} style={{ background: "#fff", borderRadius: 20, padding: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", border: "1px solid #f2f3f5" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{c.icon}</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: c.color, fontFamily: "var(--font-display)", marginBottom: 2, lineHeight: 1 }}>{loading ? "…" : c.value}</div>
                        <div style={{ fontSize: 12, color: "#999", fontWeight: 700 }}>{c.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 28 }}>
                {/* ── My Attendance Calendar ── */}
                <MyAttendanceCalendar records={attRecords} loading={attLoading} />

                {/* ── Upcoming Schedule ── */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", boxSizing: "border-box" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h3 style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", margin: 0 }}>📅 Class Schedule</h3>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#3B5BDB", background: "#E8EEFF", padding: "4px 10px", borderRadius: 20, textTransform: "uppercase" }}>Upcoming</span>
                    </div>

                    {schedLoading ? (
                        <div style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>Loading schedule…</div>
                    ) : schedule.length === 0 ? (
                        <div style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 13 }}>No upcoming classes scheduled.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {schedule.map(c => (
                                <div key={c.id} style={{ display: "flex", gap: 12, padding: 14, borderRadius: 16, background: "#f9faff", border: "1px solid #ebf0fe" }}>
                                    <div style={{ width: 44, height: 44, background: "#fff", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #eef", flexShrink: 0 }}>
                                        <div style={{ fontSize: 8, fontWeight: 900, color: "#3B5BDB" }}>{new Date(c.date).toLocaleString("en-IN", { month: "short" }).toUpperCase()}</div>
                                        <div style={{ fontSize: 16, fontWeight: 900, color: "#1a1a2e", lineHeight: 1 }}>{new Date(c.date).getDate()}</div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 800, fontSize: 14, color: "#1a1a2e", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.topic}</div>
                                        <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#888", fontWeight: 600 }}>
                                            <span>🕙 {c.time}</span>
                                            <span>🎓 {c.classType}</span>
                                        </div>
                                    </div>
                                    <a href={c.meetingLink} target="_blank" rel="noreferrer" style={{ alignSelf: "center", background: "#3B5BDB", color: "#fff", padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 800, textDecoration: "none" }}>Join</a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── My Students ── */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", margin: 0 }}>👩‍🎓 My Students ({students.length})</h3>
                    <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{user?.class === "Both" ? "All Classes" : user?.class}</div>
                </div>

                {stuLoading ? (
                    <div style={{ padding: "32px 0", textAlign: "center", color: "#aaa" }}>Loading students…</div>
                ) : students.length === 0 ? (
                    <div style={{ padding: "32px 0", textAlign: "center", color: "#999", fontSize: 13 }}>
                        No students found in {user?.class || "assigned"} class.
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                        {students.slice(0, 8).map(s => (
                            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, border: "1px solid #f0f0f0", background: "#fdfdff" }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#E8EEFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#3B5BDB", fontSize: 14, flexShrink: 0 }}>
                                    {(s.name || "S")[0].toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                                    <div style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.email}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Announcements ── */}
            <div style={{ background: "#fff", borderRadius: 24, padding: "24px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", margin: 0 }}>📢 Announcements</h3>
                    {announcements.length > 3 && (
                        <button onClick={() => setShowAll(p => !p)} style={{ background: "none", border: "none", color: "#20C997", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                            {showAll ? "Show less ▲" : `View all ${announcements.length} ▼`}
                        </button>
                    )}
                </div>

                {annLoading ? (
                    <div style={{ textAlign: "center", padding: 32, color: "#aaa", fontSize: 14 }}>Loading…</div>
                ) : announcements.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 32, color: "#aaa", fontSize: 14 }}>📭 No new announcements</div>
                ) : (
                    displayedAnns.map(a => <AnnouncementCard key={a.id} ann={a} userId={myUid} onMarkRead={markAsRead} />)
                )}
            </div>
        </DashboardLayout>
    );
}
