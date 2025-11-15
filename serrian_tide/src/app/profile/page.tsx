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
  { value: 'SPBackground.png', label: 'SP Background' },
  { value: 'WesternBG.png', label: 'Western Background' },
];

const GEAR_OPTIONS = [
  { value: null, label: 'None' },
  { value: 'SPGear.png', label: 'SP Gear' },
  { value: 'alchemy.png', label: 'Alchemy (Spinning)' },
  { value: 'Revolver.png', label: 'Revolver (Spinning)' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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
