import type { Metadata } from "next";
import RepoBattle from "./RepoBattle";

export const metadata: Metadata = {
  title: "Repo Battle",
};

export default function RepoBattlePage() {
  return (
    <section className="content-panel">
      <RepoBattle />
    </section>
  );
}
