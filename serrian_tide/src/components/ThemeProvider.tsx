'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch('/api/profile/preferences');
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.preferences) {
            const { theme, backgroundImage, gearImage } = data.preferences;
            
            // Apply theme class
            document.documentElement.className = `theme-${theme || 'void'}`;
            
            // Apply background image
            if (backgroundImage) {
              document.body.style.backgroundImage = `
                linear-gradient(var(--st-tint), var(--st-tint)),
                url("/${backgroundImage}"),
                linear-gradient(to bottom, var(--st-top), var(--st-deep))
              `.replace(/\s+/g, ' ').trim();
            }
            
            // Apply gear/spinner overlay
            const styleId = 'user-gear-style';
            let styleEl = document.getElementById(styleId) as HTMLStyleElement;
            
            if (!styleEl) {
              styleEl = document.createElement('style');
              styleEl.id = styleId;
              document.head.appendChild(styleEl);
            }
            
            if (gearImage) {
              styleEl.textContent = `
                body::before {
                  background-image: url("/${gearImage}") !important;
                }
              `;
            } else {
              styleEl.textContent = `
                body::before {
                  display: none !important;
                }
              `;
            }
          } else if (res.status === 401) {
            // User not logged in, apply defaults
            document.documentElement.className = 'theme-void';
            document.body.style.backgroundImage = `
              linear-gradient(var(--st-tint), var(--st-tint)),
              url("/nebula.png"),
              linear-gradient(to bottom, var(--st-top), var(--st-deep))
            `.replace(/\s+/g, ' ').trim();
            
            const styleEl = document.getElementById('user-gear-style');
            if (styleEl) {
              styleEl.textContent = 'body::before { display: none !important; }';
            }
          }
        }
      } catch (err) {
        console.error('Failed to load theme preferences:', err);
      }
    }
    
    loadPreferences();
  }, [pathname]); // Reload when navigating (including after login)
  
  return <>{children}</>;
}
