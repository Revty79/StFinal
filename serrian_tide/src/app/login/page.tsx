'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GradientText } from "@/components/GradientText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { Tabs } from "@/components/Tabs";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // login
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // register
  const [regUser, setRegUser] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function goHome() {
    router.push('/');
  }

  async function handleLogin() {
    if (!loginUser || !loginPass) {
      setMsg('Please enter both username and password.');
      return;
    }
    try {
      setLoading(true);
      setMsg(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMsg(data?.error === 'INVALID_CREDENTIALS' ? 'Invalid username or password.' : 'Login failed.');
        return;
      }
      router.push('/dashboard');
    } catch {
      setMsg('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function isValidEmail(s: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  async function handleRegister() {
    if (!regUser || !regEmail || !regPass || !regConfirm) {
      setMsg('Fill out all fields to continue.');
      return;
    }
    if (!isValidEmail(regEmail)) {
      setMsg('Enter a valid email address.');
      return;
    }
    if (regPass !== regConfirm) {
      setMsg('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      setMsg(null);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUser, email: regEmail, password: regPass }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMsg(data?.error === 'USERNAME_TAKEN' ? 'That username is taken.' : 'Registration failed.');
        return;
      }
      router.push('/dashboard');
    } catch {
      setMsg('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full px-6">
      {/* Back to home */}
      <div className="absolute left-4 top-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={goHome}
          className="gap-2"
        >
          <span aria-hidden>←</span>
          Back to Home
        </Button>
      </div>

      {/* Center card */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md items-center justify-center p-6">
        <Card className="w-full">
          {/* Title */}
          <div className="mb-6 text-center">
            <GradientText 
              as="h2" 
              variant="title" 
              glow 
              className="font-evanescent text-5xl sm:text-6xl tracking-tight"
            >
              Serrian&nbsp;Tide
            </GradientText>
            <p className="mt-2 text-sm text-zinc-300">Begin your journey</p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <Tabs
              tabs={[
                { id: 'login', label: 'Login' },
                { id: 'register', label: 'Register' }
              ]}
              activeId={tab}
              onChange={(id) => {
                setTab(id as 'login' | 'register');
                setMsg(null);
              }}
              fullWidth
            />
          </div>

          {msg && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {msg}
            </div>
          )}

          {tab === 'login' ? (
            <section aria-label="Login" className="space-y-4" data-testid="content-login">
              <FormField
                label="Username"
                htmlFor="login-username"
                required
              >
                <Input
                  id="login-username"
                  type="text"
                  placeholder="adventurer"
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="username"
                  data-testid="input-login-username"
                />
              </FormField>

              <FormField
                label="Password"
                htmlFor="login-password"
                required
              >
                <Input
                  id="login-password"
                  type="password"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="current-password"
                  data-testid="input-login-password"
                />
              </FormField>

              <Button
                variant="primary"
                fullWidth
                onClick={handleLogin}
                disabled={loading}
                className="mt-2"
                data-testid="button-login-submit"
              >
                {loading ? 'Working…' : 'Login'}
              </Button>

              <p className="pt-2 text-center text-xs text-slate-400">
                New here?{' '}
                <button onClick={() => setTab('register')} className="font-medium text-amber-300 hover:underline">
                  Create an account
                </button>
              </p>
            </section>
          ) : (
            <section aria-label="Register" className="space-y-4" data-testid="content-register">
              <FormField
                label="Username"
                htmlFor="register-username"
                required
              >
                <Input
                  id="register-username"
                  type="text"
                  placeholder="adventurer"
                  value={regUser}
                  onChange={e => setRegUser(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  autoComplete="username"
                  data-testid="input-register-username"
                />
              </FormField>

              <FormField
                label="Email"
                htmlFor="register-email"
                required
              >
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@realm.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  autoComplete="email"
                  data-testid="input-register-email"
                />
              </FormField>

              <FormField
                label="Password"
                htmlFor="register-password"
                required
              >
                <Input
                  id="register-password"
                  type="password"
                  value={regPass}
                  onChange={e => setRegPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  autoComplete="new-password"
                  data-testid="input-register-password"
                />
              </FormField>

              <FormField
                label="Confirm Password"
                htmlFor="register-confirm"
                required
              >
                <Input
                  id="register-confirm"
                  type="password"
                  value={regConfirm}
                  onChange={e => setRegConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  autoComplete="new-password"
                  data-testid="input-register-confirm"
                />
              </FormField>

              <Button
                variant="primary"
                fullWidth
                onClick={handleRegister}
                disabled={loading}
                className="mt-2"
                data-testid="button-register-submit"
              >
                {loading ? 'Working…' : 'Create Account'}
              </Button>

              <p className="pt-2 text-center text-xs text-slate-400">
                Already have an account?{' '}
                <button onClick={() => setTab('login')} className="font-medium text-amber-300 hover:underline">
                  Login
                </button>
              </p>
            </section>
          )}

          {/* Footer links */}
          <div className="mt-6 flex items-center justify-between text-xs text-slate-400/80">
            <button className="hover:text-slate-200 hover:underline">
              Forgot password?
            </button>
            <span className="select-none">GM is G.O.D.</span>
          </div>
        </Card>
      </div>
    </main>
  );
}
