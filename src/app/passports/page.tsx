'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';

interface Passport {
  id: string;
  qrCode: string;
  holderName: string;
  holderIdNo: string;
  status: string;
  box?: { label: string } | null;
}

export default function PassportsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const { data: passportsData } = useQuery<{ data: Passport[] }>({
    queryKey: ['passports'],
    queryFn: async () => {
      const res = await apiClient.get('/passports');
      return res.data;
    },
    refetchInterval: 5000,
  });

  const passports = passportsData?.data || [];

  return (
    <Shell title="Passport Management">
      <Card>
        <PageHeader
          title="All Passports"
          subtitle="Track and manage passport records"
        />

        {/* Filter Bar */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by name, ID or passport number..."
            style={{
              flex: 1,
              height: '36px',
              padding: '0 12px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <select
            style={{
              height: '36px',
              padding: '0 12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option>All Status</option>
            <option>IN_BOX</option>
            <option>ISSUED</option>
            <option>UNASSIGNED</option>
          </select>
        </div>

        <Table>
          <TableHead>
            <TableRow isHeader>
              <TableHeader>QR Code</TableHeader>
              <TableHeader>Holder Name</TableHeader>
              <TableHeader>Holder ID</TableHeader>
              <TableHeader>Current Box</TableHeader>
              <TableHeader align="right">Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {passports.map((passport) => {
              let statusVariant: 'success' | 'brand' | 'warning' = 'brand';
              if (passport.status === 'ISSUED') statusVariant = 'success';
              if (passport.status === 'UNASSIGNED') statusVariant = 'warning';

              return (
                <TableRow key={passport.id}>
                  <TableCell>
                    <span style={{ fontFamily: 'monospace' }}>{passport.qrCode}</span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontWeight: 600 }}>{passport.holderName}</span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {passport.holderIdNo}
                    </span>
                  </TableCell>
                  <TableCell>{passport.box?.label || '—'}</TableCell>
                  <TableCell align="right">
                    <Badge variant={statusVariant}>{passport.status}</Badge>
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
