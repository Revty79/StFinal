'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
        <button
          onClick={goHome}
          className="inline-flex items-center gap-2 rounded-xl border border-yellow-400/40 px-3 py-2 text-sm font-medium text-yellow-200/90 hover:bg-yellow-400/10 hover:border-yellow-300/70 transition"
        >
          <span aria-hidden>←</span>
          Back to Home
        </button>
      </div>

      {/* Center card */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md items-center justify-center p-6">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          {/* Title */}
          <div className="mb-6 text-center">
            <h2 className="font-evanescent st-title-gradient st-glow text-5xl sm:text-6xl tracking-tight">
              Serrian&nbsp;Tide
            </h2>
            <p className="mt-2 text-sm text-zinc-300">Begin your journey</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 grid w-full grid-cols-2 rounded-xl border border-white/10 bg-black/30 p-1 text-sm">
            <button
              onClick={() => { setTab('login'); setMsg(null); }}
              className={`rounded-lg py-2 transition ${tab === 'login' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'}`}
              data-testid="tab-login"
            >
              Login
            </button>
            <button
              onClick={() => { setTab('register'); setMsg(null); }}
              className={`rounded-lg py-2 transition ${tab === 'register' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'}`}
              data-testid="tab-register"
            >
              Register
            </button>
          </div>

          {msg && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {msg}
            </div>
          )}

          {tab === 'login' ? (
            <section aria-label="Login" className="space-y-4" data-testid="content-login">
              <div className="space-y-2">
                <label htmlFor="login-username" className="text-sm text-slate-200">Username</label>
                <input
                  id="login-username"
                  type="text"
                  placeholder="adventurer"
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                  autoComplete="username"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none ring-0 transition placeholder:text-slate-500 focus:border-amber-300/60"
                  data-testid="input-login-username"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm text-slate-200">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none ring-0 transition placeholder:text-slate-500 focus:border-amber-300/60"
                  data-testid="input-login-password"
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-amber-400 px-4 py-2 font-semibold text-black shadow-lg transition hover:bg-amber-300 active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="button-login-submit"
              >
                {loading ? 'Working…' : 'Login'}
              </button>
              <p className="pt-2 text-center text-xs text-slate-400">
                New here?{' '}
                <button onClick={() => setTab('register')} className="font-medium text-amber-300 hover:underline">
                  Create an account
                </button>
              </p>
            </section>
          ) : (
            <section aria-label="Register" className="space-y-4" data-testid="content-register">
              <div className="space-y-2">
                <label htmlFor="register-username" className="text-sm text-slate-200">Username</label>
                <input
                  id="register-username"
                  type="text"
                  placeholder="adventurer"
                  value={regUser}
                  onChange={e => setRegUser(e.target.value)}
                  autoComplete="username"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none ring-0 transition placeholder:text-slate-500 focus:border-amber-300/60"
                  data-testid="input-register-username"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="register-email" className="text-sm text-slate-200">Email</label>
                <input
                  id="register-email"
                  type="email"
                  placeholder="you@realm.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none ring-0 transition placeholder:text-slate-500 focus:border-amber-300/60"
                  data-testid="input-register-email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="register-password" className="text-sm text-slate-200">Password</label>
                <input
                  id="register-password"
                  type="password"
                  value={regPass}
                  onChange={e => setRegPass(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none ring-0 transition placeholder:text-slate-500 focus:border-amber-300/60"
                  data-testid="input-register-password"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="register-confirm" className="text-sm text-slate-200">Confirm Password</label>
                <input
                  id="register-confirm"
                  type="password"
                  value={regConfirm}
                  onChange={e => setRegConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none ring-0 transition placeholder:text-slate-500 focus:border-amber-300/60"
                  data-testid="input-register-confirm"
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-amber-400 px-4 py-2 font-semibold text-black shadow-lg transition hover:bg-amber-300 active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="button-register-submit"
              >
                {loading ? 'Working…' : 'Create Account'}
              </button>
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
            <Link href="#" className="hover:text-slate-200 hover:underline">Forgot password?</Link>
            <span className="select-none">GM is G.O.D.</span>
          </div>
        </div>
      </div>
    </main>
  );
}
