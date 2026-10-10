"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function WorkspaceShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <main className={`dashboard-page${collapsed ? " is-collapsed" : ""}`}>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        id="workspace-sidebar"
        onClick={(event) => {
          if (mobileOpen && event.target instanceof Element && event.target.closest("a[href]")) {
            setMobileOpen(false);
          }
        }}
        className={[
          "sidebar-shell",
          collapsed && "is-collapsed",
          mobileOpen && "is-mobile-open",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {mobileOpen && (
          <button
            className="mobile-sidebar-close"
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
        {sidebar}
        <button
          className="sidebar-toggle"
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="workspace-sidebar"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((current) => !current)}
        >
          <span aria-hidden="true">{collapsed ? "›" : "‹"}</span>
        </button>
      </div>

      <div className="workspace-main">
        <div className="mobile-menu-bar">
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="workspace-sidebar"
            onClick={() => setMobileOpen((current) => !current)}
          >
            <span className="hamburger-icon" aria-hidden="true">
              ☰
            </span>
            <span>Menu</span>
          </button>
        </div>
        {children}
      </div>
    </main>
  );
}
