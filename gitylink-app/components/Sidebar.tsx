import SidebarNav, { SettingsLink } from "./SidebarNav";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-wrap">
        <div className="brand-mark">↗</div>
        <div className="brand-text">
          <span className="brand-title">commit</span>
          <span className="brand-subtitle">to post</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-label">WORKSPACE</div>
        <SidebarNav />
      </div>

      <div className="sidebar-section sidebar-bottom">
        <div className="section-label">SETTINGS</div>
        <SettingsLink />
        <button className="nav-item compact" type="button">
          <span className="nav-icon">ⓘ</span>
          <span>Help &amp; feedback</span>
        </button>
      </div>

      <div className="account-card">
        <div className="avatar">JD</div>
        <div className="account-meta">
          <span className="account-name">Your account</span>
          <span className="account-status">GitHub connected</span>
        </div>
      </div>
    </aside>
  );
}
