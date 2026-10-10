"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

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

type Lane = {
  id: number;
  name: string;
  key: string;
  color: string;
};

type ChartNote = {
  id: string;
  lane: number;
  hitTime: number;
};

type VisibleNote = ChartNote & {
  progress: number;
};

type GameMode = "idle" | "composing" | "ready" | "playing" | "finished";

const lanes: Lane[] = [
  { id: 0, name: "Kick", key: "D", color: "#dd745c" },
  { id: 1, name: "Snare", key: "F", color: "#e7b75e" },
  { id: 2, name: "Hi-hat", key: "J", color: "#83a58a" },
  { id: 3, name: "Melody", key: "K", color: "#8299c0" },
];

const beatCount = 4;
const travelTime = 1.55;
const hitWindow = 0.2;
const laneAudioFrequencies = [58, 185, 900, 330];

function buildChart(track: RhythmTrack): ChartNote[] {
  const notes: ChartNote[] = [];
  const stepDuration = 60 / track.bpm / 4;
  const drumSteps = [track.kick, track.snare, track.hat];

  for (let bar = 0; bar < beatCount; bar += 1) {
    for (let step = 0; step < 16; step += 1) {
      const hitTime = (bar * 16 + step) * stepDuration;
      for (let lane = 0; lane < drumSteps.length; lane += 1) {
        if (drumSteps[lane].includes(step)) {
          notes.push({ id: `${bar}-${step}-${lane}`, lane, hitTime });
        }
      }
      if (track.melody[step] >= 0) {
        notes.push({ id: `${bar}-${step}-3`, lane: 3, hitTime });
      }
    }
  }
  return notes.sort((first, second) => first.hitTime - second.hitTime);
}

function createNoiseBuffer(context: AudioContext) {
  const buffer = context.createBuffer(1, context.sampleRate * 0.25, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  return buffer;
}

function playKick(context: AudioContext, destination: AudioNode, time: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(145, time);
  oscillator.frequency.exponentialRampToValueAtTime(42, time + 0.16);
  gain.gain.setValueAtTime(0.8, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
  oscillator.connect(gain).connect(destination);
  oscillator.start(time);
  oscillator.stop(time + 0.21);
}

function playNoise(
  context: AudioContext,
  destination: AudioNode,
  noise: AudioBuffer,
  time: number,
  type: "snare" | "hat",
) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = noise;
  filter.type = "highpass";
  filter.frequency.value = type === "snare" ? 1400 : 6500;
  gain.gain.setValueAtTime(type === "snare" ? 0.3 : 0.13, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + (type === "snare" ? 0.16 : 0.045));
  source.connect(filter).connect(gain).connect(destination);
  source.start(time);
  source.stop(time + (type === "snare" ? 0.17 : 0.05));

  if (type === "snare") {
    const tone = context.createOscillator();
    const toneGain = context.createGain();
    tone.type = "triangle";
    tone.frequency.setValueAtTime(180, time);
    toneGain.gain.setValueAtTime(0.2, time);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    tone.connect(toneGain).connect(destination);
    tone.start(time);
    tone.stop(time + 0.11);
  }
}

function playMelodyNote(
  context: AudioContext,
  destination: AudioNode,
  midiNote: number,
  time: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = 440 * 2 ** ((midiNote - 69) / 12);
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.17, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
  oscillator.connect(gain).connect(destination);
  oscillator.start(time);
  oscillator.stop(time + 0.23);
}

function scheduleTrack(context: AudioContext, destination: AudioNode, track: RhythmTrack, startAt: number) {
  const noise = createNoiseBuffer(context);
  const stepDuration = 60 / track.bpm / 4;

  for (let bar = 0; bar < beatCount; bar += 1) {
    for (let step = 0; step < 16; step += 1) {
      const time = startAt + (bar * 16 + step) * stepDuration;
      if (track.kick.includes(step)) playKick(context, destination, time);
      if (track.snare.includes(step)) playNoise(context, destination, noise, time, "snare");
      if (track.hat.includes(step)) playNoise(context, destination, noise, time, "hat");
      if (track.melody[step] >= 0) {
        playMelodyNote(context, destination, track.melody[step], time);
      }
    }
  }
}

export default function RhythmGame() {
  const [mode, setMode] = useState<GameMode>("idle");
  const [track, setTrack] = useState<RhythmTrack | null>(null);
  const [error, setError] = useState("");
  const [visibleNotes, setVisibleNotes] = useState<VisibleNote[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState("Ready when you are.");
  const modeRef = useRef<GameMode>("idle");
  const trackRef = useRef<RhythmTrack | null>(null);
  const chartRef = useRef<ChartNote[]>([]);
  const hitNotesRef = useRef(new Set<string>());
  const missedNotesRef = useRef(new Set<string>());
  const roundStartRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);

  function updateMode(nextMode: GameMode) {
    modeRef.current = nextMode;
    setMode(nextMode);
  }

  async function composeTrack() {
    updateMode("composing");
    setError("");
    setFeedback("The house band is warming up…");
    try {
      const response = await fetch("/api/generate-rhythm-track", { method: "POST" });
      const result = (await response.json()) as { track?: RhythmTrack; error?: string };
      if (!response.ok || !result.track) {
        throw new Error(result.error || "Could not compose a rhythm track.");
      }
      trackRef.current = result.track;
      setTrack(result.track);
      chartRef.current = buildChart(result.track);
      setVisibleNotes([]);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setHits(0);
      setMisses(0);
      hitNotesRef.current.clear();
      missedNotesRef.current.clear();
      setFeedback("Fresh beat, hot off the algorithm.");
      updateMode("ready");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not compose a rhythm track.",
      );
      setFeedback("The band missed its cue. Try again.");
      updateMode(trackRef.current ? "ready" : "idle");
    }
  }

  const stopMusic = useCallback(() => {
    const context = audioContextRef.current;
    const gain = audioGainRef.current;
    if (!context) return;

    audioContextRef.current = null;
    audioGainRef.current = null;
    if (context.state === "running" && gain) {
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setTargetAtTime(0, context.currentTime, 0.04);
      window.setTimeout(() => closeAudioContext(context), 250);
    } else {
      closeAudioContext(context);
    }
  }, []);

  const startGame = useCallback(async () => {
    const currentTrack = trackRef.current;
    if (!currentTrack || modeRef.current === "playing") return;

    try {
      stopMusic();
      const context = new AudioContext();
      const masterGain = context.createGain();
      masterGain.gain.value = 0.72;
      masterGain.connect(context.destination);
      audioContextRef.current = context;
      audioGainRef.current = masterGain;
      await context.resume();

      hitNotesRef.current.clear();
      missedNotesRef.current.clear();
      setVisibleNotes([]);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setHits(0);
      setMisses(0);
      setFeedback("Get ready…");

      const audioStartAt = context.currentTime + 1.2;
      roundStartRef.current = performance.now() + 1200;
      scheduleTrack(context, masterGain, currentTrack, audioStartAt);
      updateMode("playing");
    } catch (startError) {
      console.error("Rhythm game playback could not start.", startError);
      setError("Could not start audio playback. Check your browser’s audio settings and try again.");
      setFeedback("The sound system needs a quick tune-up.");
      updateMode("ready");
      stopMusic();
    }
  }, [stopMusic]);

  const pressLane = useCallback((lane: number) => {
    if (modeRef.current !== "playing") return;
    const currentTrack = trackRef.current;
    if (!currentTrack) return;

    const currentTime = (performance.now() - roundStartRef.current) / 1000;
    const nextNote = chartRef.current
      .filter(
        (note) =>
          note.lane === lane &&
          !hitNotesRef.current.has(note.id) &&
          !missedNotesRef.current.has(note.id),
      )
      .reduce<ChartNote | null>((closest, note) => {
        if (!closest || Math.abs(note.hitTime - currentTime) < Math.abs(closest.hitTime - currentTime)) {
          return note;
        }
        return closest;
      }, null);

    if (nextNote && Math.abs(nextNote.hitTime - currentTime) <= hitWindow) {
      const difference = Math.abs(nextNote.hitTime - currentTime);
      const points = difference <= 0.055 ? 100 : difference <= 0.115 ? 70 : 45;
      const nextStreak = streak + 1;
      hitNotesRef.current.add(nextNote.id);
      setScore((current) => current + points + Math.min(streak, 20));
      setHits((current) => current + 1);
      setStreak(nextStreak);
      setBestStreak((current) => Math.max(current, nextStreak));
      setFeedback(
        difference <= 0.055 ? "PERFECT!" : difference <= 0.115 ? "Nice!" : "On beat!",
      );

      const context = audioContextRef.current;
      if (context && context.state === "running") {
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = lane === 0 ? "sine" : "triangle";
        oscillator.frequency.value = laneAudioFrequencies[lane];
        gain.gain.setValueAtTime(0.17, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      }
      return;
    }

    setStreak(0);
    setMisses((current) => current + 1);
    setFeedback("Miss! Follow the falling notes.");
  }, [streak]);

  useEffect(() => {
    if (mode !== "playing" || !track) return;
    let frame = 0;
    let lastRender = 0;
    const totalDuration = beatCount * 4 * (60 / track.bpm);

    function animate(now: number) {
      const currentTime = (now - roundStartRef.current) / 1000;
      for (const note of chartRef.current) {
        if (
          currentTime > note.hitTime + hitWindow &&
          !hitNotesRef.current.has(note.id) &&
          !missedNotesRef.current.has(note.id)
        ) {
          missedNotesRef.current.add(note.id);
          setMisses((current) => current + 1);
          setStreak(0);
          setFeedback("Miss! Keep the groove.");
        }
      }

      if (now - lastRender > 30) {
        lastRender = now;
        setVisibleNotes(
          chartRef.current
            .filter(
              (note) =>
                !hitNotesRef.current.has(note.id) &&
                !missedNotesRef.current.has(note.id) &&
                note.hitTime >= currentTime - 0.05 &&
                note.hitTime <= currentTime + travelTime,
            )
            .map((note) => ({
              ...note,
              progress: Math.max(0, Math.min(1, 1 - (note.hitTime - currentTime) / travelTime)),
            })),
        );
      }

      if (currentTime > totalDuration + hitWindow + 0.1) {
        updateMode("finished");
        setVisibleNotes([]);
        setFeedback("Track complete. The crowd is legally required to cheer.");
        stopMusic();
        return;
      }
      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [mode, track, stopMusic]);

  useEffect(() => {
    if (mode !== "playing") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const lane = lanes.find((item) => item.key.toLowerCase() === event.key.toLowerCase());
      if (lane) {
        event.preventDefault();
        pressLane(lane.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, pressLane]);

  useEffect(
    () => () => {
      const context = audioContextRef.current;
      if (context && context.state !== "closed") void context.close();
    },
    [],
  );

  const accuracy = hits + misses === 0 ? 0 : Math.round((hits / (hits + misses)) * 100);

  return (
    <div className="rhythm-page">
      <header className="rhythm-heading">
        <div>
          <p className="record-eyebrow">REPO RADIO · AFTER HOURS</p>
          <h1>Rhythm Arcade</h1>
          <p>Catch the beat. Don’t let the algorithm see you miss.</p>
        </div>
        <div className="rhythm-stamp" aria-hidden="true">
          <span>AI</span>
          <strong>BEAT</strong>
          <span>VOL. ∞</span>
        </div>
      </header>

      <section className="rhythm-console" aria-label="Rhythm game">
        <div className="rhythm-track-info">
          <div className="rhythm-record-icon" aria-hidden="true">♫</div>
          <div>
            <p className="record-eyebrow">{track ? `${track.genre} · ${track.mood}` : "ORIGINAL AI COMPOSITION"}</p>
            <h2>{track?.title ?? "The algorithm is in the studio"}</h2>
            <p>{track ? `${track.bpm} BPM · 4 bars · 4 lanes` : "Generate a fresh beat, then tap along."}</p>
          </div>
          <div className="rhythm-score" aria-live="polite">
            <span>SCORE</span>
            <strong>{score.toLocaleString()}</strong>
          </div>
        </div>

        <div className={`rhythm-board${mode === "playing" ? " is-playing" : ""}`}>
          {lanes.map((lane) => (
            <div
              className="rhythm-lane"
              key={lane.id}
              style={{ "--lane-color": lane.color } as CSSProperties}
            >
              <span className="rhythm-lane-label">{lane.name}</span>
              <span className="rhythm-lane-key">{lane.key}</span>
              <div className="rhythm-hit-line" />
              {visibleNotes
                .filter((note) => note.lane === lane.id)
                .map((note) => (
                  <span
                    className="rhythm-note"
                    key={note.id}
                    style={{ top: `${10 + note.progress * 82}%` }}
                    aria-hidden="true"
                  />
                ))}
              <button
                type="button"
                className="rhythm-tap-target"
                aria-label={`Tap ${lane.name} lane, key ${lane.key}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  pressLane(lane.id);
                }}
              >
                <span>{lane.key}</span>
              </button>
            </div>
          ))}
          {mode !== "playing" && (
            <div className="rhythm-board-overlay">
              <span aria-hidden="true">{mode === "composing" ? "◌" : mode === "finished" ? "✦" : "♫"}</span>
              <p>
                {mode === "composing"
                  ? "Writing something fresh…"
                  : mode === "finished"
                    ? "Encore?"
                    : "Your stage is waiting"}
              </p>
            </div>
          )}
          <span className="rhythm-feedback" aria-live="polite">{feedback}</span>
        </div>

        <div className="rhythm-controls">
          <div className="rhythm-stats">
            <span><strong>{streak}</strong> streak</span>
            <span><strong>{bestStreak}</strong> best</span>
            <span><strong>{accuracy}%</strong> accuracy</span>
          </div>
          <div className="rhythm-buttons">
            {mode === "playing" ? (
              <button
                className="record-button record-button-quiet"
                type="button"
                onClick={() => {
                  stopMusic();
                  updateMode("ready");
                  setVisibleNotes([]);
                  setFeedback("Show’s over. Run it back?");
                }}
              >
                Stop
              </button>
            ) : (
              <button
                className="record-button record-button-primary"
                type="button"
                onClick={() => void (track ? startGame() : composeTrack())}
                disabled={mode === "composing"}
              >
                {mode === "composing"
                  ? "Composing…"
                  : mode === "ready" || mode === "finished"
                    ? "▶ Play this beat"
                    : "♫ Generate a beat"}
              </button>
            )}
            {(track || mode === "composing") && mode !== "playing" && (
              <button
                className="record-button record-button-quiet"
                type="button"
                onClick={() => void composeTrack()}
                disabled={mode === "composing"}
              >
                ↻ New track
              </button>
            )}
          </div>
        </div>

        {error && <p className="rhythm-error" role="alert">{error}</p>}
        <p className="rhythm-instructions">
          Hit each falling note as it reaches the line. Use <kbd>D</kbd> <kbd>F</kbd> <kbd>J</kbd>{" "}
          <kbd>K</kbd> or tap the lane buttons. Sound is synthesized in your browser; headphones recommended.
        </p>
      </section>

      <p className="rhythm-footnote">
        Every generated loop is an original, AI-composed pattern rendered live with browser instruments.
      </p>
    </div>
  );
}

function closeAudioContext(context: AudioContext) {
  if (context.state === "closed") return;
  void context.close().catch((closeError: unknown) => {
    console.error("Could not close rhythm game audio.", closeError);
  });
}
