"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  icon: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/", icon: "◉", label: "Overview" },
  { href: "/repositories", icon: "▣", label: "Repositories" },
  { href: "/skills", icon: "♫", label: "Skills Explorer" },
  { href: "/rhythm", icon: "♪", label: "Rhythm Arcade" },
];

function NavLink({ item, compact }: { item: NavItem; compact?: boolean }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const className = ["nav-item", compact && "compact", active && "active"]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={item.href}
      className={className}
      aria-label={item.label}
      title={item.label}
      aria-current={active ? "page" : undefined}
    >
      <span className="nav-icon">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

export default function SidebarNav() {
  return (
    <nav className="nav-list" aria-label="Sidebar navigation">
      {navItems.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
    </nav>
  );
}
