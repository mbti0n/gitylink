"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { GitHubRepository } from "@/lib/github-repositories";

const coverStorageKey = (repositoryId: number) =>
  `repo-radio:album-cover:${repositoryId}`;

export default function RepositoryAlbumArt({
  repository,
  compact = false,
}: {
  repository: GitHubRepository;
  compact?: boolean;
}) {
  const [cover, setCover] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      try {
        const storedCover = window.localStorage.getItem(coverStorageKey(repository.id));
        if (!cancelled) setCover(storedCover ?? "");
      } catch {
        if (!cancelled) {
          setError("Browser storage is unavailable; generated art won’t be saved.");
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [repository.id]);

  async function generateCover() {
    setIsGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/repository-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: repository.id }),
      });
      const result = (await response.json()) as {
        data?: string;
        mimeType?: string;
        error?: string;
      };
      if (!response.ok || !result.data || !result.mimeType) {
        throw new Error(result.error || "Could not generate the album cover.");
      }

      const original = `data:${result.mimeType};base64,${result.data}`;
      const optimized = await optimizeCover(original);
      setCover(optimized);
      try {
        window.localStorage.setItem(coverStorageKey(repository.id), optimized);
      } catch {
        setError("Cover generated, but browser storage is full; it won’t persist after refresh.");
      }
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate the album cover.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className={`album-art${compact ? " compact" : ""}`}>
      {cover ? (
        <Image
          src={cover}
          alt={`AI-generated album cover inspired by ${repository.name}`}
          fill
          sizes={compact ? "180px" : "(max-width: 680px) 45vw, 280px"}
          unoptimized
        />
      ) : (
        <div className={`album-art-placeholder art-color-${repository.id % 6}`}>
          <span className="art-orbit art-orbit-one" />
          <span className="art-orbit art-orbit-two" />
          <span className="art-sticker">SIDE A</span>
          <span className="art-glyph" aria-hidden="true">✳</span>
          <span className="art-placeholder-label">Your next cover</span>
        </div>
      )}
      <button
        type="button"
        className="album-art-action"
        onClick={generateCover}
        disabled={isGenerating}
        aria-label={`${cover ? "Regenerate" : "Generate"} album cover for ${repository.name}`}
      >
        {isGenerating ? (
          <>
            <span className="cover-spinner" /> Painting…
          </>
        ) : cover ? (
          "↻ Remix cover"
        ) : (
          "✦ Make cover"
        )}
      </button>
      {error && <span className="album-art-error" role="status">{error}</span>}
    </div>
  );
}

async function optimizeCover(dataUrl: string): Promise<string> {
  const response = await fetch(dataUrl);
  const bitmap = await createImageBitmap(await response.blob());
  const edge = 640;
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not prepare the generated album cover.");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}
