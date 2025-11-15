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
