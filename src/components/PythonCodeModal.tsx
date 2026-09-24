import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, X } from 'lucide-react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeFile, setActiveFile] = useState<string>('detector.py');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const files: Record<string, { label: string; desc: string; content: string }> = {
    'detector.py': {
      label: 'detector.py',
      desc: 'Stages 2 & 3: OpenCV Video Processing & HTTP API client',
      content: `import cv2
import numpy as np
import requests
import json
import time

API_ENDPOINT = "http://localhost:8000/api/slots/update"
THRESHOLD_PIXELS = 900  # Non-zero white pixel threshold

# Predefined 20 parking spaces coordinates: (slot_id, x, y, width, height)
SLOTS = [
    # Zone A (Faculty / North Mall)
    ("A1", 50, 80, 100, 60), ("A2", 170, 80, 100, 60), ("A3", 290, 80, 100, 60),
    ("A4", 410, 80, 100, 60), ("A5", 530, 80, 100, 60),
    # Zone B (Student / Visitor)
    ("B1", 50, 180, 100, 60), ("B2", 170, 180, 100, 60), ("B3", 290, 180, 100, 60),
    ("B4", 410, 180, 100, 60), ("B5", 530, 180, 100, 60),
    # Zone C (EV Fast Charging)
    ("C1", 50, 300, 100, 60), ("C2", 170, 300, 100, 60), ("C3", 290, 300, 100, 60),
    ("C4", 410, 300, 100, 60), ("C5", 530, 300, 100, 60),
    # Zone D (General Deck)
    ("D1", 50, 400, 100, 60), ("D2", 170, 400, 100, 60), ("D3", 290, 400, 100, 60),
    ("D4", 410, 400, 100, 60), ("D5", 530, 400, 100, 60),
]

def preprocess_frame(frame):
    # 1. Grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # 2. Gaussian Blur
    blur = cv2.GaussianBlur(gray, (3, 3), 1)
    # 3. Adaptive Threshold
    thresh = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16
    )
    # 4. Dilate
    median = cv2.medianBlur(thresh, 5)
    kernel = np.ones((3, 3), np.uint8)
    return cv2.dilate(median, kernel, iterations=1)

def main():
    cap = cv2.VideoCapture("parking_sample.mp4") # Or 0 for webcam
    last_sync = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        frame = cv2.resize(frame, (700, 500))
        dilated = preprocess_frame(frame)
        results = []

        for slot_id, x, y, w, h in SLOTS:
            crop = dilated[y:y+h, x:x+w]
            count = cv2.countNonZero(crop)
            is_occupied = count > THRESHOLD_PIXELS

            color = (0, 0, 255) if is_occupied else (0, 255, 0)
            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
            cv2.putText(frame, f"{slot_id} ({count}px)", (x+4, y+20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

            results.append({"slot_id": slot_id, "is_occupied": is_occupied, "pixel_count": count})

        # Send status to FastAPI every 2 seconds
        if time.time() - last_sync > 2.0:
            try:
                requests.post(API_ENDPOINT, json={"timestamp": time.ctime(), "updates": results}, timeout=1)
            except Exception:
                pass
            last_sync = time.time()

        cv2.imshow("Smart Parking OpenCV Detector", frame)
        if cv2.waitKey(20) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,
    },
    'main.py': {
      label: 'main.py',
      desc: 'Stages 3 & 4: FastAPI REST API with endpoints',
      content: `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import database as db

db.init_db()

app = FastAPI(title="Smart Parking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SlotStatusUpdate(BaseModel):
    slot_id: str
    is_occupied: bool
    pixel_count: Optional[int] = None

class BulkUpdatePayload(BaseModel):
    timestamp: str
    updates: List[SlotStatusUpdate]

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
    return {"status": "success", "processed": len(payload.updates)}

@app.get("/api/history")
def get_history(limit: int = 50):
    return db.get_history(limit=limit)

@app.get("/api/analytics")
def get_analytics():
    return db.get_analytics_summary()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)`,
    },
    'database.py': {
      label: 'database.py',
      desc: 'Stage 6: SQLite Schema, Entry/Exit logs & Duration calculation',
      content: `import sqlite3
from datetime import datetime

DB_NAME = "parking_system.db"

def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS parking_slots (
        slot_id TEXT PRIMARY KEY,
        zone TEXT NOT NULL,
        is_occupied INTEGER NOT NULL DEFAULT 0,
        current_plate TEXT,
        entry_time TEXT,
        last_updated TEXT NOT NULL
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS parking_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot_id TEXT NOT NULL,
        plate TEXT NOT NULL,
        entry_time TEXT NOT NULL,
        exit_time TEXT,
        duration_minutes INTEGER,
        fee REAL,
        status TEXT NOT NULL DEFAULT 'ACTIVE'
    )""")
    conn.commit()
    conn.close()

def update_slot_status(slot_id: str, is_occupied: bool, plate: str = None):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT is_occupied, entry_time FROM parking_slots WHERE slot_id = ?", (slot_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return

    prev = bool(row["is_occupied"])
    now_str = datetime.now().isoformat()

    if not prev and is_occupied:
        # Car entered
        v_plate = plate or f"KA-01-M{hash(slot_id + now_str) % 9000 + 1000}"
        c.execute("UPDATE parking_slots SET is_occupied=1, current_plate=?, entry_time=?, last_updated=? WHERE slot_id=?",
                  (v_plate, now_str, now_str, slot_id))
        c.execute("INSERT INTO parking_history (slot_id, plate, entry_time, status) VALUES (?, ?, ?, 'ACTIVE')",
                  (slot_id, v_plate, now_str))

    elif prev and not is_occupied:
        # Car departed
        c.execute("SELECT id, entry_time FROM parking_history WHERE slot_id=? AND status='ACTIVE' ORDER BY id DESC LIMIT 1",
                  (slot_id,))
        active_sess = c.fetchone()
        duration = 15
        if active_sess and active_sess["entry_time"]:
            try:
                dt = datetime.fromisoformat(active_sess["entry_time"])
                duration = max(1, int((datetime.now() - dt).total_seconds() / 60))
            except Exception:
                pass
        fee = round(max(2.0, (duration / 60.0) * 2.5), 2)
        if active_sess:
            c.execute("UPDATE parking_history SET exit_time=?, duration_minutes=?, fee=?, status='COMPLETED' WHERE id=?",
                      (now_str, duration, fee, active_sess["id"]))
        c.execute("UPDATE parking_slots SET is_occupied=0, current_plate=NULL, entry_time=NULL, last_updated=? WHERE slot_id=?",
                  (now_str, slot_id))

    conn.commit()
    conn.close()`,
    },
    'requirements.txt': {
      label: 'requirements.txt',
      desc: 'Python Dependencies for Local Execution',
      content: `fastapi==0.110.0
uvicorn==0.28.0
opencv-python==4.9.0.80
numpy==1.26.4
requests==2.31.0
pydantic==2.6.4`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([files[activeFile].content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-4xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">
              Python OpenCV & FastAPI Source Code (Ready to Run)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector & File Description */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/80 gap-2">
          <div className="flex items-center gap-1.5">
            {Object.keys(files).map((fileName) => (
              <button
                key={fileName}
                onClick={() => setActiveFile(fileName)}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  activeFile === fileName
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
                }`}
              >
                {fileName}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-950 border border-emerald-600/50 hover:bg-emerald-900/60 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        <div className="px-5 py-2 bg-slate-950/40 text-[11px] text-slate-400 border-b border-slate-800/60">
          {files[activeFile].desc}
        </div>

        {/* Code Body */}
        <div className="flex-1 p-5 overflow-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed">
          <pre className="text-emerald-300 whitespace-pre">{files[activeFile].content}</pre>
        </div>

        {/* Instructions Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Run locally: `pip install -r requirements.txt` then `uvicorn main:app --reload`</span>
          <button
            onClick={onClose}
            className="px-4 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors self-end sm:self-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
