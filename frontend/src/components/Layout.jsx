import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

const Layout = ({ children }) => {
  const { user, logout, isStudent } = useAuth();

  const navItems = useMemo(() => {
    if (isStudent) {
      return [
        { to: "/portal", label: "Student Portal" },
        { to: "/assignments", label: "Assignments" },
        { to: "/community", label: "Community" }
      ];
    }
    const links = [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/students", label: "Students" },
      { to: "/courses", label: "Courses" },
      { to: "/assignments", label: "Assignments" },
      { to: "/facilities", label: "Facilities" },
      { to: "/community", label: "Community" }
    ];
    if (user?.role === "admin") {
      links.push({ to: "/staff", label: "Staff" });
    }
    if (user?.role === "admin" || user?.role === "doctor") {
      links.push({ to: "/staff-management", label: "Staff Management" });
    }
    return links;
  }, [isStudent, user?.role]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="brand__mark">U</span>
          <div>
            <p className="brand__name">CampusFlow</p>
            <p className="brand__caption">University Suite</p>
          </div>
        </div>

        <div className="sidebar__user">
          <p className="muted-text">{user?.name}</p>
          <span className="role-pill">{user?.role}</span>
        </div>

        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link${isActive ? " nav-link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="btn btn--ghost" type="button" onClick={logout}>
          Logout
        </button>

        <div className="sidebar__footer">
          <p className="muted-text">Academic Year 2024</p>
          <p className="muted-text">Registrar’s Office</p>
        </div>
      </aside>

      <div className="app-content">
        <header className="app-header">
          <div>
            <p className="eyebrow">University Management</p>
            <h1>Campus Operations Center</h1>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
