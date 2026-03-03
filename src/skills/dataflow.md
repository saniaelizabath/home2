# LedgerLearn — Firestore Dataflow & Realtime Integration Skill

This document defines the **complete data architecture** for the LedgerLearn online tuition app.
Use it as the implementation reference when replacing hardcoded data with live Firestore reads/writes.

---

## Firestore Collections Overview

| Collection | Purpose |
|---|---|
| `/students/{uid}` | Student profile + learning preferences |
| `/teachers/{id}` | Teacher profile + login credentials |
| `/admins/{uid}` | Admin profile (seeded on first login) |
| `/courses/{courseId}` | Course info + enrolled students list + syllabusURL |
| `/classes/{classId}` | Scheduled class sessions (topic, time, meeting link) |
| `/assignments/{assignmentId}` | Assignments per course |
| `/submissions/{submissionId}` | Student file submissions for assignments |
| `/tests/{testId}` | Tests/quizzes per course with time window |
| `/testScores/{scoreId}` | Test scores per student |
| `/notes/{noteId}` | Uploaded notes per course |
| `/attendance/{recordId}` | Per-student per-class attendance status |
| `/tasks/{taskId}` | AI task scheduler items per student |
| `/taskSchedules/{schedId}` | AI-generated schedule snapshots |
| `/chats/{chatId}` | Chat conversations (participants array) |
| `/messages/{msgId}` | Individual messages in a chat |
| `/announcements/{annId}` | Public / group / individual announcements |

---

## 🎓 STUDENT PORTAL

### Current Hardcoded Data (needs replacing)
| File | Hardcoded Variable | Replace With |
|---|---|---|
| `ClassDashboard.jsx` | `SCHEDULE` array | Firestore query `/classes` |
| `ClassDashboard.jsx` | `ASSIGNMENTS` array | Firestore query `/assignments` |
| `ClassDashboard.jsx` | `QUIZZES` array | Firestore query `/tests` |
| `StudentProfile.jsx` | `SYLLABUS` object | Firestore read `/courses/{courseId}` |
| `ProgressDashboard.jsx` | Static score data | Firestore query `/testScores` |
| `Attendance.jsx` | Static attendance list | Firestore query `/attendance` |
| `TaskScheduler.jsx` | Static task list | Firestore query `/tasks` |
| `Chat.jsx` | Static conversation list | Firestore query `/chats` |

---

### Student Profile (`StudentProfile.jsx`)

```javascript
// On load — fetch full profile
const snap = await getDoc(doc(db, "students", user.uid));
const profile = snap.data(); // { name, email, course, class, phone, ... }

// Syllabus button click — fetch course syllabus URL
const courseSnap = await getDoc(doc(db, "courses", profile.courseId));
const { syllabusURL } = courseSnap.data();
window.open(syllabusURL, "_blank"); // opens Firebase Storage PDF URL
```

> **Remove:** `const SYLLABUS = { Accountancy: [...], ... }` — replace topics with PDF from Storage.

---

### Class Dashboard (`ClassDashboard.jsx`)

```javascript
// REMOVE: const SCHEDULE = [...], ASSIGNMENTS = [...], QUIZZES = [...]

// Classes — real-time onSnapshot listener
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

useEffect(() => {
  const q = query(
    collection(db, "classes"),
    where("courseId", "==", student.courseId),
    where("date", ">=", new Date()),
    orderBy("date", "asc")
  );
  const unsub = onSnapshot(q, (snap) => {
    setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
  return () => unsub(); // cleanup on unmount
}, [student.courseId]);

// Assignments — one-time read
const assignSnap = await getDocs(
  query(collection(db, "assignments"), where("courseId", "==", student.courseId))
);
setAssignments(assignSnap.docs.map(d => ({ id: d.id, ...d.data() })));

// Tests — filtered by availability window
const now = new Date();
const testSnap = await getDocs(
  query(
    collection(db, "tests"),
    where("courseId", "==", student.courseId),
    where("availableFrom", "<=", now)
  )
);
// Client-side filter: d.availableTo >= now
setTests(testSnap.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .filter(t => t.availableTo.toDate() >= now)
);

// Assignment file upload
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
const storageRef = ref(storage, `submissions/${user.uid}/${assignmentId}/${file.name}`);
const { ref: uploadedRef } = await uploadBytes(storageRef, file);
const fileURL = await getDownloadURL(uploadedRef);

// Firestore write — record submission
await addDoc(collection(db, "submissions"), {
  assignmentId, studentId: user.uid,
  fileURL, submittedAt: serverTimestamp(),
  marks: null, feedback: null,
});
```

---

### Progress Dashboard (`ProgressDashboard.jsx`)

```javascript
// On load — fetch test scores
const scoresSnap = await getDocs(
  query(
    collection(db, "testScores"),
    where("studentId", "==", user.uid),
    orderBy("submittedAt", "asc")
  )
);
const scores = scoresSnap.docs.map(d => d.data()); // [{ testName, score, submittedAt }]

// Calculate average
const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

// Target from student profile (already in AuthContext / Firestore)
const target = Number(user.targetAggregate);

// Render with Recharts LineChart
// X-axis: submittedAt dates, Y-axis: score values
```

---

### Chat (`Chat.jsx`)

```javascript
// List existing chats
const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
const chatsSnap = await getDocs(q);

// Fetch available teachers for new chat
const teachersSnap = await getDocs(
  query(collection(db, "teachers"), where("status", "==", "approved"))
);

// Create new chat
await addDoc(collection(db, "chats"), {
  participants: [user.uid, teacherId],
  createdAt: serverTimestamp(),
});

// Real-time message listener
const msgQ = query(
  collection(db, "messages"),
  where("chatId", "==", activeChatId),
  orderBy("timestamp", "asc")
);
const unsub = onSnapshot(msgQ, (snap) => {
  setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});

// Send message
await addDoc(collection(db, "messages"), {
  chatId: activeChatId, senderId: user.uid, receiverId: teacherId,
  text, timestamp: serverTimestamp(), read: false,
});

// Mark messages as read (batch)
const batch = writeBatch(db);
unreadMsgs.forEach(m => batch.update(doc(db, "messages", m.id), { read: true }));
await batch.commit();
```

---

### Task Scheduler (`TaskScheduler.jsx`)

```javascript
// Load pending tasks
const tasksSnap = await getDocs(
  query(collection(db, "tasks"),
    where("studentId", "==", user.uid),
    where("completed", "==", false))
);

// Add task
await addDoc(collection(db, "tasks"), {
  studentId: user.uid, taskName, priority, difficulty,
  timeRequired, completed: false, createdAt: serverTimestamp(),
});

// Generate AI schedule — POST to Firebase Cloud Function
const profileSnap = await getDoc(doc(db, "students", user.uid));
const profile = profileSnap.data();
const tasks = /* fetch all incomplete tasks */;

const res = await fetch("https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/generateSchedule", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ profile, tasks, moodCheck }),
});
const { schedule } = await res.json();
// schedule = [{ taskName, startTime, endTime, reason }]

// Save generated schedule
await addDoc(collection(db, "taskSchedules"), {
  studentId: user.uid, date: new Date(),
  moodCheck, generatedSchedule: schedule,
});

// Mark task complete
await updateDoc(doc(db, "tasks", taskId), { completed: true });
```

---

### Attendance (`Attendance.jsx`)

```javascript
// On load
const snap = await getDocs(
  query(
    collection(db, "attendance"),
    where("studentId", "==", user.uid),
    orderBy("date", "desc")
  )
);
const records = snap.docs.map(d => d.data());
// records = [{ date, status: "Present" | "Absent" | "Late", classId }]

// Monthly summary — computed client-side from records
const total = records.length;
const attended = records.filter(r => r.status === "Present").length;
const percentage = Math.round((attended / total) * 100);
```

---

## 👩‍🏫 TEACHER MODULE

### Current Hardcoded Data (needs replacing)

| File | Hardcoded Variable | Replace With |
|---|---|---|
| `TeacherDashboard.jsx` | Static stats (students, classes) | Firestore queries |
| `ClassManagement.jsx` | Static class list | Firestore query `/classes` |
| `AcademicContent.jsx` | No real upload | Firebase Storage + Firestore write |
| `Evaluation.jsx` | Static submission list | Firestore query `/submissions` |
| `TeacherAttendance.jsx` | Static student list | Firestore query `/students` via `/courses` |
| `TeacherProfile.jsx` | Static profile | Firestore read `/teachers/{uid}` |
| `TeacherChat.jsx` | Static conversations | Firestore query `/chats` |
| `Syllabus.jsx` | No real upload | Firebase Storage + Firestore write |

---

### Teacher Profile (`TeacherProfile.jsx`)

```javascript
// Fetch
const snap = await getDoc(doc(db, "teachers", user.uid));
setProfile(snap.data());

// Edit & save
await updateDoc(doc(db, "teachers", user.uid), { name, phone, subject });
```

---

### Class Management (`ClassManagement.jsx`)

```javascript
// Load teacher's classes — real-time
const q = query(
  collection(db, "classes"),
  where("teacherId", "==", user.uid),
  orderBy("date", "asc")
);
const unsub = onSnapshot(q, snap => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

// Add class
await addDoc(collection(db, "classes"), {
  courseId, teacherId: user.uid, topic, date, time,
  meetingLink, createdAt: serverTimestamp(),
});

// Edit class
await updateDoc(doc(db, "classes", classId), { topic, date, time, meetingLink });

// Delete class
await deleteDoc(doc(db, "classes", classId));
// ↑ All student ClassDashboard onSnapshot listeners update automatically
```

---

### Academic Content (`AcademicContent.jsx`)

```javascript
// Upload Notes
const storageRef = ref(storage, `notes/${courseId}/${file.name}`);
const { ref: r } = await uploadBytes(storageRef, file);
const fileURL = await getDownloadURL(r);
await addDoc(collection(db, "notes"), {
  courseId, teacherId: user.uid, title, fileURL, uploadedAt: serverTimestamp(),
});

// Upload Assignment
const aRef = ref(storage, `assignments/${courseId}/${file.name}`);
const fileURL = await getDownloadURL((await uploadBytes(aRef, file)).ref);
await addDoc(collection(db, "assignments"), {
  courseId, teacherId: user.uid, title, description, dueDate, fileURL,
});

// Create Test (no file — just a link)
await addDoc(collection(db, "tests"), {
  courseId, teacherId: user.uid, title, link, availableFrom, availableTo,
});
```

---

### Evaluation (`Evaluation.jsx`)

```javascript
// Load submissions for teacher's courses
const subs = await getDocs(
  query(collection(db, "submissions"), where("courseId", "in", teacher.courseIds))
);
// Join with /assignments and /students for names

// Submit marks & feedback
await updateDoc(doc(db, "submissions", submissionId), {
  marks: Number(marks), feedback, gradedAt: serverTimestamp(),
});
// ↑ Automatically reflects in student's Progress Dashboard
```

---

### Attendance Marking (`TeacherAttendance.jsx`)

```javascript
// Get enrolled students for course
const courseSnap = await getDoc(doc(db, "courses", courseId));
const { enrolledStudents } = courseSnap.data(); // [uid1, uid2, ...]

// Fetch student names
const students = await Promise.all(
  enrolledStudents.map(uid => getDoc(doc(db, "students", uid)))
);

// Submit attendance — batch write
const batch = writeBatch(db);
attendanceList.forEach(({ studentId, status }) => {
  const ref = doc(collection(db, "attendance"));
  batch.set(ref, {
    classId, studentId, teacherId: user.uid,
    date: selectedDate, status, // "Present" | "Absent" | "Late"
    createdAt: serverTimestamp(),
  });
});
await batch.commit();
```

---

### Syllabus Upload (`Syllabus.jsx`)

```javascript
// Upload to Storage
const sRef = ref(storage, `syllabus/${courseId}/syllabus.pdf`);
const fileURL = await getDownloadURL((await uploadBytes(sRef, file)).ref);

// Update course with PDF URL
await updateDoc(doc(db, "courses", courseId), { syllabusURL: fileURL });
```

---

## 🛠️ ADMIN MODULE

### Current Hardcoded Data (needs replacing)

| File | Hardcoded Variable | Replace With |
|---|---|---|
| `AdminDashboard.jsx` | Static stats (142 students, 9 teachers) | Firestore aggregate queries |
| `StudentManagement.jsx` | Static student table | Firestore read all `/students` |
| `ClassScheduling.jsx` | Static schedule list | Firestore read all `/classes` |
| `CourseManagement.jsx` | Static course list | Firestore read all `/courses` |
| `Reports.jsx` | Static report data | Firestore aggregate reads |
| `Announcements.jsx` | Static announcement list | Firestore read/write `/announcements` |

---

### Student Management (`StudentManagement.jsx`)

```javascript
// Load all students
const snap = await getDocs(collection(db, "students"));
setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));

// Edit student
await updateDoc(doc(db, "students", studentId), updatedFields);

// Delete student
await deleteDoc(doc(db, "students", studentId));
// Also remove from enrolled course:
await updateDoc(doc(db, "courses", student.courseId), {
  enrolledStudents: arrayRemove(studentId),
});

// Monthly approval batch
const batch = writeBatch(db);
studentsToApprove.forEach(id => batch.update(doc(db, "students", id), { status: "active" }));
await batch.commit();
```

---

### Course Management (`CourseManagement.jsx`)

```javascript
// Load courses
const snap = await getDocs(collection(db, "courses"));
setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));

// Add course
await addDoc(collection(db, "courses"), {
  name, description, enrolledStudents: [],
  createdAt: serverTimestamp(),
});

// Update course
await updateDoc(doc(db, "courses", courseId), { name, description });
```

---

### Class Scheduling (`ClassScheduling.jsx`)

```javascript
// Same CRUD as Teacher ClassManagement but without teacherId filter
// Changes propagate instantly to all student/teacher onSnapshot listeners

const snap = await getDocs(collection(db, "classes"));
// Join with course and teacher names for display
```

---

### Reports (`Reports.jsx`)

```javascript
// Attendance report — filterable
const q = query(
  collection(db, "attendance"),
  where("date", ">=", startDate),
  where("date", "<=", endDate),
  where("courseId", "==", selectedCourse)
);
const records = (await getDocs(q)).docs.map(d => d.data());
// Export to CSV using PapaParse: Papa.unparse(records)

// Progress report — test scores with student names
const scores = await getDocs(collection(db, "testScores"));
// Join with /students for names, compare score vs targetAggregate
```

---

### Announcements (`Announcements.jsx`)

```javascript
// Create announcement
await addDoc(collection(db, "announcements"), {
  type: "public" | "group" | "individual",
  targetId: courseId | userId | null,
  title, body,
  createdBy: admin.uid,
  createdAt: serverTimestamp(),
});

// Student/Teacher fetches on login (merge all three queries):
const [pub, group, individual] = await Promise.all([
  getDocs(query(collection(db, "announcements"), where("type", "==", "public"))),
  getDocs(query(collection(db, "announcements"), where("type", "==", "group"), where("targetId", "==", user.courseId))),
  getDocs(query(collection(db, "announcements"), where("type", "==", "individual"), where("targetId", "==", user.uid))),
]);
// Merge, sort by createdAt desc, show in notification bell
```

---

## ⚙️ TECHNICAL GUIDELINES

### When to use `onSnapshot` (real-time) vs `getDocs` (one-time)

| Use `onSnapshot` | Use `getDocs` |
|---|---|
| Chat messages | Profile loads |
| Class schedule (student & teacher views) | Registration dropdowns |
| Announcements bell | Report generation |
| Task list updates | Initial data fetch on page load |

### Firebase Storage Folder Structure

```
submissions/{studentId}/{assignmentId}/{filename}
notes/{courseId}/{filename}
assignments/{courseId}/{filename}
syllabus/{courseId}/syllabus.pdf
chats/{chatId}/{filename}
```

### Firestore Security Rules (target state)

```
students/{uid}       → read/write: request.auth.uid == uid (student own doc)
                     → read: admin or teacher (for their course students)
teachers/{id}        → read: anyone (login validation)
                     → write: admin (Firebase Auth user in admins collection)
admins/{uid}         → read/write: request.auth != null
classes/{classId}    → read: authenticated users
                     → write: teacher (uid matches teacherId) or admin
assignments/{id}     → read: authenticated users
                     → write: teacher or admin
submissions/{id}     → read/write: student (own) or teacher (for their course)
attendance/{id}      → read: student (own), teacher, admin
                     → write: teacher or admin
announcements/{id}   → read: authenticated users
                     → write: admin only
```

### Cloud Functions Needed

| Function | Trigger | Purpose |
|---|---|---|
| `generateSchedule` | HTTP POST | Calls Gemini API with student profile + tasks → returns JSON schedule |
| `sendWeeklyProgressEmail` | HTTP POST (admin-triggered) | Reads scores/attendance per student → emails parentEmail via SendGrid |

### UI Libraries

| Feature | Library |
|---|---|
| Class calendar | `react-big-calendar` or `FullCalendar` |
| Progress charts | `recharts` (LineChart, BarChart) |
| File export (reports) | `papaparse` (CSV) or `xlsx` (Excel) |
| PDF viewer (syllabus) | Open Firebase Storage URL in new tab or embed `<iframe>` |
