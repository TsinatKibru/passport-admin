'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import { RoleProvider } from '@/lib/auth/RoleContext';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5-second polling interval for "live" dashboard feel — CONVENTIONS.md §1
            // WebSockets/Redis not needed at this scale.
            refetchInterval: 5_000,
            staleTime: 4_000,
            retry: 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <RoleProvider>
          {children}
        </RoleProvider>
      </LanguageProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: 'var(--success)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--danger)',
              secondary: 'white',
            },
            duration: 5000,
          },
        }}
      />
    </QueryClientProvider>
  );
}
