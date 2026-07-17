'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { useRole } from '@/lib/auth/RoleContext';
import { Shell } from '@/components/layout/Shell';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Server-side pagination and filtering
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [liveSearch, setLiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'IN_BOX' | 'ISSUED' | ''>('');
  
  // Box modal pagination and filters
  const [boxPage, setBoxPage] = useState(1);
  const [boxSearch, setBoxSearch] = useState('');
  const [boxRoomFilter, setBoxRoomFilter] = useState('');
  const BOX_LIMIT = 20;
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedPassport, setSelectedPassport] = useState<Passport | null>(null);

  // Confirm dialogs state
  const [confirmIssue, setConfirmIssue] = useState<{
    isOpen: boolean;
    passport: Passport | null;
  }>({
    isOpen: false,
    passport: null,
  });

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    passport: Passport | null;
  }>({
    isOpen: false,
    passport: null,
  });

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

  // Fetch available boxes (pass neededSpaces for batch operations) with pagination
  const neededSpaces = modalType === 'batch-assign' ? selectedIds.size : 1;
  const { data: boxesData, isLoading: boxesLoading } = useQuery<{
    data: MovableBox[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }>({
    queryKey: ['boxes', 'available', neededSpaces, boxPage, boxSearch, boxRoomFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('neededSpaces', String(neededSpaces));
      params.set('page', String(boxPage));
      params.set('limit', String(BOX_LIMIT));
      if (boxSearch) params.set('search', boxSearch);
      if (boxRoomFilter) params.set('roomId', boxRoomFilter);
      const res = await apiClient.get(`/boxes/available?${params}`);
      return res.data;
    },
    enabled: modalType === 'assign' || modalType === 'batch-assign',
  });

  const availableBoxes = boxesData?.data ?? [];
  const boxTotalPages = boxesData?.totalPages ?? 1;
  const boxTotal = boxesData?.total ?? 0;

  // Create passport mutation
  const createPassportMutation = useMutation({
    mutationFn: async (data: typeof registerForm) => {
      await apiClient.post('/passports', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passports'] });
      setModalType(null);
      setRegisterForm({ qrCode: '', holderName: '', holderIdNo: '' });
      toast.success('Passport registered successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to register passport';
      toast.error(message);
    },
  });

  // Assign passport to box
  const assignPassportMutation = useMutation({
    mutationFn: async ({ id, boxId, action }: { id: string; boxId: string; action: 'ASSIGN' | 'RETURN' }) => {
      const endpoint = action === 'RETURN' ? `/passports/${id}/return` : `/passports/${id}/assign`;
      await apiClient.post(endpoint, { boxId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passports'] });
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      setModalType(null);
      setSelectedPassport(null);
      setTargetBoxId('');
      const action = variables.action === 'RETURN' ? 'returned to box' : 'assigned to box';
      toast.success(`Passport ${action} successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to assign passport';
      toast.error(message);
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
      toast.success('Passport issued to owner successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to issue passport';
      toast.error(message);
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passports'] });
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      setSelectedIds(new Set());
      setModalType(null);
      setTargetBoxId('');
      toast.success(`${variables.passportIds.length} passports assigned successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to batch assign passports';
      toast.error(message);
    },
  });

  // Delete passport mutation
  const deletePassportMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/passports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passports'] });
      toast.success('Passport deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete passport';
      toast.error(message);
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
    setConfirmIssue({ isOpen: true, passport });
  };

  const confirmIssueAction = () => {
    if (confirmIssue.passport) {
      issuePassportMutation.mutate(confirmIssue.passport.id);
      setConfirmIssue({ isOpen: false, passport: null });
    }
  };

  const handleDeletePassport = (passport: Passport) => {
    setConfirmDelete({ isOpen: true, passport });
  };

  const confirmDeleteAction = () => {
    if (confirmDelete.passport) {
      deletePassportMutation.mutate(confirmDelete.passport.id);
      setConfirmDelete({ isOpen: false, passport: null });
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
    <Shell title={t('passports.custody_title', 'Passport Custody System')} subtitle={t('passports.custody_subtitle', 'Track and register national passports')}>
      <Card>
        <PageHeader
          title={t('passports.all_title', 'All Registered Passports')}
          subtitle={`${totalRecords} ${t('passports.custody_subtitle_count', 'total passports in database')}`}
          action={
            canCreate && (
              <Button onClick={() => setModalType('register')} variant="primary" size="sm">
                <Plus size={14} />
                {t('passports.add_passport', 'Register Passport')}
              </Button>
            )
          }
        />

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
            <Input
              type="text"
              placeholder={t('passports.search_placeholder', 'Search by name, ID number, or QR Code...')}
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
            <option value="">{t('passports.all_statuses', 'All Statuses')}</option>
            <option value="IN_BOX">{t('passports.status_in_box', 'In Box')}</option>
            <option value="ISSUED">{t('passports.status_issued', 'Issued')}</option>
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
                {selectedIds.size} {t('passports.selected_count', 'Passport(s) Selected')}
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
                {t('passports.batch_assign', 'Batch Assign to Box')}
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
                {t('passports.clear_selection', 'Clear Selection')}
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
              <TableHeader>{t('passports.col_qr_code', 'QR Code')}</TableHeader>
              <TableHeader>{t('passports.col_holder', 'Holder Name')}</TableHeader>
              <TableHeader>{t('passports.col_holder_id', 'Holder ID No')}</TableHeader>
              <TableHeader>{t('passports.col_box', 'Box Storage')}</TableHeader>
              <TableHeader align="center">{t('passports.col_status', 'Status')}</TableHeader>
              <TableHeader align="right">{t('passports.col_actions', 'Actions')}</TableHeader>
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
                      {isIssued ? t('passports.status_issued', 'Issued') : t('passports.status_in_box', 'In Box')}
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
                        {isIssued ? t('passports.action_return', 'Return') : t('passports.action_move', 'Move')}
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
                          {t('passports.action_issue', 'Issue')}
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
              {liveSearch || statusFilter ? t('passports.no_results', 'No passports found') : t('passports.no_records', 'No passports registered')}
            </p>
            <p style={{ fontSize: '13px' }}>
              {liveSearch || statusFilter ? t('passports.try_different', 'Try a different search or filter') : t('passports.register_to_begin', 'Register a new passport to begin tracking')}
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
              {t('passports.prev', 'Prev')}
            </Button>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {t('passports.prev', 'Page')} {page} {t('passports.of', 'of')} {totalPages} · {totalRecords} {t('passports.records', 'records')}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              {t('passports.next', 'Next')}
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
              {t('passports.modal_register_title', 'Register New Passport')}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                {t('passports.field_qr', 'QR Code / Document Number *')}
              </label>
              <Input
                value={registerForm.qrCode}
                onChange={(e) => setRegisterForm({ ...registerForm, qrCode: e.target.value })}
                placeholder="e.g., EP-01928"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                {t('passports.field_name', 'Holder Full Name *')}
              </label>
              <Input
                value={registerForm.holderName}
                onChange={(e) => setRegisterForm({ ...registerForm, holderName: e.target.value })}
                placeholder="e.g., Abebe Bikila"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                {t('passports.field_id', 'National / Document ID No *')}
              </label>
              <Input
                value={registerForm.holderIdNo}
                onChange={(e) => setRegisterForm({ ...registerForm, holderIdNo: e.target.value })}
                placeholder="e.g., ID-90812"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setModalType(null)}>
                {t('passports.cancel', 'Cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleRegisterPassport}
                disabled={createPassportMutation.isPending || !registerForm.qrCode || !registerForm.holderName || !registerForm.holderIdNo}
              >
                {createPassportMutation.isPending ? t('passports.registering', 'Registering...') : t('passports.register', 'Register')}
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
              {modalType === 'batch-assign' ? t('passports.modal_batch_title', 'Batch Assign to Movable Box') : t('passports.modal_assign_title', 'Assign Passport to Box')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {modalType === 'batch-assign' 
                ? `${t('passports.assigning', 'Assigning')} ${selectedIds.size} ${t('passports.selected_count_sub', 'selected passports')} · ${boxTotal} ${t('passports.boxes_avail', 'boxes available')}`
                : `${t('passports.assigning', 'Assigning')} ${t('passports.passport_of', 'passport belonging to')} ${selectedPassport?.holderName}`
              }
            </p>

            {/* Search and Filter Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Input
                  type="text"
                  placeholder={t('passports.search_box_placeholder', 'Search by label or QR code...')}
                  value={boxSearch}
                  onChange={(e) => {
                    setBoxSearch(e.target.value);
                    setBoxPage(1); // Reset to page 1 on search
                  }}
                  style={{ paddingRight: '32px' }}
                />
                <Search 
                  size={14} 
                  color="var(--text-muted)" 
                  style={{ position: 'absolute', right: '10px', top: '11px', pointerEvents: 'none' }} 
                />
              </div>
              {/* Room filter would go here if we had rooms query */}
            </div>

            {boxesLoading && (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                {t('passports.loading_boxes', 'Loading boxes...')}
              </div>
            )}

            <div style={{ flex: 1, overflow: 'auto', marginBottom: '16px', minHeight: '200px' }}>
              {!boxesLoading && availableBoxes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  <Package size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>{t('passports.no_available_boxes', 'No available boxes with sufficient vacant slots')}</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>
                    {modalType === 'batch-assign' && `${t('passports.need_boxes_with', 'Need boxes with at least')} ${selectedIds.size} ${t('passports.vacant_slots', 'vacant slots')}`}
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
                        {box.vacantCount} {t('passports.vacant_count', 'vacant')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {boxTotalPages > 1 && !boxesLoading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                padding: '12px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius)',
              }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setBoxPage(p => Math.max(1, p - 1))}
                  disabled={boxPage === 1}
                >
                  <ChevronLeft size={14} />
                  {t('passports.prev', 'Prev')}
                </Button>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {t('passports.prev', 'Page')} {boxPage} {t('passports.of', 'of')} {boxTotalPages} · {boxTotal} {t('sidebar.boxes', 'boxes')}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setBoxPage(p => Math.min(boxTotalPages, p + 1))}
                  disabled={boxPage === boxTotalPages}
                >
                  {t('passports.next', 'Next')}
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => { 
                setModalType(null); 
                setSelectedPassport(null); 
                setTargetBoxId('');
                setBoxPage(1); // Reset pagination
                setBoxSearch(''); // Reset search
              }}>
                {t('passports.cancel', 'Cancel')}
              </Button>
              <Button
                variant="primary"
                disabled={!targetBoxId || assignPassportMutation.isPending || batchAssignMutation.isPending}
                onClick={modalType === 'batch-assign' ? handleBatchAssign : handleAssignPassport}
              >
                {assignPassportMutation.isPending || batchAssignMutation.isPending ? t('passports.assigning', 'Assigning...') : t('passports.assign', 'Assign')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Issue Modal */}
      <ConfirmModal
        isOpen={confirmIssue.isOpen}
        onClose={() => setConfirmIssue({ isOpen: false, passport: null })}
        onConfirm={confirmIssueAction}
        title={t('passports.modal_issue_title', 'Issue Passport')}
        message={confirmIssue.passport ? `${t('passports.issue_msg_1', 'Issue passport belonging to')} ${confirmIssue.passport.holderName} ${t('passports.issue_msg_2', 'to its owner?')}` : ''}
        confirmText={t('passports.action_issue', 'Issue')}
        variant="primary"
        isLoading={issuePassportMutation.isPending}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, passport: null })}
        onConfirm={confirmDeleteAction}
        title={t('passports.modal_delete_title', 'Confirm Deletion')}
        message={confirmDelete.passport ? `${t('passports.delete_msg_1', 'Are you sure you want to delete passport belonging to')} ${confirmDelete.passport.holderName}? ${t('passports.delete_msg_2', 'This action cannot be undone.')}` : ''}
        confirmText={t('passports.delete', 'Delete')}
        variant="danger"
        isLoading={deletePassportMutation.isPending}
      />
    </Shell>
  );
}
