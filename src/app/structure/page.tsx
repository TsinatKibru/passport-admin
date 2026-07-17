'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { useRole } from '@/lib/auth/RoleContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  Plus, 
  Trash2,
  Package,
  Layers,
  Grid3x3,
  Square,
  Edit,
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    shelves: number;
  };
}

interface Shelf {
  id: string;
  name: string;
  qrCode: string;
  position: number;
  roomId: string;
  room: Room;
  createdAt: string;
  updatedAt: string;
  _count?: {
    rows: number;
  };
}

interface Row {
  id: string;
  name: string;
  qrCode: string;
  position: number;
  shelfId: string;
  shelf: Shelf;
  createdAt: string;
  updatedAt: string;
  _count?: {
    slots: number;
  };
}

interface Slot {
  id: string;
  name: string;
  qrCode: string;
  position: number;
  rowId: string;
  row: Row;
  createdAt: string;
  updatedAt: string;
  boxes?: MovableBox[];  // Optional: may be included in responses
}

interface MovableBox {
  id: string;
  qrCode: string;
  label: string;
  capacity: number;
  occupiedCount: number;
  status: string;
}

type ModalType = 'room' | 'shelf' | 'row' | 'slot' | 'assign-box' | 'bulk-create-slots' | 'bulk-create-rows' | null;

export default function StructurePage() {
  const { canCreate, canDelete } = useRole();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Expanded state
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [expandedShelves, setExpandedShelves] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Selected slot for detail view
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'room' | 'shelf' | 'row' | 'slot';
    data: any;
  } | null>(null);
  
  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [parentId, setParentId] = useState<string>('');
  const [parentRow, setParentRow] = useState<Row | null>(null); // Store the full row object
  const [formData, setFormData] = useState({ name: '', qrCode: '', position: 1 });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Confirm delete state
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    type: string;
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: '',
    id: '',
    name: '',
  });
  
  // Bulk create state
  const [bulkSlotForm, setBulkSlotForm] = useState({
    namePattern: 'Slot {n}',
    qrPattern: 'SLOT-{row}-{n}',  // Include {row} placeholder for row name
    startNumber: 1,
    endNumber: 10,
    positionStart: 1,
  });
  
  const [bulkRowForm, setBulkRowForm] = useState({
    namePattern: 'Row {letter}',
    qrPattern: 'ROW-{letter}',
    sequence: 'A-J', // A through J
  });

  // Fetch rooms
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await apiClient.get('/location/rooms');
      return res.data;
    },
    refetchInterval: 5000,
  });

  // Create separate queries for each expanded room's shelves
  const shelfQueries = Array.from(expandedRooms).map((roomId) => ({
    queryKey: ['shelves', roomId],
    queryFn: async () => {
      const res = await apiClient.get(`/location/shelves?roomId=${roomId}`);
      return res.data;
    },
    enabled: expandedRooms.has(roomId),
  }));

  // Fetch shelves for all expanded rooms
  const shelfResults = useQuery({
    queryKey: ['shelves', 'batch', Array.from(expandedRooms).sort()],
    queryFn: async () => {
      if (expandedRooms.size === 0) return [];
      const promises = Array.from(expandedRooms).map(async (roomId) => {
        const res = await apiClient.get(`/location/shelves?roomId=${roomId}`);
        return res.data;
      });
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: expandedRooms.size > 0,
    refetchInterval: 5000,
  });

  // Fetch rows for all expanded shelves
  const rowResults = useQuery({
    queryKey: ['rows', 'batch', Array.from(expandedShelves).sort()],
    queryFn: async () => {
      if (expandedShelves.size === 0) return [];
      const promises = Array.from(expandedShelves).map(async (shelfId) => {
        const res = await apiClient.get(`/location/rows?shelfId=${shelfId}`);
        return res.data;
      });
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: expandedShelves.size > 0,
    refetchInterval: 5000,
  });

  // Fetch slots for all expanded rows
  const slotResults = useQuery({
    queryKey: ['slots', 'batch', Array.from(expandedRows).sort()],
    queryFn: async () => {
      if (expandedRows.size === 0) return [];
      const promises = Array.from(expandedRows).map(async (rowId) => {
        const res = await apiClient.get(`/location/slots?rowId=${rowId}`);
        return res.data;
      });
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: expandedRows.size > 0,
    refetchInterval: 5000,
  });

  const allShelves = shelfResults.data || [];
  const allRows = rowResults.data || [];
  const allSlots = slotResults.data || [];

  // Fetch available boxes for slot assignment (neededSpaces=1 for single slot)
  const { data: availableBoxes = [] } = useQuery<MovableBox[]>({
    queryKey: ['boxes', 'available', 1],
    queryFn: async () => {
      const res = await apiClient.get('/boxes/available?neededSpaces=1');
      return res.data;
    },
    enabled: modalType === 'assign-box',
  });

  // Create mutations
  const createMutation = useMutation({
    mutationFn: async ({ type, data }: { type: string; data: any }) => {
      await apiClient.post(`/location/${type}s`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.type + 's'] });
      setModalType(null);
      setFormData({ name: '', qrCode: '', position: 1 });
      toast.success(`${variables.type.charAt(0).toUpperCase() + variables.type.slice(1)} created successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create item. Please try again.';
      toast.error(message);
    },
  });

  // Update mutations
  const updateMutation = useMutation({
    mutationFn: async ({ type, id, data }: { type: string; id: string; data: any }) => {
      await apiClient.patch(`/location/${type}s/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['rows'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      setModalType(null);
      setIsEditing(false);
      setEditId('');
      setFormData({ name: '', qrCode: '', position: 1 });
      if (selectedEntity && selectedEntity.data.id === variables.id) {
        setSelectedEntity(null);
        setSelectedSlot(null);
      }
      toast.success(`${variables.type.charAt(0).toUpperCase() + variables.type.slice(1)} updated successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update item. Please try again.';
      toast.error(message);
    },
  });
  
  // Bulk create slots mutation
  const bulkCreateSlotsMutation = useMutation({
    mutationFn: async ({ rowId, rowName, pattern }: { rowId: string; rowName: string; pattern: typeof bulkSlotForm }) => {
      const slots = [];
      for (let i = pattern.startNumber; i <= pattern.endNumber; i++) {
        const name = pattern.namePattern.replace('{n}', String(i));
        let qrCode = pattern.qrPattern
          .replace('{n}', String(i))
          .replace('{row}', rowName); // Replace {row} with actual row name
        const position = pattern.positionStart + (i - pattern.startNumber);
        slots.push({ name, qrCode, position, rowId });
      }
      
      // Create all slots sequentially (better error handling than parallel)
      const results = [];
      for (const slot of slots) {
        try {
          const res = await apiClient.post('/location/slots', slot);
          results.push({ success: true, data: res.data });
        } catch (error: any) {
          results.push({ 
            success: false, 
            error: error.response?.data?.message || 'Failed',
            slot: slot.name 
          });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      setModalType(null);
      setBulkSlotForm({
        namePattern: 'Slot {n}',
        qrPattern: 'SLOT-{row}-{n}',
        startNumber: 1,
        endNumber: 10,
        positionStart: 1,
      });
      
      if (failCount === 0) {
        toast.success(`${successCount} slots created successfully`);
      } else {
        toast.error(`Created ${successCount} slots, ${failCount} failed (likely duplicates)`);
      }
    },
    onError: (error: any) => {
      toast.error('Bulk create failed. Please try again.');
    },
  });
  
  // Bulk create rows mutation
  const bulkCreateRowsMutation = useMutation({
    mutationFn: async ({ shelfId, pattern }: { shelfId: string; pattern: typeof bulkRowForm }) => {
      const [start, end] = pattern.sequence.split('-');
      const rows = [];
      
      // Generate A-Z sequence
      if (start.match(/[A-Z]/i) && end.match(/[A-Z]/i)) {
        const startCode = start.toUpperCase().charCodeAt(0);
        const endCode = end.toUpperCase().charCodeAt(0);
        let position = 1;
        
        for (let code = startCode; code <= endCode; code++) {
          const letter = String.fromCharCode(code);
          const name = pattern.namePattern.replace('{letter}', letter);
          const qrCode = pattern.qrPattern.replace('{letter}', letter);
          rows.push({ name, qrCode, position: position++, shelfId });
        }
      }
      
      // Create all rows sequentially
      const results = [];
      for (const row of rows) {
        try {
          const res = await apiClient.post('/location/rows', row);
          results.push({ success: true, data: res.data });
        } catch (error: any) {
          results.push({ 
            success: false, 
            error: error.response?.data?.message || 'Failed',
            row: row.name 
          });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['rows'] });
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      setModalType(null);
      setBulkRowForm({
        namePattern: 'Row {letter}',
        qrPattern: 'ROW-{letter}',
        sequence: 'A-J',
      });
      
      if (failCount === 0) {
        toast.success(`${successCount} rows created successfully`);
      } else {
        toast.error(`Created ${successCount} rows, ${failCount} failed (likely duplicates)`);
      }
    },
    onError: (error: any) => {
      toast.error('Bulk create failed. Please try again.');
    },
  });

  // Delete mutations
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      await apiClient.delete(`/location/${type}s/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.type + 's'] });
      if (selectedEntity && selectedEntity.data.id === variables.id) {
        setSelectedEntity(null);
        setSelectedSlot(null);
      }
      toast.success(`${variables.type.charAt(0).toUpperCase() + variables.type.slice(1)} deleted successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete item. It may still contain child items.';
      toast.error(message);
    },
  });

  // Assign box to slot mutation
  const assignBoxMutation = useMutation({
    mutationFn: async ({ boxId, slotId }: { boxId: string; slotId: string }) => {
      await apiClient.post(`/boxes/${boxId}/move`, { slotId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      setModalType(null);
      setSelectedEntity(null);
      setSelectedSlot(null);
      toast.success('Box assigned to slot successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to assign box to slot';
      toast.error(message);
    },
  });

  const toggleRoom = (roomId: string) => {
    const newSet = new Set(expandedRooms);
    if (newSet.has(roomId)) {
      newSet.delete(roomId);
    } else {
      newSet.add(roomId);
    }
    setExpandedRooms(newSet);
  };

  const toggleShelf = (shelfId: string) => {
    const newSet = new Set(expandedShelves);
    if (newSet.has(shelfId)) {
      newSet.delete(shelfId);
    } else {
      newSet.add(shelfId);
    }
    setExpandedShelves(newSet);
  };

  const toggleRow = (rowId: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(rowId)) {
      newSet.delete(rowId);
    } else {
      newSet.add(rowId);
    }
    setExpandedRows(newSet);
  };

  const openCreateModal = (type: ModalType, parentId: string = '') => {
    setIsEditing(false);
    setModalType(type);
    setParentId(parentId);
    setFormData({ name: '', qrCode: '', position: 1 });
  };

  const openEditModal = (type: ModalType, id: string, name: string, qrCode: string, position: number = 1) => {
    setIsEditing(true);
    setModalType(type);
    setEditId(id);
    setFormData({ name, qrCode, position });
  };

  const handleSave = () => {
    if (isEditing) {
      let data: any = { name: formData.name, qrCode: formData.qrCode };
      if (modalType !== 'room') data.position = formData.position;
      updateMutation.mutate({ type: modalType as string, id: editId, data });
    } else {
      let data: any = { ...formData };
      
      if (modalType === 'shelf') data.roomId = parentId;
      if (modalType === 'row') data.shelfId = parentId;
      if (modalType === 'slot') data.rowId = parentId;
      
      createMutation.mutate({ type: modalType as string, data });
    }
  };
  
  const handleBulkCreateSlots = () => {
    if (!parentId || !parentRow) return;
    bulkCreateSlotsMutation.mutate({ 
      rowId: parentId, 
      rowName: parentRow.name, 
      pattern: bulkSlotForm 
    });
  };
  
  const handleBulkCreateRows = () => {
    if (!parentId) return;
    bulkCreateRowsMutation.mutate({ shelfId: parentId, pattern: bulkRowForm });
  };

  const handleDelete = (type: string, id: string, name: string) => {
    setConfirmDelete({ isOpen: true, type, id, name });
  };

  const confirmDeleteAction = () => {
    deleteMutation.mutate({ type: confirmDelete.type, id: confirmDelete.id });
    setConfirmDelete({ isOpen: false, type: '', id: '', name: '' });
  };

  const handleAssignBox = (boxId: string) => {
    if (selectedSlot) {
      assignBoxMutation.mutate({ boxId, slotId: selectedSlot.id });
    }
  };

  return (
    <Shell title={t('structure.title', 'Physical Structure Layout')} subtitle={t('structure.subtitle', 'Configure rooms, shelves, rows and slots')}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left: Expandable Tree */}
        <Card>
          <PageHeader
            title={t('structure.hierarchy', 'Storage Facility Hierarchy')}
            subtitle={t('structure.central_repo', 'Central Repository System (CRS-01)')}
            action={
              canCreate && (
                <Button onClick={() => openCreateModal('room')} size="sm">
                  <Plus size={14} />
                  {t('structure.add_room', 'Add Room')}
                </Button>
              )
            }
          />

          {rooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <Folder size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>{t('structure.no_rooms', 'No Rooms Configured')}</p>
              <p style={{ fontSize: '13px' }}>{t('structure.add_room_to_begin', 'Start by adding a room to the system.')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {rooms.map((room) => {
                const isExpanded = expandedRooms.has(room.id);
                const shelves = allShelves.filter(s => s.roomId === room.id);
                const shelvesCount = room._count?.shelves ?? shelves.length;
                
                return (
                  <div key={room.id}>
                    {/* Room */}
                    <div
                      onClick={() => { setSelectedSlot(null); setSelectedEntity({ type: 'room', data: room }); }}
                      style={{
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius)',
                        background: selectedEntity?.type === 'room' && selectedEntity?.data?.id === room.id ? 'var(--bg-subtle)' : 'transparent',
                        transition: 'background 150ms',
                      }}
                      onMouseEnter={(e) => { 
                        if (selectedEntity?.type !== 'room' || selectedEntity?.data?.id !== room.id) {
                          e.currentTarget.style.background = 'var(--bg-subtle)'; 
                        }
                      }}
                      onMouseLeave={(e) => { 
                        if (selectedEntity?.type !== 'room' || selectedEntity?.data?.id !== room.id) {
                          e.currentTarget.style.background = 'transparent'; 
                        }
                      }}
                    >
                      <button
                        onClick={() => toggleRoom(room.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      <Folder size={18} color="var(--brand)" />
                      <span style={{ flex: 1, fontWeight: 600, fontSize: '14px' }}>{room.name}</span>
                      <span style={{ 
                        fontSize: '11px', 
                        padding: '2px 6px', 
                        background: 'var(--bg-subtle)', 
                        borderRadius: '4px', 
                        fontFamily: 'monospace' 
                      }}>
                        {room.qrCode}
                      </span>
                      {canCreate && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal('room', room.id, room.name, room.qrCode); }}
                            style={{
                              padding: '4px',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '2px',
                            }}
                            title={t('structure.edit_room', 'Edit Room')}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openCreateModal('shelf', room.id); }}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius)',
                              background: 'var(--bg-surface)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={t('structure.add_shelf', 'Add Shelf')}
                          >
                            <Plus size={12} />
                          </button>
                        </>
                      )}
                      {canDelete && (
                        <button
                          disabled={shelvesCount > 0}
                          onClick={(e) => { e.stopPropagation(); handleDelete('room', room.id, room.name); }}
                          style={{
                            padding: '4px',
                            border: 'none',
                            background: 'transparent',
                            cursor: shelvesCount > 0 ? 'not-allowed' : 'pointer',
                            color: shelvesCount > 0 ? 'var(--text-muted)' : 'var(--danger)',
                            opacity: shelvesCount > 0 ? 0.4 : 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title={shelvesCount > 0 ? t('structure.cannot_delete_room', 'Cannot delete Room: it still contains Shelves. Delete shelves first.') : t('structure.delete_room', 'Delete Room')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Shelves */}
                    {isExpanded && shelves.map((shelf) => {
                      const isShelfExpanded = expandedShelves.has(shelf.id);
                      const rows = allRows.filter(r => r.shelfId === shelf.id);
                      const rowsCount = shelf._count?.rows ?? rows.length;
                      
                      return (
                        <div key={shelf.id} style={{ marginLeft: '28px' }}>
                          <div
                            onClick={() => { setSelectedSlot(null); setSelectedEntity({ type: 'shelf', data: shelf }); }}
                            style={{
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              borderRadius: 'var(--radius)',
                              background: selectedEntity?.type === 'shelf' && selectedEntity?.data?.id === shelf.id ? 'var(--bg-subtle)' : 'transparent',
                              transition: 'background 150ms',
                            }}
                            onMouseEnter={(e) => { 
                              if (selectedEntity?.type !== 'shelf' || selectedEntity?.data?.id !== shelf.id) {
                                e.currentTarget.style.background = 'var(--bg-subtle)'; 
                              }
                            }}
                            onMouseLeave={(e) => { 
                              if (selectedEntity?.type !== 'shelf' || selectedEntity?.data?.id !== shelf.id) {
                                e.currentTarget.style.background = 'transparent'; 
                              }
                            }}
                          >
                            <button
                              onClick={() => toggleShelf(shelf.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                            >
                              {isShelfExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            <Layers size={16} color="var(--success)" />
                            <span style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>{shelf.name}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {shelf.qrCode}
                            </span>
                            {canCreate && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditModal('shelf', shelf.id, shelf.name, shelf.qrCode, shelf.position); }}
                                  style={{
                                    padding: '3px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '2px',
                                  }}
                                  title={t('structure.edit_shelf', 'Edit Shelf')}
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openCreateModal('row', shelf.id); }}
                                  style={{
                                    padding: '3px 6px',
                                    fontSize: '11px',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)',
                                    background: 'var(--bg-surface)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title={t('structure.add_row', 'Add Row')}
                                >
                                  <Plus size={10} />
                                </button>
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setParentId(shelf.id);
                                    setModalType('bulk-create-rows');
                                  }}
                                  style={{
                                    padding: '3px 6px',
                                    fontSize: '9px',
                                    border: '1px solid var(--brand)',
                                    borderRadius: 'var(--radius)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--brand)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    fontWeight: 600,
                                  }}
                                  title={t('structure.bulk_create_rows', 'Bulk Create Rows')}
                                >
                                  <Plus size={8} />
                                  {t('structure.bulk_rows_btn', 'Bulk')}
                                </button>
                              </>
                            )}
                            {canDelete && (
                              <button
                                disabled={rowsCount > 0}
                                onClick={(e) => { e.stopPropagation(); handleDelete('shelf', shelf.id, shelf.name); }}
                                style={{
                                  padding: '3px',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: rowsCount > 0 ? 'not-allowed' : 'pointer',
                                  color: rowsCount > 0 ? 'var(--text-muted)' : 'var(--danger)',
                                  opacity: rowsCount > 0 ? 0.4 : 1,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title={rowsCount > 0 ? t('structure.cannot_delete_shelf', 'Cannot delete Shelf: it still contains Rows. Delete rows first.') : t('structure.delete_shelf', 'Delete Shelf')}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>

                          {/* Rows */}
                          {isShelfExpanded && rows.map((row) => {
                            const isRowExpanded = expandedRows.has(row.id);
                            const slots = allSlots.filter(s => s.rowId === row.id);
                            const slotsCount = row._count?.slots ?? slots.length;
                            
                            return (
                              <div key={row.id} style={{ marginLeft: '28px' }}>
                                <div
                                  onClick={() => { setSelectedSlot(null); setSelectedEntity({ type: 'row', data: row }); }}
                                  style={{
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    borderRadius: 'var(--radius)',
                                    background: selectedEntity?.type === 'row' && selectedEntity?.data?.id === row.id ? 'var(--bg-subtle)' : 'transparent',
                                    transition: 'background 150ms',
                                  }}
                                  onMouseEnter={(e) => { 
                                    if (selectedEntity?.type !== 'row' || selectedEntity?.data?.id !== row.id) {
                                      e.currentTarget.style.background = 'var(--bg-subtle)'; 
                                    }
                                  }}
                                  onMouseLeave={(e) => { 
                                    if (selectedEntity?.type !== 'row' || selectedEntity?.data?.id !== row.id) {
                                      e.currentTarget.style.background = 'transparent'; 
                                    }
                                  }}
                                >
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                                  >
                                    {isRowExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                                  <Grid3x3 size={14} color="var(--warning)" />
                                  <span style={{ flex: 1, fontSize: '12px' }}>{row.name}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    {row.qrCode}
                                  </span>
                                  {canCreate && (
                                    <>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); openEditModal('row', row.id, row.name, row.qrCode, row.position); }}
                                        style={{
                                          padding: '2px',
                                          border: 'none',
                                          background: 'transparent',
                                          cursor: 'pointer',
                                          color: 'var(--text-secondary)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          marginRight: '2px',
                                        }}
                                        title={t('structure.edit_row', 'Edit Row')}
                                      >
                                        <Edit size={11} />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); openCreateModal('slot', row.id); }}
                                        style={{
                                          padding: '2px 5px',
                                          fontSize: '10px',
                                          border: '1px solid var(--border)',
                                          borderRadius: 'var(--radius)',
                                          background: 'var(--bg-surface)',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                        title={t('structure.add_slot', 'Add Slot')}
                                      >
                                        <Plus size={9} />
                                      </button>
                                      <button
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          setParentId(row.id);
                                          setParentRow(row); // Store the full row object
                                          setModalType('bulk-create-slots');
                                        }}
                                        style={{
                                          padding: '2px 5px',
                                          fontSize: '8px',
                                          border: '1px solid var(--brand)',
                                          borderRadius: 'var(--radius)',
                                          background: 'var(--bg-surface)',
                                          color: 'var(--brand)',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '2px',
                                          fontWeight: 600,
                                        }}
                                        title={t('structure.bulk_create_slots', 'Bulk Create Slots')}
                                      >
                                        <Plus size={7} />
                                        {t('structure.bulk_slots_btn', 'Bulk')}
                                      </button>
                                    </>
                                  )}
                                  {canDelete && (
                                    <button
                                      disabled={slotsCount > 0}
                                      onClick={(e) => { e.stopPropagation(); handleDelete('row', row.id, row.name); }}
                                      style={{
                                        padding: '2px',
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: slotsCount > 0 ? 'not-allowed' : 'pointer',
                                        color: slotsCount > 0 ? 'var(--text-muted)' : 'var(--danger)',
                                        opacity: slotsCount > 0 ? 0.4 : 1,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                      title={slotsCount > 0 ? t('structure.cannot_delete_row', 'Cannot delete Row: it still contains Slots. Delete slots first.') : t('structure.delete_row', 'Delete Row')}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </div>

                                {/* Slots */}
                                {isRowExpanded && slots.map((slot) => (
                                  <div
                                    key={slot.id}
                                    onClick={() => { setSelectedSlot(slot); setSelectedEntity({ type: 'slot', data: slot }); }}
                                    style={{
                                      marginLeft: '28px',
                                      padding: '6px 12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      cursor: 'pointer',
                                      borderRadius: 'var(--radius)',
                                      background: selectedEntity?.type === 'slot' && selectedEntity?.data?.id === slot.id ? 'var(--bg-subtle)' : 'transparent',
                                      transition: 'background 150ms',
                                    }}
                                    onMouseEnter={(e) => { 
                                      if (selectedEntity?.type !== 'slot' || selectedEntity?.data?.id !== slot.id) {
                                        e.currentTarget.style.background = 'var(--bg-subtle)'; 
                                      }
                                    }}
                                    onMouseLeave={(e) => { 
                                      if (selectedEntity?.type !== 'slot' || selectedEntity?.data?.id !== slot.id) {
                                        e.currentTarget.style.background = 'transparent'; 
                                      }
                                    }}
                                  >
                                    <Square size={12} color="var(--info)" />
                                    <span style={{ flex: 1, fontSize: '12px' }}>{slot.name}</span>
                                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                      {slot.qrCode}
                                    </span>
                                    {canCreate && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); openEditModal('slot', slot.id, slot.name, slot.qrCode, slot.position); }}
                                        style={{
                                          padding: '2px',
                                          border: 'none',
                                          background: 'transparent',
                                          cursor: 'pointer',
                                          color: 'var(--text-secondary)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          marginRight: '2px',
                                        }}
                                        title={t('structure.edit_slot', 'Edit Slot')}
                                      >
                                        <Edit size={10} />
                                      </button>
                                    )}
                                    {canDelete && (
                                      <button
                                        disabled={slot.boxes && slot.boxes.length > 0}
                                        onClick={(e) => { e.stopPropagation(); handleDelete('slot', slot.id, slot.name); }}
                                        style={{
                                          padding: '2px',
                                          border: 'none',
                                          background: 'transparent',
                                          cursor: slot.boxes && slot.boxes.length > 0 ? 'not-allowed' : 'pointer',
                                          color: slot.boxes && slot.boxes.length > 0 ? 'var(--text-muted)' : 'var(--danger)',
                                          opacity: slot.boxes && slot.boxes.length > 0 ? 0.4 : 1,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                        title={slot.boxes && slot.boxes.length > 0 ? t('structure.cannot_delete_slot', 'Cannot delete Slot: it still contains Box(es). Move boxes first.') : t('structure.delete_slot', 'Delete Slot')}
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: Detail Panel */}
        <Card>
          <PageHeader 
            title={selectedEntity 
              ? t(`structure.${selectedEntity.type}_details`, `${selectedEntity.type.charAt(0).toUpperCase() + selectedEntity.type.slice(1)} Details`) 
              : t('structure.details', 'Details')} 
          />
          {selectedEntity ? (
            <div style={{ padding: '16px' }}>
              {selectedEntity.type === 'slot' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.location_path', 'LOCATION PATH')}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {selectedEntity.data.row?.shelf?.room?.name} / {selectedEntity.data.row?.shelf?.name} / {selectedEntity.data.row?.name} / {selectedEntity.data.name}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.qr_code', 'QR CODE')}
                    </div>
                    <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--brand)' }}>
                      {selectedEntity.data.qrCode}
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.status', 'STATUS')}
                    </div>
                    {(() => {
                      const boxes = selectedEntity.data.boxes || [];
                      const hasBox = boxes.length > 0;
                      
                      if (hasBox) {
                        return (
                          <div>
                            <Badge variant="warning">{t('structure.occupied', 'Occupied')}</Badge>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              {boxes.map((box: any) => box.label).join(', ')}
                            </div>
                          </div>
                        );
                      }
                      return <Badge variant="success">{t('structure.available', 'Available')}</Badge>;
                    })()}
                  </div>

                  {canCreate && !(selectedEntity.data.boxes && selectedEntity.data.boxes.length > 0) && (
                    <div style={{ width: '100%' }}>
                      <Button onClick={() => openCreateModal('assign-box')} variant="primary">
                        <Package size={14} />
                        {t('structure.assign_box_to_slot', 'Assign Box to Slot')}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {selectedEntity.type === 'room' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.room_name', 'ROOM NAME')}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {selectedEntity.data.name}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.qr_code', 'QR CODE')}
                    </div>
                    <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--brand)' }}>
                      {selectedEntity.data.qrCode}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.structure_details', 'STRUCTURE DETAILS')}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {t('structure.details_shelves', 'Contains {count} shelves').replace('{count}', String(selectedEntity.data._count?.shelves ?? allShelves.filter((s: any) => s.roomId === selectedEntity.data.id).length))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.created_at', 'CREATED AT')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(selectedEntity.data.createdAt).toLocaleString()}
                    </div>
                  </div>
                </>
              )}

              {selectedEntity.type === 'shelf' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.shelf_name', 'SHELF NAME')}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {selectedEntity.data.name}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.parent_room', 'PARENT ROOM')}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {selectedEntity.data.room?.name || 'Unknown Room'}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.qr_code', 'QR CODE')}
                    </div>
                    <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--brand)' }}>
                      {selectedEntity.data.qrCode}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.position', 'POSITION')}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {selectedEntity.data.position}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.structure_details', 'STRUCTURE DETAILS')}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {t('structure.details_rows', 'Contains {count} rows').replace('{count}', String(selectedEntity.data._count?.rows ?? allRows.filter((r: any) => r.shelfId === selectedEntity.data.id).length))}
                    </div>
                  </div>
                </>
              )}

              {selectedEntity.type === 'row' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.row_name', 'ROW NAME')}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {selectedEntity.data.name}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.parent_shelf', 'PARENT SHELF')}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {selectedEntity.data.shelf?.room?.name} / {selectedEntity.data.shelf?.name}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.qr_code', 'QR CODE')}
                    </div>
                    <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--brand)' }}>
                      {selectedEntity.data.qrCode}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.position', 'POSITION')}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {selectedEntity.data.position}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t('structure.structure_details', 'STRUCTURE DETAILS')}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {t('structure.details_slots', 'Contains {count} slots').replace('{count}', String(selectedEntity.data._count?.slots ?? allSlots.filter((s: any) => s.rowId === selectedEntity.data.id).length))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <Square size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: '13px' }}>{t('structure.select_item_to_view', 'Select an item in the structure tree to view details')}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Create Modal */}
      {modalType && modalType !== 'assign-box' && (
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
              {isEditing 
                ? t(`structure.edit_${modalType}`, `Edit ${modalType}`) 
                : t(`structure.add_${modalType}`, `Add ${modalType}`)}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                {t('structure.name', 'Name')}
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`e.g., ${modalType === 'room' ? 'Room A' : modalType === 'shelf' ? 'Shelf 01' : modalType === 'row' ? 'Row A' : 'Slot 1'}`}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                {t('structure.qr_code', 'QR Code')}
              </label>
              <Input
                value={formData.qrCode}
                onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                placeholder="e.g., QR-001"
              />
            </div>

            {modalType !== 'room' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                  {t('structure.position_label', 'Position')}
                </label>
                <Input
                  type="number"
                  value={formData.position.toString()}
                  onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 1 })}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setModalType(null)}>
                {t('structure.cancel', 'Cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={(isEditing ? updateMutation.isPending : createMutation.isPending) || !formData.name || !formData.qrCode}
              >
                {isEditing 
                  ? (updateMutation.isPending ? t('structure.saving', 'Saving...') : t('structure.save', 'Save')) 
                  : (createMutation.isPending ? t('structure.creating', 'Creating...') : t('structure.add', 'Create'))}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Box Modal */}
      {modalType === 'assign-box' && selectedSlot && (
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
              maxWidth: '600px',
              border: '1px solid var(--border)',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
              {t('structure.assign_box_to_slot', 'Assign Box to Slot')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {selectedSlot.row.shelf.room.name} / {selectedSlot.row.shelf.name} / {selectedSlot.row.name} / {selectedSlot.name}
            </p>

            {availableBoxes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <Package size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>{t('structure.no_boxes_available', 'No available boxes')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {availableBoxes.map((box) => (
                  <div
                    key={box.id}
                    onClick={() => handleAssignBox(box.id)}
                    style={{
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-subtle)';
                      e.currentTarget.style.borderColor = 'var(--brand)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <Package size={18} color="var(--brand)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{box.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {box.qrCode}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {box.occupiedCount}/{box.capacity}
                    </div>
                    <Badge variant={box.status === 'ACTIVE' ? 'success' : 'default'}>
                      {box.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setModalType(null)}>
                {t('structure.cancel', 'Cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Slots Modal */}
      {modalType === 'bulk-create-slots' && (
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
              maxWidth: '600px',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
              {t('structure.bulk_create_slots', 'Bulk Create Slots')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {t('structure.bulk_create_slots_help', 'Create multiple slots at once with sequential naming')}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                {t('structure.name_pattern', 'Name Pattern')}
              </label>
              <Input
                value={bulkSlotForm.namePattern}
                onChange={(e) => setBulkSlotForm({ ...bulkSlotForm, namePattern: e.target.value })}
                placeholder="Slot {n}"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('structure.use_n_placeholder', 'Use {n} for number placeholder (e.g., "Slot {n}" → Slot 1, Slot 2...)')}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                {t('structure.qr_pattern', 'QR Code Pattern')}
              </label>
              <Input
                value={bulkSlotForm.qrPattern}
                onChange={(e) => setBulkSlotForm({ ...bulkSlotForm, qrPattern: e.target.value })}
                placeholder="SLOT-{row}-{n}"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('structure.use_qr_placeholder', 'Use {n} for number, {row} for row name (e.g., "SLOT-{row}-{n}" → SLOT-A-1, SLOT-A-2...)')}
                {parentRow && <span style={{ color: 'var(--brand)', fontWeight: 500 }}> {t('structure.current_row', 'Current row:')} {parentRow.name}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                  {t('structure.start_number', 'Start Number')}
                </label>
                <Input
                  type="number"
                  value={String(bulkSlotForm.startNumber)}
                  onChange={(e) => setBulkSlotForm({ ...bulkSlotForm, startNumber: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                  {t('structure.end_number', 'End Number')}
                </label>
                <Input
                  type="number"
                  value={String(bulkSlotForm.endNumber)}
                  onChange={(e) => setBulkSlotForm({ ...bulkSlotForm, endNumber: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                  {t('structure.position_start', 'Position Start')}
                </label>
                <Input
                  type="number"
                  value={String(bulkSlotForm.positionStart)}
                  onChange={(e) => setBulkSlotForm({ ...bulkSlotForm, positionStart: parseInt(e.target.value) || 1 })}
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
                {t('structure.preview_slots_title', 'Preview (first 3 of {total} slots):').replace('{total}', String(bulkSlotForm.endNumber - bulkSlotForm.startNumber + 1))}
              </div>
              {[bulkSlotForm.startNumber, bulkSlotForm.startNumber + 1, bulkSlotForm.startNumber + 2]
                .filter(n => n <= bulkSlotForm.endNumber)
                .map((n, idx) => {
                  const name = bulkSlotForm.namePattern.replace('{n}', String(n));
                  const qr = bulkSlotForm.qrPattern
                    .replace('{n}', String(n))
                    .replace('{row}', parentRow?.name || 'ROW'); // Replace {row} with actual row name
                  const pos = bulkSlotForm.positionStart + idx;
                  return (
                    <div key={n} style={{ fontSize: '11px', marginBottom: '4px', display: 'flex', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--success)' }}>✓</span>
                      <span style={{ flex: 1 }}>{name}</span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{qr}</span>
                      <span style={{ color: 'var(--text-muted)' }}>pos: {pos}</span>
                    </div>
                  );
                })}
              {bulkSlotForm.endNumber - bulkSlotForm.startNumber > 2 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {t('structure.and_more', '... and {count} more').replace('{count}', String(bulkSlotForm.endNumber - bulkSlotForm.startNumber - 2))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setModalType(null)}>
                {t('structure.cancel', 'Cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkCreateSlots}
                disabled={bulkCreateSlotsMutation.isPending || !bulkSlotForm.namePattern || !bulkSlotForm.qrPattern || bulkSlotForm.endNumber < bulkSlotForm.startNumber}
              >
                {bulkCreateSlotsMutation.isPending 
                  ? t('structure.creating', 'Creating...') 
                  : t('structure.create_slots_btn', 'Create {count} Slots').replace('{count}', String(bulkSlotForm.endNumber - bulkSlotForm.startNumber + 1))}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Rows Modal */}
      {modalType === 'bulk-create-rows' && (
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
              maxWidth: '600px',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
              {t('structure.bulk_create_rows', 'Bulk Create Rows')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {t('structure.bulk_create_rows_help', 'Create multiple rows at once with letter sequence (A-Z)')}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                {t('structure.name_pattern', 'Name Pattern')}
              </label>
              <Input
                value={bulkRowForm.namePattern}
                onChange={(e) => setBulkRowForm({ ...bulkRowForm, namePattern: e.target.value })}
                placeholder="Row {letter}"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('structure.use_letter_placeholder', 'Use {letter} for letter placeholder (e.g., "Row {letter}" → Row A, Row B...)')}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                {t('structure.qr_pattern', 'QR Code Pattern')}
              </label>
              <Input
                value={bulkRowForm.qrPattern}
                onChange={(e) => setBulkRowForm({ ...bulkRowForm, qrPattern: e.target.value })}
                placeholder="ROW-{letter}"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('structure.use_qr_letter_placeholder', 'Use {letter} for letter placeholder (e.g., "ROW-{letter}" → ROW-A, ROW-B...)')}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                {t('structure.letter_sequence', 'Letter Sequence')}
              </label>
              <Input
                value={bulkRowForm.sequence}
                onChange={(e) => setBulkRowForm({ ...bulkRowForm, sequence: e.target.value })}
                placeholder="A-J"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('structure.sequence_help', 'Format: START-END (e.g., "A-Z" for all letters, "A-J" for first 10)')}
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
                {t('structure.preview_first_3', 'Preview (first 3):')}
              </div>
              {(() => {
                const [start, end] = bulkRowForm.sequence.split('-');
                if (!start || !end || !start.match(/[A-Z]/i) || !end.match(/[A-Z]/i)) {
                  return <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Invalid sequence format</div>;
                }
                const startCode = start.toUpperCase().charCodeAt(0);
                const endCode = end.toUpperCase().charCodeAt(0);
                const total = endCode - startCode + 1;
                
                return (
                  <>
                    {[0, 1, 2].filter(i => startCode + i <= endCode).map((i) => {
                      const letter = String.fromCharCode(startCode + i);
                      const name = bulkRowForm.namePattern.replace('{letter}', letter);
                      const qr = bulkRowForm.qrPattern.replace('{letter}', letter);
                      return (
                        <div key={letter} style={{ fontSize: '11px', marginBottom: '4px', display: 'flex', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--success)' }}>✓</span>
                          <span style={{ flex: 1 }}>{name}</span>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{qr}</span>
                          <span style={{ color: 'var(--text-muted)' }}>pos: {i + 1}</span>
                        </div>
                      );
                    })}
                    {total > 3 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {t('structure.and_more_total', '... and {count} more ({total} total)').replace('{count}', String(total - 3)).replace('{total}', String(total))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setModalType(null)}>
                {t('structure.cancel', 'Cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkCreateRows}
                disabled={bulkCreateRowsMutation.isPending || !bulkRowForm.namePattern || !bulkRowForm.qrPattern || !bulkRowForm.sequence.match(/^[A-Z]-[A-Z]$/i)}
              >
                {bulkCreateRowsMutation.isPending 
                  ? t('structure.creating', 'Creating...') 
                  : t('structure.create_rows_btn', 'Create Rows {sequence}').replace('{sequence}', bulkRowForm.sequence)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, type: '', id: '', name: '' })}
        onConfirm={confirmDeleteAction}
        title={t('structure.confirm_delete', 'Confirm Deletion')}
        message={t('structure.confirm_delete_msg', 'Are you sure you want to delete {name}? This action cannot be undone.').replace('{name}', confirmDelete.name)}
        confirmText={t('structure.delete', 'Delete')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </Shell>
  );
}
