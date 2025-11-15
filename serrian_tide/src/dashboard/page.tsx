import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/session";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen px-6 py-10">
      <header className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-evanescent st-title-gradient text-4xl sm:text-5xl tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm opacity-85">Welcome, {user.username}</p>
          <p className="text-xs opacity-70">Role: <span className="font-medium">{user.role}</span></p>
        </div>
        <LogoutButton />
      </header>

      <section className="max-w-5xl mx-auto">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="st-card-title-gradient font-portcullion" data-card-title>
            Galaxy Forge (placeholder)
          </h2>
          <p className="mt-2 text-sm opacity-85">
            Stub content. If you can see this after login, sessions work. Click Logout to test clearing the cookie.
          </p>
        </div>
      </section>
    </main>
  );
}
