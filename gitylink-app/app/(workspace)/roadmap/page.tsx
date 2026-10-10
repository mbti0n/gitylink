import type { Metadata } from "next";

const roadmapMetrics = [
  { icon: "◎", value: "6", label: "Active milestones", tone: "blue" },
  { icon: "▣", value: "3", label: "Roles targeted", tone: "green" },
  { icon: "◌", value: "12", label: "Skills in focus", tone: "amber" },
  { icon: "↗", value: "86%", label: "Readiness score", tone: "blue" },
];

const milestones = [
  {
    quarter: "Q3 2026",
    status: "current",
    statusLabel: "In progress",
    title: "Ship a polished full-stack portfolio",
    description:
      "Wrap up your strongest projects with measurable outcomes, clear architecture decisions, and deploy-ready documentation.",
    tags: ["React", "Next.js", "Product design"],
  },
  {
    quarter: "Q4 2026",
    status: "upcoming",
    statusLabel: "Next",
    title: "Target mid-level product engineering roles",
    description:
      "Build a focused application story around impact, collaboration, and rapid delivery across product, platform, and infra work.",
    tags: ["Interview prep", "System design", "Leadership"],
  },
  {
    quarter: "Q1 2027",
    status: "upcoming",
    statusLabel: "Planned",
    title: "Expand into infrastructure and AI workflows",
    description:
      "Use your GitHub work to deepen expertise in automation, developer experience, and AI-enabled product tooling.",
    tags: ["AI", "DevEx", "Cloud"],
  },
  {
    quarter: "Q2 2027",
    status: "future",
    statusLabel: "Stretch",
    title: "Step into a senior engineer or staff-track role",
    description:
      "Lead strategic technical initiatives, mentor peers, and translate deep systems knowledge into business impact.",
    tags: ["Mentoring", "Architecture", "Strategy"],
  },
];

const focusAreas = [
  {
    title: "Core technical depth",
    blurb: "Keep sharpening backend systems, API design, and deployment workflows.",
    value: "Strong",
  },
  {
    title: "Communication and story",
    blurb: "Turn project wins into structured case studies and polished post content.",
    value: "Improving",
  },
  {
    title: "Career positioning",
    blurb: "Align your profile with the exact roles and teams you want to attract.",
    value: "Priority",
  },
];

export const metadata: Metadata = {
  title: "Career roadmap · Gitylink",
};

export default function CareerRoadmapPage() {
  return (
    <section className="content-panel">

      <div className="page-content">
        <div className="page-heading">
          <div className="page-intro">
            <p className="eyebrow">Growth plan</p>
            <h1>Career roadmap</h1>
            <p>Turn your momentum into a clear path toward the next role you want.</p>
          </div>
          <button type="button" className="btn btn-primary">
            +  Add milestone
          </button>
        </div>

        <div className="kpi-grid">
          {roadmapMetrics.map((metric) => (
            <article key={metric.label} className={`stat-card tone-${metric.tone}`}>
              <div className="metric-icon">{metric.icon}</div>
              <div className="metric-number">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
            </article>
          ))}
        </div>

        <div className="roadmap-layout">
          <div className="panel roadmap-panel">
            <div className="panel-header">
              <div>
                <span className="section-label">Milestones</span>
                <h2>Career progression</h2>
              </div>
              <button type="button" className="btn btn-secondary">
                Review plan
              </button>
            </div>

            <div className="roadmap-timeline">
              {milestones.map((milestone) => (
                <article
                  key={milestone.quarter}
                  className={`roadmap-item ${milestone.status}`}
                >
                  <div className="timeline-marker" aria-hidden="true" />
                  <div className="roadmap-content">
                    <div className="roadmap-meta">
                      <span className="status-badge">{milestone.statusLabel}</span>
                      <span>{milestone.quarter}</span>
                    </div>
                    <h3>{milestone.title}</h3>
                    <p>{milestone.description}</p>
                    <div className="tag-row">
                      {milestone.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="panel focus-panel">
            <div className="panel-header">
              <h2>Focus areas</h2>
            </div>

            {focusAreas.map((area) => (
              <div key={area.title} className="focus-card">
                <div className="focus-header">
                  <strong>{area.title}</strong>
                  <span>{area.value}</span>
                </div>
                <p>{area.blurb}</p>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
