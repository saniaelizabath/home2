import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebase";
import {
  collection, query, where, onSnapshot,
  getDocs, addDoc, serverTimestamp,
} from "firebase/firestore";

import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import useIsMobile from "../../hooks/useIsMobile";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatDateFull(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" });
}

/* ─── Validate form ─── */
function parseTime(timeStr) {
  if (!timeStr) return { hour: "10", minute: "00", ampm: "AM" };
  const [hm, ampm] = timeStr.split(" ");
  const [hour, minute] = (hm || "10:00").split(":");
  return { hour: hour || "10", minute: minute || "00", ampm: ampm || "AM" };
}

function pad(n) { return String(n).padStart(2, "0"); }

const isClassPast = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return false;
  const { hour, minute, ampm } = parseTime(timeStr);
  let h = parseInt(hour, 10);
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  const classDate = new Date(`${dateStr}T${pad(h)}:${pad(minute)}:00`);
  return classDate < new Date();
};

// Returns: "before" | "active" | "expired"
// Join link is active from scheduled start time up to 1 hour after
const getJoinStatus = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return "before";
  const { hour, minute, ampm } = parseTime(timeStr);
  let h = parseInt(hour, 10);
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  const classStart = new Date(`${dateStr}T${pad(h)}:${pad(minute)}:00`);
  const classEnd = new Date(classStart.getTime() + 60 * 60 * 1000); // +1 hour
  const now = new Date();
  if (now < classStart) return "before";
  if (now <= classEnd) return "active";
  return "expired";
};


/* ─── Chip styles ─── */
const chipBlue = {
  padding: "8px 18px", borderRadius: 20, background: "#3B5BDB",
  color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none", cursor: "pointer",
  border: "none", display: "inline-block",
};
const chipGreen = {
  padding: "5px 14px", borderRadius: 20, background: "#E6FCF5",
  color: "#20C997", fontSize: 12, fontWeight: 700,
};
const chipOrange = {
  padding: "8px 18px", borderRadius: 20, background: "#FF6B6B",
  color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none",
};

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
export default function ClassDashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile(900);
  const now = new Date();

  /* ── Calendar state ── */
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);

  /* ── Data state ── */
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tests, setTests] = useState([]);
  const [uploading, setUploading] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [classesLoading, setClassesLoading] = useState(true);

  const [assignTab, setAssignTab] = useState("active");
  const [testTab, setTestTab] = useState("active");
  const [classTab, setClassTab] = useState("today");

  /* Identify student's batch type + name */
  const studentClassType = user?.classType || user?.class || user?.batch || null;
  const studentName = user?.name || user?.displayName || "";

  /* ── Real-time scheduled classes ──
     Fetch classes for the student's batch AND any individual classes by name.
     Firestore doesn't allow OR on different fields, so we run two queries. */
  useEffect(() => {
    const listeners = [];
    let batchClasses = [];
    let individualClasses = [];
    let resolved = 0;

    const merge = () => {
      resolved++;
      if (resolved < 2) return;
      const all = [...batchClasses, ...individualClasses];
      // deduplicate by id
      const seen = new Set();
      const unique = all.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
      unique.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      setClasses(unique);
      setClassesLoading(false);
    };

    if (studentClassType) {
      const q1 = query(
        collection(db, "scheduled_classes"),
        where("classType", "==", studentClassType)
        // No orderBy — avoids composite index requirement; sorted client-side below
      );
      const u1 = onSnapshot(q1, snap => {
        batchClasses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        merge();
      }, err => { console.error("Batch query error:", err); merge(); });
      listeners.push(u1);
    } else {
      resolved++; // skip batch query if no classType
    }

    if (studentName) {
      const q2 = query(
        collection(db, "scheduled_classes"),
        where("classType", "==", "Individual"),
        where("studentName", "==", studentName)
        // No orderBy — avoids composite index requirement; sorted client-side below
      );
      const u2 = onSnapshot(q2, snap => {
        individualClasses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        merge();
      }, err => { console.error("Individual query error:", err); merge(); });
      listeners.push(u2);
    } else {
      resolved++;
    }

    // If neither condition applies, still stop loading
    if (!studentClassType && !studentName) {
      setClassesLoading(false);
    }

    return () => listeners.forEach(u => u());
  }, [studentClassType, studentName]);

  /* ── Assignments ── */
  useEffect(() => {
    if (!studentClassType) return;
    getDocs(query(
      collection(db, "assignments"),
      where("class", "in", [studentClassType, "Both"])
    )).then(snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        let dateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate || "9999-12-31");
        let dateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate || "9999-12-31");
        return dateA - dateB;
      });
      setAssignments(data);
    })
      .catch(() => {
        // Fallback: fetch all and filter client side
        getDocs(collection(db, "assignments"))
          .then(snap => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.class === studentClassType || a.class === "Both" || a.classType === studentClassType);
            setAssignments(data);
          });
      });
  }, [studentClassType, user]);

  /* ── Tests ── */
  useEffect(() => {
    if (!studentClassType) return;
    getDocs(query(collection(db, "tests"), where("class", "in", [studentClassType, "Both"])))
      .then(snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          let dateA = a.availableTo?.toDate ? a.availableTo.toDate() : new Date(a.availableTo || "9999-12-31");
          let dateB = b.availableTo?.toDate ? b.availableTo.toDate() : new Date(b.availableTo || "9999-12-31");
          return dateA - dateB;
        });
        setTests(list);
      }).catch(() => {
        getDocs(collection(db, "tests"))
          .then(snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.class === studentClassType || t.class === "Both");
            setTests(list);
          });
      });
  }, [studentClassType]);

  /* ── Submissions check ── */
  useEffect(() => {
    if (!user?.uid || !assignments.length) return;
    getDocs(query(collection(db, "submissions"), where("studentId", "==", user.uid)))
      .then(snap => {
        const map = {};
        snap.docs.forEach(d => { map[d.data().assignmentId] = d.data(); });
        setSubmitted(map);
      }).catch(console.error);
  }, [user?.uid, assignments]);

  /* ── File upload ── */
  const handleUpload = async (assignmentId, file, isLate) => {
    if (!file || !user?.uid) return;
    if (file.size > 30 * 1024 * 1024) { alert("File is too large! Please keep it under 30MB."); return; }

    setUploading(p => ({ ...p, [assignmentId]: true }));
    setUploadProgress(p => ({ ...p, [assignmentId]: 0 }));

    try {
      const storageRef = ref(storage, `submissions/${user.uid}/${assignmentId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(p => ({ ...p, [assignmentId]: progress }));
          },
          (error) => reject(error),
          async () => {
            const fileURL = await getDownloadURL(uploadTask.snapshot.ref);
            const newSub = {
              assignmentId, studentId: user.uid,
              classType: studentClassType,
              fileURL, fileName: file.name,
              submittedAt: serverTimestamp(), marks: null, feedback: null,
              status: isLate ? "Late" : "On Time"
            };
            await addDoc(collection(db, "submissions"), newSub);
            setSubmitted(p => ({ ...p, [assignmentId]: newSub }));
            resolve();
          }
        );
      });
    } catch (e) {
      console.error("Upload failed:", e);
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(p => ({ ...p, [assignmentId]: false }));
    }
  };

  /* ── Calendar helpers ── */
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7; // Mon-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = [];
  for (let i = 0; i < startOffset; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);

  const getClassesForDay = (d) => {
    if (!d) return [];
    return classes.filter(c => {
      if (!c.date) return false;
      const cd = new Date(c.date + "T00:00:00");
      return cd.getDate() === d && cd.getMonth() === month && cd.getFullYear() === year;
    });
  };

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const getFilteredClasses = () => {
    if (classTab === "today") {
      return classes
        .filter(c => c.date === todayStr)
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    }
    if (classTab === "upcoming") {
      return classes
        .filter(c => c.date > todayStr)
        .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    }
    // past
    return classes
      .filter(c => c.date < todayStr)
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  };
  const filteredClasses = getFilteredClasses();
  const dayClasses = selectedDay ? getClassesForDay(selectedDay) : [];

  const navBtn = {
    background: "#F3F4F6", border: "none", borderRadius: 10,
    width: 34, height: 34, cursor: "pointer", fontSize: 14, color: "#374151", fontWeight: 700,
  };
  const cardTitle = { fontWeight: 800, fontSize: 16, color: "#1F2937", marginBottom: 18 };
  const tabBtn = (isActive) => ({
    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", transition: "0.2s",
    background: isActive ? "#3B5BDB" : "#F3F4F6", color: isActive ? "#fff" : "#6B7280"
  });

  const getFilteredAssignments = () => {
    const current = new Date();
    return assignments.filter(a => {
      const dDate = a.dueDate?.toDate ? a.dueDate.toDate() : (a.dueDate ? new Date(a.dueDate) : null);
      const isPast = dDate && dDate < current;
      if (assignTab === "active") return !dDate || !isPast;
      return isPast;
    });
  };

  const getFilteredTests = () => {
    const current = new Date();
    return tests.filter(t => {
      const toDate = t.availableTo?.toDate ? t.availableTo.toDate() : (t.availableTo ? new Date(t.availableTo) : null);
      const isPast = toDate && toDate < current;
      if (testTab === "active") return !toDate || !isPast;
      return isPast;
    });
  };

  const displayedAssignments = getFilteredAssignments();
  const displayedTests = getFilteredTests();

  /* ─── If student has no class info at all ─── */
  if (!studentClassType && !studentName && !classesLoading) {
    return (
      <DashboardLayout>
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>No class enrolled yet.</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>Please contact your admin to assign you to Class 11, Class 12, or an Individual session.</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <h1 style={{ fontFamily: "Inter, Poppins, sans-serif", fontSize: 30, fontWeight: 900, color: "#1F2937", marginBottom: 4 }}>
        📚 Class Dashboard
      </h1>
      <p style={{ color: "#9CA3AF", fontSize: 14, marginBottom: 32 }}>
        Your schedule, meeting links, assignments & tests
        {studentClassType && <> · <span style={{ color: "#6366f1", fontWeight: 700 }}>{studentClassType}</span></>}
      </p>

      {/* ── Top row: Calendar + Upcoming ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, marginBottom: 24 }}>

        {/* Calendar */}
        <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
          {/* Month nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button style={navBtn} onClick={() => {
              if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
              setSelectedDay(null);
            }}>‹</button>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1F2937" }}>{MONTHS[month]} {year}</div>
            <button style={navBtn} onClick={() => {
              if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
              setSelectedDay(null);
            }}>›</button>
          </div>

          {/* Day labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", padding: "2px 0" }}>{d}</div>
            ))}
          </div>

          {/* Date grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
            {grid.map((d, i) => {
              const dayCls = d ? getClassesForDay(d) : [];
              const hasClass = dayCls.length > 0;
              const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const isSelected = d === selectedDay;
              return (
                <div key={`${d}-${i}`}
                  onClick={() => d && setSelectedDay(d === selectedDay ? null : d)}
                  style={{
                    textAlign: "center", padding: "8px 2px", borderRadius: 10, fontSize: 13,
                    fontWeight: d ? 600 : 400,
                    cursor: d ? "pointer" : "default",
                    color: !d ? "transparent" : isSelected ? "#fff" : isToday ? "#fff" : hasClass ? "#3B5BDB" : "#374151",
                    background: !d ? "transparent" : isSelected ? "#3B5BDB" : isToday ? "#3B5BDB" : hasClass ? "#E8EEFF" : "transparent",
                    transition: "background 0.1s",
                    position: "relative",
                  }}>
                  {d ?? ""}
                  {hasClass && !isSelected && !isToday && (
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#3B5BDB", margin: "2px auto 0" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Day popup */}
          {selectedDay && (
            <div style={{ marginTop: 16, padding: 14, background: "#F8F9FF", borderRadius: 14, border: "1.5px solid #E8EEFF" }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#1F2937", marginBottom: 10 }}>
                📅 {formatDateFull(`${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`)}
              </div>
              {dayClasses.length === 0 ? (
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>No class scheduled this day.</div>
              ) : dayClasses.map(c => (
                <div key={c.id} style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", marginBottom: 8, border: "1px solid #E8EEFF" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1F2937" }}>{c.topic}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>
                    {c.subject && `📚 ${c.subject}  `}🕐 {c.time}  👨‍🏫 {c.teacherName}
                  </div>
                  {c.meetingLink && (() => {
                    const js = getJoinStatus(c.date, c.time);
                    if (js === "active") {
                      return (
                        <a href={c.meetingLink} target="_blank" rel="noreferrer"
                          style={{ ...chipBlue, marginTop: 8, fontSize: 11, padding: "5px 12px", display: "inline-block" }}>
                          🔗 Join
                        </a>
                      );
                    }
                    return (
                      <span style={{ marginTop: 8, fontSize: 11, padding: "5px 12px", display: "inline-block", borderRadius: 20, fontWeight: 700, background: "#F3F4F6", color: "#9CA3AF", cursor: "default" }}>
                        {js === "before" ? "⏳ Not yet" : "⌛ Expired"}
                      </span>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop: 14, display: "flex", gap: 14, flexWrap: "wrap" }}>
            {[["#3B5BDB", "#fff", "Today / Selected"], ["#E8EEFF", "#3B5BDB", "Class day"]].map(([bg, col, lbl]) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6B7280" }}>
                <div style={{ width: 13, height: 13, borderRadius: 4, background: bg, border: "1px solid #E5E7EB" }} />
                {lbl}
              </div>
            ))}
          </div>
        </div>

        {/* Classes panel */}
        <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" }}>
          {/* Header + tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1F2937" }}>📅 Classes</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["today", "upcoming", "past"].map(tab => (
                <button key={tab} onClick={() => setClassTab(tab)} style={tabBtn(classTab === tab)}>
                  {tab === "today" ? "Today" : tab === "upcoming" ? "Upcoming" : "Past"}
                </button>
              ))}
            </div>
          </div>

          {/* Today badge */}
          {classTab === "today" && (
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 14, fontWeight: 600 }}>
              🗓️ {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          )}

          {classesLoading ? (
            <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #E8EEFF", borderTop: "3px solid #3B5BDB", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              Loading…
            </div>
          ) : filteredClasses.length === 0 ? (
            <div style={{ color: "#9CA3AF", fontSize: 14, padding: "24px 0", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗓️</div>
              {classTab === "today" ? "No classes scheduled for today."
                : classTab === "upcoming" ? "No upcoming classes scheduled yet."
                  : "No past classes found."}
            </div>
          ) : filteredClasses.map((c, i) => (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 0",
              borderBottom: i < filteredClasses.length - 1 ? "1px solid #F3F4F6" : "none",
            }}>
              {/* Date tile */}
              <div style={{
                minWidth: 46, textAlign: "center",
                background: c.date === todayStr
                  ? "linear-gradient(135deg,#20C997,#12b886)"
                  : classTab === "past"
                    ? "#F3F4F6"
                    : "linear-gradient(135deg,#3B5BDB,#6366f1)",
                borderRadius: 12, padding: "7px 4px", flexShrink: 0,
              }}>
                <div style={{ fontSize: 17, fontWeight: 900, color: c.date === todayStr || classTab !== "past" ? "#fff" : "#6B7280", lineHeight: 1 }}>
                  {c.date ? new Date(c.date + "T00:00:00").getDate() : "—"}
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: c.date === todayStr || classTab !== "past" ? "rgba(255,255,255,0.8)" : "#9CA3AF", textTransform: "uppercase" }}>
                  {c.date ? MONTHS[new Date(c.date + "T00:00:00").getMonth()].slice(0, 3) : ""}
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: classTab === "past" ? "#6B7280" : "#1F2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.topic}
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  👨‍🏫 {c.teacherName} · 🕐 {c.time}
                  {c.subject && ` · 📚 ${c.subject}`}
                </div>
              </div>

              {/* Join button — time-gated */}
              {c.meetingLink && (() => {
                const js = getJoinStatus(c.date, c.time);
                if (js === "active") {
                  return <a href={c.meetingLink} target="_blank" rel="noreferrer" style={chipBlue}>Join</a>;
                }
                return (
                  <span style={{ padding: "8px 16px", borderRadius: 20, background: "#F3F4F6", color: "#9CA3AF", fontSize: 12, fontWeight: 700, cursor: "default", whiteSpace: "nowrap" }}>
                    {js === "before" ? "⏳ Soon" : "⌛ Ended"}
                  </span>
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom row: Assignments + Tests ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>

        {/* Assignments */}
        <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div style={{ ...cardTitle, marginBottom: 0 }}>📝 Assignments</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setAssignTab("active")} style={tabBtn(assignTab === "active")}>Active</button>
              <button onClick={() => setAssignTab("past")} style={tabBtn(assignTab === "past")}>Past</button>
            </div>
          </div>
          {displayedAssignments.length === 0 ? (
            <div style={{ color: "#9CA3AF", fontSize: 14, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>No {assignTab} assignments.</div>
          ) : displayedAssignments.map((a, i) => {
            const dDate = a.dueDate?.toDate ? a.dueDate.toDate() : (a.dueDate ? new Date(a.dueDate) : null);
            const isPast = dDate && dDate < new Date();
            return (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "13px 0",
                borderBottom: i < displayedAssignments.length - 1 ? "1px solid #F3F4F6" : "none",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1F2937", textDecoration: (isPast && !submitted[a.id]) ? "line-through" : "none", opacity: (isPast && !submitted[a.id]) ? 0.6 : 1 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: isPast ? "#FF6B6B" : "#9CA3AF", fontWeight: isPast ? 600 : 400 }}>
                    {dDate ? `Due: ${dDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : "No due date"}
                  </div>
                </div>
                {submitted[a.id] ? (
                  <div style={{ ...chipGreen, background: submitted[a.id].status === "Late" ? "#FFF4E6" : "#E6FCF5", color: submitted[a.id].status === "Late" ? "#E8590C" : "#20C997" }}>
                    {submitted[a.id].status === "Late" ? "Late ✓" : "Submitted ✓"}
                  </div>
                ) : uploading[a.id] ? (
                  <div style={{ padding: "8px 14px", borderRadius: 20, background: "#f0f4ff", border: "1px solid #E8EEFF", display: "flex", flexDirection: "column", gap: 5, width: 120 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#3B5BDB", textAlign: "center" }}>Uploading {uploadProgress[a.id] ? Math.round(uploadProgress[a.id]) : 0}%</div>
                    <div style={{ width: "100%", height: 4, background: "#E5E7EB", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${uploadProgress[a.id] || 0}%`, height: "100%", background: "#3B5BDB", transition: "width 0.2s" }} />
                    </div>
                  </div>
                ) : (
                  <label style={{ ...(isPast ? chipOrange : chipBlue), cursor: "pointer" }}>
                    {isPast ? "Upload Late" : "Upload"}
                    <input type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={e => handleUpload(a.id, e.target.files[0], isPast)} />
                  </label>
                )}
              </div>
            )
          })}
        </div>

        {/* Tests */}
        <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div style={{ ...cardTitle, marginBottom: 0 }}>📋 Tests & Quizzes</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setTestTab("active")} style={tabBtn(testTab === "active")}>Active</button>
              <button onClick={() => setTestTab("past")} style={tabBtn(testTab === "past")}>Past</button>
            </div>
          </div>
          {displayedTests.length === 0 ? (
            <div style={{ color: "#9CA3AF", fontSize: 14, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>No {testTab} tests right now.</div>
          ) : displayedTests.map((t, i) => {
            const fromDate = t.availableFrom?.toDate ? t.availableFrom.toDate() : (t.availableFrom ? new Date(t.availableFrom) : null);
            const toDate = t.availableTo?.toDate ? t.availableTo.toDate() : (t.availableTo ? new Date(t.availableTo) : null);
            const isPast = toDate && toDate < new Date();
            const isFuture = fromDate && fromDate > new Date();

            return (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 0",
                borderBottom: i < displayedTests.length - 1 ? "1px solid #F3F4F6" : "none",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1F2937", opacity: isPast ? 0.6 : 1, textDecoration: isPast ? "line-through" : "none" }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: isPast ? "#FF6B6B" : "#9CA3AF", fontWeight: isPast ? 600 : 400, marginTop: 3 }}>
                    {fromDate ? `From: ${fromDate.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}` : "Available now"}
                    {toDate ? ` · Until: ${toDate.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}` : ""}
                  </div>
                </div>
                {t.link && (
                  isPast ? <div style={{ padding: "5px 14px", borderRadius: 20, background: "#FFF0F0", color: "#FF6B6B", fontSize: 12, fontWeight: 700 }}>Closed</div>
                    : isFuture ? <div style={{ padding: "5px 14px", borderRadius: 20, background: "#F3F4F6", color: "#6B7280", fontSize: 12, fontWeight: 700 }}>Not Yet</div>
                      : <a href={t.link} target="_blank" rel="noreferrer" style={chipOrange}>Attempt</a>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
