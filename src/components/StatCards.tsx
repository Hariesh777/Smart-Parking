import React from 'react';
import { OccupancyStats } from '../types/parking';
import { Car, CheckCircle2, AlertCircle, Percent, AlertTriangle } from 'lucide-react';

interface StatCardsProps {
  stats: OccupancyStats;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const isHighOccupancy = stats.occupancyRate > 90;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* High Occupancy Threshold Alert Banner */}
      {isHighOccupancy && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-rose-950/90 border-2 border-rose-500 rounded-lg p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/60 animate-pulse transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-sm sm:text-base font-bold tracking-wide text-rose-100 uppercase">
                High Occupancy Alert
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/30 text-rose-200 border border-rose-400/60 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                {stats.occupancyRate.toFixed(1)}% Capacity ({stats.occupied}/{stats.total} occupied)
              </span>
            </div>
          </div>
          <div className="text-xs text-rose-200/90 font-medium">
            Occupancy threshold exceeded (&gt;90%). Divert incoming vehicles to overflow decks.
          </div>
        </div>
      )}

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Total Slots */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Capacity</span>
            <Car className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
              {stats.total}
            </span>
            <span className="text-xs text-slate-500 font-mono">slots</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>Zones A, B, C, D</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>4 zones</span>
          </div>
        </div>

        {/* Available Slots */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Available Slots</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400 font-mono tabular-nums">
              {stats.available}
            </span>
            <span className="text-xs text-emerald-500/80 font-mono">vacant</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>Ready to park</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span className="text-emerald-400/90 font-mono tabular-nums">
              {stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0}% free
            </span>
          </div>
        </div>

        {/* Occupied Slots */}
        <div
          className={`bg-slate-900/90 border rounded-lg p-4 transition-all ${
            isHighOccupancy ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-400">Occupied Slots</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-400 font-mono tabular-nums">
              {stats.occupied}
            </span>
            <span className="text-xs text-rose-400/80 font-mono">vehicles</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>Active sessions</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>EV: {stats.evOccupied}/{stats.evTotal}</span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div
          className={`bg-slate-900/90 border rounded-lg p-4 transition-all ${
            isHighOccupancy
              ? 'border-rose-500 bg-rose-950/30 ring-2 ring-rose-500/30'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Occupancy Rate</span>
            {isHighOccupancy ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-rose-500/30 text-rose-300 border border-rose-500/60 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                High Occupancy
              </span>
            ) : (
              <Percent className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums ${
                  isHighOccupancy
                    ? 'text-rose-400 animate-pulse'
                    : stats.occupancyRate >= 80
                    ? 'text-amber-400'
                    : 'text-white'
                }`}
              >
                {stats.occupancyRate.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-mono">filled</span>
            </div>
          </div>
          {/* Visual progress track */}
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isHighOccupancy
                  ? 'bg-rose-500 animate-pulse'
                  : stats.occupancyRate >= 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, stats.occupancyRate))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
