import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";

// Auth
import RoleSelectModal from "./pages/auth/RoleSelectModal";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

// Student
import StudentRegister from "./pages/student/StudentRegister";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import ClassDashboard from "./pages/student/ClassDashboard";
import ProgressDashboard from "./pages/student/ProgressDashboard";
import StudentChat from "./pages/student/Chat";
import TaskScheduler from "./pages/student/TaskScheduler";
import StudentAttendance from "./pages/student/Attendance";

// Teacher
import TeacherRegister from "./pages/teacher/TeacherRegister";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import ClassManagement from "./pages/teacher/ClassManagement";
import AcademicContent from "./pages/teacher/AcademicContent";
import Evaluation from "./pages/teacher/Evaluation";
import TeacherChat from "./pages/teacher/TeacherChat";
import Syllabus from "./pages/teacher/Syllabus";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentManagement from "./pages/admin/StudentManagement";
import TeacherManagement from "./pages/admin/TeacherManagement";
import ClassScheduling from "./pages/admin/ClassScheduling";
import CourseManagement from "./pages/admin/CourseManagement";
import Reports from "./pages/admin/Reports";
import Announcements from "./pages/admin/Announcements";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/select-role" element={<RoleSelectModal />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Student */}
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/classes" element={<ClassDashboard />} />
        <Route path="/student/progress" element={<ProgressDashboard />} />
        <Route path="/student/chat" element={<StudentChat />} />
        <Route path="/student/tasks" element={<TaskScheduler />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />

        {/* Teacher */}
        <Route path="/teacher/register" element={<TeacherRegister />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/profile" element={<TeacherProfile />} />
        <Route path="/teacher/classes" element={<ClassManagement />} />
        <Route path="/teacher/content" element={<AcademicContent />} />
        <Route path="/teacher/evaluation" element={<Evaluation />} />
        <Route path="/teacher/chat" element={<TeacherChat />} />
        <Route path="/teacher/syllabus" element={<Syllabus />} />
        <Route path="/teacher/attendance" element={<TeacherAttendance />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<StudentManagement />} />
        <Route path="/admin/teachers" element={<TeacherManagement />} />
        <Route path="/admin/scheduling" element={<ClassScheduling />} />
        <Route path="/admin/courses" element={<CourseManagement />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/announcements" element={<Announcements />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
