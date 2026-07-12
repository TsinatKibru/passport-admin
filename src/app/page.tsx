'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Shell } from '@/components/layout/Shell';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Package, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  // Passport metrics
  totalPassports: number;
  inBox: number;
  issued: number;
  
  // Box metrics
  totalBoxes: number;
  occupiedBoxes: number;
  activeBoxes: number;
  fullBoxes: number;
  inactiveBoxes: number;
  vacantBoxes: number;
  
  // Capacity metrics
  totalCapacity: number;
  totalOccupied: number;
  totalVacant: number;
  occupancyRate: number;
  
  // Structure metrics
  totalRooms: number;
}

interface Box {
  id: string;
  qrCode: string;
  label: string;
  capacity: number;
  occupiedCount: number;
  status: string;
  slot?: {
    name: string;
    row: {
      name: string;
      shelf: {
        name: string;
        room: { name: string };
      };
    };
  };
  location: string | null;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Fetch dashboard stats from backend (no fallback - endpoint exists now)
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data;
    },
    refetchInterval: 5000,
  });

  // Fetch recent boxes for preview table (paginated, limit 10)
  const { data: boxesData } = useQuery<PaginatedResponse<Box>>({
    queryKey: ['boxes', 'preview'],
    queryFn: async () => {
      const res = await apiClient.get('/boxes?page=1&limit=10');
      return res.data;
    },
    refetchInterval: 5000,
  });

  const boxes = boxesData?.data ?? [];
  
  // Use backend-provided stats (no frontend calculation)
  const totalBoxes = stats?.totalBoxes ?? 0;
  const occupiedBoxes = stats?.occupiedBoxes ?? 0;
  const vacantBoxes = stats?.vacantBoxes ?? 0;
  const occupancyRate = stats?.occupancyRate?.toFixed(1) ?? '0.0';

  return (
    <Shell title="Dashboard Overview" subtitle="Real-time tracking summary">
      {/* Show loading state for stats */}
      {statsLoading && (
        <div style={{ marginBottom: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
          Loading dashboard statistics...
        </div>
      )}

      {/* KPI Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          icon={Package}
          value={totalBoxes}
          label="Total Movable Boxes"
          sublabel="All registered boxes"
          iconColor="var(--brand)"
          waveColor="#2563EB"
        />
        <StatCard
          icon={CheckCircle}
          value={occupiedBoxes}
          label="Occupied Boxes"
          sublabel="Currently in use"
          iconColor="var(--success)"
          waveColor="#16A34A"
        />
        <StatCard
          icon={AlertCircle}
          value={vacantBoxes}
          label="Vacant Boxes"
          sublabel="Available for use"
          iconColor="var(--warning)"
          waveColor="#D97706"
        />
        <StatCard
          icon={TrendingUp}
          value={`${occupancyRate}%`}
          label="Occupancy Rate"
          sublabel="Overall utilization"
          iconColor="var(--info)"
          waveColor="#DC2626"
        />
      </div>

      {/* Movable Box Overview Table */}
      <Card>
        <PageHeader
          title="Movable Box Overview"
          action={<Button variant="secondary">Refresh</Button>}
        />

        {/* Info: Showing recent boxes preview */}
        <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Showing most recent {boxes.length} boxes. <a href="/boxes" style={{ color: 'var(--brand)', textDecoration: 'none' }}>View all →</a>
        </div>

        <Table>
          <TableHead>
            <TableRow isHeader>
              <TableHeader>Box ID</TableHeader>
              <TableHeader>Label</TableHeader>
              <TableHeader>Location</TableHeader>
              <TableHeader align="center">Occupied</TableHeader>
              <TableHeader align="center">Capacity</TableHeader>
              <TableHeader align="right">Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {boxes.map((box) => {
              const location = box.location || 'Unassigned';
              
              // Use the actual status from backend instead of computing it
              let statusVariant: 'success' | 'warning' | 'danger' = 'success';
              let statusLabel = box.status; // Use backend status directly
              
              if (box.status === 'FULL') {
                statusVariant = 'danger';
              } else if (box.status === 'INACTIVE') {
                statusVariant = 'warning';
              } else {
                statusVariant = 'success';
              }

              return (
                <TableRow key={box.id}>
                  <TableCell>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand)' }}>
                      {box.qrCode}
                    </span>
                  </TableCell>
                  <TableCell>{box.label}</TableCell>
                  <TableCell>{location}</TableCell>
                  <TableCell align="center">{box.occupiedCount}</TableCell>
                  <TableCell align="center">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', minWidth: '20px', textAlign: 'right' }}>
                        {box.capacity}
                      </span>
                      <div style={{
                        flex: 1,
                        height: '6px',
                        borderRadius: '9999px',
                        background: 'var(--border)',
                        overflow: 'hidden',
                        minWidth: '60px',
                        maxWidth: '80px',
                      }}>
                        <div style={{
                          height: '100%',
                          borderRadius: '9999px',
                          width: `${Math.round((box.occupiedCount / box.capacity) * 100)}%`,
                          background: box.occupiedCount / box.capacity >= 0.9
                            ? 'var(--danger)'
                            : box.occupiedCount / box.capacity >= 0.5
                            ? 'var(--warning)'
                            : 'var(--brand)',
                          transition: 'width 300ms ease',
                        }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </Shell>
  );
}
