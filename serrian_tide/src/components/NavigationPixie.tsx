"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type NavLink = {
  href: string;
  label: string;
};

function canAccessSourceForge(role: string): boolean {
  const normalized = role.toLowerCase();
  return normalized === "admin" || normalized === "privileged";
}

function isAdmin(role: string): boolean {
  return role.toLowerCase() === "admin";
}

function isActivePath(pathname: string, href: string): boolean {
  if (href.startsWith("/coming-soon")) return pathname === "/coming-soon";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavigationPixie() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/profile/me", { cache: "no-store" });
        if (!response.ok) {
          if (active) {
            setRole(null);
            setReady(true);
          }
          return;
        }

        const data = (await response.json().catch(() => null)) as
          | { ok?: boolean; user?: { role?: string | null } }
          | null;

        if (active) {
          setRole(data?.ok ? data?.user?.role ?? null : null);
          setReady(true);
        }
      } catch {
        if (active) {
          setRole(null);
          setReady(true);
        }
      }
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const showPixie = useMemo(() => {
    if (!ready || !role) return false;
    if (pathname === "/" || pathname === "/login") return false;
    return true;
  }, [pathname, ready, role]);

  const sourceForgeLinks: NavLink[] = useMemo(() => {
    if (!role || !canAccessSourceForge(role)) return [];
    return [
      { href: "/worldbuilder", label: "Source Forge Hub" },
      { href: "/worldbuilder/toolbox", label: "Toolbox" },
      { href: "/worldbuilder/playground", label: "G.O.D's Playground" },
      { href: "/worldbuilder/creatures", label: "Creatures" },
      { href: "/worldbuilder/skillsets", label: "Skillsets" },
      { href: "/worldbuilder/races", label: "Races" },
      { href: "/worldbuilder/inventory", label: "Inventory" },
    ];
  }, [role]);

  const godsRealmLinks: NavLink[] = [
    { href: "/gods-realm", label: "Gods' Realm" },
    { href: "/campaign", label: "Create Campaign" },
    { href: "/coming-soon?realm=gods-realm&tool=create-session&back=/gods-realm", label: "Create Session" },
    { href: "/coming-soon?realm=gods-realm&tool=run-session&back=/gods-realm", label: "Run Session" },
  ];

  const playersRealmLinks: NavLink[] = [
    { href: "/players-realm", label: "Players' Realm" },
    { href: "/players-realm/characters", label: "Characters" },
    { href: "/coming-soon?realm=players-realm&tool=sessions&back=/players-realm", label: "Sessions" },
    { href: "/coming-soon?realm=players-realm&tool=join-session&back=/players-realm", label: "Join Session" },
  ];

  const coreLinks: NavLink[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/free-tools", label: "Free Tools" },
  ];

  const bazaarLink = role && canAccessSourceForge(role)
    ? { href: "/coming-soon?realm=bazaar&tool=shop&back=/dashboard", label: "Bazaar" }
    : null;
  const adminLink = role && isAdmin(role)
    ? { href: "/admin", label: "Admin Console" }
    : null;

  if (!showPixie) return null;

  return (
    <div
      ref={rootRef}
      className="fixed z-[70]"
      style={{
        top: "calc(env(safe-area-inset-top) + 12px)",
        left: "calc(env(safe-area-inset-left) + 12px)",
      }}
    >
      <button
        type="button"
        aria-label="Open navigation pixie"
        onClick={() => setOpen((v) => !v)}
        className={[
          "st-pixie-float relative h-16 w-16 rounded-full border backdrop-blur transition",
          "border-pink-200/60 bg-slate-950/75 shadow-[0_0_24px_rgba(236,72,153,0.35)]",
          "hover:border-pink-100 hover:shadow-[0_0_32px_rgba(236,72,153,0.5)]",
        ].join(" ")}
      >
        <span className="sr-only">Open destination navigator</span>
        <span className="pointer-events-none absolute inset-0 st-fairy-shell">
          <span className="st-pixie-spark st-pixie-spark-a" />
          <span className="st-pixie-spark st-pixie-spark-b" />
          <span className="st-pixie-spark st-pixie-spark-c" />
          <span className="st-fairy-wing st-fairy-wing-left" />
          <span className="st-fairy-wing st-fairy-wing-right" />
          <span className="st-fairy-halo" />
          <span className="st-fairy-head">
            <span className="st-fairy-eye st-fairy-eye-left" />
            <span className="st-fairy-eye st-fairy-eye-right" />
            <span className="st-fairy-blush st-fairy-blush-left" />
            <span className="st-fairy-blush st-fairy-blush-right" />
          </span>
          <span className="st-fairy-hair" />
          <span className="st-fairy-body" />
          <span className="st-fairy-wand" />
          <span className="st-fairy-star" />
        </span>
      </button>

      {open && (
        <div className="absolute left-16 top-0 w-[min(88vw,340px)] rounded-2xl border border-white/15 bg-slate-950/92 p-3 shadow-2xl backdrop-blur">
          <p className="text-sm font-semibold text-amber-200">Navigation Pixie</p>
          <p className="mt-1 text-xs text-zinc-300">Hi, traveler. Where should I flutter you?</p>

          <div className="mt-3 max-h-[70vh] space-y-3 overflow-auto pr-1">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-400">Main</p>
              <div className="mt-1 space-y-1">
                {coreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "block rounded-lg border px-2 py-1.5 text-xs transition",
                      isActivePath(pathname, link.href)
                        ? "border-violet-400/40 bg-violet-500/10 text-violet-100"
                        : "border-white/10 bg-black/25 text-zinc-200 hover:bg-white/10",
                    ].join(" ")}
                  >
                    {link.label}
                  </Link>
                ))}
                {bazaarLink && (
                  <Link
                    href={bazaarLink.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-xs text-zinc-200 transition hover:bg-white/10"
                  >
                    {bazaarLink.label}
                  </Link>
                )}
                {adminLink && (
                  <Link
                    href={adminLink.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "block rounded-lg border px-2 py-1.5 text-xs transition",
                      isActivePath(pathname, adminLink.href)
                        ? "border-violet-400/40 bg-violet-500/10 text-violet-100"
                        : "border-white/10 bg-black/25 text-zinc-200 hover:bg-white/10",
                    ].join(" ")}
                  >
                    {adminLink.label}
                  </Link>
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-400">Source Forge</p>
              <div className="mt-1 space-y-1">
                {sourceForgeLinks.length > 0 ? (
                  sourceForgeLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={[
                        "block rounded-lg border px-2 py-1.5 text-xs transition",
                        isActivePath(pathname, link.href)
                          ? "border-violet-400/40 bg-violet-500/10 text-violet-100"
                          : "border-white/10 bg-black/25 text-zinc-200 hover:bg-white/10",
                      ].join(" ")}
                    >
                      {link.label}
                    </Link>
                  ))
                ) : (
                  <p className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-xs text-zinc-500">
                    Source Forge is locked for your role.
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-400">Gods' Realm</p>
              <div className="mt-1 space-y-1">
                {godsRealmLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-xs text-zinc-200 transition hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-400">Players' Realm</p>
              <div className="mt-1 space-y-1">
                {playersRealmLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-xs text-zinc-200 transition hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
