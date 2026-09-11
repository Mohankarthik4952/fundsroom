import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark">M</div>

          <div>
            <h1>Mini ERP</h1>
            <p>{user?.role || "ADMIN"}</p>
          </div>

          {/* Mobile close button */}
          <button
            className="sidebar-close"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <nav className="nav-list">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={closeSidebar}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={closeSidebar}
          >
            Customers
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={closeSidebar}
          >
            Products
          </NavLink>

          <NavLink
            to="/inventory"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={closeSidebar}
          >
            Inventory
          </NavLink>

          <NavLink
            to="/challans"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={closeSidebar}
          >
            Challans
          </NavLink>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="content-area">
        {/* Mobile top navigation */}
        <div className="mobile-topbar">
          <button
            className="hamburger-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="mobile-brand">
            <strong>Mini ERP</strong>
            <span>{user?.role || "ADMIN"}</span>
          </div>
        </div>

        <div className="topbar">
          <p className="eyebrow">Operations Portal</p>

          <h2>Welcome back, {user?.name || "System Admin"}</h2>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
