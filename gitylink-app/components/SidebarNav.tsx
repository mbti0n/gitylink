"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: "▦", label: "Overview" },
  { href: "/activity", icon: "◷", label: "Activity" },
  { href: "/post-studio", icon: "✦", label: "Post studio" },
  { href: "/repositories", icon: "▤", label: "Repositories" },
  { href: "/skills", icon: "◈", label: "Skills explorer" },
  { href: "/roadmap", icon: "◎", label: "Career roadmap" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-list" aria-label="Sidebar navigation">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "nav-item active" : "nav-item"}
            aria-current={active ? "page" : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
