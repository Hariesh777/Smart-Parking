import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StatCards } from './components/StatCards';
import { ParkingLotVisualizer } from './components/ParkingLotVisualizer';
import { LiveCVFeed } from './components/LiveCVFeed';
import { AdminHistory } from './components/AdminHistory';
import { AnalyticsView } from './components/AnalyticsView';
import { StagesWalkthrough } from './components/StagesWalkthrough';
import { PythonCodeModal } from './components/PythonCodeModal';
import { INITIAL_SLOTS, INITIAL_SESSIONS, SAMPLE_VEHICLES } from './data/initialSlots';
import { ParkingSlot, ParkingSession, OccupancyStats, ViewTab } from './types/parking';

export default function App() {
  const [slots, setSlots] = useState<ParkingSlot[]>(INITIAL_SLOTS);
  const [sessions, setSessions] = useState<ParkingSession[]>(INITIAL_SESSIONS);
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [autoSimulate, setAutoSimulate] = useState<boolean>(true);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Compute summary stats with tabular figures
  const stats: OccupancyStats = useMemo(() => {
    const total = slots.length;
    const occupied = slots.filter((s) => s.isOccupied).length;
    const available = total - occupied;
    const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;
    const evSlots = slots.filter((s) => s.type === 'ev');
    const evOccupied = evSlots.filter((s) => s.isOccupied).length;

    const completed = sessions.filter((s) => s.status === 'COMPLETED' && s.durationMinutes);
    const avgDwell =
      completed.length > 0
        ? Math.round(completed.reduce((acc, c) => acc + (c.durationMinutes || 0), 0) / completed.length)
        : 45;

    return {
      total,
      occupied,
      available,
      occupancyRate,
      evOccupied,
      evTotal: evSlots.length,
      averageDwellMinutes: avgDwell,
    };
  }, [slots, sessions]);

  // Show temporary toast notification
  const showToast = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Handle Slot State Toggle (Simulating Vehicle Entry or Exit)
  const handleToggleSlot = useCallback(
    (slotId: string, customPlate?: string) => {
      setSlots((prevSlots) => {
        const target = prevSlots.find((s) => s.id === slotId);
        if (!target) return prevSlots;

        const willBeOccupied = !target.isOccupied;
        const now = new Date();
        const nowIso = now.toISOString();

        if (willBeOccupied) {
          // New vehicle arriving
          const randomVehicle =
            SAMPLE_VEHICLES[Math.floor(Math.random() * SAMPLE_VEHICLES.length)];
          const plate =
            customPlate || `${randomVehicle.prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

          // Create new active parking session in history
          const newSession: ParkingSession = {
            id: `SES-${Math.floor(1100 + Math.random() * 9000)}`,
            slotId: target.id,
            zone: target.zone,
            plate,
            vehicleColor: randomVehicle.color,
            vehicleModel: randomVehicle.model,
            entryTime: nowIso,
            status: 'ACTIVE',
          };
          setSessions((prev) => [newSession, ...prev]);
          showToast(`Vehicle ${plate} parked at Slot ${slotId}`);

          return prevSlots.map((s) =>
            s.id === slotId
              ? {
                  ...s,
                  isOccupied: true,
                  plate,
                  vehicleColor: randomVehicle.color,
                  vehicleModel: randomVehicle.model,
                  entryTime: nowIso,
                  durationMinutes: 1,
                  pixelCount: 1400 + Math.floor(Math.random() * 200),
                }
              : s
          );
        } else {
          // Vehicle departing
          setSessions((prev) =>
            prev.map((sess) => {
              if (sess.slotId === slotId && sess.status === 'ACTIVE') {
                const entry = new Date(sess.entryTime);
                const duration = Math.max(
                  1,
                  Math.round((now.getTime() - entry.getTime()) / 60000) ||
                    (target.durationMinutes || 25)
                );
                const fee = Number((Math.max(2.0, (duration / 60) * 2.5)).toFixed(2));
                return {
                  ...sess,
                  exitTime: nowIso,
                  durationMinutes: duration,
                  fee,
                  status: 'COMPLETED',
                };
              }
              return sess;
            })
          );
          showToast(`Vehicle ${target.plate || 'Auto'} vacated Slot ${slotId}`);

          return prevSlots.map((s) =>
            s.id === slotId
              ? {
                  ...s,
                  isOccupied: false,
                  plate: undefined,
                  vehicleColor: undefined,
                  vehicleModel: undefined,
                  entryTime: undefined,
                  durationMinutes: undefined,
                  pixelCount: 180 + Math.floor(Math.random() * 60),
                }
              : s
          );
        }
      });
    },
    [showToast]
  );

  // CV Batch updates from Video / Canvas detector
  const handleBatchUpdateSlots = useCallback(
    (updates: { slot_id: string; is_occupied: boolean; pixel_count: number }[]) => {
      setSlots((prevSlots) => {
        const updateMap = new Map(updates.map((u) => [u.slot_id, u]));
        return prevSlots.map((slot) => {
          const update = updateMap.get(slot.id);
          if (!update) return slot;
          return {
            ...slot,
            pixelCount: update.pixel_count,
          };
        });
      });
    },
    []
  );

  // Single slot pixel count updater
  const handleUpdateSlotPixel = useCallback(
    (slotId: string, count: number, isOccupied: boolean) => {
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, pixelCount: count, isOccupied } : s))
      );
    },
    []
  );

  // Force Vacate from Admin
  const handleForceVacate = useCallback(
    (slotId: string) => {
      const slot = slots.find((s) => s.id === slotId);
      if (slot && slot.isOccupied) {
        handleToggleSlot(slotId);
      } else {
        showToast(`Slot ${slotId} is already vacant.`);
      }
    },
    [slots, handleToggleSlot, showToast]
  );

  // Toggle Maintenance Mode
  const handleToggleMaintenance = useCallback(
    (slotId: string) => {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId ? { ...s, isMaintenance: !s.isMaintenance } : s
        )
      );
      showToast(`Slot ${slotId} maintenance state updated.`);
    },
    [showToast]
  );

  // Automated Traffic Simulation Loop (demonstrating dynamic arrivals & departures)
  useEffect(() => {
    if (!autoSimulate) return;

    const interval = setInterval(() => {
      // Pick random slot
      const randomIndex = Math.floor(Math.random() * slots.length);
      const chosenSlot = slots[randomIndex];
      // Toggle state with a 40% probability per tick to simulate natural turnover
      if (Math.random() > 0.45) {
        handleToggleSlot(chosenSlot.id);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [autoSimulate, slots, handleToggleSlot]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        autoSimulate={autoSimulate}
        onToggleAutoSimulate={() => setAutoSimulate(!autoSimulate)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Floating Notification Banner */}
        {notification && (
          <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-emerald-500/60 text-slate-200 px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{notification}</span>
          </div>
        )}

        {/* Global Metric Cards (Always visible across dashboard) */}
        <StatCards stats={stats} />

        {/* Dynamic Tab Views */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <ParkingLotVisualizer
              slots={slots}
              onToggleSlot={handleToggleSlot}
              onRefreshFromCv={() => showToast('Refreshed slot data from OpenCV stream.')}
            />

            {/* Quick Teaser for CV Pipeline */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-white">
                  Computer Vision & Video Feed Ready
                </h4>
                <p className="text-xs text-slate-400">
                  Switch to the Live Camera CV tab to inspect real-time Gaussian blur, adaptive thresholding, and contour pixel counting.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('cv-feed')}
                className="px-3.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded hover:bg-emerald-900/60 transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                View Live CV Feed →
              </button>
            </div>
          </div>
        )}

        {currentTab === 'cv-feed' && (
          <LiveCVFeed
            slots={slots}
            onUpdateSlotPixelCount={handleUpdateSlotPixel}
            onBatchUpdateSlots={handleBatchUpdateSlots}
          />
        )}

        {currentTab === 'admin' && (
          <AdminHistory
            sessions={sessions}
            slots={slots}
            onForceVacate={handleForceVacate}
            onToggleMaintenance={handleToggleMaintenance}
          />
        )}

        {currentTab === 'analytics' && <AnalyticsView slots={slots} />}

        {currentTab === 'stages' && (
          <StagesWalkthrough slots={slots} onToggleSlot={handleToggleSlot} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>ParkVision Smart Parking Detection System</span>
          <div className="flex items-center gap-3 text-slate-500">
            <span>Stages 1–7</span>
            <span aria-hidden="true">·</span>
            <span>Python & OpenCV</span>
            <span aria-hidden="true">·</span>
            <span>FastAPI & SQLite</span>
          </div>
        </div>
      </footer>

      {/* Python Code Viewer & Downloader Modal */}
      <PythonCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </div>
  );
}
