"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import type { GitHubMoodProfile } from "@/lib/github-mood";

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
  // Seconds to hold for a slider; 0 for a tap note
  duration: number;
  // Hit together with at least one other lane (Project Sekai-style linked notes)
  dual: boolean;
};

type VisibleNote = ChartNote & {
  progress: number;
  tailProgress: number;
  holding: boolean;
};

type BeatLine = {
  id: number;
  progress: number;
  downbeat: boolean;
};

type ActiveHold = {
  note: ChartNote;
  bonus: number;
};

type GameMode = "idle" | "composing" | "ready" | "playing" | "finished";

const lanes: Lane[] = [
  { id: 0, name: "Kick", key: "D", color: "#dd745c" },
  { id: 1, name: "Snare", key: "F", color: "#e7b75e" },
  { id: 2, name: "Hi-hat", key: "J", color: "#83a58a" },
  { id: 3, name: "Melody", key: "K", color: "#8299c0" },
];

type Judgement = "perfect" | "great" | "good" | "miss";

const judgementLabels: Record<Judgement, string> = {
  perfect: "PERFECT",
  great: "GREAT",
  good: "GOOD",
  miss: "MISS",
};

const emptyCounts: Record<Judgement, number> = { perfect: 0, great: 0, good: 0, miss: 0 };

type Grade = "A" | "B" | "C" | "D" | "F";

const gradeMessages: Record<Grade, string> = {
  A: "Standing ovation. The crowd is chanting your commit hash.",
  B: "Encore-worthy. A few wrong notes, but the vibe was immaculate.",
  C: "Solid set. The band nods approvingly.",
  D: "The crowd is… politely clapping. Run it back?",
  F: "The algorithm has requested a rematch. Practice makes platinum.",
};

function gradeFor(accuracy: number): Grade {
  if (accuracy >= 85) return "A";
  if (accuracy >= 75) return "B";
  if (accuracy >= 65) return "C";
  if (accuracy >= 50) return "D";
  return "F";
}

const beatCount = 4;
// Seconds of 3-2-1 countdown before the first note
const leadIn = 2.4;
// Notes are on screen for this long before reaching the line
const travelTime = 2.1;
const hitWindow = 0.26;
// Faster AI beats are slowed to this tempo so there's time to read and hit every note
const maxTempo = 100;
const laneAudioFrequencies = [58, 185, 900, 330];
// Releasing this close to a slider's end still counts as holding it through
const holdReleaseGrace = 0.12;

// A melody note followed by 2+ rests becomes a slider that lasts through the rests.
// Used for both the chart and the audio, so the held note sounds exactly as long as the slider.
function melodyHoldSteps(melody: number[], step: number) {
  let rests = 0;
  for (let next = step + 1; next < 16 && melody[next] < 0 && rests < 4; next += 1) {
    rests += 1;
  }
  return rests >= 2 ? rests + 1 : 0;
}

// Charts are thinned for playability: at least an 8th note between notes in a lane (a full
// beat on the busy hi-hat lane), and never more than two lanes at once. The audio still plays every hit.
const minLaneGaps = [2, 2, 4, 2];
// Order lanes are kept in when too many land together (the hi-hat goes first)
const lanePriority = [0, 1, 3, 2];

function thinSteps(steps: number[], minLaneGap: number) {
  const kept: number[] = [];
  for (const step of [...steps].sort((first, second) => first - second)) {
    if (kept.length === 0 || step - kept[kept.length - 1] >= minLaneGap) kept.push(step);
  }
  // The pattern loops every bar, so the last note also needs room before the next bar's first
  if (kept.length > 1 && kept[0] + 16 - kept[kept.length - 1] < minLaneGap) kept.pop();
  return kept;
}

function buildChart(track: RhythmTrack): ChartNote[] {
  const stepDuration = 60 / track.bpm / 4;
  const melodySteps = track.melody.flatMap((note, step) => (note >= 0 ? [step] : []));
  const laneSteps = [track.kick, track.snare, track.hat, melodySteps].map((steps, lane) =>
    thinSteps(steps, minLaneGaps[lane]),
  );
  let notes: ChartNote[] = [];

  laneSteps.forEach((steps, lane) => {
    steps.forEach((step, index) => {
      const gap = (steps[index + 1] ?? steps[0] + 16) - step;
      // Melody holds follow the sustained note; kick and snare hold for a beat on a downbeat
      // when the lane has room before its next hit
      const holdSteps =
        lane === 3
          ? melodyHoldSteps(track.melody, step)
          : lane < 2 && step % 4 === 0 && gap >= 6
            ? 4
            : 0;
      for (let bar = 0; bar < beatCount; bar += 1) {
        notes.push({
          id: `${bar}-${step}-${lane}`,
          lane,
          hitTime: (bar * 16 + step) * stepDuration,
          duration: holdSteps * stepDuration,
          dual: false,
        });
      }
    });
  });

  // Notes that land together in two lanes are dual notes; a third or fourth is dropped
  const perTime = new Map<number, ChartNote[]>();
  for (const note of notes) {
    perTime.set(note.hitTime, [...(perTime.get(note.hitTime) ?? []), note]);
  }
  const dropped = new Set<string>();
  for (const group of perTime.values()) {
    group.sort((first, second) => lanePriority.indexOf(first.lane) - lanePriority.indexOf(second.lane));
    group.slice(2).forEach((note) => dropped.add(note.id));
    if (group.length > 1) group.slice(0, 2).forEach((note) => (note.dual = true));
  }
  notes = notes.filter((note) => !dropped.has(note.id));
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
  holdDuration = 0,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = 440 * 2 ** ((midiNote - 69) / 12);
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.17, time + 0.012);
  if (holdDuration > 0) {
    // Sustain for exactly as long as the slider on screen
    gain.gain.setTargetAtTime(0.11, time + 0.012, 0.08);
    gain.gain.setValueAtTime(0.11, time + holdDuration);
    gain.gain.exponentialRampToValueAtTime(0.001, time + holdDuration + 0.12);
  } else {
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
  }
  oscillator.connect(gain).connect(destination);
  oscillator.start(time);
  oscillator.stop(time + Math.max(0.23, holdDuration + 0.13));
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
        const holdDuration = melodyHoldSteps(track.melody, step) * stepDuration;
        playMelodyNote(context, destination, track.melody[step], time, holdDuration);
      }
    }
  }
}

type Props = {
  // undefined while the profile loads, null when GitHub isn't connected
  moodProfile?: GitHubMoodProfile | null;
  // Set when arriving from Repo Wrapped's "Play my mood": compose a beat right away
  autoCompose?: boolean;
};

export default function RhythmGame({ moodProfile, autoCompose = false }: Props) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [mode, setMode] = useState<GameMode>("idle");
  const [track, setTrack] = useState<RhythmTrack | null>(null);
  const [error, setError] = useState("");
  const [visibleNotes, setVisibleNotes] = useState<VisibleNote[]>([]);
  const [beatLines, setBeatLines] = useState<BeatLine[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState("Ready when you are.");
  const [judgement, setJudgement] = useState<{ kind: Judgement; id: number } | null>(null);
  const [counts, setCounts] = useState(emptyCounts);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pressedLanes, setPressedLanes] = useState([false, false, false, false]);
  // Bumped on every hit so the lane's burst effect remounts and replays
  const [laneBursts, setLaneBursts] = useState([0, 0, 0, 0]);
  const judgementIdRef = useRef(0);
  const modeRef = useRef<GameMode>("idle");
  const trackRef = useRef<RhythmTrack | null>(null);
  const chartRef = useRef<ChartNote[]>([]);
  const hitNotesRef = useRef(new Set<string>());
  const missedNotesRef = useRef(new Set<string>());
  // Song time 0 on the AudioContext clock; the game reads time from audio so notes match the sound
  const audioStartRef = useRef(0);
  const activeHoldsRef = useRef(new Map<number, ActiveHold>());
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);

  function updateMode(nextMode: GameMode) {
    modeRef.current = nextMode;
    setMode(nextMode);
  }

  // Seconds into the song as heard through the speakers. getOutputTimestamp accounts for
  // output latency, so the notes line up with the sound rather than with the scheduler.
  const songTime = useCallback(() => {
    const context = audioContextRef.current;
    if (!context) return -leadIn;
    if (typeof context.getOutputTimestamp === "function") {
      const stamp = context.getOutputTimestamp();
      if (stamp.contextTime !== undefined && stamp.performanceTime !== undefined && stamp.performanceTime > 0) {
        return stamp.contextTime + (performance.now() - stamp.performanceTime) / 1000 - audioStartRef.current;
      }
    }
    return context.currentTime - (context.outputLatency || context.baseLatency || 0) - audioStartRef.current;
  }, []);

  const judge = useCallback((kind: Judgement) => {
    judgementIdRef.current += 1;
    setJudgement({ kind, id: judgementIdRef.current });
    setCounts((current) => ({ ...current, [kind]: current[kind] + 1 }));
  }, []);

  const setLanePressed = useCallback((lane: number, pressed: boolean) => {
    setPressedLanes((current) =>
      current[lane] === pressed ? current : current.map((value, index) => (index === lane ? pressed : value)),
    );
  }, []);

  async function composeTrack() {
    updateMode("composing");
    setPhraseIndex(0);
    setError("");
    setFeedback("The house band is warming up…");
    try {
      const response = await fetch("/api/generate-rhythm-track", { method: "POST" });
      const result = (await response.json()) as { track?: RhythmTrack; error?: string };
      if (!response.ok || !result.track) {
        throw new Error(result.error || "Could not compose a rhythm track.");
      }
      const nextTrack = { ...result.track, bpm: Math.min(result.track.bpm, maxTempo) };
      trackRef.current = nextTrack;
      setTrack(nextTrack);
      chartRef.current = buildChart(nextTrack);
      setVisibleNotes([]);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setHits(0);
      setMisses(0);
      setCounts(emptyCounts);
      setJudgement(null);
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
      setCounts(emptyCounts);
      setJudgement(null);
      setCountdown(3);
      setFeedback("Get ready…");

      const audioStartAt = context.currentTime + leadIn;
      audioStartRef.current = audioStartAt;
      activeHoldsRef.current.clear();
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

    const currentTime = songTime();
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
      const kind: Judgement = difference <= 0.07 ? "perfect" : difference <= 0.14 ? "great" : "good";
      const points = kind === "perfect" ? 100 : kind === "great" ? 70 : 45;
      // Guitar Hero-style multiplier: x2 at 10 combo, x3 at 20, x4 at 30
      const multiplier = Math.min(4, 1 + Math.floor(streak / 10));
      const nextStreak = streak + 1;
      // Dual notes are worth double; sliders pay the same again when held to the end
      const earned = points * multiplier * (nextNote.dual ? 2 : 1);
      hitNotesRef.current.add(nextNote.id);
      if (nextNote.duration > 0) {
        activeHoldsRef.current.set(lane, { note: nextNote, bonus: earned });
      }
      setScore((current) => current + earned);
      setHits((current) => current + 1);
      setStreak(nextStreak);
      setBestStreak((current) => Math.max(current, nextStreak));
      judge(kind);
      setLaneBursts((current) => current.map((value, index) => (index === lane ? value + 1 : value)));

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

    // A press with no note nearby is ignored, as in Project Sekai and Guitar Hero;
    // only notes that pass the line unhit count as misses
  }, [streak, judge, songTime]);

  // Letting go of a lane ends its slider; held to the end (or close enough) pays the bonus
  const releaseLane = useCallback((lane: number) => {
    const hold = activeHoldsRef.current.get(lane);
    if (!hold) return;
    activeHoldsRef.current.delete(lane);
    if (songTime() >= hold.note.hitTime + hold.note.duration - holdReleaseGrace) {
      setScore((current) => current + hold.bonus);
      setLaneBursts((current) => current.map((value, index) => (index === lane ? value + 1 : value)));
    }
  }, [songTime]);

  useEffect(() => {
    if (mode !== "playing" || !track) return;
    let frame = 0;
    let lastRender = 0;
    let shownCountdown: number | null = 3;
    const totalDuration = beatCount * 4 * (60 / track.bpm);

    const beatDuration = 60 / track.bpm;

    function animate(now: number) {
      const currentTime = songTime();
      const nextCountdown = currentTime < 0 ? Math.ceil(-currentTime / (leadIn / 3)) : null;
      if (nextCountdown !== shownCountdown) {
        shownCountdown = nextCountdown;
        setCountdown(nextCountdown);
      }
      for (const note of chartRef.current) {
        if (
          currentTime > note.hitTime + hitWindow &&
          !hitNotesRef.current.has(note.id) &&
          !missedNotesRef.current.has(note.id)
        ) {
          missedNotesRef.current.add(note.id);
          setMisses((current) => current + 1);
          setStreak(0);
          judge("miss");
        }
      }

      // Sliders held all the way through pay out as they finish
      for (const [lane, hold] of activeHoldsRef.current) {
        if (currentTime >= hold.note.hitTime + hold.note.duration) {
          activeHoldsRef.current.delete(lane);
          setScore((current) => current + hold.bonus);
          setLaneBursts((current) => current.map((value, index) => (index === lane ? value + 1 : value)));
        }
      }

      if (now - lastRender > 30) {
        lastRender = now;
        const toProgress = (time: number) =>
          Math.max(0, Math.min(1, 1 - (time - currentTime) / travelTime));
        const nextNotes: VisibleNote[] = [];
        for (const note of chartRef.current) {
          if (missedNotesRef.current.has(note.id)) continue;
          const holding = activeHoldsRef.current.get(note.lane)?.note.id === note.id;
          if (hitNotesRef.current.has(note.id) && !holding) continue;
          if (!holding && note.hitTime < currentTime - 0.05) continue;
          if (note.hitTime > currentTime + travelTime) continue;
          const progress = holding ? 1 : toProgress(note.hitTime);
          nextNotes.push({
            ...note,
            progress,
            tailProgress: note.duration > 0 ? toProgress(note.hitTime + note.duration) : progress,
            holding,
          });
        }
        setVisibleNotes(nextNotes);

        // Beat lines move with the notes, so the highway pulses on the actual beat
        const nextLines: BeatLine[] = [];
        const firstBeat = Math.max(0, Math.ceil(currentTime / beatDuration));
        const lastBeat = Math.min(beatCount * 4, Math.floor((currentTime + travelTime) / beatDuration));
        for (let beat = firstBeat; beat <= lastBeat; beat += 1) {
          nextLines.push({ id: beat, progress: toProgress(beat * beatDuration), downbeat: beat % 4 === 0 });
        }
        setBeatLines(nextLines);
      }

      if (currentTime > totalDuration + hitWindow + 0.1) {
        updateMode("finished");
        setVisibleNotes([]);
        setBeatLines([]);
        setFeedback("Track complete.");
        stopMusic();
        return;
      }
      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [mode, track, stopMusic, judge, songTime]);

  useEffect(() => {
    if (mode !== "playing") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const lane = lanes.find((item) => item.key.toLowerCase() === event.key.toLowerCase());
      if (lane) {
        event.preventDefault();
        setLanePressed(lane.id, true);
        pressLane(lane.id);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const lane = lanes.find((item) => item.key.toLowerCase() === event.key.toLowerCase());
      if (lane) {
        setLanePressed(lane.id, false);
        releaseLane(lane.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [mode, pressLane, releaseLane, setLanePressed]);

  // Arriving from Repo Wrapped composes the mood beat once; the URL is cleaned up so a
  // refresh doesn't spend another generation
  const autoComposedRef = useRef(false);
  useEffect(() => {
    if (!autoCompose || autoComposedRef.current) return;
    autoComposedRef.current = true;
    window.history.replaceState(null, "", "/rhythm");
    void composeTrack();
  });

  // Wrapped-style "thinking" phrases cycle while the AI composes
  useEffect(() => {
    if (mode !== "composing" || !moodProfile) return;
    const timer = window.setInterval(() => {
      setPhraseIndex((current) => (current + 1) % moodProfile.thinkingPhrases.length);
    }, 1400);
    return () => window.clearInterval(timer);
  }, [mode, moodProfile]);

  useEffect(
    () => () => {
      const context = audioContextRef.current;
      if (context && context.state !== "closed") void context.close();
    },
    [],
  );

  const accuracy = hits + misses === 0 ? 0 : Math.round((hits / (hits + misses)) * 100);
  const multiplier = Math.min(4, 1 + Math.floor(streak / 10));
  const grade = gradeFor(accuracy);

  // A bar joining dual notes that are still on their way, like Project Sekai
  const dualLinks: { id: string; progress: number; from: number; to: number }[] = [];
  const dualGroups = new Map<number, VisibleNote[]>();
  for (const note of visibleNotes) {
    if (!note.dual || note.holding) continue;
    dualGroups.set(note.hitTime, [...(dualGroups.get(note.hitTime) ?? []), note]);
  }
  for (const [hitTime, group] of dualGroups) {
    if (group.length < 2) continue;
    const laneIds = group.map((note) => note.lane);
    dualLinks.push({
      id: `link-${hitTime}`,
      progress: group[0].progress,
      from: Math.min(...laneIds),
      to: Math.max(...laneIds),
    });
  }

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

      {moodProfile ? (
        <div className="rhythm-mood-banner">
          <div>
            <p className="record-eyebrow">Tuned to your Repo Wrapped mood</p>
            <strong>{moodProfile.archetype}</strong>
            <span>
              {moodProfile.genre} · {moodProfile.bpmMin}–{moodProfile.bpmMax} BPM
            </span>
          </div>
          <Link href="/wrapped" className="record-text-link">
            See your Wrapped <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : moodProfile === null ? (
        <p className="rhythm-mood-hint">
          Connect GitHub on the overview page and every beat will be tuned to your Repo Wrapped mood.
        </p>
      ) : (
        <p className="rhythm-mood-hint" aria-live="polite">
          Reading your GitHub mood…
        </p>
      )}

      <section className="rhythm-console" aria-label="Rhythm game">
        <div className="rhythm-track-info">
          <div className="rhythm-record-icon" aria-hidden="true">♫</div>
          <div>
            <p className="record-eyebrow">{track ? `${track.genre} · ${track.mood}` : "ORIGINAL AI COMPOSITION"}</p>
            <h2>{track?.title ?? "The algorithm is in the studio"}</h2>
            {track?.because && <p className="rhythm-because">{track.because}</p>}
            <p>{track ? `${track.bpm} BPM · 4 bars · 4 lanes` : "Generate a fresh beat, then tap along."}</p>
          </div>
          <div className="rhythm-score" aria-live="polite">
            <span>SCORE</span>
            <strong>{score.toLocaleString()}</strong>
          </div>
        </div>

        <div className={`rhythm-board${mode === "playing" ? " is-playing" : ""}`}>
          {/* Notes travel down a tilted highway toward the receptors, like Guitar Hero / Project Sekai */}
          <div className="rhythm-highway">
            {beatLines.map((line) => (
              <span
                className={`rhythm-beat-line${line.downbeat ? " is-downbeat" : ""}`}
                key={line.id}
                style={{ top: `${line.progress * 88}%` }}
                aria-hidden="true"
              />
            ))}
            {dualLinks.map((link) => (
              <span
                className="rhythm-dual-link"
                key={link.id}
                style={{
                  top: `${link.progress * 88}%`,
                  left: `${(link.from + 0.5) * 25}%`,
                  width: `${(link.to - link.from) * 25}%`,
                }}
                aria-hidden="true"
              />
            ))}
            {lanes.map((lane) => (
              <div
                className={`rhythm-lane${pressedLanes[lane.id] ? " is-pressed" : ""}`}
                key={lane.id}
                style={{ "--lane-color": lane.color } as CSSProperties}
              >
                <div className="rhythm-hit-line" />
                {visibleNotes
                  .filter((note) => note.lane === lane.id)
                  .map((note) => (
                    <span key={note.id} aria-hidden="true">
                      {note.duration > 0 && (
                        <span
                          className={`rhythm-slider${note.holding ? " is-holding" : ""}`}
                          style={{
                            top: `${note.tailProgress * 88}%`,
                            height: `${(note.progress - note.tailProgress) * 88}%`,
                          }}
                        />
                      )}
                      <span
                        className={[
                          "rhythm-note",
                          note.dual && "is-dual",
                          note.duration > 0 && "is-slider",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={{ top: `${note.progress * 88}%` }}
                      />
                    </span>
                  ))}
                {laneBursts[lane.id] > 0 && (
                  <span className="rhythm-burst" key={laneBursts[lane.id]} aria-hidden="true" />
                )}
                <button
                  type="button"
                  className="rhythm-tap-target"
                  aria-label={`Tap ${lane.name} lane, key ${lane.key}`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    setLanePressed(lane.id, true);
                    pressLane(lane.id);
                  }}
                  onPointerUp={() => {
                    setLanePressed(lane.id, false);
                    releaseLane(lane.id);
                  }}
                  onPointerLeave={() => {
                    setLanePressed(lane.id, false);
                    releaseLane(lane.id);
                  }}
                >
                  <span>{lane.key}</span>
                </button>
                <span className="rhythm-lane-label">
                  <kbd>{lane.key}</kbd> {lane.name}
                </span>
              </div>
            ))}
          </div>

          {mode === "playing" && (
            <div className="rhythm-hud" aria-hidden="true">
              <span className="rhythm-multiplier">×{multiplier}</span>
              {countdown !== null ? (
                <span className="rhythm-countdown" key={`count-${countdown}`}>
                  {countdown}
                </span>
              ) : (
                judgement && (
                  <span className={`rhythm-judgement is-${judgement.kind}`} key={judgement.id}>
                    {judgementLabels[judgement.kind]}
                  </span>
                )
              )}
              {streak >= 2 && (
                <span className="rhythm-combo" key={`combo-${streak}`}>
                  <strong>{streak}</strong>
                  COMBO
                </span>
              )}
            </div>
          )}

          {mode !== "playing" && (
            <div className="rhythm-board-overlay">
              {mode === "finished" ? (
                <div className="rhythm-results">
                  <span className={`rhythm-grade grade-${grade}`}>{grade}</span>
                  <p className="rhythm-results-score">{score.toLocaleString()}</p>
                  <dl>
                    {(Object.keys(judgementLabels) as Judgement[]).map((kind) => (
                      <div key={kind} className={`is-${kind}`}>
                        <dt>{judgementLabels[kind]}</dt>
                        <dd>{counts[kind]}</dd>
                      </div>
                    ))}
                    <div>
                      <dt>MAX COMBO</dt>
                      <dd>{bestStreak}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <>
                  <span className="rhythm-board-overlay-icon" aria-hidden="true">
                    {mode === "composing" ? "◌" : "♫"}
                  </span>
                  <p>
                    {mode === "composing"
                      ? moodProfile
                        ? moodProfile.thinkingPhrases[phraseIndex]
                        : "Writing something fresh…"
                      : "Your stage is waiting"}
                  </p>
                </>
              )}
            </div>
          )}
          {mode !== "playing" && (
            <span className="rhythm-feedback" aria-live="polite">
              {mode === "finished" ? `Track complete. ${gradeMessages[grade]}` : feedback}
            </span>
          )}
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
          Hit each note as it reaches the glowing line at the bottom of the highway. Use <kbd>D</kbd> <kbd>F</kbd> <kbd>J</kbd>{" "}
          <kbd>K</kbd> or tap the lane buttons. Hold the key through green HOLD notes until their trail ends, and hit gold
          dual notes joined by a white line together; both are worth double. Sound is synthesized in your browser; headphones
          recommended.
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
