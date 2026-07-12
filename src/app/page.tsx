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
  totalPassports: number;
  inBox: number;
  issued: number;
  totalBoxes: number;
  occupiedBoxes: number;
  fullBoxes: number;
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

  // Fetch dashboard stats (aggregated metrics from backend)
  // Fallback: calculate from boxes data if stats endpoint not available
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/dashboard/stats');
        return res.data;
      } catch (error) {
        // Fallback: endpoint doesn't exist yet, return empty stats
        return {
          totalPassports: 0,
          inBox: 0,
          issued: 0,
          totalBoxes: 0,
          occupiedBoxes: 0,
          fullBoxes: 0,
          totalRooms: 0,
        };
      }
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
  
  // Calculate metrics from boxes data (fallback if stats endpoint unavailable)
  const totalBoxesFromData = boxesData?.total ?? 0;
  const occupiedBoxesFromData = boxes.filter(b => b.occupiedCount > 0).length;
  
  const totalBoxes = stats?.totalBoxes || totalBoxesFromData;
  const occupiedBoxes = stats?.occupiedBoxes || occupiedBoxesFromData;
  const vacantBoxes = totalBoxes - occupiedBoxes;
  
  // Calculate occupancy rate
  const totalCapacity = boxes.reduce((acc, b) => acc + b.capacity, 0);
  const totalOccupied = boxes.reduce((acc, b) => acc + b.occupiedCount, 0);
  const occupancyRate = totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100).toFixed(1) : '0.0';

  return (
    <Shell title="Dashboard Overview" subtitle="Real-time tracking summary">
      {/* KPI Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          icon={Package}
          value={totalBoxes}
          label="Total Movable Boxes"
          iconColor="var(--brand)"
        />
        <StatCard
          icon={CheckCircle}
          value={occupiedBoxes}
          label="Occupied Boxes"
          iconColor="var(--success)"
        />
        <StatCard
          icon={AlertCircle}
          value={vacantBoxes}
          label="Vacant Boxes"
          iconColor="var(--warning)"
        />
        <StatCard
          icon={TrendingUp}
          value={`${occupancyRate}%`}
          label="Occupancy Rate"
          iconColor="var(--info)"
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
              
              let statusVariant: 'success' | 'warning' | 'danger' = 'success';
              let statusLabel = 'ACTIVE';
              
              if (box.occupiedCount === box.capacity) {
                statusVariant = 'danger';
                statusLabel = 'FULL';
              } else if (box.occupiedCount === 0) {
                statusVariant = 'warning';
                statusLabel = 'INACTIVE';
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
                  <TableCell align="center">{box.capacity}</TableCell>
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
