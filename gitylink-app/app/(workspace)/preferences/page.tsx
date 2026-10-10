import type { Metadata } from "next";
import Topbar from "@/components/Topbar";
import Preferences from "./Preferences";

export const metadata: Metadata = {
  title: "Preferences · Commit to Post",
};

export default function PreferencesPage() {
  return (
    <section className="content-panel">
      <Topbar crumb="Preferences" />
      <Preferences />
    </section>
  );
}
