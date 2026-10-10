import type { Metadata } from "next";
import Topbar from "@/components/Topbar";
import Repositories from "./Repositories";

export const metadata: Metadata = {
  title: "Repositories · Commit to Post",
};

export default function RepositoriesPage() {
  return (
    <section className="content-panel">
      <Topbar crumb="Repositories" />
      <Repositories />
    </section>
  );
}