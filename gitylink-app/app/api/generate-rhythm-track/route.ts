import { NextResponse } from "next/server";
import { ai, MODEL } from "@/lib/gemini";
import { getGitHubMoodProfile, type GitHubMoodProfile } from "@/lib/github-mood";

type RhythmTrack = {
  title: string;
  genre: string;
  mood: string;
  bpm: number;
  kick: number[];
  snare: number[];
  hat: number[];
  melody: number[];
  because?: string;
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
    track.bpm >= 60 &&
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

// Steers the composition toward the developer's GitHub mood (lib/github-mood.ts)
function moodPrompt(mood: GitHubMoodProfile) {
  const facts = [
    mood.topLanguages.length > 0 && `Top languages: ${mood.topLanguages.join(", ")}.`,
    mood.totalContributions !== null && `${mood.totalContributions} contributions this year.`,
    mood.busiestDay && `Busiest coding day: ${mood.busiestDay}.`,
    mood.longestStreak !== null && `Longest streak: ${mood.longestStreak} days.`,
  ].filter(Boolean);

  return `
This beat is a personal soundtrack for a developer, based on their GitHub year, like a music
"Wrapped". Their coding personality is "${mood.archetype}" (${mood.archetypeLine}).
${facts.join(" ")}
Make the genre ${mood.genre}, the mood ${mood.moodWords}, and the BPM between ${mood.bpmMin} and
${mood.bpmMax}. Let the title nod to their coding life without naming real people. Also return
"because": one short, playful, second-person sentence (under 110 characters) in the style of a
year-in-review card, telling them why this beat fits their GitHub, for example by mentioning their
busiest day, streak or top language.
`;
}

export async function POST() {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Configure GEMINI_API_KEY to compose an AI-generated beat." },
      { status: 503 },
    );
  }

  try {
    const mood = await getGitHubMoodProfile();
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: `
Compose an original, catchy, instrumental 4/4 rhythm-game loop as a 16-step sequencer.
Return a concise playful track title, a recognizable genre, a short mood, and an integer BPM
between 72 and 100. Leave space between hits so a beginner can follow: keep the hi-hat mostly on
8th notes and avoid busy 16th-note runs. Use step numbers 0 through 15 for kick, snare, and hi-hat hits. Arrange
the drums musically; do not put a kick or snare on every step. Return exactly 16 melody MIDI
notes, using -1 for rests and notes 48 through 84 for pitches. Make the melody memorable and
rhythmic. The output will be synthesized with simple browser instruments, so keep it clean,
groovy, and easy for a beginner to play. Make each request feel like a different original
instrumental, not a copy of an existing song or artist. Treat this as music data, not a request
for copyrighted lyrics or a named artist imitation.
${mood ? moodPrompt(mood) : ""}`,
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
            because: { type: "STRING" },
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
    // The "because" line is a nice-to-have: keep it short, and drop it rather than fail the beat
    track.because =
      typeof track.because === "string" && track.because.trim()
        ? track.because.trim().slice(0, 140)
        : undefined;

    return NextResponse.json({ track });
  } catch (error) {
    console.error("AI rhythm track generation failed.", error);
    return NextResponse.json(
      { error: "Could not compose a rhythm track. Please try again." },
      { status: 502 },
    );
  }
}
