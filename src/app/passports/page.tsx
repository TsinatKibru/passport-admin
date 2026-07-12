'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useRole } from '@/lib/auth/RoleContext';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { 
  Plus, 
  Trash2, 
  ArrowRightLeft, 
  FolderDown, 
  FolderUp, 
  CheckSquare, 
  Square,
  Search,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Passport {
  id: string;
  qrCode: string;
  holderName: string;
  holderIdNo: string;
  status: 'IN_BOX' | 'ISSUED';
  box?: { id: string; label: string } | null;
}

interface MovableBox {
  id: string;
  qrCode: string;
  label: string;
  occupiedCount: number;
  capacity: number;
  vacantCount: number;
  status: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ModalType = 'register' | 'assign' | 'batch-assign' | null;

const LIMIT = 10;

export default function PassportsPage() {
  const { canCreate, canDelete } = useRole();
  const queryClient = useQueryClient();

  // Server-side pagination and filtering
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [liveSearch, setLiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'IN_BOX' | 'ISSUED' | ''>('');
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedPassport, setSelectedPassport] = useState<Passport | null>(null);

  // Form states
  const [registerForm, setRegisterForm] = useState({ qrCode: '', holderName: '', holderIdNo: '' });
  const [targetBoxId, setTargetBoxId] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on search
      setLiveSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page and selection on filter change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set()); // Clear selection on filter change
  }, [statusFilter]);

  // Fetch passports with server-side pagination
  const { data } = useQuery<PaginatedResponse<Passport>>({
    queryKey: ['passports', page, liveSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (liveSearch) params.set('search', liveSearch);
      if (statusFilter) params.set('status', statusFilter);
      const res = await apiClient.get(`/passports?${params}`);
      return res.data;
    },
    refetchInterval: 5000,
  });

  const passports = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalRecords = data?.total ?? 0;

  // Fetch available boxes (pass neededSpaces for batch operations)
  const neededSpaces = modalType === 'batch-assign' ? selectedIds.size : 1;
  const { data: availableBoxes = [] } = useQuery<MovableBox[]>({
    queryKey: ['boxes', 'available', neededSpaces],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('neededSpaces', String(neededSpaces));
      const res = await apiClient.get(`/boxes/available?${params}`);
      return res.data;
    },
    enabled: modalType === 'assign' || modalType === 'batch-assign',
  });

  // Create passport mutation
  const createPassportMutation = useMutation({
    mutationFn: async (data: typeof registerForm) => {
      await apiClient.post('/passports', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passports'] });
      setModalType(null);
      setRegisterForm({ qrCode: '', holderName: '', holderIdNo: '' });
    },
  });

  // Assign passport to box
  const assignPassportMutation = useMutation({
    mutationFn: async ({ id, boxId, action }: { id: string; boxId: string; action: 'ASSIGN' | 'RETURN' }) => {
      const endpoint = action === 'RETURN' ? `/passports/${id}/return` : `/passports/${id}/assign`;
      await apiClient.post(endpoint, { boxId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passports'] });
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      setModalType(null);
      setSelectedPassport(null);
      setTargetBoxId('');
    },
  });

  // Issue passport to owner
  const issuePassportMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/passports/${id}/issue`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passports'] });
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
    },
  });

  // Batch assign passports to box
  const batchAssignMutation = useMutation({
    mutationFn: async ({ passportIds, boxId }: { passportIds: string[]; boxId: string }) => {
      await apiClient.post('/passports/batch-assign', {
        passportIds,
        boxId,
        action: 'ASSIGN',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passports'] });
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      setSelectedIds(new Set());
      setModalType(null);
      setTargetBoxId('');
    },
  });

  // Delete passport mutation
  const deletePassportMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/passports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passports'] });
    },
  });

  // Operations
  const handleRegisterPassport = () => {
    createPassportMutation.mutate(registerForm);
  };

  const handleAssignPassport = () => {
    if (selectedPassport && targetBoxId) {
      const isReturn = selectedPassport.status === 'ISSUED';
      assignPassportMutation.mutate({ 
        id: selectedPassport.id, 
        boxId: targetBoxId, 
        action: isReturn ? 'RETURN' : 'ASSIGN' 
      });
    }
  };

  const handleBatchAssign = () => {
    if (selectedIds.size > 0 && targetBoxId) {
      batchAssignMutation.mutate({ 
        passportIds: Array.from(selectedIds), 
        boxId: targetBoxId 
      });
    }
  };

  const handleIssuePassport = (passport: Passport) => {
    if (window.confirm(`Issue passport belonging to ${passport.holderName} to its owner?`)) {
      issuePassportMutation.mutate(passport.id);
    }
  };

  const handleDeletePassport = (passport: Passport) => {
    if (window.confirm(`Are you sure you want to delete passport belonging to ${passport.holderName}? This action cannot be undone.`)) {
      deletePassportMutation.mutate(passport.id);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === passports.length && passports.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(passports.map(p => p.id)));
    }
  };

  return (
    <Shell title="Passport Custody System" subtitle="Track and register national passports">
      <Card>
        <PageHeader
          title="All Registered Passports"
          subtitle={`${totalRecords} total passports in database`}
          action={
            canCreate && (
              <Button onClick={() => setModalType('register')} variant="primary" size="sm">
                <Plus size={14} />
                Register Passport
              </Button>
            )
          }
        />

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
            <Input
              type="text"
              placeholder="Search by name, ID number, or QR Code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Search 
              size={16} 
              color="var(--text-muted)" 
              style={{ position: 'absolute', right: '12px', top: '10px', pointerEvents: 'none' }} 
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '0 12px',
              height: '36px',
              fontSize: '13px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              minWidth: '150px',
            }}
          >
            <option value="">All Statuses</option>
            <option value="IN_BOX">In Box</option>
            <option value="ISSUED">Issued</option>
          </select>
        </div>

        {/* Batch Workspace Floating Panel */}
        {selectedIds.size > 0 && (
          <div
            style={{
              background: 'var(--brand)',
              color: 'var(--text-inverse)',
              padding: '12px 18px',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckSquare size={18} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                {selectedIds.size} Passport(s) Selected
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setModalType('batch-assign')}
                style={{ 
                  padding: '6px 12px',
                  fontSize: '13px',
                  background: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 500,
                }}
              >
                <FolderDown size={14} />
                Batch Assign to Box
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{ 
                  padding: '6px 12px',
                  fontSize: '13px',
                  background: 'transparent', 
                  color: 'white', 
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        <Table>
          <TableHead>
            <TableRow isHeader>
              <TableHeader style={{ width: '40px' }}>
                <button
                  onClick={toggleSelectAll}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  {selectedIds.size === passports.length && passports.length > 0 ? (
                    <CheckSquare size={16} color="var(--brand)" />
                  ) : (
                    <Square size={16} color="var(--text-muted)" />
                  )}
                </button>
              </TableHeader>
              <TableHeader>QR Code</TableHeader>
              <TableHeader>Holder Name</TableHeader>
              <TableHeader>Holder ID No</TableHeader>
              <TableHeader>Box Storage</TableHeader>
              <TableHeader align="center">Status</TableHeader>
              <TableHeader align="right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {passports.map((passport) => {
              const isSelected = selectedIds.has(passport.id);
              const isIssued = passport.status === 'ISSUED';
              
              return (
                <TableRow key={passport.id}>
                  <TableCell>
                    <button
                      onClick={() => toggleSelect(passport.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                    >
                      {isSelected ? (
                        <CheckSquare size={16} color="var(--brand)" />
                      ) : (
                        <Square size={16} color="var(--text-muted)" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{passport.qrCode}</span>
                  </TableCell>
                  <TableCell>{passport.holderName}</TableCell>
                  <TableCell>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {passport.holderIdNo}
                    </span>
                  </TableCell>
                  <TableCell>
                    {passport.box ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <Package size={14} color="var(--brand)" />
                        {passport.box.label}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Badge variant={isIssued ? 'warning' : 'success'}>
                      {passport.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setSelectedPassport(passport);
                          setModalType('assign');
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          background: 'var(--bg-surface)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ArrowRightLeft size={12} />
                        {isIssued ? 'Return' : 'Move'}
                      </button>
                      
                      {!isIssued && (
                        <button
                          onClick={() => handleIssuePassport(passport)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            background: 'var(--bg-surface)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <FolderUp size={12} />
                          Issue
                        </button>
                      )}
                      
                      {canDelete && (
                        <button
                          onClick={() => handleDeletePassport(passport)}
                          style={{
                            padding: '4px 8px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--danger)',
                            borderRadius: 'var(--radius)',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {passports.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <Package size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontWeight: 600, marginBottom: '4px' }}>
              {liveSearch || statusFilter ? 'No passports found' : 'No passports registered'}
            </p>
            <p style={{ fontSize: '13px' }}>
              {liveSearch || statusFilter ? 'Try a different search or filter' : 'Register a new passport to begin tracking'}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            padding: '12px 0',
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
      </Card>

      {/* Register Passport Modal */}
      {modalType === 'register' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setModalType(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              width: '90%',
              maxWidth: '500px',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              Register New Passport
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                QR Code / Document Number *
              </label>
              <Input
                value={registerForm.qrCode}
                onChange={(e) => setRegisterForm({ ...registerForm, qrCode: e.target.value })}
                placeholder="e.g., EP-01928"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                Holder Full Name *
              </label>
              <Input
                value={registerForm.holderName}
                onChange={(e) => setRegisterForm({ ...registerForm, holderName: e.target.value })}
                placeholder="e.g., Abebe Bikila"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                National / Document ID No *
              </label>
              <Input
                value={registerForm.holderIdNo}
                onChange={(e) => setRegisterForm({ ...registerForm, holderIdNo: e.target.value })}
                placeholder="e.g., ID-90812"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setModalType(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRegisterPassport}
                disabled={createPassportMutation.isPending || !registerForm.qrCode || !registerForm.holderName || !registerForm.holderIdNo}
              >
                {createPassportMutation.isPending ? 'Registering...' : 'Register'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Box Assignment Modal (Single & Batch) */}
      {(modalType === 'assign' || modalType === 'batch-assign') && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setModalType(null);
            setSelectedPassport(null);
            setTargetBoxId('');
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              border: '1px solid var(--border)',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
              {modalType === 'batch-assign' ? 'Batch Assign to Movable Box' : 'Assign Passport to Box'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {modalType === 'batch-assign' 
                ? `Assigning ${selectedIds.size} selected passports`
                : `Assigning passport belonging to ${selectedPassport?.holderName}`
              }
            </p>

            <div style={{ flex: 1, overflow: 'auto', marginBottom: '16px' }}>
              {availableBoxes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  <Package size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>No available boxes with sufficient vacant slots</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>
                    {modalType === 'batch-assign' && `Need boxes with at least ${selectedIds.size} vacant slots`}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableBoxes.map((box) => (
                    <div
                      key={box.id}
                      onClick={() => setTargetBoxId(box.id)}
                      style={{
                        padding: '12px',
                        border: '1px solid ' + (targetBoxId === box.id ? 'var(--brand)' : 'var(--border)'),
                        background: targetBoxId === box.id ? 'var(--brand)' : 'var(--bg-surface)',
                        color: targetBoxId === box.id ? 'var(--text-inverse)' : 'inherit',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 150ms',
                      }}
                      onMouseEnter={(e) => {
                        if (targetBoxId !== box.id) {
                          e.currentTarget.style.background = 'var(--bg-subtle)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (targetBoxId !== box.id) {
                          e.currentTarget.style.background = 'var(--bg-surface)';
                        }
                      }}
                    >
                      <Package size={18} color={targetBoxId === box.id ? 'var(--text-inverse)' : 'var(--brand)'} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{box.label}</div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: targetBoxId === box.id ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', 
                          fontFamily: 'monospace' 
                        }}>
                          {box.qrCode}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: targetBoxId === box.id ? 'var(--text-inverse)' : 'var(--text-secondary)', 
                        fontWeight: 500 
                      }}>
                        {box.vacantCount} vacant
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => { 
                setModalType(null); 
                setSelectedPassport(null); 
                setTargetBoxId(''); 
              }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!targetBoxId || assignPassportMutation.isPending || batchAssignMutation.isPending}
                onClick={modalType === 'batch-assign' ? handleBatchAssign : handleAssignPassport}
              >
                {assignPassportMutation.isPending || batchAssignMutation.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
