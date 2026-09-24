import React from 'react';
import { HOURLY_PEAK_DATA } from '../data/initialSlots';
import { ParkingSlot, ZoneId } from '../types/parking';
import { BarChart3, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface AnalyticsViewProps {
  slots: ParkingSlot[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ slots }) => {
  // Compute zone statistics
  const zones: { id: ZoneId; name: string; type: string }[] = [
    { id: 'A', name: 'Zone A', type: 'Faculty / Mall North' },
    { id: 'B', name: 'Zone B', type: 'Student / Visitor' },
    { id: 'C', name: 'Zone C', type: 'EV Fast Charging' },
    { id: 'D', name: 'Zone D', type: 'General Deck' },
  ];

  const zoneBreakdown = zones.map((z) => {
    const zoneSlots = slots.filter((s) => s.zone === z.id);
    const occupied = zoneSlots.filter((s) => s.isOccupied).length;
    const rate = Math.round((occupied / zoneSlots.length) * 100);
    return {
      ...z,
      occupied,
      total: zoneSlots.length,
      rate,
    };
  });

  const totalOccupied = slots.filter((s) => s.isOccupied).length;
  const overallRate = Math.round((totalOccupied / slots.length) * 100);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Parking Analytics & Peak Hours Profile
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>Stage 7: Occupancy Trends & Congestion Intelligence</span>
          <span aria-hidden="true">·</span>
          <span>Hourly distribution based on college lectures and mall peak rush</span>
        </div>
      </div>

      {/* Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Primary Peak Window</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono">11:00 — 13:30</div>
          <p className="mt-1 text-xs text-slate-500">Lunch rush & mid-day college lecture shift</p>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Dwell Time</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono tabular-nums">48 minutes</div>
          <p className="mt-1 text-xs text-slate-500">Based on recent completed parking sessions</p>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current Congestion State</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono">
            <span className={overallRate > 80 ? 'text-rose-400' : 'text-emerald-400'}>
              {overallRate}% Capacity
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {overallRate > 80 ? 'High demand: route drivers to Zone D' : 'Optimal capacity available'}
          </p>
        </div>
      </div>

      {/* Hourly Occupancy Bar Chart (08:00 to 22:00) */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Hourly Occupancy Profile (08:00 — 22:00)
            </h3>
            <p className="text-xs text-slate-500">
              Visualizes occupancy percentage across operating hours. 12:00 represents max capacity.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span>Normal (&lt;70%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500" />
              <span>Heavy (70-85%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500" />
              <span>Peak (&gt;85%)</span>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="pt-6 pb-2">
          <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-48 px-1">
            {HOURLY_PEAK_DATA.map((item) => {
              const isPeak = item.occupancyPercent >= 85;
              const isMedium = item.occupancyPercent >= 70 && item.occupancyPercent < 85;

              return (
                <div key={item.hour} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono bg-slate-800 text-white px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap -mb-1">
                    {item.occupancyPercent}% ({item.vehicles}/20)
                  </div>

                  {/* Vertical bar */}
                  <div className="w-full max-w-[28px] bg-slate-900 rounded-t overflow-hidden flex flex-col justify-end h-full">
                    <div
                      className={`w-full transition-all duration-500 rounded-t ${
                        isPeak ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ height: `${item.occupancyPercent}%` }}
                    />
                  </div>

                  {/* Hour label */}
                  <span className="text-[10px] font-mono text-slate-500 tracking-tighter truncate">
                    {item.hour.split(':')[0]}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Zone Utilization Comparison */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-lg space-y-4">
        <h3 className="text-sm font-semibold text-white">Zone Utilization Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {zoneBreakdown.map((z) => (
            <div key={z.id} className="p-3 bg-slate-900/60 rounded border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white font-mono">{z.name}</span>
                  <span className="text-[11px] text-slate-400 ml-1.5">({z.type})</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                  {z.rate}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    z.rate >= 80 ? 'bg-rose-500' : z.rate >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${z.rate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>{z.occupied} occupied</span>
                <span>{z.total - z.occupied} available</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
