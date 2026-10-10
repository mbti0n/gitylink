import type { Metadata } from "next";
import Topbar from "@/components/Topbar";
import Activity from "./Activity";

export const metadata: Metadata = {
  title: "Activity · Commit to Post",
};

export default function ActivityPage() {
  return (
    <section className="content-panel">
      <Topbar crumb="Activity" />
      <Activity />
    </section>
  );
}
