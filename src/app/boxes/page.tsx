'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';

interface Box {
  id: string;
  qrCode: string;
  label: string;
  capacity: number;
  occupiedCount: number;
  status: string;
}

export default function BoxesPage() {
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

  return (
    <Shell title="Movable Boxes">
      <Card>
        <PageHeader
          title="All Movable Boxes"
          subtitle="Manage box inventory and assignments"
          action={<Button variant="primary">+ Add Box</Button>}
        />

        <Table>
          <TableHead>
            <TableRow isHeader>
              <TableHeader>Box ID</TableHeader>
              <TableHeader>Label</TableHeader>
              <TableHeader align="center">Occupied</TableHeader>
              <TableHeader align="center">Capacity</TableHeader>
              <TableHeader align="center">Utilization</TableHeader>
              <TableHeader align="right">Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {boxes.map((box) => {
              const utilization = box.capacity > 0
                ? `${Math.round((box.occupiedCount / box.capacity) * 100)}%`
                : '0%';

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
                  <TableCell align="center">{box.occupiedCount}</TableCell>
                  <TableCell align="center">{box.capacity}</TableCell>
                  <TableCell align="center">
                    <span style={{ fontWeight: 600 }}>{utilization}</span>
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
