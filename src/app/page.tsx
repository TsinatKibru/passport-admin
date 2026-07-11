'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import {
  Boxes,
  Database,
  Eye,
  FileText,
  LogOut,
  Map,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  TrendingUp,
  User,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
  qrCode: string;
  _count?: { shelves: number };
}

interface Shelf {
  id: string;
  name: string;
  qrCode: string;
  position: number;
  roomId: string;
  room?: { id: string; name: string };
  _count?: { rows: number };
}

interface Row {
  id: string;
  name: string;
  qrCode: string;
  position: number;
  shelfId: string;
  shelf?: { id: string; name: string; room?: { id: string; name: string } };
  _count?: { slots: number };
}

interface Slot {
  id: string;
  name: string;
  qrCode: string;
  position: number;
  rowId: string;
  row?: {
    id: string;
    name: string;
    shelf?: { id: string; name: string; room?: { id: string; name: string } };
  };
  boxes?: {
    id: string;
    qrCode: string;
    label: string;
    occupiedCount: number;
    capacity: number;
    status: string;
  }[];
}

interface Box {
  id: string;
  qrCode: string;
  label: string;
  capacity: number;
  occupiedCount: number;
  status: string;
  slotId: string | null;
  slot?: {
    id: string;
    name: string;
    row: {
      id: string;
      name: string;
      shelf: {
        id: string;
        name: string;
        room: { id: string; name: string };
      };
    };
  };
}

interface Passport {
  id: string;
  qrCode: string;
  holderName: string;
  holderIdNo: string;
  status: string;
  box?: {
    id: string;
    label: string;
  } | null;
}

interface LogEntry {
  id: string;
  action: string;
  fromLocation: string | null;
  toLocation: string | null;
  createdAt: string;
  passport?: { qrCode: string; holderName: string } | null;
  box?: { qrCode: string; label: string } | null;
  user: { name: string; email: string };
}

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'boxes' | 'passports' | 'logs'>('hierarchy');

  // Creation State
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', qrCode: '' });

  const [showAddShelf, setShowAddShelf] = useState(false);
  const [newShelf, setNewShelf] = useState({ name: '', qrCode: '', roomId: '', position: 1 });

  const [showAddRow, setShowAddRow] = useState(false);
  const [newRow, setNewRow] = useState({ name: '', qrCode: '', shelfId: '', position: 1 });

  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ name: '', qrCode: '', rowId: '', position: 1 });

  const [showAddBox, setShowAddBox] = useState(false);
  const [newBox, setNewBox] = useState({ label: '', qrCode: '', capacity: 10, slotId: '' });

  // Move Box State
  const [movingBoxId, setMovingBoxId] = useState<string | null>(null);
  const [destinationSlotId, setDestinationSlotId] = useState('');

  // Filtering / Search State
  const [passportSearch, setPassportSearch] = useState('');
  const [boxSearch, setBoxSearch] = useState('');

  // Expandable Hierarchy Navigation State
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
  const [expandedShelves, setExpandedShelves] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  // Queries (Automatic Polling enabled by providers.tsx config)
  const { data: rooms = [], refetch: refetchRooms } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await apiClient.get('/location/rooms');
      return res.data;
    },
  });

  const { data: shelves = [], refetch: refetchShelves } = useQuery<Shelf[]>({
    queryKey: ['shelves'],
    queryFn: async () => {
      const res = await apiClient.get('/location/shelves');
      return res.data;
    },
  });

  const { data: rows = [], refetch: refetchRowsData } = useQuery<Row[]>({
    queryKey: ['rows'],
    queryFn: async () => {
      const res = await apiClient.get('/location/rows');
      return res.data;
    },
  });

  const { data: slots = [], refetch: refetchSlots } = useQuery<Slot[]>({
    queryKey: ['slots'],
    queryFn: async () => {
      const res = await apiClient.get('/location/slots');
      return res.data;
    },
  });

  const { data: boxes = [], refetch: refetchBoxes } = useQuery<Box[]>({
    queryKey: ['boxes'],
    queryFn: async () => {
      const res = await apiClient.get('/boxes');
      return res.data.data || res.data;
    },
  });

  const { data: passportsData, refetch: refetchPassports } = useQuery<{ data: Passport[]; total: number }>({
    queryKey: ['passports', passportSearch],
    queryFn: async () => {
      const res = await apiClient.get('/passports', {
        params: { search: passportSearch || undefined, limit: 50 },
      });
      return res.data;
    },
  });

  const { data: logsData, refetch: refetchLogs } = useQuery<{ data: LogEntry[] }>({
    queryKey: ['logs'],
    queryFn: async () => {
      const res = await apiClient.get('/location/logs', { params: { limit: 30 } });
      return res.data;
    },
  });

  const passports = passportsData?.data || [];

  // Mutations
  const createRoomMutation = useMutation({
    mutationFn: (data: typeof newRoom) => apiClient.post('/location/rooms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setShowAddRoom(false);
      setNewRoom({ name: '', qrCode: '' });
    },
  });

  const createShelfMutation = useMutation({
    mutationFn: (data: typeof newShelf) => apiClient.post('/location/shelves', { ...data, position: Number(data.position) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      setShowAddShelf(false);
      setNewShelf({ name: '', qrCode: '', roomId: '', position: 1 });
    },
  });

  const createRowMutation = useMutation({
    mutationFn: (data: typeof newRow) => apiClient.post('/location/rows', { ...data, position: Number(data.position) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rows'] });
      setShowAddRow(false);
      setNewRow({ name: '', qrCode: '', shelfId: '', position: 1 });
    },
  });

  const createSlotMutation = useMutation({
    mutationFn: (data: typeof newSlot) => apiClient.post('/location/slots', { ...data, position: Number(data.position) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      setShowAddSlot(false);
      setNewSlot({ name: '', qrCode: '', rowId: '', position: 1 });
    },
  });

  const createBoxMutation = useMutation({
    mutationFn: (data: typeof newBox) => apiClient.post('/boxes', {
      label: data.label,
      qrCode: data.qrCode,
      capacity: Number(data.capacity),
      slotId: data.slotId || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      setShowAddBox(false);
      setNewBox({ label: '', qrCode: '', capacity: 10, slotId: '' });
    },
  });

  const moveBoxMutation = useMutation({
    mutationFn: ({ boxId, slotId }: { boxId: string; slotId: string }) =>
      apiClient.post(`/boxes/${boxId}/move`, { slotId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      setMovingBoxId(null);
      setDestinationSlotId('');
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/location/rooms/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const deleteShelfMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/location/shelves/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shelves'] }),
  });

  const deleteRowMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/location/rows/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rows'] }),
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/location/slots/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['slots'] }),
  });

  const deleteBoxMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/boxes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boxes'] }),
  });

  // Toggle Collapse
  const toggleRoom = (id: string) => {
    setExpandedRooms((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleShelf = (id: string) => {
    setExpandedShelves((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Capacity analytics
  const totalCapacity = boxes.reduce((acc, b) => acc + b.capacity, 0);
  const totalOccupied = boxes.reduce((acc, b) => acc + b.occupiedCount, 0);
  const utilizationPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 flex-col">
      {/* Dynamic Background */}
      <div className="fixed top-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-zinc-900 bg-zinc-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <img src="/ics-logo.png" alt="ICS Logo" className="h-10 w-auto object-contain bg-white/95 p-1 rounded shadow-sm" />
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-linear-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              ICS PASSPORT LOGISTICS
            </h1>
            <p className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">
              Immigration and Citizenship Service
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
            <User className="h-4 w-4 text-blue-400" />
            <span className="font-medium">Administrator</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-sm text-red-400 transition-all hover:bg-red-500/15"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Sidebar Stats */}
        <section className="md:col-span-1 space-y-6">
          
          {/* Card: Box Utilization */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">Storage Utilization</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-white">{utilizationPercent}%</span>
              <span className="text-xs text-zinc-500">of limit</span>
            </div>
            <div className="mt-3 w-full bg-zinc-850 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-linear-to-r from-blue-500 to-violet-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${utilizationPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-400 font-medium">
              {totalOccupied} / {totalCapacity} passports stored
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-4">
              <span className="text-xs font-medium text-zinc-500 uppercase block">Boxes</span>
              <span className="text-2xl font-bold text-white mt-1 block">{boxes.length}</span>
              <span className="text-[10px] text-zinc-400">Total MB units</span>
            </div>
            <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-4">
              <span className="text-xs font-medium text-zinc-500 uppercase block">Passports</span>
              <span className="text-2xl font-bold text-white mt-1 block">
                {passports.length || totalOccupied}
              </span>
              <span className="text-[10px] text-zinc-400">In system</span>
            </div>
          </div>

          {/* Tab Selection */}
          <nav className="flex flex-col space-y-1 bg-zinc-900/40 p-1.5 rounded-xl border border-zinc-900">
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'hierarchy'
                  ? 'bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Map className="h-4 w-4" />
              <span>Storage Hierarchy</span>
            </button>
            <button
              onClick={() => setActiveTab('boxes')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'boxes'
                  ? 'bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Boxes className="h-4 w-4" />
              <span>Movable Boxes</span>
            </button>
            <button
              onClick={() => setActiveTab('passports')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'passports'
                  ? 'bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Passports Feed</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'logs'
                  ? 'bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Movement Logs</span>
            </button>
          </nav>
        </section>

        {/* Right Dashboard Content */}
        <section className="md:col-span-3 space-y-6">

          {/* TAB 1: Storage Hierarchy */}
          {activeTab === 'hierarchy' && (
            <div className="space-y-6">
              
              {/* Actions Row */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Storage Hierarchy</h2>
                  <p className="text-sm text-zinc-400">Configure physical Rooms, Shelves, Rows, and Slots.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAddRoom(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all shadow-md shadow-blue-500/10"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Room</span>
                  </button>
                  <button
                    onClick={() => setShowAddShelf(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-semibold text-white transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Shelf</span>
                  </button>
                  <button
                    onClick={() => setShowAddRow(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-semibold text-white transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Row</span>
                  </button>
                  <button
                    onClick={() => setShowAddSlot(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-semibold text-white transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Slot</span>
                  </button>
                </div>
              </div>

              {/* Modals for creation */}
              {showAddRoom && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Add New Room</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      placeholder="Room Name (e.g. Room A)"
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                    <input
                      placeholder="QR Code (e.g. ROOM-A)"
                      value={newRoom.qrCode}
                      onChange={(e) => setNewRoom({ ...newRoom, qrCode: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowAddRoom(false)} className="px-3.5 py-2 rounded-lg text-sm text-zinc-400">Cancel</button>
                    <button
                      onClick={() => createRoomMutation.mutate(newRoom)}
                      className="px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500"
                    >
                      Save Room
                    </button>
                  </div>
                </div>
              )}

              {showAddShelf && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Add New Shelf</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      placeholder="Shelf Name (e.g. Shelf 01)"
                      value={newShelf.name}
                      onChange={(e) => setNewShelf({ ...newShelf, name: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                    <input
                      placeholder="QR Code (e.g. SHELF-01)"
                      value={newShelf.qrCode}
                      onChange={(e) => setNewShelf({ ...newShelf, qrCode: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                    <select
                      value={newShelf.roomId}
                      onChange={(e) => setNewShelf({ ...newShelf, roomId: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    >
                      <option value="">Select Room...</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Position (e.g. 1)"
                      value={newShelf.position}
                      onChange={(e) => setNewShelf({ ...newShelf, position: Number(e.target.value) })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowAddShelf(false)} className="px-3.5 py-2 rounded-lg text-sm text-zinc-400">Cancel</button>
                    <button
                      onClick={() => createShelfMutation.mutate(newShelf)}
                      className="px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500"
                    >
                      Save Shelf
                    </button>
                  </div>
                </div>
              )}

              {showAddRow && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Add New Row</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      placeholder="Row Name (e.g. Row A)"
                      value={newRow.name}
                      onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                    <input
                      placeholder="QR Code (e.g. ROW-A)"
                      value={newRow.qrCode}
                      onChange={(e) => setNewRow({ ...newRow, qrCode: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                    <select
                      value={newRow.shelfId}
                      onChange={(e) => setNewRow({ ...newRow, shelfId: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    >
                      <option value="">Select Shelf...</option>
                      {shelves.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.room?.name})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Position (e.g. 1)"
                      value={newRow.position}
                      onChange={(e) => setNewRow({ ...newRow, position: Number(e.target.value) })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowAddRow(false)} className="px-3.5 py-2 rounded-lg text-sm text-zinc-400">Cancel</button>
                    <button
                      onClick={() => createRowMutation.mutate(newRow)}
                      className="px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500"
                    >
                      Save Row
                    </button>
                  </div>
                </div>
              )}

              {showAddSlot && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Add New Slot</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      placeholder="Slot Name (e.g. Slot 1)"
                      value={newSlot.name}
                      onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                    <input
                      placeholder="QR Code (e.g. SLOT-A1)"
                      value={newSlot.qrCode}
                      onChange={(e) => setNewSlot({ ...newSlot, qrCode: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                    <select
                      value={newSlot.rowId}
                      onChange={(e) => setNewSlot({ ...newSlot, rowId: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    >
                      <option value="">Select Row...</option>
                      {rows.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.shelf?.name} / {r.shelf?.room?.name})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Position (e.g. 1)"
                      value={newSlot.position}
                      onChange={(e) => setNewSlot({ ...newSlot, position: Number(e.target.value) })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowAddSlot(false)} className="px-3.5 py-2 rounded-lg text-sm text-zinc-400">Cancel</button>
                    <button
                      onClick={() => createSlotMutation.mutate(newSlot)}
                      className="px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500"
                    >
                      Save Slot
                    </button>
                  </div>
                </div>
              )}

              {/* Hierarchy Tree Visualizer */}
              <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-5 space-y-4">
                {rooms.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <Map className="h-12 w-12 mx-auto mb-2 text-zinc-600" />
                    <p className="font-semibold">No Rooms Configured</p>
                    <p className="text-xs mt-1">Start by adding a room above.</p>
                  </div>
                ) : (
                  rooms.map((room) => {
                    const roomShelves = shelves.filter((s) => s.roomId === room.id);
                    const isRoomExpanded = !!expandedRooms[room.id];

                    return (
                      <div key={room.id} className="border border-zinc-900/60 rounded-xl bg-zinc-900/30 overflow-hidden">
                        {/* Room Node */}
                        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/60 border-b border-zinc-900/40">
                          <button
                            onClick={() => toggleRoom(room.id)}
                            className="flex items-center space-x-2 text-sm font-bold text-zinc-200"
                          >
                            {isRoomExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span>{room.name}</span>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">
                              {room.qrCode}
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this room and its children?')) {
                                deleteRoomMutation.mutate(room.id);
                              }
                            }}
                            className="text-zinc-600 hover:text-red-400 p-1 rounded-md transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Room Contents (Shelves) */}
                        {isRoomExpanded && (
                          <div className="p-4 space-y-4 pl-8 border-l border-zinc-900/60">
                            {roomShelves.length === 0 ? (
                              <p className="text-xs text-zinc-500 font-medium">No shelves in this room.</p>
                            ) : (
                              roomShelves.map((shelf) => {
                                const shelfRows = rows.filter((r) => r.shelfId === shelf.id);
                                const isShelfExpanded = !!expandedShelves[shelf.id];

                                return (
                                  <div key={shelf.id} className="border border-zinc-900/40 rounded-lg bg-zinc-900/10 overflow-hidden">
                                    {/* Shelf Node */}
                                    <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/40 border-b border-zinc-900/20">
                                      <button
                                        onClick={() => toggleShelf(shelf.id)}
                                        className="flex items-center space-x-2 text-xs font-bold text-zinc-300"
                                      >
                                        {isShelfExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                        <span>{shelf.name}</span>
                                        <span className="text-[9px] bg-zinc-850 text-zinc-500 px-1.5 py-0.5 rounded-sm">
                                          pos {shelf.position}
                                        </span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm('Delete this shelf?')) {
                                            deleteShelfMutation.mutate(shelf.id);
                                          }
                                        }}
                                        className="text-zinc-700 hover:text-red-400 p-0.5"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>

                                    {/* Shelf Contents (Rows) */}
                                    {isShelfExpanded && (
                                      <div className="p-3 space-y-3 pl-6 border-l border-zinc-900/40">
                                        {shelfRows.length === 0 ? (
                                          <p className="text-xs text-zinc-500 font-medium">No rows on this shelf.</p>
                                        ) : (
                                          shelfRows.map((row) => {
                                            const rowSlots = slots.filter((s) => s.rowId === row.id);
                                            const isRowExpanded = !!expandedRows[row.id];

                                            return (
                                              <div key={row.id} className="border border-zinc-900/20 rounded-md bg-zinc-900/5">
                                                {/* Row Node */}
                                                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/20 border-b border-zinc-900/10">
                                                  <button
                                                    onClick={() => toggleRow(row.id)}
                                                    className="flex items-center space-x-1.5 text-xs font-bold text-zinc-400"
                                                  >
                                                    {isRowExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                    <span>{row.name}</span>
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      if (confirm('Delete this row?')) {
                                                        deleteRowMutation.mutate(row.id);
                                                      }
                                                    }}
                                                    className="text-zinc-800 hover:text-red-400"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </button>
                                                </div>

                                                {/* Row Contents (Slots Grid) */}
                                                {isRowExpanded && (
                                                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                    {rowSlots.length === 0 ? (
                                                      <p className="text-xs text-zinc-500 font-medium col-span-full">No slots in this row.</p>
                                                    ) : (
                                                      rowSlots.map((slot) => (
                                                        <div key={slot.id} className="rounded-lg border border-zinc-850 bg-zinc-950 p-3 flex flex-col justify-between space-y-2">
                                                          <div className="flex items-center justify-between">
                                                            <span className="text-xs font-semibold text-zinc-300">{slot.name}</span>
                                                            <button
                                                              onClick={() => {
                                                                if (confirm('Delete this slot?')) {
                                                                  deleteSlotMutation.mutate(slot.id);
                                                                }
                                                              }}
                                                              className="text-zinc-700 hover:text-red-500 p-0.5 rounded-md hover:bg-zinc-900"
                                                            >
                                                              <Trash2 className="h-3 w-3" />
                                                            </button>
                                                          </div>
                                                          <div className="flex items-center justify-between text-[10px] text-zinc-500">
                                                            <div className="flex items-center space-x-1">
                                                              <QrCode className="h-3 w-3 text-zinc-600" />
                                                              <span>{slot.qrCode}</span>
                                                            </div>
                                                            <span>Pos: {slot.position}</span>
                                                          </div>

                                                          {/* Box contained in this slot */}
                                                          {slot.boxes && slot.boxes.length > 0 ? (
                                                            slot.boxes.map((b) => (
                                                              <div key={b.id} className="mt-2 rounded-md bg-linear-to-r from-blue-950 to-violet-950 border border-blue-900/30 p-2">
                                                                <div className="flex justify-between items-center">
                                                                  <span className="text-xs font-bold text-blue-200">{b.label}</span>
                                                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold ${
                                                                    b.status === 'FULL' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                                                                  }`}>
                                                                    {b.status}
                                                                  </span>
                                                                </div>
                                                                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                                                                  <span className="text-zinc-400 font-semibold uppercase">Capacity:</span>
                                                                  <span className="text-zinc-300 font-bold">{b.occupiedCount}/{b.capacity}</span>
                                                                </div>
                                                              </div>
                                                            ))
                                                          ) : (
                                                            <span className="text-[10px] text-zinc-600 font-semibold italic mt-2">Empty Slot</span>
                                                          )}
                                                        </div>
                                                      ))
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Movable Boxes Manager */}
          {activeTab === 'boxes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Movable Box Units</h2>
                  <p className="text-sm text-zinc-400">Deploy boxes and manually relocate them within slots.</p>
                </div>
                <button
                  onClick={() => setShowAddBox(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all shadow-md shadow-blue-500/10"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register Box</span>
                </button>
              </div>

              {/* Register Box Modal */}
              {showAddBox && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Register New Movable Box</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      placeholder="Label (e.g. MB-0003)"
                      value={newBox.label}
                      onChange={(e) => setNewBox({ ...newBox, label: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                    <input
                      placeholder="QR Label (e.g. BOX-MB-0003)"
                      value={newBox.qrCode}
                      onChange={(e) => setNewBox({ ...newBox, qrCode: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                    <input
                      type="number"
                      placeholder="Capacity (default 10)"
                      value={newBox.capacity}
                      onChange={(e) => setNewBox({ ...newBox, capacity: Number(e.target.value) })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white"
                    />
                    <select
                      value={newBox.slotId}
                      onChange={(e) => setNewBox({ ...newBox, slotId: e.target.value })}
                      className="rounded-lg border border-zinc-850 bg-zinc-950 p-2.5 text-sm text-white md:col-span-3"
                    >
                      <option value="">Optionally assign to Slot...</option>
                      {slots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.row?.name} / {s.row?.shelf?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowAddBox(false)} className="px-3.5 py-2 rounded-lg text-sm text-zinc-400">Cancel</button>
                    <button
                      onClick={() => createBoxMutation.mutate(newBox)}
                      className="px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500"
                    >
                      Deploy Box
                    </button>
                  </div>
                </div>
              )}

              {/* Move Box Action Overlay */}
              {movingBoxId && (
                <div className="rounded-xl border border-blue-900/30 bg-blue-950/20 p-5 space-y-4">
                  <div className="flex items-center space-x-2 text-blue-300">
                    <Info className="h-4 w-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Move Box: {boxes.find(b => b.id === movingBoxId)?.label}</h3>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={destinationSlotId}
                      onChange={(e) => setDestinationSlotId(e.target.value)}
                      className="flex-1 rounded-lg border border-blue-900/40 bg-zinc-950 p-2.5 text-sm text-white focus:outline-hidden"
                    >
                      <option value="">Select Target Slot...</option>
                      {slots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.row?.shelf?.room?.name} &gt; {s.row?.shelf?.name} &gt; {s.row?.name} &gt; {s.name} ({s.qrCode})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => moveBoxMutation.mutate({ boxId: movingBoxId, slotId: destinationSlotId })}
                      className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white transition-all"
                      disabled={!destinationSlotId}
                    >
                      Execute Move
                    </button>
                    <button
                      onClick={() => {
                        setMovingBoxId(null);
                        setDestinationSlotId('');
                      }}
                      className="px-4 py-2.5 rounded-lg border border-zinc-800 text-sm text-zinc-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Boxes List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {boxes.map((box) => (
                  <div key={box.id} className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-zinc-800 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-bold text-white">{box.label}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            box.status === 'FULL'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {box.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-zinc-500 mt-1">
                          <QrCode className="h-3 w-3" />
                          <span>{box.qrCode}</span>
                        </div>
                      </div>
                      <div className="flex space-x-1.5">
                        <button
                          onClick={() => setMovingBoxId(box.id)}
                          className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-all"
                        >
                          Relocate
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this box?')) {
                              deleteBoxMutation.mutate(box.id);
                            }
                          }}
                          className="p-1 rounded-md text-zinc-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Location Path */}
                    <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-900/60 text-xs">
                      <span className="text-zinc-500 font-semibold block uppercase text-[10px] tracking-wider mb-1">Physical Location</span>
                      {box.slot ? (
                        <span className="text-zinc-300 font-medium">
                          {box.slot.row.shelf.room.name} &gt; {box.slot.row.shelf.name} &gt; {box.slot.row.name} &gt; {box.slot.name}
                        </span>
                      ) : (
                        <span className="text-zinc-600 font-medium italic">Unplaced box</span>
                      )}
                    </div>

                    {/* Occupancy Indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-400">Occupancy</span>
                        <span className="text-zinc-200">{box.occupiedCount} / {box.capacity}</span>
                      </div>
                      <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-linear-to-r from-blue-500 to-violet-500 h-full rounded-full"
                          style={{ width: `${(box.occupiedCount / box.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Passports Feed */}
          {activeTab === 'passports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Registered Passports</h2>
                  <p className="text-sm text-zinc-400">Search and track status of passport documents.</p>
                </div>
                <input
                  placeholder="Search holder name, ID or QR..."
                  value={passportSearch}
                  onChange={(e) => setPassportSearch(e.target.value)}
                  className="rounded-lg border border-zinc-900 bg-zinc-900/30 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-700 w-full sm:w-64"
                />
              </div>

              {/* Passports List */}
              <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10">
                <table className="w-full border-collapse text-left text-sm text-zinc-400">
                  <thead className="bg-zinc-900/50 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">QR / ID Code</th>
                      <th className="px-6 py-4">Holder Name</th>
                      <th className="px-6 py-4">National ID</th>
                      <th className="px-6 py-4">Current Box</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 font-medium">
                    {passports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-zinc-500">
                          No passports match query
                        </td>
                      </tr>
                    ) : (
                      passports.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-900/20">
                          <td className="px-6 py-4 font-bold text-zinc-200">{p.qrCode}</td>
                          <td className="px-6 py-4 text-white">{p.holderName}</td>
                          <td className="px-6 py-4">{p.holderIdNo}</td>
                          <td className="px-6 py-4">
                            {p.box ? (
                              <span className="text-blue-300 font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-sm text-xs">
                                {p.box.label}
                              </span>
                            ) : (
                              <span className="text-zinc-600 font-medium italic">None (Issued)</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.status === 'IN_BOX'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Movement Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Movement Logs</h2>
                <p className="text-sm text-zinc-400">Complete, append-only history of custody logs & system moves.</p>
              </div>

              {/* Logs Activity Feed */}
              <div className="space-y-4">
                {logsData?.data.map((log) => {
                  const date = new Date(log.createdAt).toLocaleString();
                  const isBox = log.action === 'BOX_MOVED';

                  return (
                    <div key={log.id} className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-4 flex items-start space-x-4">
                      <div className="mt-1">
                        {isBox ? (
                          <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-2">
                            <Boxes className="h-4 w-4 text-violet-400" />
                          </div>
                        ) : (
                          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
                            <FileText className="h-4 w-4 text-emerald-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-300 tracking-wide uppercase">
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-semibold">{date}</span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-zinc-300">
                          {isBox ? (
                            <>
                              Box <span className="font-bold text-white">{log.box?.label}</span> moved
                            </>
                          ) : (
                            <>
                              Passport <span className="font-bold text-white">{log.passport?.holderName}</span> (QR: {log.passport?.qrCode})
                            </>
                          )}
                        </p>

                        {/* Location Details */}
                        <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-2 bg-zinc-950 p-2 rounded-lg border border-zinc-900/60 max-w-fit">
                          {log.fromLocation ? (
                            <>
                              <span className="font-medium">{log.fromLocation}</span>
                              <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
                            </>
                          ) : null}
                          <span className="font-semibold text-white">
                            {log.toLocation || 'Issued to Owner'}
                          </span>
                        </div>

                        {/* Actor details */}
                        <div className="flex items-center space-x-1 text-[10px] text-zinc-500 mt-1">
                          <User className="h-3 w-3" />
                          <span>Performed by {log.user.name} ({log.user.email})</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(!logsData || logsData.data.length === 0) && (
                  <div className="text-center py-12 text-zinc-500">
                    <Database className="h-12 w-12 mx-auto mb-2 text-zinc-600" />
                    <p className="font-semibold">No Custody movements registered</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
