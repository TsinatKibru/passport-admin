'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Clock, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Calendar } from 'lucide-react';

interface LogEntry {
  id: string;
  action: string;
  fromLocation: string | null;
  toLocation: string | null;
  notes?: string | null;
  createdAt: string;
  passport?: { qrCode: string; holderName: string } | null;
  box?: { qrCode: string; label: string } | null;
  user: { name: string; email: string };
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 20;

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<LogEntry>>({
    queryKey: ['logs', page, search, action, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (search.trim()) params.set('search', search.trim());
      if (action) params.set('action', action);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      
      const res = await apiClient.get(`/location/logs?${params}`);
      return res.data;
    },
    refetchInterval: 5000,
  });

  const logs = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalRecords = data?.total ?? 0;

  const handleClearFilters = () => {
    setSearch('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'PASSPORT_ASSIGNED':
        return 'Passport Placed';
      case 'PASSPORT_RETURNED':
        return 'Returned to Vault';
      case 'PASSPORT_ISSUED':
        return 'Issued to Owner';
      case 'BOX_MOVED':
        return 'Box Relocated';
      case 'ROOM_CREATED':
        return 'Room Created';
      case 'ROOM_UPDATED':
        return 'Room Updated';
      case 'ROOM_DELETED':
        return 'Room Deleted';
      case 'SHELF_CREATED':
        return 'Shelf Created';
      case 'SHELF_UPDATED':
        return 'Shelf Updated';
      case 'SHELF_DELETED':
        return 'Shelf Deleted';
      case 'ROW_CREATED':
        return 'Row Created';
      case 'ROW_UPDATED':
        return 'Row Updated';
      case 'ROW_DELETED':
        return 'Row Deleted';
      case 'SLOT_CREATED':
        return 'Slot Created';
      case 'SLOT_UPDATED':
        return 'Slot Updated';
      case 'SLOT_DELETED':
        return 'Slot Deleted';
      default:
        return action;
    }
  };

  const getActionVariant = (action: string) => {
    if (action.endsWith('_CREATED')) return 'success';
    if (action.endsWith('_UPDATED')) return 'warning';
    if (action.endsWith('_DELETED')) return 'danger';

    switch (action) {
      case 'PASSPORT_ASSIGNED':
        return 'default';
      case 'PASSPORT_RETURNED':
        return 'info';
      case 'PASSPORT_ISSUED':
        return 'success';
      case 'BOX_MOVED':
        return 'brand';
      default:
        return 'default';
    }
  };

  return (
    <Shell title="Audit Logs" subtitle="Real-time movement ledger and system operation logs">
      <Card>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <PageHeader
            title="Activity Timeline"
            subtitle={`${totalRecords} log entries found`}
          />
        </div>

        {/* Filters Control Panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          padding: '24px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border)'
        }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Search size={14} />
              TEXT SEARCH
            </label>
            <Input
              placeholder="Search holder, QR, box, staff..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <SlidersHorizontal size={14} />
              ACTION TYPE
            </label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 150ms',
              }}
            >
              <option value="">All Actions</option>
              <optgroup label="Physical Movements">
                <option value="PASSPORT_ASSIGNED">Passport Placed (Assigned)</option>
                <option value="PASSPORT_RETURNED">Returned to Vault</option>
                <option value="PASSPORT_ISSUED">Issued to Owner</option>
                <option value="BOX_MOVED">Box Relocated (Moved)</option>
              </optgroup>
              <optgroup label="Configuration Changes">
                <option value="ROOM_CREATED">Room Created</option>
                <option value="ROOM_UPDATED">Room Updated</option>
                <option value="ROOM_DELETED">Room Deleted</option>
                <option value="SHELF_CREATED">Shelf Created</option>
                <option value="SHELF_UPDATED">Shelf Updated</option>
                <option value="SHELF_DELETED">Shelf Deleted</option>
                <option value="ROW_CREATED">Row Created</option>
                <option value="ROW_UPDATED">Row Updated</option>
                <option value="ROW_DELETED">Row Deleted</option>
                <option value="SLOT_CREATED">Slot Created</option>
                <option value="SLOT_UPDATED">Slot Updated</option>
                <option value="SLOT_DELETED">Slot Deleted</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Calendar size={14} />
              START DATE
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Calendar size={14} />
              END DATE
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={handleClearFilters}
              style={{ width: '100%', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              disabled={!search && !action && !startDate && !endDate}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Timeline Feed */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <p>Loading audit ledger...</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Vertical Line */}
              {logs.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '20px',
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    background: 'var(--border)',
                  }}
                />
              )}

              {/* Log Entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {logs.map((log, index) => (
                  <div
                    key={log.id}
                    style={{
                      paddingLeft: '52px',
                      position: 'relative',
                    }}
                  >
                    {/* Timeline Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '12px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: index === 0 ? 'var(--brand)' : 'var(--bg-subtle)',
                        border: '3px solid var(--bg-surface)',
                        boxShadow: '0 0 0 1px var(--border)',
                        transition: 'all 200ms',
                      }}
                    />

                    {/* Log Card */}
                    <div
                      style={{
                        padding: '16px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-surface)',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'border-color 150ms, box-shadow 150ms',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--brand-muted)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginBottom: '12px',
                        }}
                      >
                        <Badge variant={getActionVariant(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Details */}
                      {log.passport && (
                        <div
                          style={{
                            fontSize: '13px',
                            padding: '12px',
                            background: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            marginBottom: '12px',
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Passport QR Code</span>
                              <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{log.passport.qrCode}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Holder Name</span>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{log.passport.holderName}</span>
                            </div>
                          </div>

                          {(log.fromLocation || log.toLocation) && (
                            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed var(--border)', fontSize: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                              {log.fromLocation && (
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>From: </span>
                                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{log.fromLocation}</span>
                                </div>
                              )}
                              {log.toLocation && (
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>To: </span>
                                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{log.toLocation}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Box Location Changes */}
                      {!log.passport && log.box && (
                        <div
                          style={{
                            fontSize: '13px',
                            padding: '12px',
                            background: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            marginBottom: '12px',
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Box Label</span>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{log.box.label}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Box QR Code</span>
                              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-primary)' }}>{log.box.qrCode}</span>
                            </div>
                          </div>
                          {(log.fromLocation || log.toLocation) && (
                            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed var(--border)', fontSize: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                              {log.fromLocation && (
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>From: </span>
                                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{log.fromLocation}</span>
                                </div>
                              )}
                              {log.toLocation && (
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>To: </span>
                                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{log.toLocation}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Configuration Changes (no passport & no box) */}
                      {!log.passport && !log.box && (log.notes || log.fromLocation || log.toLocation) && (
                        <div
                          style={{
                            fontSize: '13px',
                            padding: '12px',
                            background: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            marginBottom: '12px',
                          }}
                        >
                          {log.notes && (
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: (log.fromLocation || log.toLocation) ? '8px' : 0 }}>
                              {log.notes}
                            </div>
                          )}
                          {(log.fromLocation || log.toLocation) && (
                            <div style={{ fontSize: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px', color: 'var(--text-muted)' }}>
                              {log.fromLocation && (
                                <div>
                                  <span>Original: </span>
                                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{log.fromLocation}</span>
                                </div>
                              )}
                              {log.toLocation && (
                                <div>
                                  <span>Current: </span>
                                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{log.toLocation}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Operator Info */}
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Performed by:</span>
                        <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{log.user.name}</strong>
                        <span>({log.user.email})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {logs.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Clock size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>No Activity Found</p>
                  <p style={{ fontSize: '13px' }}>Try adjusting your search criteria or date filters.</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
            }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={14} />
                Prev
              </Button>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages} · {totalRecords} records
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </Shell>
  );
}
