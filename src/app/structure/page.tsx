'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Folder } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  qrCode: string;
  _count?: { shelves: number };
}

export default function StructurePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await apiClient.get('/location/rooms');
      return res.data;
    },
    refetchInterval: 5000,
  });

  return (
    <Shell title="Physical Structure">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left: Tree View */}
        <Card>
          <PageHeader
            title="Storage Facility Hierarchy"
            subtitle="Central Repository System (CRS-01)"
          />

          {rooms.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                color: 'var(--text-muted)',
              }}
            >
              <Folder size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>No Rooms Configured</p>
              <p style={{ fontSize: '13px' }}>Start by adding a room to the system.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rooms.map((room) => (
                <div
                  key={room.id}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Folder size={18} color="var(--brand)" />
                  <span style={{ flex: 1, fontWeight: 600 }}>{room.name}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      background: 'var(--bg-subtle)',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {room.qrCode}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {room._count?.shelves || 0} shelves
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right: Detail Panel */}
        <Card>
          <PageHeader title="Details" />
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: 'var(--text-muted)',
            }}
          >
            <p style={{ fontSize: '13px' }}>Select an item to view details</p>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
