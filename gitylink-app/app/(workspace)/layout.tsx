import Sidebar from "@/components/Sidebar";
import WorkspaceShell from "@/components/WorkspaceShell";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceShell sidebar={<Sidebar />}>{children}</WorkspaceShell>
  );
}
