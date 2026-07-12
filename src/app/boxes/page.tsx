'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { useRole } from '@/lib/auth/RoleContext';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { 
  Package, 
  Plus, 
  Trash2, 
  Move, 
  ChevronLeft,
  ChevronRight,
  Square,
} from 'lucide-react';

interface Box {
  id: string;
  qrCode: string;
  label: string;
  capacity: number;
  occupiedCount: number;
  vacantCount: number;
  status: string;
  slotId: string | null;
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

interface Slot {
  id: string;
  name: string;
  qrCode: string;
  rowId: string;
  row: {
    name: string;
    shelf: {
      name: string;
      room: {
        name: string;
      };
    };
  };
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ModalType = 'create' | 'move' | 'bulk-register' | null;

const LIMIT = 10;
const SLOT_PICKER_LIMIT = 15;

export default function BoxesPage() {
  const { canCreate, canDelete } = useRole();
  const queryClient = useQueryClient();
  
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  
  // Server-side pagination and filtering
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [liveSearch, setLiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'FULL' | 'INACTIVE' | ''>('');
  
  // Create box form
  const [createForm, setCreateForm] = useState({ qrCode: '', label: '', capacity: '10' });
  
  // Bulk register form
  const [bulkRegisterForm, setBulkRegisterForm] = useState({
    labelPattern: 'MB-{n:04d}',
    qrPattern: 'BOX-{n:04d}',
    startNumber: 1,
    endNumber: 10,
    capacity: 10,
  });

  // Debug: log form state when it changes
  useEffect(() => {
    console.log('Bulk Register Form State:', bulkRegisterForm);
  }, [bulkRegisterForm]);
  
  // Move box - slot picker with client-side search and pagination
  const [slotSearchInput, setSlotSearchInput] = useState('');
  const [slotPage, setSlotPage] = useState(1);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');

  // Helper function to format pattern with zero-padding support
  const formatPattern = (pattern: string, number: number): string => {
    return pattern.replace(/\{n(:(\d+)d)?\}/g, (match, _, width) => {
      if (width) {
        return String(number).padStart(parseInt(width), '0');
      }
      return String(number);
    });
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on search
      setLiveSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset slot page when search changes
  useEffect(() => {
    setSlotPage(1);
  }, [slotSearchInput]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Fetch boxes with server-side pagination
  const { data } = useQuery<PaginatedResponse<Box>>({
    queryKey: ['boxes', page, liveSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (liveSearch) params.set('search', liveSearch);
      if (statusFilter) params.set('status', statusFilter);
      const res = await apiClient.get(`/boxes?${params}`);
      return res.data;
    },
    refetchInterval: 5000,
  });

  const boxes = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalRecords = data?.total ?? 0;

  // Fetch slots with server-side pagination for move modal
  const { data: slotsData, isLoading: slotsLoading } = useQuery<PaginatedResponse<Slot>>({
    queryKey: ['slots', 'paginated', slotPage, slotSearchInput],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(slotPage));
      params.set('limit', String(SLOT_PICKER_LIMIT));
      if (slotSearchInput) params.set('search', slotSearchInput);
      const res = await apiClient.get(`/location/slots?${params}`);
      return res.data;
    },
    enabled: modalType === 'move',
  });

  const slots = slotsData?.data ?? [];
  const slotTotalPages = slotsData?.totalPages ?? 1;
  const slotTotalRecords = slotsData?.total ?? 0;

  // Create box mutation
  const createBoxMutation = useMutation({
    mutationFn: async (data: { qrCode: string; label: string; capacity?: number }) => {
      await apiClient.post('/boxes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      setModalType(null);
      setCreateForm({ qrCode: '', label: '', capacity: '10' });
      toast.success('Box created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create box';
      toast.error(message);
    },
  });

  // Move box mutation
  const moveBoxMutation = useMutation({
    mutationFn: async ({ boxId, slotId }: { boxId: string; slotId: string }) => {
      await apiClient.post(`/boxes/${boxId}/move`, { slotId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      setModalType(null);
      setSelectedBox(null);
      setSelectedSlotId('');
      toast.success('Box moved successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to move box';
      toast.error(message);
    },
  });

  // Delete box mutation
  const deleteBoxMutation = useMutation({
    mutationFn: async (boxId: string) => {
      await apiClient.delete(`/boxes/${boxId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      toast.success('Box deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete box';
      toast.error(message);
    },
  });

  // Bulk register boxes mutation
  const bulkRegisterBoxesMutation = useMutation({
    mutationFn: async (pattern: typeof bulkRegisterForm) => {
      const boxes = [];
      for (let i = pattern.startNumber; i <= pattern.endNumber; i++) {
        const label = formatPattern(pattern.labelPattern, i);
        const qrCode = formatPattern(pattern.qrPattern, i);
        boxes.push({ label, qrCode, capacity: pattern.capacity });
      }
      
      // Create all boxes sequentially
      const results = [];
      for (const box of boxes) {
        try {
          const res = await apiClient.post('/boxes', box);
          results.push({ success: true, data: res.data });
        } catch (error: any) {
          results.push({ 
            success: false, 
            error: error.response?.data?.message || 'Failed',
            box: box.label 
          });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      setModalType(null);
      setBulkRegisterForm({
        labelPattern: 'MB-{n:04d}',
        qrPattern: 'BOX-{n:04d}',
        startNumber: 1,
        endNumber: 10,
        capacity: 10,
      });
      
      if (failCount === 0) {
        toast.success(`${successCount} boxes registered successfully`);
      } else {
        toast.error(`Registered ${successCount} boxes, ${failCount} failed (likely duplicates)`);
      }
    },
    onError: (error: any) => {
      toast.error('Bulk registration failed. Please try again.');
    },
  });

  const handleCreateBox = () => {
    const capacity = parseInt(createForm.capacity) || 10;
    createBoxMutation.mutate({ 
      qrCode: createForm.qrCode, 
      label: createForm.label,
      capacity,
    });
  };

  const handleMoveBox = () => {
    if (selectedBox && selectedSlotId) {
      moveBoxMutation.mutate({ boxId: selectedBox.id, slotId: selectedSlotId });
    }
  };

  const handleDeleteBox = (box: Box) => {
    if (box.occupiedCount > 0) {
      alert(`Cannot delete box ${box.label}. It contains ${box.occupiedCount} passport(s).`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete box ${box.label}? This action cannot be undone.`)) {
      deleteBoxMutation.mutate(box.id);
    }
  };

  const handleBulkRegister = () => {
    bulkRegisterBoxesMutation.mutate(bulkRegisterForm);
  };

  return (
    <Shell title="Movable Boxes" subtitle="Manage box inventory and assignments">
      <Card>
        <PageHeader
          title="All Movable Boxes"
          subtitle={`${totalRecords} boxes in system`}
          action={
            canCreate && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={() => setModalType('create')} variant="secondary" size="sm">
                  <Plus size={14} />
                  Add Box
                </Button>
                <Button onClick={() => setModalType('bulk-register')} variant="primary" size="sm">
                  <Plus size={14} />
                  Bulk Register
                </Button>
              </div>
            )
          }
        />

        {/* Search and Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <Input
              type="text"
              placeholder="Search Box ID, Label..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="FULL">Full</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <Table>
          <TableHead>
            <TableRow isHeader>
              <TableHeader>Box ID</TableHeader>
              <TableHeader>Label</TableHeader>
              <TableHeader>Location</TableHeader>
              <TableHeader align="center">Occupied</TableHeader>
              <TableHeader align="center">Capacity</TableHeader>
              <TableHeader align="center">Utilization</TableHeader>
              <TableHeader align="right">Status</TableHeader>
              <TableHeader align="right">Actions</TableHeader>
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
                  <TableCell>
                    {box.location ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {box.location}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell align="center">{box.occupiedCount}</TableCell>
                  <TableCell align="center">{box.capacity}</TableCell>
                  <TableCell align="center">
                    <span style={{ fontWeight: 600 }}>{utilization}</span>
                  </TableCell>
                  <TableCell align="right">
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                  </TableCell>
                  <TableCell align="right">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {canCreate && (
                        <button
                          onClick={() => {
                            setSelectedBox(box);
                            setModalType('move');
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            background: 'var(--bg-surface)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Move to slot"
                        >
                          <Move size={12} />
                          Move
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteBox(box)}
                          disabled={box.occupiedCount > 0}
                          style={{
                            padding: '4px 8px',
                            border: 'none',
                            background: box.occupiedCount > 0 ? 'var(--bg-subtle)' : 'transparent',
                            cursor: box.occupiedCount > 0 ? 'not-allowed' : 'pointer',
                            color: box.occupiedCount > 0 ? 'var(--text-muted)' : 'var(--danger)',
                            borderRadius: 'var(--radius)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title={box.occupiedCount > 0 ? 'Cannot delete occupied box' : 'Delete box'}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {boxes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <Package size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontWeight: 600, marginBottom: '4px' }}>
              {liveSearch || statusFilter ? 'No boxes found' : 'No boxes yet'}
            </p>
            <p style={{ fontSize: '13px' }}>
              {liveSearch || statusFilter ? 'Try a different search or filter' : 'Start by adding a box to the system'}
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

      {/* Create Box Modal */}
      {modalType === 'create' && (
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
              Add New Box
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                QR Code *
              </label>
              <Input
                value={createForm.qrCode}
                onChange={(e) => setCreateForm({ ...createForm, qrCode: e.target.value })}
                placeholder="e.g., BOX-001"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                Label *
              </label>
              <Input
                value={createForm.label}
                onChange={(e) => setCreateForm({ ...createForm, label: e.target.value })}
                placeholder="e.g., MB-0001"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                Capacity
              </label>
              <Input
                type="number"
                value={createForm.capacity}
                onChange={(e) => setCreateForm({ ...createForm, capacity: e.target.value })}
                placeholder="10"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Default capacity is 10 passports per box
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setModalType(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateBox}
                disabled={createBoxMutation.isPending || !createForm.qrCode || !createForm.label}
              >
                {createBoxMutation.isPending ? 'Creating...' : 'Create Box'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Move Box Modal - Paginated Searchable Slot Picker */}
      {modalType === 'move' && selectedBox && (
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
            setSlotSearchInput('');
            setSlotPage(1);
            setSelectedSlotId('');
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              width: '90%',
              maxWidth: '700px',
              border: '1px solid var(--border)',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
              Move Box: {selectedBox.label}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Select a slot to assign this box ({slotTotalRecords} slots available)
            </p>

            {/* Search Input */}
            <Input
              type="text"
              placeholder="Search slot by name, room, or QR code..."
              value={slotSearchInput}
              onChange={(e) => setSlotSearchInput(e.target.value)}
            />

            {/* Slots List */}
            <div style={{ 
              marginTop: '16px',
              flex: 1,
              overflow: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}>
              {slots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  <Square size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>{slotSearchInput ? 'No slots found matching your search' : 'No slots configured'}</p>
                </div>
              ) : (
                slots.map((slot) => {
                  const locationPath = `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name}`;
                  const isSelected = selectedSlotId === slot.id;
                  
                  return (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlotId(slot.id)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: isSelected ? 'var(--brand)' : 'transparent',
                        color: isSelected ? 'var(--text-inverse)' : 'inherit',
                        transition: 'all 150ms',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'var(--bg-subtle)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <Square 
                        size={18} 
                        color={isSelected ? 'var(--text-inverse)' : 'var(--info)'} 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                          {slot.name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-muted)' 
                        }}>
                          {locationPath}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        padding: '2px 8px', 
                        background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'var(--bg-subtle)', 
                        borderRadius: '4px', 
                        fontFamily: 'monospace',
                        color: isSelected ? 'var(--text-inverse)' : 'inherit',
                      }}>
                        {slot.qrCode}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination for slots */}
            {slotTotalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border)',
              }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSlotPage(p => Math.max(1, p - 1))}
                  disabled={slotPage === 1}
                >
                  <ChevronLeft size={14} />
                  Prev
                </Button>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Page {slotPage} of {slotTotalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSlotPage(p => Math.min(slotTotalPages, p + 1))}
                  disabled={slotPage === slotTotalPages}
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => {
                setModalType(null);
                setSlotSearchInput('');
                setSlotPage(1);
                setSelectedSlotId('');
              }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleMoveBox}
                disabled={moveBoxMutation.isPending || !selectedSlotId}
              >
                {moveBoxMutation.isPending ? 'Moving...' : 'Move Box'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Register Boxes Modal */}
      {modalType === 'bulk-register' && (
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
              maxWidth: '650px',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
              Bulk Register Boxes
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Register multiple boxes at once with sequential labeling
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                Label Pattern
              </label>
              <Input
                value={bulkRegisterForm.labelPattern}
                onChange={(e) => setBulkRegisterForm({ ...bulkRegisterForm, labelPattern: e.target.value })}
                placeholder="MB-{n:04d}"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Use {'{n}'} for number. Add :04d for zero-padding (e.g., MB-{'{n:04d}'} → MB-0001, MB-0002)
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                QR Code Pattern
              </label>
              <Input
                value={bulkRegisterForm.qrPattern}
                onChange={(e) => setBulkRegisterForm({ ...bulkRegisterForm, qrPattern: e.target.value })}
                placeholder="BOX-{n:04d}"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                QR codes must be globally unique. Use same pattern format as label.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                  Start Number
                </label>
                <Input
                  type="number"
                  value={String(bulkRegisterForm.startNumber)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBulkRegisterForm({ ...bulkRegisterForm, startNumber: isNaN(val) ? 1 : Math.max(1, val) });
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                  End Number
                </label>
                <Input
                  type="number"
                  value={String(bulkRegisterForm.endNumber)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBulkRegisterForm({ ...bulkRegisterForm, endNumber: isNaN(val) ? 10 : Math.max(1, val) });
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                  Capacity
                </label>
                <Input
                  type="number"
                  value={String(bulkRegisterForm.capacity)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBulkRegisterForm({ ...bulkRegisterForm, capacity: isNaN(val) ? 10 : Math.max(1, val) });
                  }}
                />
              </div>
            </div>

            {/* Preview */}
            <div style={{ 
              padding: '12px', 
              background: 'var(--bg-subtle)', 
              borderRadius: 'var(--radius)', 
              marginBottom: '20px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Preview (first 3 of {bulkRegisterForm.endNumber - bulkRegisterForm.startNumber + 1} boxes):
              </div>
              {[bulkRegisterForm.startNumber, bulkRegisterForm.startNumber + 1, bulkRegisterForm.startNumber + 2]
                .filter(n => n <= bulkRegisterForm.endNumber)
                .map((n) => {
                  const label = formatPattern(bulkRegisterForm.labelPattern, n);
                  const qr = formatPattern(bulkRegisterForm.qrPattern, n);
                  return (
                    <div key={n} style={{ fontSize: '11px', marginBottom: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--success)' }}>✓</span>
                      <Package size={12} color="var(--brand)" />
                      <span style={{ flex: 1, fontWeight: 600 }}>{label}</span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '10px' }}>{qr}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Cap: {bulkRegisterForm.capacity}</span>
                    </div>
                  );
                })}
              {bulkRegisterForm.endNumber - bulkRegisterForm.startNumber > 2 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  ... and {bulkRegisterForm.endNumber - bulkRegisterForm.startNumber - 2} more
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setModalType(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkRegister}
                disabled={
                  bulkRegisterBoxesMutation.isPending || 
                  !bulkRegisterForm.labelPattern.trim() || 
                  !bulkRegisterForm.qrPattern.trim() || 
                  bulkRegisterForm.endNumber < bulkRegisterForm.startNumber ||
                  bulkRegisterForm.capacity < 1
                }
              >
                {bulkRegisterBoxesMutation.isPending 
                  ? 'Registering...' 
                  : `Register ${Math.max(0, bulkRegisterForm.endNumber - bulkRegisterForm.startNumber + 1)} Boxes`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
