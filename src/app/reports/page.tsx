'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import toast from 'react-hot-toast';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Activity,
  Package,
  TrendingUp,
  FileText,
  Building2,
  ChevronDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RoomOccupancy {
  roomId: string;
  roomName: string;
  boxes: number;
  capacity: number;
  occupied: number;
  vacant: number;
  occupancyRate: number;
}

interface ActivityTrend {
  date: string;
  assigned: number;
  returned: number;
  issued: number;
  moved: number;
  total: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [trendDays, setTrendDays] = useState(30);
  const [exportingType, setExportingType] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Fetch Dashboard Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data;
    },
  });

  // Fetch Activity Trend (dynamic based on selected days)
  const { data: trendData, isLoading: trendLoading } = useQuery<ActivityTrend[]>({
    queryKey: ['dashboard', 'activity-trend', trendDays],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboard/activity-trend?days=${trendDays}`);
      return res.data;
    },
  });

  // Fetch Room Occupancy
  const { data: occupancyData, isLoading: occupancyLoading } = useQuery<RoomOccupancy[]>({
    queryKey: ['dashboard', 'room-occupancy'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/room-occupancy');
      return res.data;
    },
  });

  // Helper: Download CSV helper
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export 1: Passport Custody Register
  const handleExportPassports = async () => {
    setExportingType('passports');
    try {
      // Fetch all registered passports (limit 1000 for exports)
      const res = await apiClient.get('/passports?page=1&limit=1000');
      const passports = res.data.data || [];

      if (passports.length === 0) {
        toast.error('No passports found to export.');
        return;
      }

      const headers = ['Passport ID / QR', 'Holder Name', 'Holder ID Number', 'Status', 'Assigned Box', 'Room', 'Shelf', 'Row', 'Slot', 'Registered At'];
      const rows = passports.map((p: any) => [
        p.qrCode,
        p.holderName,
        p.holderIdNo || '',
        p.status,
        p.box?.label || 'Unassigned',
        p.box?.slot?.row?.shelf?.room?.name || '',
        p.box?.slot?.row?.shelf?.name || '',
        p.box?.slot?.row?.name || '',
        p.box?.slot?.name || '',
        new Date(p.createdAt).toLocaleString(),
      ]);

      downloadCSV(`Passport_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
      toast.success('Passport inventory exported successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export passport registry.');
    } finally {
      setExportingType(null);
    }
  };

  // Export 2: Movable Box Registry
  const handleExportBoxes = async () => {
    setExportingType('boxes');
    try {
      // Fetch all boxes
      const res = await apiClient.get('/boxes?page=1&limit=1000');
      const boxes = res.data.data || [];

      if (boxes.length === 0) {
        toast.error('No boxes found to export.');
        return;
      }

      const headers = ['Box QR Code', 'Label', 'Status', 'Occupied Count', 'Max Capacity', 'Utilization %', 'Room Location', 'Shelf', 'Row', 'Slot'];
      const rows = boxes.map((b: any) => {
        const utilPercent = b.capacity > 0 ? ((b.occupiedCount / b.capacity) * 100).toFixed(1) : '0';
        return [
          b.qrCode,
          b.label,
          b.status,
          b.occupiedCount,
          b.capacity,
          `${utilPercent}%`,
          b.slot?.row?.shelf?.room?.name || 'Unassigned',
          b.slot?.row?.shelf?.name || '',
          b.slot?.row?.name || '',
          b.slot?.name || '',
        ];
      });

      downloadCSV(`Box_Utilization_Report_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
      toast.success('Movable boxes utilization exported successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export box registry.');
    } finally {
      setExportingType(null);
    }
  };

  // Export 3: Audit Activity Ledger
  const handleExportLogs = async () => {
    setExportingType('logs');
    try {
      // Fetch audit logs
      const res = await apiClient.get('/location/logs?page=1&limit=1000');
      const logs = res.data.data || [];

      if (logs.length === 0) {
        toast.error('No activity logs found to export.');
        return;
      }

      const headers = ['Timestamp', 'Action Type', 'Passport QR', 'Holder Name', 'Box QR', 'Box Label', 'Origin Location', 'Destination Location', 'Operator'];
      const rows = logs.map((l: any) => [
        new Date(l.createdAt).toLocaleString(),
        l.action,
        l.passport?.qrCode || '',
        l.passport?.holderName || '',
        l.box?.qrCode || '',
        l.box?.label || '',
        l.fromLocation || '',
        l.toLocation || '',
        l.user?.name || 'System / API',
      ]);

      downloadCSV(`Audit_Activity_Ledger_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
      toast.success('Audit activity ledger exported successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export audit ledger.');
    } finally {
      setExportingType(null);
    }
  };

  // Loading indicator for page state
  const isPageLoading = statsLoading || occupancyLoading;

  // Chart Color Palette
  const COLORS = {
    brand: 'var(--brand)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    info: 'var(--info)',
    border: 'var(--border)',
    card: 'var(--card)',
    textPrimary: 'var(--text-primary)',
    textMuted: 'var(--text-muted)',
  };

  // Pie Chart Data mapping
  const pieData = stats
    ? [
        { name: 'In Storage (In Box)', value: stats.inBox, color: COLORS.brand },
        { name: 'Handed Over (Issued)', value: stats.issued, color: COLORS.success },
      ]
    : [];

  return (
    <Shell
      title={t('reports.title', 'Reports & Analytics')}
      subtitle={t('reports.subtitle', 'Comprehensive metrics, space utilization analysis, and system register export tools.')}
    >
      {isPageLoading && (
        <div style={{ marginBottom: '24px', color: COLORS.textMuted, fontSize: '14px' }}>
          {t('reports.loading', 'Loading system metrics and reports data...')}
        </div>
      )}

      {/* KPI Cards Row */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Card 1: Passport Overview */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius)',
              background: 'var(--brand-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand)',
            }}>
              <FileText size={24} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: COLORS.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('reports.passports_custody', 'Passports in Custody')}</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: COLORS.textPrimary, margin: '4px 0 2px' }}>{stats.totalPassports}</h3>
              <p style={{ fontSize: '12px', color: COLORS.textMuted }}>
                <span style={{ fontWeight: 600, color: 'var(--brand)' }}>{stats.inBox}</span> {t('reports.inside_boxes', 'inside boxes')} • <span style={{ fontWeight: 600, color: 'var(--success)' }}>{stats.issued}</span> {t('reports.issued', 'issued')}
              </p>
            </div>
          </div>

          {/* Card 2: Box Overview */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius)',
              background: 'var(--warning-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--warning)',
            }}>
              <Package size={24} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: COLORS.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('reports.movable_boxes', 'Movable Boxes')}</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: COLORS.textPrimary, margin: '4px 0 2px' }}>{stats.totalBoxes}</h3>
              <p style={{ fontSize: '12px', color: COLORS.textMuted }}>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>{stats.occupiedBoxes}</span> {t('reports.occupied', 'occupied')} • <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{stats.vacantBoxes}</span> {t('reports.vacant', 'vacant')}
              </p>
            </div>
          </div>

          {/* Card 3: Storage Occupancy */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius)',
              background: 'var(--info-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--info)',
            }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: COLORS.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('reports.slot_occupancy_rate', 'Slot Occupancy Rate')}</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: COLORS.textPrimary, margin: '4px 0 2px' }}>{stats.occupancyRate.toFixed(1)}%</h3>
              <p style={{ fontSize: '12px', color: COLORS.textMuted }}>
                <span style={{ fontWeight: 600, color: 'var(--info)' }}>{stats.totalOccupied}</span> / {stats.totalCapacity} {t('reports.total_assigned_slots', 'total assigned slots')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Interactive Charts */}
      {mounted && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Chart 1: Activity Trend over time */}
          <Card>
            <PageHeader
              title={t('reports.activity_trend', 'Passport Activity Trend')}
              subtitle={t('reports.activity_trend_sub', 'Daily volume of passport return and issue events')}
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 10px', background: 'var(--bg-surface)' }}>
                  <Calendar size={14} color={COLORS.textMuted} />
                  <select
                    value={trendDays}
                    onChange={(e) => setTrendDays(parseInt(e.target.value))}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value="7">{t('reports.range_7_days', 'Last 7 Days')}</option>
                    <option style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value="15">{t('reports.range_15_days', 'Last 15 Days')}</option>
                    <option style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value="30">{t('reports.range_30_days', 'Last 30 Days')}</option>
                    <option style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value="90">{t('reports.range_90_days', 'Last 90 Days')}</option>
                  </select>
                </div>
              }
            />
            {trendLoading ? (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted }}>
                {t('dashboard.loading_stats', 'Loading trend chart...')}
              </div>
            ) : (
              <div style={{ height: '300px', width: '100%', padding: '10px 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReturned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--brand)" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorIssued" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                    <XAxis dataKey="date" stroke={COLORS.textMuted} fontSize={11} tickLine={false} />
                    <YAxis stroke={COLORS.textMuted} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      labelStyle={{ fontWeight: 600, color: COLORS.textPrimary }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Area name={t('reports.returned_vault', 'Returned to Vault')} type="monotone" dataKey="returned" stroke="var(--brand)" strokeWidth={2} fillOpacity={1} fill="url(#colorReturned)" />
                    <Area name={t('reports.issued_owner', 'Issued to Owner')} type="monotone" dataKey="issued" stroke="var(--success)" strokeWidth={2} fillOpacity={1} fill="url(#colorIssued)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Chart 2: Room Capacity Comparison */}
          <Card>
            <PageHeader
              title={t('reports.room_capacity', 'Room Capacity Utilization')}
              subtitle={t('reports.room_capacity_sub', 'Comparing total capacity vs occupied slots per storage room')}
            />
            {occupancyLoading ? (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted }}>
                {t('dashboard.loading_stats', 'Loading room utilization chart...')}
              </div>
            ) : (
              <div style={{ height: '300px', width: '100%', padding: '10px 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                    <XAxis dataKey="roomName" stroke={COLORS.textMuted} fontSize={11} tickLine={false} />
                    <YAxis stroke={COLORS.textMuted} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      labelStyle={{ fontWeight: 600, color: COLORS.textPrimary }}
                      cursor={{ fill: 'var(--bg-subtle)', opacity: 0.15 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar name={t('reports.occupied_slots', 'Occupied Slots')} dataKey="occupied" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Bar name={t('reports.total_capacity', 'Total Capacity')} dataKey="capacity" fill="var(--border)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Room Occupancy Tabular Summary */}
      {occupancyData && occupancyData.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <Card>
            <PageHeader
              title={t('reports.storage_breakdown', 'Organized Storage breakdown')}
              subtitle={t('reports.storage_breakdown_sub', 'Occupancy rate, box allocations, and vacant slots details per room')}
            />
            <Table>
              <TableHead>
                <TableRow isHeader>
                  <TableHeader>{t('reports.room_name', 'Room Name')}</TableHeader>
                  <TableHeader align="center">{t('reports.movable_boxes', 'Movable Boxes')}</TableHeader>
                  <TableHeader align="center">{t('reports.occupied_slots', 'Occupied Slots')}</TableHeader>
                  <TableHeader align="center">{t('reports.total_capacity', 'Total Capacity')}</TableHeader>
                  <TableHeader align="center">{t('reports.vacant_slots', 'Vacant Slots')}</TableHeader>
                  <TableHeader align="right">{t('reports.occupancy_percent', 'Occupancy %')}</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {occupancyData.map((room) => (
                  <TableRow key={room.roomId}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={16} color={COLORS.brand} />
                        <span style={{ fontWeight: 600 }}>{room.roomName}</span>
                      </div>
                    </TableCell>
                    <TableCell align="center">{room.boxes}</TableCell>
                    <TableCell align="center">{room.occupied}</TableCell>
                    <TableCell align="center">{room.capacity}</TableCell>
                    <TableCell align="center">{room.vacant}</TableCell>
                    <TableCell align="right">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{room.occupancyRate.toFixed(1)}%</span>
                        <div style={{
                          width: '80px',
                          height: '6px',
                          borderRadius: '9999px',
                          background: 'var(--border)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            borderRadius: '9999px',
                            width: `${Math.round(room.occupancyRate)}%`,
                            background: room.occupancyRate >= 90
                              ? COLORS.danger
                              : room.occupancyRate >= 70
                              ? COLORS.warning
                              : COLORS.brand,
                          }} />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* CSV Export Center */}
      <div style={{ marginBottom: '24px' }}>
        <Card>
          <PageHeader
            title={t('reports.export_center', 'Data Export Center')}
            subtitle={t('reports.export_center_sub', 'Download local registers and audit trails in CSV format for local analysis and archiving')}
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginTop: '8px'
          }}>
            {/* Export Card 1: Passports */}
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              background: 'var(--bg-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '150px'
            }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color={COLORS.brand} />
                  {t('reports.passport_register', 'Passport Custody Register')}
                </h4>
                <p style={{ fontSize: '13px', color: COLORS.textMuted, marginTop: '6px' }}>
                  {t('reports.passport_register_desc', 'Complete registry of all passports, holder details, status, and active movable box locations.')}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleExportPassports}
                disabled={exportingType !== null}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '13px' }}
              >
                <Download size={14} />
                {exportingType === 'passports' ? t('reports.exporting', 'Exporting...') : t('reports.export_csv', 'Export to CSV')}
              </Button>
            </div>

            {/* Export Card 2: Boxes */}
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              background: 'var(--bg-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '150px'
            }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={16} color={COLORS.warning} />
                  {t('reports.box_registry', 'Movable Box Registry')}
                </h4>
                <p style={{ fontSize: '13px', color: COLORS.textMuted, marginTop: '6px' }}>
                  {t('reports.box_registry_desc', 'List of boxes in system, capacities, occupied status, and their physical slot layout locations.')}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleExportBoxes}
                disabled={exportingType !== null}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '13px' }}
              >
                <Download size={14} />
                {exportingType === 'boxes' ? t('reports.exporting', 'Exporting...') : t('reports.export_csv', 'Export to CSV')}
              </Button>
            </div>

            {/* Export Card 3: Audit Timeline */}
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              background: 'var(--bg-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '150px'
            }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} color={COLORS.success} />
                  {t('reports.activity_ledger', 'System Activity Ledger')}
                </h4>
                <p style={{ fontSize: '13px', color: COLORS.textMuted, marginTop: '6px' }}>
                  {t('reports.activity_ledger_desc', 'Complete historical record of movements, assignments, returns, relocations, and operator trails.')}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleExportLogs}
                disabled={exportingType !== null}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '13px' }}
              >
                <Download size={14} />
                {exportingType === 'logs' ? t('reports.exporting', 'Exporting...') : t('reports.export_csv', 'Export to CSV')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
