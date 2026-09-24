import React, { useState } from 'react';
import { ParkingSlot, ZoneId } from '../types/parking';
import { Zap, Shield, Search, ArrowRight, ArrowDown, RefreshCw } from 'lucide-react';

interface ParkingLotVisualizerProps {
  slots: ParkingSlot[];
  onToggleSlot: (slotId: string) => void;
  onRefreshFromCv: () => void;
}

export const ParkingLotVisualizer: React.FC<ParkingLotVisualizerProps> = ({
  slots,
  onToggleSlot,
  onRefreshFromCv,
}) => {
  const [selectedZone, setSelectedZone] = useState<'ALL' | ZoneId>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlotModal, setActiveSlotModal] = useState<ParkingSlot | null>(null);

  const filteredSlots = slots.filter((slot) => {
    if (selectedZone !== 'ALL' && slot.zone !== selectedZone) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = slot.id.toLowerCase().includes(q);
      const matchPlate = slot.plate?.toLowerCase().includes(q);
      const matchZone = slot.zoneName.toLowerCase().includes(q);
      return matchId || matchPlate || matchZone;
    }
    return true;
  });

  const getZoneSummary = (zone: ZoneId) => {
    const zoneSlots = slots.filter((s) => s.zone === zone);
    const occupied = zoneSlots.filter((s) => s.isOccupied).length;
    return { occupied, total: zoneSlots.length };
  };

  const zones: { id: ZoneId; name: string; tag: string }[] = [
    { id: 'A', name: 'Zone A', tag: 'Faculty & Mall North' },
    { id: 'B', name: 'Zone B', tag: 'Student & Visitors' },
    { id: 'C', name: 'Zone C', tag: 'EV Fast Charging' },
    { id: 'D', name: 'Zone D', tag: 'General Parking Deck' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 sm:p-6 space-y-6">
      {/* Header with Zone Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Parking Area Real-Time Map
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>20 Predefined Slots</span>
            <span aria-hidden="true">·</span>
            <span>Click any slot to inspect or simulate vehicle entry/exit</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Zone filter segmented buttons */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setSelectedZone('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                selectedZone === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Zones
            </button>
            {zones.map((z) => (
              <button
                key={z.id}
                onClick={() => setSelectedZone(z.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  selectedZone === z.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {z.id}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search slot or plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 w-44"
            />
          </div>

          <button
            onClick={onRefreshFromCv}
            title="Refresh slot states"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-md border border-slate-800/80">
        <span className="text-slate-300 font-medium">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-500/20 border border-emerald-500 inline-block" />
          <span className="text-emerald-400 font-medium">Available (Vacant)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-rose-500/20 border border-rose-500 inline-block" />
          <span className="text-rose-400 font-medium">Occupied (Vehicle Detected)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>EV Charging Slot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Faculty / Reserved</span>
        </div>
      </div>

      {/* Bird's-Eye Visual Parking Layout */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto">
        {/* Entrance / Exit markings */}
        <div className="flex justify-between items-center text-xs font-mono text-slate-500 border-b border-dashed border-slate-800 pb-2 mb-4">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="tracking-wider">CAMPUS / MALL ENTRANCE GATE 1</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="tracking-wider">SPEED LIMIT 10 KM/H</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="tracking-wider">EXIT BOOTH & TICKET GATE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 4 Quadrants / Zones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-[620px]">
          {zones.map((zone) => {
            const summary = getZoneSummary(zone.id);
            const zoneSlots = filteredSlots.filter((s) => s.zone === zone.id);

            return (
              <div
                key={zone.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-md p-3.5 space-y-3"
              >
                {/* Zone Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white font-mono">
                      {zone.name}
                    </span>
                    <span className="text-xs text-slate-400">({zone.tag})</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-slate-400">
                    <span className="text-rose-400 font-semibold">{summary.occupied}</span>
                    <span className="text-slate-600"> / </span>
                    <span className="text-emerald-400">{summary.total - summary.occupied} free</span>
                  </div>
                </div>

                {/* Driving Lane simulation strip */}
                <div className="relative bg-slate-950/80 border border-slate-800 rounded p-2">
                  <div className="grid grid-cols-5 gap-2.5">
                    {zoneSlots.map((slot) => {
                      const isOccupied = slot.isOccupied;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => {
                            setActiveSlotModal(slot);
                          }}
                          className={`group relative flex flex-col justify-between p-2 rounded border cursor-pointer transition-all duration-200 select-none ${
                            isOccupied
                              ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400 hover:bg-rose-950/50'
                              : 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/40'
                          }`}
                          style={{ minHeight: '115px' }}
                        >
                          {/* Slot ID and icons */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold font-mono ${
                                isOccupied ? 'text-rose-300' : 'text-emerald-300'
                              }`}
                            >
                              {slot.id}
                            </span>
                            {slot.type === 'ev' && (
                              <Zap className="w-3 h-3 text-cyan-400" />
                            )}
                            {slot.type === 'faculty' && (
                              <Shield className="w-3 h-3 text-amber-400" />
                            )}
                          </div>

                          {/* Visual Car Graphic or Empty Stencil */}
                          <div className="my-1.5 flex flex-col items-center justify-center">
                            {isOccupied ? (
                              <div
                                className="w-10 h-14 rounded-md shadow-sm border border-slate-700/60 relative flex flex-col justify-between p-1 overflow-hidden"
                                style={{ backgroundColor: slot.vehicleColor || '#3b82f6' }}
                              >
                                {/* Windshield reflection */}
                                <div className="w-full h-2.5 bg-slate-900/60 rounded-xs" />
                                <div className="text-[8px] font-mono text-white text-center font-bold truncate leading-none">
                                  {slot.plate ? slot.plate.split('-')[1] : 'AUTO'}
                                </div>
                                <div className="w-full h-2 bg-slate-900/60 rounded-xs" />
                              </div>
                            ) : (
                              <div className="w-10 h-14 border border-dashed border-emerald-500/30 rounded-md flex items-center justify-center">
                                <span className="text-[10px] font-mono text-emerald-400/60">
                                  OPEN
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Status and Pixel count metadata */}
                          <div className="space-y-0.5 text-center">
                            <div
                              className={`text-[10px] font-semibold tracking-wider font-mono ${
                                isOccupied ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono tabular-nums">
                              {slot.pixelCount} px
                            </div>
                          </div>

                          {/* Interactive Hover prompt */}
                          <div className="absolute inset-0 bg-slate-900/90 rounded opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-1 transition-opacity text-center">
                            <span className="text-[10px] font-medium text-slate-200">
                              {isOccupied ? 'Vacate Slot' : 'Park Car'}
                            </span>
                            <span className="text-[9px] text-emerald-400 mt-0.5">Click to toggle</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Drive lane directional arrows */}
                  <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-slate-600 font-mono">
                    <span>DRIVE AISLE</span>
                    <ArrowDown className="w-3 h-3 text-slate-600" />
                    <span>ONE WAY</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Slot Detail Inspection and Manual Action */}
      {activeSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <span>Slot {activeSlotModal.id}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono ${
                      activeSlotModal.isOccupied
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {activeSlotModal.isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeSlotModal.zoneName} (Zone {activeSlotModal.zone})
                </p>
              </div>
              <button
                onClick={() => setActiveSlotModal(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Information Grid */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Slot Type:</span>
                <span className="text-slate-200 capitalize font-medium">{activeSlotModal.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Computer Vision Pixel Count:</span>
                <span className="text-slate-200 font-mono tabular-nums">
                  {activeSlotModal.pixelCount} px (Threshold: {activeSlotModal.threshold} px)
                </span>
              </div>

              {activeSlotModal.isOccupied ? (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">License Plate:</span>
                    <span className="text-white font-mono font-semibold">
                      {activeSlotModal.plate || 'KA-05-MC-8821'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Vehicle Model:</span>
                    <span className="text-slate-200">{activeSlotModal.vehicleModel || 'Standard Vehicle'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Parked Duration:</span>
                    <span className="text-emerald-400 font-mono tabular-nums">
                      {activeSlotModal.durationMinutes || 35} minutes
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-2 text-slate-500 italic">
                  Slot is currently clear. No vehicle presence detected by the computer vision camera feed.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveSlotModal(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded border border-slate-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onToggleSlot(activeSlotModal.id);
                  setActiveSlotModal((prev) =>
                    prev
                      ? {
                          ...prev,
                          isOccupied: !prev.isOccupied,
                          pixelCount: prev.isOccupied ? 190 : 1420,
                        }
                      : null
                  );
                }}
                className={`px-4 py-1.5 text-xs font-semibold rounded text-white transition-colors ${
                  activeSlotModal.isOccupied
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {activeSlotModal.isOccupied ? 'Simulate Vehicle Exit' : 'Simulate Vehicle Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
