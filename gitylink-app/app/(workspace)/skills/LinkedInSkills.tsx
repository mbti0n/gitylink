"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

type LinkedInSkill = {
  name: string;
  endorsements?: number;
};

const STORAGE_KEY = "gitylink:linkedin-skills";
const STORAGE_ERROR = "__gitylink_linkedin_skills_storage_error__";
const SKILLS_CHANGE_EVENT = "gitylink-linkedin-skills-change";

function subscribeToSkills(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SKILLS_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SKILLS_CHANGE_EVENT, callback);
  };
}

function getSavedSkillsSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return STORAGE_ERROR;
  }
}

function parseLinkedInSkills(value: string): LinkedInSkill[] {
  const skills: LinkedInSkill[] = [];
  const ignoredLine = /^(skills?|top skills|show all skills|see all skills)$/i;
  const endorsementLine = /^([\d,]+)\s+endorsements?$/i;

  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine
      .trim()
      .replace(/^[•●▪*-]\s*/, "")
      .replace(/\s+/g, " ");

    if (!line || ignoredLine.test(line) || /^endorsed by\b/i.test(line)) {
      continue;
    }

    const standaloneEndorsements = line.match(endorsementLine);
    if (standaloneEndorsements && skills.length > 0) {
      skills[skills.length - 1].endorsements = Number(
        standaloneEndorsements[1].replaceAll(",", ""),
      );
      continue;
    }

    const endorsementMatch = line.match(
      /(?:\s*[·|,–-]\s*|\s*\()([\d,]+)\s+endorsements?\)?$/i,
    );
    const name = line
      .replace(/(?:\s*[·|,–-]\s*|\s*\()[\d,]+\s+endorsements?\)?$/i, "")
      .trim();

    if (!name || /endorsements?/i.test(name)) {
      continue;
    }

    const existingSkill = skills.find(
      (skill) => skill.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (existingSkill) {
      if (endorsementMatch) {
        existingSkill.endorsements = Number(
          endorsementMatch[1].replaceAll(",", ""),
        );
      }
      continue;
    }

    skills.push({
      name,
      ...(endorsementMatch
        ? { endorsements: Number(endorsementMatch[1].replaceAll(",", "")) }
        : {}),
    });
  }

  return skills;
}

function isLinkedInSkill(value: unknown): value is LinkedInSkill {
  if (typeof value !== "object" || value === null || !("name" in value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    (!("endorsements" in value) ||
      (typeof value.endorsements === "number" &&
        Number.isFinite(value.endorsements) &&
        value.endorsements >= 0))
  );
}

export default function LinkedInSkills() {
  const savedSkillsSnapshot = useSyncExternalStore(
    subscribeToSkills,
    getSavedSkillsSnapshot,
    () => null,
  );
  const storedSkills = useMemo(() => {
    if (savedSkillsSnapshot === STORAGE_ERROR) {
      return {
        skills: [],
        error: "Could not access browser storage for LinkedIn skills.",
      };
    }

    if (savedSkillsSnapshot === null) {
      return { skills: [], error: "" };
    }

    try {
      const parsed: unknown = JSON.parse(savedSkillsSnapshot);
      if (!Array.isArray(parsed) || !parsed.every(isLinkedInSkill)) {
        throw new Error("Saved LinkedIn skills have an invalid format.");
      }
      return { skills: parsed, error: "" };
    } catch {
      return {
        skills: [],
        error: "Could not load saved LinkedIn skills. You can import them again below.",
      };
    }
  }, [savedSkillsSnapshot]);
  const skills = storedSkills.skills;
  const [pastedSkills, setPastedSkills] = useState("");
  const [message, setMessage] = useState("");

  function saveSkills(nextSkills: LinkedInSkill[]) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSkills));
      window.dispatchEvent(new Event(SKILLS_CHANGE_EVENT));
      setMessage("");
      return true;
    } catch {
      setMessage(
        "Could not save skills in this browser. Check its storage settings and try again.",
      );
      return false;
    }
  }

  function importSkills(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const importedSkills = parseLinkedInSkills(pastedSkills);

    if (importedSkills.length === 0) {
      setMessage("No skills found. Paste the skill names from your LinkedIn profile and try again.");
      return;
    }

    const combinedSkills = [...skills];
    for (const importedSkill of importedSkills) {
      const existingIndex = combinedSkills.findIndex(
        (skill) =>
          skill.name.toLocaleLowerCase() ===
          importedSkill.name.toLocaleLowerCase(),
      );
      if (existingIndex === -1) {
        combinedSkills.push(importedSkill);
      } else if (importedSkill.endorsements !== undefined) {
        combinedSkills[existingIndex] = importedSkill;
      }
    }

    if (saveSkills(combinedSkills)) {
      setPastedSkills("");
      setMessage(
        `Imported ${importedSkills.length} LinkedIn skill${importedSkills.length === 1 ? "" : "s"}.`,
      );
    }
  }

  function removeSkill(skillToRemove: LinkedInSkill) {
    saveSkills(skills.filter((skill) => skill.name !== skillToRemove.name));
  }

  function clearSkills() {
    if (saveSkills([])) {
      setMessage("Imported LinkedIn skills cleared.");
    }
  }

  return (
    <section className="linkedin-skills-panel" aria-labelledby="linkedin-skills-title">
      <div className="linkedin-skills-header">
        <div>
          <h2 id="linkedin-skills-title">LinkedIn profile skills</h2>
          <p>
            Paste the skills copied from your LinkedIn profile to keep them with
            your GitHub skill evidence.
          </p>
        </div>
        {skills.length > 0 && (
          <button
            type="button"
            className="linkedin-clear-btn"
            onClick={clearSkills}
          >
            Clear imported skills
          </button>
        )}
      </div>

      <form className="linkedin-import-form" onSubmit={importSkills}>
        <label htmlFor="linkedin-skills-input">
          Paste skill names, one per line. Endorsement counts are kept when included.
        </label>
        <textarea
          id="linkedin-skills-input"
          value={pastedSkills}
          onChange={(event) => setPastedSkills(event.target.value)}
          placeholder={"React\nTypeScript · 12 endorsements\nProject Management"}
          rows={4}
        />
        <div className="linkedin-import-actions">
          <span>LinkedIn doesn&apos;t provide this app access to profile skills automatically.</span>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!pastedSkills.trim()}
          >
            Import skills
          </button>
        </div>
      </form>

      {(message || storedSkills.error) && (
        <p className="linkedin-import-message" role="status">
          {message || storedSkills.error}
        </p>
      )}

      {skills.length > 0 ? (
        <ul className="linkedin-skill-list" aria-label="Imported LinkedIn skills">
          {skills.map((skill) => (
            <li key={skill.name} className="linkedin-skill-chip">
              <span>{skill.name}</span>
              {skill.endorsements !== undefined && (
                <span className="linkedin-endorsement-count">
                  {skill.endorsements.toLocaleString()} endorsements
                </span>
              )}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                aria-label={`Remove ${skill.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="linkedin-empty-state">
          Imported skills will appear here and stay saved in this browser.
        </p>
      )}
    </section>
  );
}
