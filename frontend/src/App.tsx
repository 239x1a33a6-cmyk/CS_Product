import { Routes, Route, Navigate } from "react-router-dom";
import { getUser } from "./lib/auth";
import Layout from "./components/Layout";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import DashboardPage from "./pages/Dashboard";
import AssessmentsPage from "./pages/Assessments";
import AssessmentDetailPage from "./pages/AssessmentDetail";
import InterviewsPage from "./pages/Interviews";
import InterviewSessionPage from "./pages/InterviewSession";
import AdminCohortsPage from "./pages/admin/Cohorts";
import AdminQuestionsPage from "./pages/admin/Questions";
import AdminCompetenciesPage from "./pages/admin/Competencies";
import AdminScriptsPage from "./pages/admin/Scripts";
import MentorReviewPage from "./pages/mentor/Review";
import MentorInterventionsPage from "./pages/mentor/Interventions";

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="assessments/:id" element={<AssessmentDetailPage />} />
        <Route path="interviews" element={<InterviewsPage />} />
        <Route path="interviews/:id" element={<InterviewSessionPage />} />

        {/* Mentor routes */}
        <Route path="mentor/review" element={<RequireAuth roles={["MENTOR","ADMIN"]}><MentorReviewPage /></RequireAuth>} />
        <Route path="mentor/interventions" element={<RequireAuth roles={["MENTOR","ADMIN"]}><MentorInterventionsPage /></RequireAuth>} />

        {/* Admin routes */}
        <Route path="admin/cohorts" element={<RequireAuth roles={["ADMIN"]}><AdminCohortsPage /></RequireAuth>} />
        <Route path="admin/questions" element={<RequireAuth roles={["ADMIN"]}><AdminQuestionsPage /></RequireAuth>} />
        <Route path="admin/competencies" element={<RequireAuth roles={["ADMIN"]}><AdminCompetenciesPage /></RequireAuth>} />
        <Route path="admin/scripts" element={<RequireAuth roles={["ADMIN"]}><AdminScriptsPage /></RequireAuth>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
