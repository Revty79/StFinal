"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Tabs } from "@/components/Tabs";

type Role = "admin" | "privileged" | "universe_creator" | "world_developer" | "world_builder" | "free";

type User = {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

type Stats = {
  usersByRole: Record<Role, number>;
  contentCounts: {
    skills: number;
    npcs: number;
    creatures: number;
    items: number;
    races: number;
    calendars: number;
  };
  freeVsPremium: {
    freeSkills: number;
    premiumSkills: number;
    freeNpcs: number;
    premiumNpcs: number;
  };
};

type AdminTabKey = "overview" | "users" | "content";

const ADMIN_TABS = [
  { id: "overview" as AdminTabKey, label: "Overview" },
  { id: "users" as AdminTabKey, label: "User Management" },
  { id: "content" as AdminTabKey, label: "Content Moderation" },
];

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: "admin", label: "Administrator", description: "Full system access" },
  { value: "privileged", label: "Privileged User", description: "Unlimited worlds, special access" },
  { value: "universe_creator", label: "Universe Creator", description: "Up to 12 worlds" },
  { value: "world_developer", label: "World Developer", description: "Up to 6 worlds" },
  { value: "world_builder", label: "World Builder", description: "Up to 3 worlds" },
  { value: "free", label: "Free User", description: "Basic access, no worlds" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
    loadStats();
    loadUsers();
  }, []);

  async function checkAccess() {
    try {
      const res = await fetch("/api/profile/me");
      const data = await res.json();
      if (!data.ok || data.user?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
    } catch (err) {
      router.push("/dashboard");
    }
  }

  async function loadStats() {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }

  async function updateUserRole(userId: string, newRole: Role) {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    setUpdatingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (data.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        alert("User role updated successfully");
      } else {
        alert(`Failed to update role: ${data.error}`);
      }
    } catch (err) {
      console.error("Update role error:", err);
      alert("Failed to update user role");
    } finally {
      setUpdatingUserId(null);
    }
  }

  const filteredUsers = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (userSearch) {
      const q = userSearch.toLowerCase();
      return (
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10 flex items-center justify-center">
        <p className="text-zinc-400">Loading admin dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <GradientText
              as="h1"
              variant="title"
              glow
              className="font-evanescent text-4xl sm:text-5xl tracking-tight"
            >
              Admin Dashboard
            </GradientText>
            <p className="mt-1 text-sm text-zinc-300/90">
              System administration and user management
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Tabs
            tabs={ADMIN_TABS}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as AdminTabKey)}
          />
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Users by Role */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-zinc-200 mb-3">
                  Users by Role
                </h3>
                <div className="space-y-2">
                  {stats && Object.entries(stats.usersByRole).map(([role, count]) => (
                    <div key={role} className="flex justify-between text-xs">
                      <span className="text-zinc-400 capitalize">
                        {role.replace(/_/g, " ")}
                      </span>
                      <span className="text-zinc-100 font-medium">{count}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-semibold">
                    <span className="text-zinc-300">Total Users</span>
                    <span className="text-zinc-100">
                      {stats ? Object.values(stats.usersByRole).reduce((a, b) => a + b, 0) : 0}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Content Counts */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-zinc-200 mb-3">
                  Content Library
                </h3>
                <div className="space-y-2">
                  {stats && Object.entries(stats.contentCounts).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span className="text-zinc-400 capitalize">{type}</span>
                      <span className="text-zinc-100 font-medium">{count}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-semibold">
                    <span className="text-zinc-300">Total Items</span>
                    <span className="text-zinc-100">
                      {stats ? Object.values(stats.contentCounts).reduce((a, b) => a + b, 0) : 0}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Free vs Premium */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-zinc-200 mb-3">
                  Free vs Premium Content
                </h3>
                <div className="space-y-2">
                  {stats && (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Free Skills</span>
                        <span className="text-emerald-400 font-medium">
                          {stats.freeVsPremium.freeSkills}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Premium Skills</span>
                        <span className="text-amber-400 font-medium">
                          {stats.freeVsPremium.premiumSkills}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Free NPCs</span>
                        <span className="text-emerald-400 font-medium">
                          {stats.freeVsPremium.freeNpcs}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Premium NPCs</span>
                        <span className="text-amber-400 font-medium">
                          {stats.freeVsPremium.premiumNpcs}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-zinc-200 mb-3">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab("users")}
                >
                  Manage Users
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab("content")}
                >
                  Review Content
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push("/worldbuilder/skillsets")}
                >
                  Manage Skills
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* USER MANAGEMENT TAB */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-zinc-200 mb-3">
                Search & Filter Users
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by username or email..."
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as Role | "")}
                  className="rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm text-zinc-100 outline-none"
                >
                  <option value="">All Roles</option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </Card>

            {/* User List */}
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-sm font-semibold text-zinc-100">
                          {user.username}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-xs bg-violet-500/20 text-violet-300 border border-violet-400/30">
                          {user.role.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{user.email}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <label className="text-xs text-zinc-400">Change Role:</label>
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as Role)}
                        disabled={updatingUserId === user.id}
                        className="rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-zinc-100 outline-none disabled:opacity-50"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      {updatingUserId === user.id && (
                        <p className="text-xs text-amber-400">Updating...</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {filteredUsers.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-sm text-zinc-500">No users found</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* CONTENT MODERATION TAB */}
        {activeTab === "content" && (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">
              Content Moderation
            </h3>
            <p className="text-sm text-zinc-400">
              Coming soon: Review and moderate user-generated content
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}
