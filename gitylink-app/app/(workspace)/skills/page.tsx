import type { Metadata } from "next";
import LinkedInSkills from "./LinkedInSkills";

const skillMetrics = [
  { value: "24", label: "Demonstrated skills", tone: "green" },
  { value: "12", label: "Repositories analyzed", tone: "blue" },
  { value: "7", label: "Ready-to-share stories", tone: "blue" },
];

const skills = [
  {
    name: "React",
    status: "Strong evidence",
    detail: "portfolio-website · dashboard-ui",
    strength: [true, true, true, true, false],
    color: "#f1e05a",
    badge: "Re",
  },
  {
    name: "TypeScript",
    status: "Strong evidence",
    detail: "portfolio-website · bot-dashboard",
    strength: [true, true, true, true, false],
    color: "#3178c6",
    badge: "Ty",
  },
  {
    name: "Node.js",
    status: "Demonstrated",
    detail: "task-manager-api · discord-bot",
    strength: [true, true, true, false, false],
    color: "#f1e05a",
    badge: "No",
  },
  {
    name: "Docker",
    status: "Demonstrated",
    detail: "docker-homelab · dev-containers",
    strength: [true, true, true, false, false],
    color: "#384d54",
    badge: "Do",
  },
  {
    name: "Python",
    status: "Emerging",
    detail: "data-analysis-lab",
    strength: [true, true, false, false, false],
    color: "#3572A5",
    badge: "Py",
  },
  {
    name: "PostgreSQL",
    status: "Emerging",
    detail: "task-manager-api",
    strength: [true, true, false, false, false],
    color: "#336790",
    badge: "Po",
  },
];

const gaps = [
  {
    name: "Testing",
    text: "Add unit tests to a React app",
  },
  {
    name: "CI/CD",
    text: "Deploy using GitHub Actions",
  },
  {
    name: "Accessibility",
    text: "Audit keyboard navigation",
  },
];

export const metadata: Metadata = {
  title: "Skills explorer · Gitylink",
};

export default function SkillsExplorerPage() {
  return (
    <section className="content-panel">
      <main className="skills-page">
        <div className="skills-hero-row">
          <div>
            <h1>Your skills, backed by real work</h1>
            <p>
              See the skills your repositories demonstrate—and what you can share
              with recruiters.
            </p>
          </div>

          <button type="button" className="btn btn-primary skills-share-btn">
            ↗ Share skills
          </button>
        </div>

        <div className="stats-grid skills-stats-grid">
          {skillMetrics.map((metric) => (
            <article key={metric.label} className={`stat-card tone-${metric.tone}`}>
              <div className="metric-number">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
            </article>
          ))}
        </div>

        <LinkedInSkills />

        <div className="skills-layout">
          <div className="skills-grid-panel">
            <div className="skills-heading-row">
              <div>
                <h2>Skills found in your work</h2>
                <p>Evidence automatically linked to commits, files and repositories.</p>
              </div>
            </div>

            <div className="skill-card-grid">
              {skills.map((skill) => (
                <article key={skill.name} className="skill-card">
                  <div className="skill-icon" style={{ backgroundColor: skill.color }}>
                    {skill.badge}
                  </div>

                  <div className="skill-body">
                    <div className="skill-headline">
                      <span
                        className="skill-language-dot"
                        style={{ backgroundColor: skill.color }}
                        aria-hidden="true"
                      />
                      <h3>{skill.name}</h3>
                      <span>{skill.status}</span>
                    </div>
                    <p>{skill.detail}</p>
                    <div className="strength-row" aria-label={`${skill.name} evidence strength`}>
                      {skill.strength.map((active, index) => (
                        <span
                          key={`${skill.name}-${index}`}
                          className={active ? "strength-bar active" : "strength-bar"}
                        />
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="career-readiness-panel">
            <h3>◎ Career readiness</h3>
            <div className="readiness-block">
              <label className="readiness-label" htmlFor="target-role">Target role</label>
              <div className="select-wrap">
                <select id="target-role" name="target-role" defaultValue="Frontend Software Engineer">
                  <option>Frontend Software Engineer</option>
                  <option>Full Stack Engineer</option>
                  <option>Platform Engineer</option>
                </select>
              </div>
            </div>

            <div className="match-row">
              <span>Skills match</span>
              <strong>76%</strong>
            </div>

            <div className="progress-track" aria-label="Skill match progress">
              <span className="progress-fill" />
            </div>

            <div className="readiness-block gap-block">
              <h4>Skills to strengthen</h4>

              {gaps.map((gap) => (
                <div key={gap.name} className="gap-item">
                  <span className="gap-dot" aria-hidden="true" />
                  <div>
                    <div className="gap-name">{gap.name}</div>
                    <div className="gap-text">{gap.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-primary roadmap-btn">
              Build my roadmap →
            </button>
          </aside>
        </div>

        <p className="skills-note">
          Repository skills are inferred from available public evidence.
          LinkedIn profile skills are imported from text you provide and saved
          in this browser.
        </p>
      </main>
    </section>
  );
}
