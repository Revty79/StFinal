'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/Input";
import { GradientText } from "@/components/GradientText";

const BACKGROUND_OPTIONS = [
  { value: 'nebula.png', label: 'Nebula' },
  { value: 'SPBackground.png', label: 'Steampunk Background' },
  { value: 'WesternBG.png', label: 'Western Background' },
  { value: 'HF.png' , label: 'High Fantasy' }
];

const GEAR_OPTIONS = [
  { value: null, label: 'None' },
  { value: 'SPGear.png', label: 'Steampunk Gear' },
  { value: 'alchemy.png', label: 'Alchemy' },
  { value: 'Revolver.png', label: 'Revolver' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Preferences
  const [backgroundImage, setBackgroundImage] = useState('nebula.png');
  const [gearImage, setGearImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch user profile
        const userRes = await fetch('/api/profile/me');
        if (userRes.status === 401) {
          router.push('/login');
          return;
        }
        
        const userData = await userRes.json();
        if (userData.ok && userData.user) {
          setUser(userData.user);
        }
        
        // Fetch user preferences
        const prefRes = await fetch('/api/profile/preferences');
        const prefData = await prefRes.json();
        if (prefData.ok && prefData.preferences) {
          setBackgroundImage(prefData.preferences.backgroundImage || 'nebula.png');
          setGearImage(prefData.preferences.gearImage);
        }

        // Fetch user statistics
        const statsRes = await fetch('/api/profile/stats');
        const statsData = await statsRes.json();
        if (statsData.ok && statsData.stats) {
          setStats(statsData.stats);
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  async function handleSave() {
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch('/api/profile/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: 'void', backgroundImage, gearImage }),
      });

      const data = await res.json();
      if (data.ok) {
        setMessage('Preferences saved successfully!');
        
        // Apply changes immediately
        applyPreferences({ theme: 'void', backgroundImage, gearImage });
        
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage('Failed to save preferences.');
      }
    } catch (err) {
      setMessage('Network error. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function applyPreferences(prefs: { theme: string; backgroundImage: string; gearImage: string | null }) {
    // Apply theme class
    document.documentElement.className = `theme-${prefs.theme}`;
    
    // Apply background image
    document.body.style.backgroundImage = `
      linear-gradient(var(--st-tint), var(--st-tint)),
      url("/${prefs.backgroundImage}"),
      linear-gradient(to bottom, var(--st-top), var(--st-deep))
    `.replace(/\s+/g, ' ').trim();
    
    // Apply gear/spinner overlay
    const styleId = 'user-gear-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    if (prefs.gearImage) {
      styleEl.textContent = `
        body::before {
          background-image: url("/${prefs.gearImage}") !important;
        }
      `;
    } else {
      styleEl.textContent = `
        body::before {
          display: none !important;
        }
      `;
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  const role = user.role.toLowerCase();

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <GradientText 
              as="h1" 
              variant="title" 
              glow 
              className="font-evanescent text-3xl sm:text-4xl tracking-tight"
            >
              Profile
            </GradientText>
            <p className="mt-1 text-sm text-zinc-300">
              Manage your account details and choose your preferred theme.
            </p>
          </div>

          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </header>

        {message && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${
            message.includes('success') 
              ? 'border-green-500/40 bg-green-500/10 text-green-200' 
              : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Content grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Statistics Overview */}
          {stats && (
            <Card padded className="space-y-4">
              <GradientText 
                as="h2" 
                variant="card-title" 
                className="font-portcullion text-lg md:text-xl"
              >
                Your Journey
              </GradientText>
              <p className="text-xs text-zinc-300/90">
                Track your contributions and adventures across Serrian Tide.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Worldbuilder Creations */}
                <div className="rounded-xl border border-violet-400/30 bg-violet-400/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/20">
                      <svg className="h-4 w-4 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-violet-200">Worldbuilder</span>
                  </div>
                  <p className="text-2xl font-bold text-violet-100">{stats.worldbuilder.total}</p>
                  <p className="text-xs text-zinc-400 mt-1">Total Creations</p>
                  <div className="mt-2 pt-2 border-t border-violet-400/20 text-xs text-zinc-400 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Skills:</span>
                      <span className="text-violet-300">{stats.worldbuilder.skills}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Races:</span>
                      <span className="text-violet-300">{stats.worldbuilder.races}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NPCs:</span>
                      <span className="text-violet-300">{stats.worldbuilder.npcs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Creatures:</span>
                      <span className="text-violet-300">{stats.worldbuilder.creatures}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items:</span>
                      <span className="text-violet-300">{stats.worldbuilder.items + stats.worldbuilder.weapons + stats.worldbuilder.armor}</span>
                    </div>
                  </div>
                </div>

                {/* Campaigns Created */}
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20">
                      <svg className="h-4 w-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-amber-200">G.O.D. Role</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-100">{stats.campaigns.created}</p>
                  <p className="text-xs text-zinc-400 mt-1">Campaigns Created</p>
                  <p className="text-xs text-zinc-500 mt-3">
                    Games you've built and are running as Game Master.
                  </p>
                </div>

                {/* Campaigns Playing In */}
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/20">
                      <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-emerald-200">Player Role</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-100">{stats.campaigns.playingIn}</p>
                  <p className="text-xs text-zinc-400 mt-1">Active Campaigns</p>
                  <p className="text-xs text-zinc-500 mt-3">
                    Adventures you're currently participating in as a player.
                  </p>
                </div>

                {/* Characters */}
                <div className="rounded-xl border border-blue-400/30 bg-blue-400/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/20">
                      <svg className="h-4 w-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-blue-200">Characters</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-100">{stats.characters.total}</p>
                  <p className="text-xs text-zinc-400 mt-1">Total Characters</p>
                  <p className="text-xs text-zinc-500 mt-3">
                    Heroes and adventurers you've created across all campaigns.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Account info */}
          <Card padded className="space-y-4">
            <GradientText 
              as="h2" 
              variant="card-title" 
              className="font-portcullion text-lg md:text-xl"
            >
              Account Info
            </GradientText>
            <p className="text-xs text-zinc-300/90">
              Basic details for your Serrian Tide account.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Username"
                htmlFor="username"
                description="Shown to other players and G.O.Ds."
                required
              >
                <Input
                  id="username"
                  defaultValue={user.username}
                  placeholder="Your handle"
                />
              </FormField>

              <FormField
                label="Email"
                htmlFor="email"
                description="Used for login and notifications."
              >
                <Input
                  id="email"
                  type="email"
                  defaultValue={user.email}
                  readOnly
                  className="opacity-70 cursor-not-allowed"
                />
              </FormField>

              <FormField
                label="Role"
                htmlFor="role"
                description="Determines what you can see and control."
              >
                <Input
                  id="role"
                  defaultValue={role}
                  readOnly
                  className="uppercase tracking-wide opacity-70 cursor-not-allowed"
                />
              </FormField>
            </div>
          </Card>
        </div>

        {/* Visual Preferences */}
        <Card padded className="space-y-6">
          <div>
            <GradientText 
              as="h2" 
              variant="card-title" 
              className="font-portcullion text-lg md:text-xl"
            >
              Visual Customization
            </GradientText>
            <p className="text-xs text-zinc-300/90 mt-2">
              Customize your background and gear overlay. Changes apply immediately after saving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Background Selection */}
            <div className="space-y-3">
              <FormField
                label="Background Image"
                htmlFor="background"
                description="Main background for your interface."
              >
                <select
                  id="background"
                  value={backgroundImage}
                  onChange={(e) => setBackgroundImage(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/40 px-4 py-2 text-sm text-slate-100 shadow-inner backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  {BACKGROUND_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FormField>

              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video">
                <Image
                  src={`/${backgroundImage}`}
                  alt="Background preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Gear Selection */}
            <div className="space-y-3">
              <FormField
                label="Spinning Overlay"
                htmlFor="gear"
                description="Optional decorative spinning gear."
              >
                <select
                  id="gear"
                  value={gearImage || ''}
                  onChange={(e) => setGearImage(e.target.value || null)}
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/40 px-4 py-2 text-sm text-slate-100 shadow-inner backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  {GEAR_OPTIONS.map(opt => (
                    <option key={opt.value || 'none'} value={opt.value || ''}>{opt.label}</option>
                  ))}
                </select>
              </FormField>

              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-slate-900/50">
                {gearImage ? (
                  <Image
                    src={`/${gearImage}`}
                    alt="Gear preview"
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                    No gear selected
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Save bar */}
        <div className="flex justify-end">
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Apply & Save Changes'}
          </Button>
        </div>
      </section>
    </main>
  );
}
