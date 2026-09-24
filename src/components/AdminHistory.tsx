import React, { useState } from 'react';
import { ParkingSession, ParkingSlot } from '../types/parking';
import { Search, Download, Clock, Wrench, CheckCircle, ShieldAlert } from 'lucide-react';

interface AdminHistoryProps {
  sessions: ParkingSession[];
  slots: ParkingSlot[];
  onForceVacate: (slotId: string) => void;
  onToggleMaintenance: (slotId: string) => void;
}

export const AdminHistory: React.FC<AdminHistoryProps> = ({
  sessions,
  slots,
  onForceVacate,
  onToggleMaintenance,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlotForAction, setSelectedSlotForAction] = useState<string>('A1');

  const filteredSessions = sessions.filter((s) => {
    if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPlate = s.plate.toLowerCase().includes(q);
      const matchSlot = s.slotId.toLowerCase().includes(q);
      const matchModel = s.vehicleModel.toLowerCase().includes(q);
      return matchPlate || matchSlot || matchModel;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = 'ID,SlotID,Zone,Plate,Model,EntryTime,ExitTime,DurationMins,Fee,Status\n';
    const rows = filteredSessions
      .map(
        (s) =>
          `"${s.id}","${s.slotId}","${s.zone}","${s.plate}","${s.vehicleModel}","${s.entryTime}","${
            s.exitTime || ''
          }",${s.durationMinutes || ''},${s.fee || ''},"${s.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `parking_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Admin Management & Parking History
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Stage 6: SQLite Database History Log</span>
            <span aria-hidden="true">·</span>
            <span>Auditing vehicle entry, exit, and duration tracking</span>
          </div>
        </div>

        {/* Quick Admin Actions & Export */}
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-700 rounded hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Admin Slot Override Bar */}
      <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Slot Operator Override</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Select any of the 20 slots to manually force vacancy or toggle maintenance mode.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSlotForAction}
            onChange={(e) => setSelectedSlotForAction(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
          >
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                Slot {s.id} ({s.isOccupied ? 'Occupied' : 'Vacant'}{s.isMaintenance ? ' - Maint' : ''})
              </option>
            ))}
          </select>

          <button
            onClick={() => onForceVacate(selectedSlotForAction)}
            className="px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded hover:bg-rose-900/50 transition-colors"
          >
            Force Vacate
          </button>

          <button
            onClick={() => onToggleMaintenance(selectedSlotForAction)}
            className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded hover:bg-amber-900/50 transition-colors"
          >
            Toggle Maintenance
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter buttons */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1 rounded transition-colors ${
              filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1 rounded transition-colors ${
              filterStatus === 'ACTIVE' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Currently Parked ({sessions.filter((s) => s.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-3 py-1 rounded transition-colors ${
              filterStatus === 'COMPLETED' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed ({sessions.filter((s) => s.status === 'COMPLETED').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search plate, slot, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Sessions Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-medium">
            <tr>
              <th className="py-2.5 px-3">Session ID</th>
              <th className="py-2.5 px-3">Slot</th>
              <th className="py-2.5 px-3">Plate / Model</th>
              <th className="py-2.5 px-3">Entry Time</th>
              <th className="py-2.5 px-3">Exit Time</th>
              <th className="py-2.5 px-3 text-right">Duration</th>
              <th className="py-2.5 px-3 text-right">Fee ($)</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                  No parking sessions match your search criteria.
                </td>
              </tr>
            ) : (
              filteredSessions.map((session) => {
                const entryDate = new Date(session.entryTime);
                const exitDate = session.exitTime ? new Date(session.exitTime) : null;

                return (
                  <tr key={session.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-400">{session.id}</td>
                    <td className="py-2 px-3 font-mono font-bold text-white">
                      Slot {session.slotId}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-mono text-slate-200 font-medium">{session.plate}</div>
                      <div className="text-[11px] text-slate-500">{session.vehicleModel}</div>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400 tabular-nums">
                      {entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="text-[10px] text-slate-600 ml-1">
                        ({entryDate.toLocaleDateString([], { month: 'short', day: 'numeric' })})
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400 tabular-nums">
                      {exitDate ? (
                        <>
                          {exitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-[10px] text-slate-600 ml-1">
                            ({exitDate.toLocaleDateString([], { month: 'short', day: 'numeric' })})
                          </span>
                        </>
                      ) : (
                        <span className="text-emerald-400/80 italic">In progress...</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {session.durationMinutes ? (
                        <span className="text-slate-200">{session.durationMinutes} min</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-400">
                      {session.fee ? `$${session.fee.toFixed(2)}` : '$2.00/hr'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          session.status === 'ACTIVE'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                            : 'bg-slate-900 text-slate-400 border border-slate-700/60'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
