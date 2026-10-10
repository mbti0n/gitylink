"use client";

import { useState } from "react";

type SoundSummary = {
  headline: string;
  summary: string;
  musicTaste: string;
  genres: string[];
};

export default function ProfileSoundSummary({
  hasRepositories,
}: {
  hasRepositories: boolean;
}) {
  const [summary, setSummary] = useState<SoundSummary | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateSummary() {
    setIsGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/profile-sound-summary", {
        method: "POST",
      });
      const result = (await response.json()) as {
        summary?: SoundSummary;
        error?: string;
      };
      if (!response.ok || !result.summary) {
        throw new Error(result.error || "Could not write your GitHub sound summary.");
      }
      setSummary(result.summary);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not write your GitHub sound summary.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="profile-sound-card" aria-labelledby="profile-sound-heading">
      <div className="profile-sound-disc" aria-hidden="true">♫</div>
      <div className="profile-sound-content">
        <p className="record-eyebrow">THE ALGORITHM HAS LINER NOTES</p>
        {summary ? (
          <>
            <h2 id="profile-sound-heading">{summary.headline}</h2>
            <p className="profile-sound-summary">{summary.summary}</p>
            <p className="profile-sound-taste">
              <strong>Soundtrack guess:</strong> {summary.musicTaste}
            </p>
            <div className="profile-sound-genres" aria-label="Suggested genres">
              {summary.genres.map((genre) => <span key={genre}>{genre}</span>)}
            </div>
          </>
        ) : (
          <>
            <h2 id="profile-sound-heading">Your repos have a type. Probably.</h2>
            <p className="profile-sound-summary">
              Get a playful AI read on your GitHub projects—and the music they seem to have on repeat.
            </p>
          </>
        )}
        {error && <p className="profile-sound-error" role="alert">{error}</p>}
        <button
          className="record-button record-button-primary profile-sound-button"
          type="button"
          onClick={() => void generateSummary()}
          disabled={isGenerating || !hasRepositories}
        >
          {isGenerating
            ? "Reading the record collection…"
            : summary
              ? "↻ Remix my profile"
              : "♫ Read my GitHub in stereo"}
        </button>
        {!hasRepositories && (
          <p className="profile-sound-hint">Connect GitHub and add public repositories to get started.</p>
        )}
        <p className="profile-sound-disclaimer">
          Music taste is a playful guess based on your public repos, not your listening history.
        </p>
      </div>
    </section>
  );
}
