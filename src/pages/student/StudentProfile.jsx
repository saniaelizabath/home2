import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

const INFO_CONFIG = [
    { label: "Email", key: "email", icon: "✉️" },
    { label: "Phone", key: "phone", icon: "📱" },
    { label: "Class", key: "class", icon: "🏫" },
    { label: "Course", key: "course", icon: "📚" },
    { label: "Parent Email", key: "parentEmail", icon: "👨‍👩‍👧" },
    { label: "Parent Phone", key: "parentPhone", icon: "☎️" },
    { label: "Favourite Subject", key: "favSubject", icon: "⭐" },
    { label: "Study Time", key: "studyTime", icon: "🕓" },
    { label: "Daily Hours", key: "dailyHours", icon: "⏱️", suffix: " hrs/day" },
    { label: "Study Plan", key: "studyPlan", icon: "🗓️" },
    { label: "Focus Level", key: "focusLevel", icon: "🎯" },
    { label: "Current Average", key: "currentAggregate", icon: "📊", suffix: "%" },
    { label: "Target Aggregate", key: "targetAggregate", icon: "🏆", suffix: "%" },
];

const SUB_META = {
    "Accountancy": { bg: "#EEF2FF", color: "#4F46E5", icon: "📒" },
    "Business Studies": { bg: "#E6FCF5", color: "#0D9488", icon: "📊" },
    "Economics": { bg: "#FFF7ED", color: "#C2410C", icon: "📈" },
};

function normaliseSubject(raw = "") {
    const r = raw.toLowerCase();
    if (r.includes("account")) return "Accountancy";
    if (r.includes("business")) return "Business Studies";
    if (r.includes("econ")) return "Economics";
    // "Both Subjects" means student takes both — pick primary favSubject instead
    return "";
}

/* Normalise class value to match exactly what CourseManagement stores */
function normaliseClass(raw = "") {
    const r = raw.toLowerCase();
    if (r.includes("11")) return "Class 11";
    if (r.includes("12")) return "Class 12";
    return raw; // already in correct form
}

export default function StudentProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syllabus, setSyllabus] = useState(null);
    const [syllabusLoading, setSyllabusLoading] = useState(false);
    const [syllabusOpen, setSyllabusOpen] = useState(false);

    useEffect(() => {
        if (!user?.uid) { setLoading(false); return; }
        getDoc(doc(db, "students", user.uid))
            .then(s => setProfile(s.exists() ? s.data() : user))
            .catch(() => setProfile(user))
            .finally(() => setLoading(false));
    }, [user]);

    const data = profile ?? user ?? {};
    // These are safe render-time derivations for display only
    const classVal = normaliseClass(data.class || data.classType || "");
    const subject = normaliseSubject(data.favSubject || data.course || "");

    /* Fetch syllabus whenever profile finishes loading */
    useEffect(() => {
        // Wait until profile is actually loaded (not still null during initial render)
        if (loading) return;
        const d = profile ?? user ?? {};
        const cls = normaliseClass(d.class || d.classType || "");
        const subj = normaliseSubject(d.favSubject || d.course || "");

        console.log("[Syllabus] looking up:", { subj, cls, raw_class: d.class, raw_subject: d.favSubject || d.course });

        if (!cls || !subj) {
            setSyllabusLoading(false);
            return;
        }
        setSyllabusLoading(true);
        const fetch = async () => {
            try {
                // 1. Exact match
                let snap = await getDocs(query(collection(db, "courses"),
                    where("subject", "==", subj), where("class", "==", cls)));
                // 2. Fallback: course covers "Both" classes
                if (snap.empty) {
                    snap = await getDocs(query(collection(db, "courses"),
                        where("subject", "==", subj), where("class", "==", "Both")));
                }
                console.log("[Syllabus] found:", snap.size, "docs");
                setSyllabus(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
            } catch (e) { console.error("[Syllabus error]", e); }
            finally { setSyllabusLoading(false); }
        };
        fetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile, loading]);  // re-run once profile doc is loaded

    if (loading) return (
        <DashboardLayout>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, flexDirection: "column", gap: 16 }}>
                <div style={{ width: 48, height: 48, border: "4px solid #E8EEFF", borderTop: "4px solid #3B5BDB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <p style={{ color: "#888", fontWeight: 600 }}>Loading your profile…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </DashboardLayout>
    );

    const meta = SUB_META[subject] || { bg: "#E8EEFF", color: "#3B5BDB", icon: "📚" };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: 860 }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>My Profile</h1>
                    <p style={{ color: "#888", fontSize: 15 }}>Your personal details and enrolled course syllabus</p>
                </div>

                {/* Profile card */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 24 }}>
                    <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#3B5BDB,#7048e8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "#fff", fontWeight: 900, flexShrink: 0 }}>
                            {data.name?.[0]?.toUpperCase() ?? "S"}
                        </div>
                        <div>
                            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e", marginBottom: 8 }}>{data.name ?? "Student Name"}</h2>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {subject && <span style={{ display: "inline-flex", gap: 6, alignItems: "center", background: meta.bg, color: meta.color, padding: "5px 14px", borderRadius: 30, fontSize: 12, fontWeight: 700 }}>{meta.icon} {subject}</span>}
                                {classVal && <span style={{ display: "inline-flex", gap: 6, alignItems: "center", background: "#E6FCF5", color: "#20C997", padding: "5px 14px", borderRadius: 30, fontSize: 12, fontWeight: 700 }}>🏫 {classVal}</span>}
                                {data.focusLevel && <span style={{ display: "inline-flex", gap: 6, alignItems: "center", background: "#FFF0F0", color: "#FF6B6B", padding: "5px 14px", borderRadius: 30, fontSize: 12, fontWeight: 700 }}>🎯 {data.focusLevel} Focus</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14, marginBottom: 24 }}>
                    {INFO_CONFIG.map(item => {
                        const raw = data[item.key];
                        if (!raw) return null;
                        return (
                            <div key={item.key} style={{ background: "#fff", borderRadius: 18, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                                <div style={{ fontSize: 20, marginBottom: 8 }}>{item.icon}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{item.label}</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", wordBreak: "break-word" }}>{item.suffix ? `${raw}${item.suffix}` : raw}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Academic progress */}
                {(data.currentAggregate || data.targetAggregate) && (
                    <div style={{ background: "linear-gradient(135deg,#3B5BDB,#4c6ef5)", borderRadius: 20, padding: "24px 28px", marginBottom: 24, color: "#fff" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, opacity: 0.9 }}>📈 Academic Target</div>
                        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                            <div><div style={{ fontSize: 38, fontWeight: 900 }}>{data.currentAggregate ?? "—"}%</div><div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Current Average</div></div>
                            <div style={{ alignSelf: "center", fontSize: 22, opacity: 0.4 }}>→</div>
                            <div><div style={{ fontSize: 38, fontWeight: 900 }}>{data.targetAggregate ?? "—"}%</div><div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Target Aggregate</div></div>
                        </div>
                        {data.currentAggregate && data.targetAggregate && (
                            <div style={{ marginTop: 16 }}>
                                <div style={{ height: 8, background: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${Math.min((data.currentAggregate / data.targetAggregate) * 100, 100)}%`, background: "#fff", borderRadius: 99 }} />
                                </div>
                                <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>{Math.round((data.currentAggregate / data.targetAggregate) * 100)}% of target achieved</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Syllabus */}
                <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}
                        onClick={() => setSyllabusOpen(o => !o)}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 4 }}>{meta.icon} My Course Syllabus</div>
                            <div style={{ color: "#888", fontSize: 13 }}>
                                {syllabusLoading ? "Loading…"
                                    : syllabus ? `${syllabus.subject} · ${syllabus.class} · ${syllabus.chapters?.length || 0} chapters`
                                        : (!classVal || !subject) ? "Profile incomplete — contact admin"
                                            : "No syllabus added yet"}
                            </div>
                        </div>
                        <span style={{ fontSize: 16, color: "#9CA3AF" }}>{syllabusOpen ? "▲" : "▼"}</span>
                    </div>

                    {syllabusOpen && (
                        <div style={{ padding: "20px 24px" }}>
                            {syllabusLoading ? (
                                <div style={{ textAlign: "center", color: "#9CA3AF", padding: 24 }}>Loading syllabus…</div>
                            ) : !syllabus ? (
                                <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                                    <div style={{ fontWeight: 700, color: "#1F2937" }}>
                                        {!classVal || !subject
                                            ? "Your class or subject isn't set yet. Please contact your admin."
                                            : `No syllabus yet for ${subject} · ${classVal}. Check back soon!`}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                                        <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: meta.bg, color: meta.color }}>{meta.icon} {syllabus.subject}</span>
                                        <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#E6FCF5", color: "#0D9488" }}>🏫 {syllabus.class}</span>
                                        <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#F3F4F6", color: "#374151" }}>📖 {syllabus.chapters?.length || 0} Chapters</span>
                                    </div>
                                    {syllabus.description && (
                                        <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                                            {syllabus.description}
                                        </div>
                                    )}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                                        {(syllabus.chapters || []).map((ch, i) => (
                                            <div key={i} style={{ borderRadius: 14, padding: "14px 16px", border: `2px solid ${meta.bg}`, background: "#FAFAFA" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: ch.description ? 6 : 0 }}>
                                                    <span style={{ width: 26, height: 26, borderRadius: "50%", background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                                                    <span style={{ fontWeight: 700, fontSize: 14, color: "#1F2937" }}>{ch.name}</span>
                                                </div>
                                                {ch.description && <div style={{ fontSize: 12, color: "#9CA3AF", paddingLeft: 34 }}>{ch.description}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
