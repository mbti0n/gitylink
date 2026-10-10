import type { Metadata } from "next";
import RhythmGame from "./RhythmGame";

export const metadata: Metadata = {
  title: "Rhythm Arcade",
};

export default function RhythmPage() {
  return (
    <section className="content-panel">
      <RhythmGame />
    </section>
  );
}
