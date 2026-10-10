const metrics = [
  { icon: "▤", value: "12", label: "Repositories tracked", tone: "blue" },
  { icon: "⌁", value: "148", label: "Commits this month", tone: "green" },
  { icon: "✦", value: "8", label: "Post opportunities", tone: "amber" },
  { icon: "◈", value: "24", label: "Skills discovered", tone: "blue" },
];

const heatmapRows = [
  [0, 1, 0, 2, 3, 3, 1],
  [2, 3, 1, 2, 3, 2, 1],
  [0, 1, 0, 2, 3, 2, 1],
  [2, 3, 1, 2, 2, 3, 1],
  [0, 1, 0, 2, 3, 2, 1],
  [2, 3, 1, 2, 3, 1, 0],
];

const shareCards = [
  {
    repo: "portfolio-website",
    time: "2 hours ago",
    title: "Shipped my new personal portfolio",
    description:
      "You built responsive pages, refined animations, and deployed the finished site.",
    tags: ["React", "TypeScript"],
  },
  {
    repo: "task-manager-api",
    time: "Yesterday",
    title: "Finally fixed JWT authentication",
    description:
      "After several debugging sessions, your authorization flow is working end to end.",
    tags: ["Node.js", "Security"],
  },
  {
    repo: "docker-homelab",
    time: "3 days ago",
    title: "Automated my development environment",
    description:
      "You added container configuration and reduced manual environment setup.",
    tags: ["Docker", "DevOps"],
  },
];

export default function Home() {
  return (
    <main className="dashboard-page">
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
          <nav className="nav-list" aria-label="Sidebar navigation">
            <button className="nav-item active" type="button">
              <span className="nav-icon">▦</span>
              <span>Overview</span>
            </button>
            <button className="nav-item" type="button">
              <span className="nav-icon">◷</span>
              <span>Activity</span>
            </button>
            <button className="nav-item" type="button">
              <span className="nav-icon">✦</span>
              <span>Post studio</span>
            </button>
            <button className="nav-item" type="button">
              <span className="nav-icon">▤</span>
              <span>Repositories</span>
            </button>
            <button className="nav-item" type="button">
              <span className="nav-icon">◈</span>
              <span>Skills explorer</span>
            </button>
            <button className="nav-item" type="button">
              <span className="nav-icon">◎</span>
              <span>Career roadmap</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-section sidebar-bottom">
          <div className="section-label">SETTINGS</div>
          <button className="nav-item compact" type="button">
            <span className="nav-icon">⚙</span>
            <span>Preferences</span>
          </button>
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

      <section className="content-panel">
        <header className="topbar">
          <div className="crumbs">Workspace / Overview</div>
          <div className="search-box">⌕ Search repositories, posts, skills...</div>
        </header>

        <div className="hero-row">
          <div>
            <h1>Good evening, developer 👋</h1>
            <p>Turn your work into stories worth sharing.</p>
          </div>
          <button type="button" className="primary-btn">+ Create a post</button>
        </div>

        <div className="stats-grid">
          {metrics.map((metric) => (
            <article key={metric.label} className={`stat-card tone-${metric.tone}`}>
              <div className="metric-icon">{metric.icon}</div>
              <div className="metric-number">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
            </article>
          ))}
        </div>

        <section className="activity-block">
          <div className="activity-header">
            <div>
              <h2>Your development activity</h2>
              <p>Across all your connected repositories</p>
            </div>
          </div>

          <div className="activity-layout">
            <div className="overview-card">
              <div className="card-header">
                <span>Contribution overview</span>
                <span className="muted">Past 12 weeks</span>
              </div>

              <div className="heatmap" aria-label="Commit activity chart">
                {heatmapRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="heatmap-row">
                    {row.map((cell, colIndex) => (
                      <span
                        key={`${rowIndex}-${colIndex}`}
                        className={`heat-cell level-${cell}`}
                        aria-label={`Activity level ${cell}`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div className="legend">
                <span>Less</span>
                <div className="legend-scale">
                  <span className="heat-cell level-0" />
                  <span className="heat-cell level-1" />
                  <span className="heat-cell level-2" />
                  <span className="heat-cell level-3" />
                </div>
                <span>More</span>
              </div>
            </div>

            <aside className="insight-card">
              <div className="insight-title">✦ This week&apos;s highlight</div>
              <div className="story-tag">Suggested story</div>
              <div className="story-line">You turned 4 days of debugging</div>
              <div className="story-line">into a working auth flow.</div>
              <p>A great learning milestone to share.</p>
              <button type="button" className="secondary-btn">Generate story →</button>
            </aside>
          </div>
        </section>

        <div className="share-header">
          <h3>Ready to share</h3>
          <a href="#">View all →</a>
        </div>

        <div className="share-grid">
          {shareCards.map((card) => (
            <article key={card.repo} className="share-card">
              <div className="share-topline">
                <span className="repo-bullet">⌁</span>
                <span className="repo-name">{card.repo}</span>
                <span className="repo-time">{card.time}</span>
              </div>

              <h4>{card.title}</h4>
              <p>{card.description}</p>

              <div className="tag-row">
                {card.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              <button type="button" className="draft-btn">Draft post →</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
