import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { db } from "../../firebase";
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import Papa from "papaparse";
import useIsMobile from "../../hooks/useIsMobile";

export default function Reports() {
    const isMobile = useIsMobile(900);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("all");
    const [reportType, setReportType] = useState("attendance");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        getDocs(collection(db, "courses")).then(snap => setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    const generate = async () => {
        setLoading(true);
        setData([]);
        try {
            if (reportType === "attendance") {
                let q = query(collection(db, "attendance"), orderBy("date", "desc"));
                if (selectedCourse !== "all") q = query(collection(db, "attendance"), where("courseId", "==", selectedCourse), orderBy("date", "desc"));
                const snap = await getDocs(q);
                let records = snap.docs.map(d => d.data());
                if (startDate) records = records.filter(r => { const d = r.date?.toDate ? r.date.toDate() : new Date(r.date); return d >= new Date(startDate); });
                if (endDate) records = records.filter(r => { const d = r.date?.toDate ? r.date.toDate() : new Date(r.date); return d <= new Date(endDate + "T23:59:59"); });
                // Fetch student names
                const studentIds = [...new Set(records.map(r => r.studentId))];
                const studentMap = {};
                await Promise.all(studentIds.slice(0, 20).map(async uid => {
                    const s = await getDocs(query(collection(db, "students"), where("__name__", "==", uid)));
                    studentMap[uid] = s.docs[0]?.data()?.name || uid;
                }));
                setData(records.map(r => ({
                    Student: studentMap[r.studentId] || r.studentId,
                    Course: r.courseId,
                    Date: (r.date?.toDate ? r.date.toDate() : new Date(r.date)).toLocaleDateString("en-IN"),
                    Status: r.status,
                })));
            } else {
                let q = query(collection(db, "testScores"), orderBy("submittedAt", "desc"));
                if (selectedCourse !== "all") q = query(collection(db, "testScores"), where("courseId", "==", selectedCourse), orderBy("submittedAt", "desc"));
                const snap = await getDocs(q);
                const records = snap.docs.map(d => d.data());
                setData(records.map(r => ({
                    Student: r.studentName || r.studentId,
                    Test: r.testName || "Test",
                    Score: r.score,
                    MaxMarks: r.max,
                    Percentage: Math.round((r.score / r.max) * 100) + "%",
                    Date: r.submittedAt ? (r.submittedAt.toDate ? r.submittedAt.toDate() : new Date(r.submittedAt)).toLocaleDateString("en-IN") : "—",
                })));
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const exportCSV = () => {
        if (!data.length) return;
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${reportType}_report_${new Date().toISOString().split("T")[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const headers = data.length ? Object.keys(data[0]) : [];

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Reports</h1>
            <p style={{ color: "#888", marginBottom: 28 }}>Generate and export attendance and progress reports</p>

            {/* Filters */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>REPORT TYPE</label>
                        <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ width: "100%", padding: "11px", borderRadius: 10, border: "2px solid #eee", fontSize: 14, outline: "none" }}>
                            <option value="attendance">Attendance</option>
                            <option value="progress">Test Scores / Progress</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>COURSE</label>
                        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={{ width: "100%", padding: "11px", borderRadius: 10, border: "2px solid #eee", fontSize: 14, outline: "none" }}>
                            <option value="all">All Courses</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>FROM DATE</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: "100%", padding: "11px", borderRadius: 10, border: "2px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>TO DATE</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: "100%", padding: "11px", borderRadius: 10, border: "2px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                    </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={generate} disabled={loading} style={{ padding: "12px 28px", borderRadius: 30, background: "#3B5BDB", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
                        {loading ? "Generating…" : "🔍 Generate Report"}
                    </button>
                    {data.length > 0 && (
                        <button onClick={exportCSV} style={{ padding: "12px 28px", borderRadius: 30, background: "#20C997", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
                            ⬇️ Export CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Results table */}
            {data.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflowX: "auto" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 16 }}>{data.length} record{data.length !== 1 ? "s" : ""} found</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                            <tr style={{ background: "#f8f9ff" }}>
                                {headers.map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#888", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                    {headers.map(h => (
                                        <td key={h} style={{ padding: "13px 16px", color: h === "Status" && row[h] === "Absent" ? "#FF6B6B" : h === "Status" && row[h] === "Present" ? "#20C997" : "#1a1a2e", fontWeight: h === "Student" ? 700 : 400 }}>
                                            {row[h]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {!loading && data.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "#aaa" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                    <div style={{ fontWeight: 700 }}>Select filters and click "Generate Report"</div>
                </div>
            )}
        </DashboardLayout>
    );
}
