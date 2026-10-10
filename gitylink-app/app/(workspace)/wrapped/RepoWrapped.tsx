"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BeatCat from "@/components/BeatCat";
import type { GitHubMoodProfile } from "@/lib/github-mood";

type Props = {
  mood: GitHubMoodProfile;
};

const slideDuration = 5200;

// A full-height, story-style "year in review" of the GitHub profile. The last card is the
// coding mood, which the Rhythm Arcade composes from (/rhythm?mood=play starts it right away).
export default function RepoWrapped({ mood }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const lastIndex = mood.cards.length - 1;
  const isFinale = index === lastIndex;
  const card = mood.cards[index];

  const goTo = (next: number) => setIndex(Math.max(0, Math.min(lastIndex, next)));

  // Auto-advance like a story, stopping on the mood card
  useEffect(() => {
    if (isFinale || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setIndex((current) => current + 1), slideDuration);
    return () => window.clearTimeout(timer);
  }, [index, isFinale, paused]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setIndex((current) => Math.min(lastIndex, current + 1));
      if (event.key === "ArrowLeft") setIndex((current) => Math.max(0, current - 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lastIndex]);

  return (
    <section
      className={`wrapped-stage ${isFinale ? "tone-finale" : `tone-${index % 4}`}${paused ? " is-paused" : ""}`}
      aria-roledescription="carousel"
      aria-label={`Repo Wrapped for @${mood.login}`}
    >
      <div className="wrapped-progress" aria-hidden="true">
        {mood.cards.map((item, cardIndex) => (
          <span
            key={item.kicker}
            className={cardIndex < index ? "is-done" : cardIndex === index ? "is-active" : ""}
          />
        ))}
      </div>

      <header className="wrapped-topline">
        <span>REPO WRAPPED · @{mood.login}</span>
        <span className="wrapped-topline-actions">
          <span>
            {index + 1} / {mood.cards.length}
          </span>
          {!isFinale && (
            <button type="button" onClick={() => setPaused((current) => !current)}>
              {paused ? "▶ Play" : "❚❚ Pause"}
            </button>
          )}
        </span>
      </header>

      {/* Tap the left side to go back and the right side to go forward, like a story */}
      <button
        type="button"
        className="wrapped-tap wrapped-tap-back"
        aria-label="Previous card"
        disabled={index === 0}
        onClick={() => goTo(index - 1)}
      />
      <button
        type="button"
        className="wrapped-tap wrapped-tap-next"
        aria-label="Next card"
        disabled={isFinale}
        onClick={() => goTo(index + 1)}
      />

      <div className="wrapped-slide" key={index} aria-live="polite">
        <p className="wrapped-kicker">{card.kicker}</p>
        <strong className="wrapped-stat">{card.stat}</strong>
        <p className="wrapped-line">{card.line}</p>

        {isFinale && (
          <>
            <dl className="wrapped-summary">
              {mood.cards.slice(0, -1).map((item) => (
                <div key={item.kicker}>
                  <dt>{item.kicker}</dt>
                  <dd>{item.stat}</dd>
                </div>
              ))}
              <div>
                <dt>Your sound</dt>
                <dd>
                  {mood.genre} · {mood.bpmMin}–{mood.bpmMax} BPM
                </dd>
              </div>
            </dl>
            <div className="wrapped-actions">
              <Link href="/rhythm?mood=play" className="wrapped-cta">
                ▶ Play my mood in the Rhythm Arcade
              </Link>
              <button type="button" className="wrapped-replay" onClick={() => setIndex(0)}>
                ↺ Watch again
              </button>
            </div>
          </>
        )}
      </div>

      <div className="wrapped-art" aria-hidden="true">
        <span className="wrapped-disc" />
        <BeatCat mood={isFinale ? "excited" : "listening"} />
      </div>
    </section>
  );
}
