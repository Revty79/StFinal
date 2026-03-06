"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const workspaceLinks = [
  {
    label: "Forge",
    href: "/prototypes/idea-1/forge/system",
    matchPrefix: "/prototypes/idea-1/forge",
  },
  {
    label: "Run",
    href: "/prototypes/idea-1/run",
    matchPrefix: "/prototypes/idea-1/run",
  },
  {
    label: "Play",
    href: "/prototypes/idea-1/play",
    matchPrefix: "/prototypes/idea-1/play",
  },
  {
    label: "Bazaar",
    href: "/prototypes/idea-1/bazaar",
    matchPrefix: "/prototypes/idea-1/bazaar",
  },
  {
    label: "Admin",
    href: "/prototypes/idea-1/admin",
    matchPrefix: "/prototypes/idea-1/admin",
  },
];

function isActive(pathname: string, matchPrefix: string) {
  return pathname === matchPrefix || pathname.startsWith(`${matchPrefix}/`);
}

export function WorkspaceSwitcher() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2" aria-label="Workspace switcher">
      {workspaceLinks.map((workspace) => {
        const active = isActive(pathname, workspace.matchPrefix);

        return (
          <Link
            key={workspace.label}
            href={workspace.href}
            className={[
              "block rounded-xl border px-3 py-2 text-sm font-medium transition",
              active
                ? "border-amber-300/70 bg-amber-200/15 text-amber-100"
                : "border-slate-700/70 text-slate-200 hover:border-slate-500/80 hover:bg-slate-800/40",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            {workspace.label}
          </Link>
        );
      })}
    </nav>
  );
}
