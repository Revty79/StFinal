'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function doLogout() {
    try {
      setBusy(true);
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      // Ignore body; cookie is cleared server-side
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={doLogout}
      disabled={busy}
      className="btn btn-gold disabled:opacity-60"
    >
      {busy ? 'Logging out…' : '← Logout'}
    </button>
  );
}
