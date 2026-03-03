import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
    collection, query, where, onSnapshot,
} from "firebase/firestore";

import useIsMobile from "../../hooks/useIsMobile";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

function pad(n) { return String(n).padStart(2, "0"); }

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatDateShort(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ─── Validate form ─── */
function parseTime(timeStr) {
    if (!timeStr) return { hour: "10", minute: "00", ampm: "AM" };
    const [hm, ampm] = timeStr.split(" ");
    const [hour, minute] = (hm || "10:00").split(":");
    return { hour: hour || "10", minute: minute || "00", ampm: ampm || "AM" };
}

const isClassPast = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return false;
    const { hour, minute, ampm } = parseTime(timeStr);
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    const classDate = new Date(`${dateStr}T${pad(h)}:${pad(minute)}:00`);
    return classDate < new Date();
};


/* ─── Badge colours by classType ─── */
function TypeBadge({ type }) {
    const map = {
        "Class 11": { bg: "#F0FDF4", color: "#16A34A", icon: "📗" },
        "Class 12": { bg: "#EEF2FF", color: "#4F46E5", icon: "📘" },
        "Individual": { bg: "#FDF4FF", color: "#9333EA", icon: "👤" },
    };
    const s = map[type] || { bg: "#F3F4F6", color: "#374151", icon: "📅" };
    return (
        <span style={{
            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: s.bg, color: s.color,
        }}>{s.icon} {type}</span>
    );
}

/* ─── Upcoming class row ─── */
function ClassRow({ c, isLast }) {
    const isPast = isClassPast(c.date, c.time);
    return (
        <div style={{
            display: "flex", gap: 14, padding: "16px 0",
            borderBottom: isLast ? "none" : "1px solid #F3F4F6",
            opacity: isPast ? 0.55 : 1,
            alignItems: "flex-start", flexWrap: "wrap",
        }}>
            {/* Date tile */}
            <div style={{
                minWidth: 52, textAlign: "center", background: isPast ? "#F3F4F6" : "linear-gradient(135deg,#6366f1,#8B5CF6)",
                borderRadius: 14, padding: "8px 4px", flexShrink: 0,
            }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: isPast ? "#9CA3AF" : "#fff", lineHeight: 1 }}>
                    {c.date ? new Date(c.date + "T00:00:00").getDate() : "—"}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: isPast ? "#9CA3AF" : "rgba(255,255,255,0.8)", textTransform: "uppercase" }}>
                    {c.date ? MONTHS[new Date(c.date + "T00:00:00").getMonth()].slice(0, 3) : ""}
                </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#1F2937", marginBottom: 4 }}>{c.topic}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <TypeBadge type={c.classType} />
                    {c.subject && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", background: "#F9FAFB", borderRadius: 20, padding: "3px 10px" }}>
                            📚 {c.subject}
                        </span>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", background: "#F9FAFB", borderRadius: 20, padding: "3px 10px" }}>
                        🕐 {c.time}
                    </span>
                    {c.classType === "Individual" && c.studentName && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", background: "#F9FAFB", borderRadius: 20, padding: "3px 10px" }}>
                            👤 {c.studentName}
                        </span>
                    )}
                </div>
                {c.meetingLink && (
                    <a href={c.meetingLink} target="_blank" rel="noreferrer" style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "7px 16px", borderRadius: 20,
                        background: isPast ? "#F3F4F6" : "linear-gradient(135deg,#6366f1,#8B5CF6)",
                        color: isPast ? "#9CA3AF" : "#fff",
                        fontWeight: 700, fontSize: 12, textDecoration: "none",
                    }}
                        onClick={isPast ? (e) => e.preventDefault() : undefined}
                    >
                        🔗 Join Class
                    </a>
                )}
            </div>
            <div style={{ fontSize: 11, color: "#D1D5DB", alignSelf: "flex-end", flexShrink: 0 }}>
                {formatDateShort(c.date)}
            </div>
        </div>
    );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function ClassManagement() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const now = new Date();

    const [month, setMonth] = useState(now.getMonth());
    const [year, setYear] = useState(now.getFullYear());
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("upcoming");
    const [selectedDay, setSelectedDay] = useState(null);

    // Teacher's display name (stored in localStorage as user.name)
    const teacherName = user?.name || user?.displayName || user?.email || "";

    /* ── Real-time: fetch all classes assigned to this teacher ── */
    useEffect(() => {
        if (!teacherName) { setLoading(false); return; }
        const q = query(
            collection(db, "scheduled_classes"),
            where("teacherName", "==", teacherName)
            // No orderBy — avoids composite index; sorted client-side
        );
        const unsub = onSnapshot(q,
            snap => {
                setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setLoading(false);
            },
            err => {
                console.error("Firestore error:", err);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [teacherName]);

    /* ── Calendar helpers ── */
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
    // Convert to Mon-first index
    const startOffset = (firstDayOfMonth + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = [];
    for (let i = 0; i < startOffset; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);

    // Get classes for a specific calendar day
    const getClassesForDay = (d) => {
        if (!d) return [];
        return classes.filter(c => {
            if (!c.date) return false;
            const cd = new Date(c.date + "T00:00:00");
            return cd.getDate() === d && cd.getMonth() === month && cd.getFullYear() === year;
        });
    };

    /* ── Filtered list ── */
    const todayStr = now.toISOString().split("T")[0];
    const filtered = filter === "upcoming"
        ? classes.filter(c => c.date > todayStr)
        : filter === "today"
            ? classes.filter(c => c.date === todayStr && !isClassPast(c.date, c.time))
            : filter === "past"
                ? classes.filter(c => isClassPast(c.date, c.time))
                : classes;

    const dayClasses = selectedDay ? getClassesForDay(selectedDay) : [];

    /* ── Nav button style ── */
    const navBtn = {
        background: "#F3F4F6", border: "none", borderRadius: 10,
        width: 34, height: 34, cursor: "pointer", fontSize: 14, color: "#374151",
        fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ textAlign: "center", padding: 80, color: "#9CA3AF" }}>
                    <div style={{ width: 40, height: 40, border: "4px solid #EEF2FF", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    Loading your schedule…
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* ── Header ── */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "Inter, Poppins, sans-serif", fontSize: 30, fontWeight: 900, color: "#1F2937", marginBottom: 4 }}>
                    📅 My Class Schedule
                </h1>
                <p style={{ color: "#9CA3AF", fontSize: 14 }}>
                    Classes scheduled by admin · {classes.length} total &nbsp;·&nbsp;
                    <span style={{ color: "#6366f1", fontWeight: 700 }}>{teacherName}</span>
                </p>
            </div>

            {/* ── Main grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: 24, alignItems: "start" }}>

                {/* ═══ CLASS LIST ═══ */}
                <div style={{ background: "#fff", borderRadius: 24, padding: isMobile ? 20 : 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    {/* Filter tabs */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                        {[["upcoming", "⏰ Upcoming"], ["today", "📅 Today"], ["past", "✅ Past"], ["all", "📋 All"]].map(([v, l]) => (
                            <button key={v} onClick={() => { setFilter(v); setSelectedDay(null); }} style={{
                                padding: "8px 18px", borderRadius: 30, fontWeight: 700, fontSize: 13,
                                border: "none", cursor: "pointer",
                                background: filter === v ? "#6366f1" : "#F3F4F6",
                                color: filter === v ? "#fff" : "#374151",
                                transition: "all 0.15s",
                            }}>{l}</button>
                        ))}
                        {selectedDay && (
                            <button onClick={() => setSelectedDay(null)} style={{
                                padding: "8px 18px", borderRadius: 30, fontWeight: 700, fontSize: 13,
                                border: "1.5px solid #6366f1", cursor: "pointer",
                                background: "#EEF2FF", color: "#4F46E5",
                            }}>
                                {MONTHS[month].slice(0, 3)} {selectedDay} ✕
                            </button>
                        )}
                    </div>

                    {/* Class rows */}
                    {(selectedDay ? dayClasses : filtered).length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>🗓️</div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: "#1F2937" }}>
                                {selectedDay ? `No class on ${MONTHS[month].slice(0, 3)} ${selectedDay}` : "No classes in this view"}
                            </div>
                            <div style={{ fontSize: 13, marginTop: 6 }}>
                                {filter === "upcoming" ? "All your upcoming classes will appear here once admin schedules them." : "Switch filter to see classes."}
                            </div>
                        </div>
                    ) : (
                        (selectedDay ? dayClasses : filtered).map((c, i, arr) => (
                            <ClassRow key={c.id} c={c} isLast={i === arr.length - 1} />
                        ))
                    )}
                </div>

                {/* ═══ CALENDAR SIDEBAR ═══ */}
                <div style={{ position: isMobile ? "static" : "sticky", top: 24 }}>
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
                                <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", padding: "3px 0" }}>{d}</div>
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
                                            textAlign: "center", padding: "7px 2px", borderRadius: 10, fontSize: 13,
                                            fontWeight: d ? 600 : 400,
                                            cursor: d ? "pointer" : "default",
                                            color: !d ? "transparent" : isSelected ? "#fff" : isToday ? "#fff" : hasClass ? "#4F46E5" : "#374151",
                                            background: !d ? "transparent" : isSelected ? "#6366f1" : isToday ? "#4F46E5" : hasClass ? "#EEF2FF" : "transparent",
                                            transition: "all 0.1s",
                                            position: "relative",
                                        }}>
                                        {d ?? ""}
                                        {hasClass && !isSelected && !isToday && (
                                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1", margin: "2px auto 0" }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #F3F4F6", display: "flex", gap: 16, flexWrap: "wrap" }}>
                            {[["#4F46E5", "#fff", "Today"], ["#EEF2FF", "#4F46E5", "Class day"], ["#6366f1", "#fff", "Selected"]].map(([bg, col, lbl]) => (
                                <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6B7280" }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 4, background: bg, border: "1px solid #E5E7EB" }} />
                                    {lbl}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats card */}
                    <div style={{ background: "linear-gradient(135deg,#6366f1,#8B5CF6)", borderRadius: 20, padding: 20, marginTop: 16, color: "#fff" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>📊 Overview</div>
                        {[
                            ["📅", "Total", classes.length],
                            ["⏰", "Upcoming", classes.filter(c => c.date > todayStr).length],
                            ["☀️", "Today", classes.filter(c => c.date === todayStr && !isClassPast(c.date, c.time)).length],
                            ["✅", "Completed", classes.filter(c => isClassPast(c.date, c.time)).length],
                        ].map(([icon, lbl, val]) => (
                            <div key={lbl} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                                <span style={{ opacity: 0.85 }}>{icon} {lbl}</span>
                                <span style={{ fontWeight: 800 }}>{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
