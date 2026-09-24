import React, { useState } from 'react';
import { CheckCircle2, Play, ArrowRight, Code, Database, Eye, Server, Layers, Terminal } from 'lucide-react';
import { ParkingSlot } from '../types/parking';

interface StagesWalkthroughProps {
  slots: ParkingSlot[];
  onToggleSlot: (slotId: string) => void;
}

export const StagesWalkthrough: React.FC<StagesWalkthroughProps> = ({ slots, onToggleSlot }) => {
  const [activeStage, setActiveStage] = useState<number>(1);
  const [apiTestEndpoint, setApiTestEndpoint] = useState<string>('/api/occupancy');
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);

  const stages = [
    {
      num: 1,
      title: 'Stage 1: Static 20-Slot Layout & Coordinate Mapping',
      icon: Layers,
      summary: 'Define 20 fixed parking spaces with unique IDs (A1-D5) and coordinate bounding boxes.',
      codeFile: 'python_backend/parking_picker.py',
      description: `In this initial stage, we establish a clean physical grid of 20 slots grouped into 4 functional zones (A: Faculty/Mall North, B: Student/Visitor, C: EV Charging, D: General Deck). Each parking space is defined by an (x, y, width, height) rectangle on the camera sensor coordinates.`,
      keyPoints: [
        'Each slot receives an immutable alphanumeric ID (e.g., A1, A2... D5).',
        'Coordinates can be selected interactively using OpenCV mouse callbacks (cv2.setMouseCallback).',
        'Coordinates are saved into slots.json for deterministic detection.',
      ],
      codeSnippet: `# Stage 1: slots.json schema
[
  ["A1", 50, 80, 100, 60],
  ["A2", 170, 80, 100, 60],
  ["A3", 290, 80, 100, 60],
  ...
  ["D5", 530, 400, 100, 60]
]`,
    },
    {
      num: 2,
      title: 'Stage 2: Python / OpenCV Computer Vision Detector',
      icon: Eye,
      summary: 'Process camera video frames, isolate contours, and count white pixels in each slot.',
      codeFile: 'python_backend/detector.py',
      description: `Stage 2 takes incoming video frames from a camera or sample video file. We apply a classic, high-performance OpenCV pipeline: grayscale conversion, Gaussian blur (removes noise), adaptive thresholding (turns edges & cars into white pixels on black pavement), and countNonZero().`,
      keyPoints: [
        'cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY): Simplifies 3 color channels to 1 intensity channel.',
        'cv2.GaussianBlur(gray, (3,3), 1): Removes camera grain and light flicker.',
        'cv2.adaptiveThreshold(): Turns car body edges and high contrast areas into bright white pixels.',
        'cv2.countNonZero(crop): Counts white pixels inside the bounding box. If count > 850, a vehicle is present!',
      ],
      codeSnippet: `# Stage 2: OpenCV Detection Core
gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
blur = cv2.GaussianBlur(gray, (3, 3), 1)
thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16)
dilated = cv2.dilate(cv2.medianBlur(thresh, 5), kernel, iterations=1)

for slot_id, x, y, w, h in slots:
    crop = dilated[y:y+h, x:x+w]
    count = cv2.countNonZero(crop)
    is_occupied = count > 850
    color = (0, 0, 255) if is_occupied else (0, 255, 0)`,
    },
    {
      num: 3,
      title: 'Stage 3: Connect Computer Vision to FastAPI',
      icon: ArrowRight,
      summary: 'Send detected slot status arrays from detector.py to the FastAPI backend over HTTP.',
      codeFile: 'python_backend/detector.py',
      description: `Once the OpenCV module finishes evaluating all 20 slots for a video frame, it packages the results into a compact JSON payload and sends an HTTP POST request to the backend.`,
      keyPoints: [
        'Throttled sync: Sends updates every 2 seconds to conserve network and database I/O.',
        'Bulk payload includes slot IDs, occupancy boolean, and exact pixel counts for auditing.',
        'Uses standard Python requests library for reliable delivery.',
      ],
      codeSnippet: `# Stage 3: Python HTTP POST
import requests

payload = {
    "timestamp": "2026-09-24T06:30:00",
    "updates": [
        {"slot_id": "A1", "is_occupied": True, "pixel_count": 1420},
        {"slot_id": "A2", "is_occupied": False, "pixel_count": 210},
        ...
    ]
}
res = requests.post("http://localhost:8000/api/slots/update", json=payload)`,
    },
    {
      num: 4,
      title: 'Stage 4: FastAPI REST Endpoints',
      icon: Server,
      summary: 'Build REST endpoints for slot availability, summary metrics, and manual overrides.',
      codeFile: 'python_backend/main.py',
      description: `Stage 4 sets up a lightweight, high-speed Python FastAPI server. It provides standard REST endpoints consumed by web dashboards, campus signage displays, and mobile parking apps.`,
      keyPoints: [
        'GET /api/slots: Returns real-time list of all 20 slots with occupied booleans.',
        'GET /api/occupancy: Returns total, available, occupied counts and occupancy percentage.',
        'POST /api/slots/update: Receives OpenCV bulk status updates.',
        'POST /api/slots/{id}/toggle: Allows parking lot operators to manually override a slot.',
      ],
      codeSnippet: `# Stage 4: FastAPI Router
@app.get("/api/slots")
def get_slots():
    return db.get_all_slots()

@app.get("/api/occupancy")
def get_occupancy():
    return db.get_analytics_summary()

@app.post("/api/slots/update")
def update_from_cv(payload: BulkUpdatePayload):
    for item in payload.updates:
        db.update_slot_status(item.slot_id, item.is_occupied)
    return {"status": "success", "processed": len(payload.updates)}`,
    },
    {
      num: 5,
      title: 'Stage 5: Connect Frontend to API & Real-Time Dashboard',
      icon: Code,
      summary: 'Build responsive web interface polling availability and displaying bird\'s-eye view.',
      codeFile: 'src/components/ParkingLotVisualizer.tsx',
      description: `Stage 5 creates the user-facing web dashboard. Drivers see immediately which slots are open (emerald green) and which are taken (crimson red). The frontend automatically refreshes when parking status transitions occur.`,
      keyPoints: [
        'Distinguishable color coding: Green = Vacant, Red = Occupied, Blue = EV Charging.',
        'Auto-refresh polling synchronizes UI state with the backend.',
        'Responsive layout functions cleanly on desktop monitors, tablets, and phones.',
      ],
      codeSnippet: `// Stage 5: React auto-polling hook
useEffect(() => {
  const fetchParkingState = async () => {
    const res = await fetch('/api/slots');
    const data = await res.json();
    setSlots(data);
  };
  const timer = setInterval(fetchParkingState, 2000);
  return () => clearInterval(timer);
}, []);`,
    },
    {
      num: 6,
      title: 'Stage 6: SQLite Database & Parking History',
      icon: Database,
      summary: 'Log entry timestamps, exit timestamps, license plates, and duration calculations.',
      codeFile: 'python_backend/database.py',
      description: `Stage 6 implements data persistence with SQLite. Whenever a slot flips from Available to Occupied, a new parking session record is created with entry_time. When the car departs, exit_time is recorded, duration in minutes is computed, and parking fee is calculated.`,
      keyPoints: [
        'Table 1 (parking_slots): Keeps current occupancy state of the 20 slots.',
        'Table 2 (parking_history): Audit log with entry_time, exit_time, duration_minutes, and fee.',
        'Duration formula: (exit_time - entry_time) / 60 seconds.',
      ],
      codeSnippet: `# Stage 6: SQLite Schema & Transition Handler
cursor.execute("""
CREATE TABLE parking_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id TEXT NOT NULL,
    plate TEXT NOT NULL,
    entry_time TEXT NOT NULL,
    exit_time TEXT,
    duration_minutes INTEGER,
    fee REAL,
    status TEXT NOT NULL DEFAULT 'ACTIVE'
)""")`,
    },
    {
      num: 7,
      title: 'Stage 7: Parking Analytics & Peak Hours Intelligence',
      icon: Play,
      summary: 'Aggregate hourly demand (08:00 - 22:00), identify peak congestion, and track turnover.',
      codeFile: 'python_backend/main.py',
      description: `The final stage provides actionable intelligence for college administrators and mall managers. It correlates hourly parking trends to predict lunch rushes, evening events, and zone turnover.`,
      keyPoints: [
        'Hourly distribution profile identifying peak congestion hours (e.g. 11:00-13:30).',
        'Zone utilization rates comparing Faculty/Mall North vs. Student and EV hubs.',
        'Helps optimize dynamic parking rates and campus shuttle routing.',
      ],
      codeSnippet: `# Stage 7: Analytics aggregation
total = 20
occupied = sum(1 for s in slots if s["is_occupied"])
occupancy_rate = (occupied / total) * 100

peak_hours = [
    {"hour": "12:00", "occupancy_percent": 95, "vehicles": 19},
    {"hour": "17:00", "occupancy_percent": 85, "vehicles": 17}
]`,
    },
  ];

  const handleRunMockApiTest = () => {
    const total = slots.length;
    const occupied = slots.filter((s) => s.isOccupied).length;
    const available = total - occupied;

    if (apiTestEndpoint === '/api/occupancy') {
      setApiTestResult(
        JSON.stringify(
          {
            total_slots: total,
            occupied_slots: occupied,
            available_slots: available,
            occupancy_rate: Number(((occupied / total) * 100).toFixed(1)),
            average_duration_minutes: 48,
          },
          null,
          2
        )
      );
    } else if (apiTestEndpoint === '/api/slots') {
      setApiTestResult(
        JSON.stringify(
          slots.slice(0, 4).map((s) => ({
            slot_id: s.id,
            zone: s.zone,
            is_occupied: s.isOccupied,
            plate: s.plate || null,
            pixel_count: s.pixelCount,
          })),
          null,
          2
        ) + '\n// ... 16 more slots omitted for brevity'
      );
    } else if (apiTestEndpoint.includes('/toggle')) {
      onToggleSlot('A1');
      setApiTestResult(
        JSON.stringify(
          {
            slot_id: 'A1',
            is_occupied: !slots[0].isOccupied,
            message: 'Slot state toggled successfully in database',
            updated_at: new Date().toISOString(),
          },
          null,
          2
        )
      );
    }
  };

  const cur = stages[activeStage - 1];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-semibold text-white tracking-tight">
          System Development Stages & Architecture Explorer
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>Stages 1 through 7 Walkthrough</span>
          <span aria-hidden="true">·</span>
          <span>Beginner-friendly Computer Vision and FastAPI design patterns</span>
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
        {stages.map((stage) => {
          const isCurrent = activeStage === stage.num;
          return (
            <button
              key={stage.num}
              onClick={() => {
                setActiveStage(stage.num);
                setApiTestResult(null);
              }}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded border whitespace-nowrap transition-all ${
                isCurrent
                  ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                  isCurrent ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {stage.num}
              </span>
              <span>Stage {stage.num}</span>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <cur.icon className="w-4 h-4 text-emerald-400" />
              <span>{cur.title}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">{cur.summary}</p>
          </div>
          <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded self-start">
            File: <span className="text-emerald-300">{cur.codeFile}</span>
          </div>
        </div>

        {/* Narrative Description */}
        <p className="text-xs text-slate-300 leading-relaxed">{cur.description}</p>

        {/* Key Points */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-semibold text-slate-200">Core Technical Mechanisms:</span>
          <div className="space-y-1">
            {cur.keyPoints.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Implementation Code Snippet:</span>
            <span className="font-mono text-[11px] text-slate-500">Python / OpenCV / FastAPI</span>
          </div>
          <pre className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
            {cur.codeSnippet}
          </pre>
        </div>
      </div>

      {/* Interactive REST API Tester */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Interactive FastAPI REST Tester</h3>
        </div>
        <p className="text-xs text-slate-400">
          Test the backend API endpoints directly in your browser. Choose an endpoint and click Send Request.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={apiTestEndpoint}
            onChange={(e) => {
              setApiTestEndpoint(e.target.value);
              setApiTestResult(null);
            }}
            className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-3 py-1.5 font-mono focus:outline-none focus:border-emerald-500"
          >
            <option value="/api/occupancy">GET /api/occupancy (Summary & Metrics)</option>
            <option value="/api/slots">GET /api/slots (List 20 Predefined Slots)</option>
            <option value="/api/slots/A1/toggle">POST /api/slots/A1/toggle (Toggle Slot A1)</option>
          </select>

          <button
            onClick={handleRunMockApiTest}
            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
          >
            Send Request
          </button>
        </div>

        {apiTestResult && (
          <div className="space-y-1 pt-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400">Response 200 OK</span>
              <span>Content-Type: application/json</span>
            </div>
            <pre className="bg-slate-900 border border-slate-800 p-3 rounded text-xs font-mono text-slate-200 overflow-x-auto">
              {apiTestResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
