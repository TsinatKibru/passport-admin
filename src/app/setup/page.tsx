'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Settings } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <Shell title="Setup">
      <Card>
        <PageHeader
          title="System Configuration"
          subtitle="Configure initial data and settings"
        />

        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--text-muted)',
          }}
        >
          <Settings size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>Setup Coming Soon</p>
          <p style={{ fontSize: '13px' }}>Configuration options will be available here.</p>
        </div>
      </Card>
    </Shell>
  );
}
