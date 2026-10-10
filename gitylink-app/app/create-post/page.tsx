const templateIdeas = [
  "Launch update",
  "Team milestone",
  "Technical deep dive",
  "Product announcement",
];

const postStats = [
  { label: "Reach", value: "8.4k" },
  { label: "Engagement", value: "12.8%" },
  { label: "Read time", value: "2 min" },
];

export default function CreatePostPage() {
  return (
    <main className="create-page-shell">
      <aside className="create-sidebar">
        <div className="create-brand">
          <div className="brand-mark">↗</div>
          <div className="brand-text">
            <span className="brand-title">commit</span>
            <span className="brand-subtitle">to post</span>
          </div>
        </div>

        <div className="mini-nav">
          <button type="button" className="mini-item active">
            <span>✎</span>
            <span>Draft</span>
          </button>
          <button type="button" className="mini-item">
            <span>◎</span>
            <span>Templates</span>
          </button>
          <button type="button" className="mini-item">
            <span>▣</span>
            <span>AI ideas</span>
          </button>
        </div>

        <div className="template-card">
          <span className="section-kicker">Templates</span>
          <div className="template-list">
            {templateIdeas.map((idea) => (
              <button key={idea} type="button" className="template-pill">
                {idea}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="composer-panel">
        <header className="composer-header">
          <div>
            <p className="eyebrow">Workspace / Post studio</p>
            <h1>Draft a post</h1>
          </div>
          <div className="header-actions">
            <button type="button" className="ghost-btn">
              Save draft
            </button>
            <button type="button" className="primary-btn">
              Publish
            </button>
          </div>
        </header>

        <div className="composer-body">
          <div className="editor-card">
            <div className="field-row">
              <label className="field-label">Repository</label>
              <div className="input-like">portfolio-website</div>
            </div>

            <div className="field-row">
              <label className="field-label">Headline</label>
              <input
                className="text-input"
                defaultValue="Shipped my new personal portfolio"
              />
            </div>

            <div className="field-row">
              <label className="field-label">Story</label>
              <textarea
                className="text-area"
                defaultValue={
                  "I redesigned my portfolio around cleaner UX patterns, shipped a mobile-first experience, and built the launch flow to feel polished and fast."
                }
              />
            </div>

            <div className="field-row tags-row">
              <label className="field-label">Tags</label>
              <div className="tag-row">
                <span className="tag">React</span>
                <span className="tag">TypeScript</span>
                <span className="tag">Design</span>
              </div>
            </div>
          </div>

          <aside className="preview-card">
            <div className="preview-header">
              <span className="preview-badge">AI preview</span>
              <button type="button" className="ghost-btn small">Regenerate</button>
            </div>

            <div className="preview-post">
              <div className="preview-topline">
                <span className="repo-bullet">⌁</span>
                <span>portfolio-website</span>
                <span className="preview-time">2 hours ago</span>
              </div>

              <h2>Shipped my new personal portfolio</h2>
              <p>
                I redesigned my portfolio around cleaner UX patterns, shipped a
                mobile-first experience, and built the launch flow to feel polished
                and fast.
              </p>

              <div className="tag-row preview-tags">
                <span className="tag">React</span>
                <span className="tag">TypeScript</span>
              </div>
            </div>

            <div className="stats-grid mini-stats">
              {postStats.map((stat) => (
                <div key={stat.label} className="mini-stat">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
