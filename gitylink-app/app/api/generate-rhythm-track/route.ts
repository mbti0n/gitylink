import { NextResponse } from "next/server";
import { ai, MODEL } from "@/lib/gemini";

type RhythmTrack = {
  title: string;
  genre: string;
  mood: string;
  bpm: number;
  kick: number[];
  snare: number[];
  hat: number[];
  melody: number[];
};

function isStepList(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length <= 16 &&
    value.every(
      (step) => typeof step === "number" && Number.isInteger(step) && step >= 0 && step < 16,
    ) &&
    new Set(value).size === value.length
  );
}

function isRhythmTrack(value: unknown): value is RhythmTrack {
  if (typeof value !== "object" || value === null) return false;
  const track = value as Record<string, unknown>;
  return (
    typeof track.title === "string" &&
    track.title.trim().length > 0 &&
    track.title.length <= 60 &&
    typeof track.genre === "string" &&
    track.genre.trim().length > 0 &&
    track.genre.length <= 40 &&
    typeof track.mood === "string" &&
    track.mood.trim().length > 0 &&
    track.mood.length <= 60 &&
    typeof track.bpm === "number" &&
    Number.isInteger(track.bpm) &&
    track.bpm >= 80 &&
    track.bpm <= 150 &&
    isStepList(track.kick) &&
    isStepList(track.snare) &&
    isStepList(track.hat) &&
    Array.isArray(track.melody) &&
    track.melody.length === 16 &&
    track.melody.every(
      (note) =>
        typeof note === "number" &&
        Number.isInteger(note) &&
        (note === -1 || (note >= 48 && note <= 84)),
    ) &&
    (track.kick.length > 0 || track.snare.length > 0 || track.hat.length > 0 ||
      track.melody.some((note) => note >= 0))
  );
}

export async function POST() {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Configure GEMINI_API_KEY to compose an AI-generated beat." },
      { status: 503 },
    );
  }

  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: `
Compose an original, catchy, instrumental 4/4 rhythm-game loop as a 16-step sequencer.
Return a concise playful track title, a recognizable genre, a short mood, and an integer BPM
between 90 and 132. Use step numbers 0 through 15 for kick, snare, and hi-hat hits. Arrange
the drums musically; do not put a kick or snare on every step. Return exactly 16 melody MIDI
notes, using -1 for rests and notes 48 through 84 for pitches. Make the melody memorable and
rhythmic. The output will be synthesized with simple browser instruments, so keep it clean,
groovy, and easy for a beginner to play. Make each request feel like a different original
instrumental, not a copy of an existing song or artist. Treat this as music data, not a request
for copyrighted lyrics or a named artist imitation.
`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            genre: { type: "STRING" },
            mood: { type: "STRING" },
            bpm: { type: "INTEGER" },
            kick: { type: "ARRAY", items: { type: "INTEGER" } },
            snare: { type: "ARRAY", items: { type: "INTEGER" } },
            hat: { type: "ARRAY", items: { type: "INTEGER" } },
            melody: {
              type: "ARRAY",
              items: { type: "INTEGER" },
            },
          },
          required: ["title", "genre", "mood", "bpm", "kick", "snare", "hat", "melody"],
        },
      },
    });

    if (!result.text) {
      throw new Error("Gemini returned an empty rhythm track.");
    }
    const track: unknown = JSON.parse(result.text);
    if (!isRhythmTrack(track)) {
      throw new Error("Gemini returned an invalid rhythm track.");
    }

    return NextResponse.json({ track });
  } catch (error) {
    console.error("AI rhythm track generation failed.", error);
    return NextResponse.json(
      { error: "Could not compose a rhythm track. Please try again." },
      { status: 502 },
    );
  }
}
