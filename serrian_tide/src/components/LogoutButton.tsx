'use client';

import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      // Reset visual preferences to defaults
      document.documentElement.className = 'theme-void';
      document.body.style.backgroundImage = `
        linear-gradient(var(--st-tint), var(--st-tint)),
        url("/nebula.png"),
        linear-gradient(to bottom, var(--st-top), var(--st-deep))
      `.replace(/\s+/g, ' ').trim();
      
      // Remove gear overlay
      const styleEl = document.getElementById('user-gear-style');
      if (styleEl) {
        styleEl.textContent = 'body::before { display: none !important; }';
      }
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Client-side navigation to home
        router.push('/');
      } else {
        console.error('Logout failed');
        // Still redirect on error
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect on error
      router.push('/');
    }
  };

  return (
    <Button 
      variant="primary" 
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? 'Logging out...' : '← Logout'}
    </Button>
  );
}
