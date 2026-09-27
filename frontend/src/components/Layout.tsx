import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "../lib/auth";

export default function Layout() {
  const user = getUser();
  const navigate = useNavigate();

  function logout() {
    clearAuth();
    navigate("/login");
  }

  const studentLinks = [
    { to: "/dashboard", label: "Overview" },
    { to: "/assessments", label: "Assessments" },
    { to: "/interviews", label: "Interviews" },
  ];

  const mentorLinks = [
    { to: "/mentor/review", label: "Review Queue" },
    { to: "/mentor/interventions", label: "Interventions" },
  ];

  const adminLinks = [
    { to: "/admin/cohorts", label: "Cohorts" },
    { to: "/admin/questions", label: "Questions" },
    { to: "/admin/competencies", label: "Competencies" },
    { to: "/admin/scripts", label: "Scripts" },
  ];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900 text-sm">CS Platform</span>
            <div className="flex gap-1">
              {studentLinks.map((l) => <NavLink key={l.to} to={l.to} className={navClass}>{l.label}</NavLink>)}
              {(user?.role === "MENTOR" || user?.role === "ADMIN") &&
                mentorLinks.map((l) => <NavLink key={l.to} to={l.to} className={navClass}>{l.label}</NavLink>)}
              {user?.role === "ADMIN" &&
                adminLinks.map((l) => <NavLink key={l.to} to={l.to} className={navClass}>{l.label}</NavLink>)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{user?.name} · {user?.role}</span>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-800">Logout</button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
