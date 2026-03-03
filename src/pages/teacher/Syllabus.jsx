import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Syllabus() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [uploading, setUploading] = useState(false);
    const [currentURL, setCurrentURL] = useState(null);
    const [uploadDone, setUploadDone] = useState(false);

    useEffect(() => {
        getDocs(collection(db, "courses")).then(snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCourses(list);
            if (list.length) {
                setSelectedCourse(list[0].id);
                setCurrentURL(list[0].syllabusURL || null);
            }
        });
    }, []);

    const handleCourseChange = (id) => {
        setSelectedCourse(id);
        const c = courses.find(c => c.id === id);
        setCurrentURL(c?.syllabusURL || null);
        setUploadDone(false);
    };

    const upload = async (file) => {
        if (!file || !selectedCourse) { alert("Select a course and file."); return; }
        if (file.type !== "application/pdf") { alert("Please upload a PDF file."); return; }
        setUploading(true);
        try {
            const storageRef = ref(storage, `syllabus/${selectedCourse}/syllabus.pdf`);
            const snap = await uploadBytes(storageRef, file);
            const fileURL = await getDownloadURL(snap.ref);
            await updateDoc(doc(db, "courses", selectedCourse), { syllabusURL: fileURL });
            setCurrentURL(fileURL);
            setCourses(p => p.map(c => c.id === selectedCourse ? { ...c, syllabusURL: fileURL } : c));
            setUploadDone(true);
        } catch (e) { console.error(e); alert("Upload failed: " + e.message); }
        finally { setUploading(false); }
    };

    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Syllabus</h1>
            <p style={{ color: "#888", marginBottom: 32 }}>Upload the syllabus PDF for each course — students can view it on their profile page</p>

            <div style={{ maxWidth: 540 }}>
                <div style={{ background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>SELECT COURSE</label>
                        <select value={selectedCourse} onChange={e => handleCourseChange(e.target.value)}
                            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid #eee", fontSize: 14, outline: "none", background: "#fafbff" }}>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            {courses.length === 0 && <option>No courses — add in Admin panel</option>}
                        </select>
                    </div>

                    {currentURL && (
                        <div style={{ background: "#E6FCF5", borderRadius: 16, padding: 16, marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
                            <div style={{ fontSize: 24 }}>📄</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: "#20C997", marginBottom: 4 }}>Current Syllabus Uploaded</div>
                                <a href={currentURL} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#3B5BDB", fontWeight: 700 }}>View Current Syllabus →</a>
                            </div>
                        </div>
                    )}

                    {!currentURL && (
                        <div style={{ background: "#FFF9DB", borderRadius: 16, padding: 16, marginBottom: 20, fontSize: 13, color: "#8A5A00", fontWeight: 600 }}>
                            ⚠️ No syllabus uploaded yet for this course.
                        </div>
                    )}

                    <label style={{
                        display: "block", padding: "32px 20px", borderRadius: 16,
                        border: "2px dashed #3B5BDB", textAlign: "center", cursor: "pointer",
                        background: uploadDone ? "#E6FCF5" : "#f0f4ff", transition: "all 0.2s",
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{uploadDone ? "✅" : "📤"}</div>
                        <div style={{ fontWeight: 700, color: uploadDone ? "#20C997" : "#3B5BDB", marginBottom: 4 }}>
                            {uploading ? "Uploading…" : uploadDone ? "Syllabus Uploaded!" : "Click to Upload Syllabus PDF"}
                        </div>
                        <div style={{ fontSize: 12, color: "#888" }}>PDF files only · This replaces the existing syllabus for this course</div>
                        <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => upload(e.target.files[0])} disabled={uploading} />
                    </label>
                </div>
            </div>
        </DashboardLayout>
    );
}
