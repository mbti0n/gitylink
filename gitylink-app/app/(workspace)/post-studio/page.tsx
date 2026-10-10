import type { Metadata } from "next";
import Topbar from "@/components/Topbar";
import PostStudio from "./PostStudio";

export const metadata: Metadata = {
  title: "Post studio · Commit to Post",
};

export default function PostStudioPage() {
  return (
    <section className="content-panel">
      <Topbar crumb="Post studio" />
      <PostStudio />
    </section>
  );
}
