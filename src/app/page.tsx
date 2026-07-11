'use client';

import { useEffect } from 'react';
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
}

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const { data: boxes = [] } = useQuery<Box[]>({
    queryKey: ['boxes'],
    queryFn: async () => {
      const res = await apiClient.get('/boxes');
      return res.data.data || res.data;
    },
    refetchInterval: 5000,
  });

  // Calculate metrics
  const totalBoxes = boxes.length;
  const occupiedBoxes = boxes.filter(b => b.occupiedCount > 0).length;
  const vacantBoxes = totalBoxes - occupiedBoxes;
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

        {/* Search Input */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search Box ID or Location..."
            style={{
              width: '300px',
              height: '36px',
              padding: '0 12px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'all 150ms',
            }}
            onFocus={(e) => {
              e.target.style.background = 'var(--bg-surface)';
              e.target.style.borderColor = 'var(--brand)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'var(--bg-subtle)';
              e.target.style.borderColor = 'var(--border)';
            }}
          />
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
            {boxes.slice(0, 10).map((box) => {
              const location = box.slot
                ? `${box.slot.row.shelf.room.name} / ${box.slot.row.shelf.name} / ${box.slot.row.name}`
                : 'Unassigned';
              
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
