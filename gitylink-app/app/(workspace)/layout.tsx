import Sidebar from "@/components/Sidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="dashboard-page">
      <Sidebar />
      {children}
    </main>
  );
}
