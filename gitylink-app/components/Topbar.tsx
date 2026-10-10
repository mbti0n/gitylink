type Props = {
  crumb: string;
};

export default function Topbar({ crumb }: Props) {
  return (
    <header className="topbar">
      <div className="crumbs">Workspace / {crumb}</div>
      <div className="search-box">⌕ Search repositories, posts, skills...</div>
    </header>
  );
}
