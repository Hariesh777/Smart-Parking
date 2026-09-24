"""
Stages 3 & 4: FastAPI Backend for Smart Parking Detection System
Connects Computer Vision output and provides REST API for the Web Dashboard.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import database as db

# Initialize SQLite database on startup
db.init_db()

app = FastAPI(
    title="Smart Parking Detection API",
    description="Beginner-friendly API receiving OpenCV slot status and serving dashboard analytics",
    version="1.0.0"
)

# Enable CORS for the web frontend (React / Vite dashboard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Data Models ---
class SlotStatusUpdate(BaseModel):
    slot_id: str
    is_occupied: bool
    pixel_count: Optional[int] = None
    plate: Optional[str] = None

class BulkUpdatePayload(BaseModel):
    timestamp: str
    updates: List[SlotStatusUpdate]

class SlotTogglePayload(BaseModel):
    is_occupied: Optional[bool] = None
    plate: Optional[str] = None

# --- API Endpoints ---

@app.get("/")
def read_root():
    """Health check and API overview."""
    return {
        "status": "online",
        "service": "Smart Parking Detection Backend",
        "version": "1.0.0",
        "slots_managed": 20
    }

@app.get("/api/slots")
def get_slots():
    """
    Stage 4 Endpoint: Returns the real-time status of all 20 predefined slots.
    Each slot has ID (A1-D5), zone, occupied status, license plate, and entry time.
    """
    return db.get_all_slots()

@app.get("/api/occupancy")
def get_occupancy():
    """
    Stage 4 Endpoint: Summary of parking availability.
    Includes total slots, occupied count, available count, and occupancy percentage.
    """
    return db.get_analytics_summary()

@app.post("/api/slots/update")
def update_slots_from_cv(payload: BulkUpdatePayload):
    """
    Stage 3 Endpoint: Receives bulk occupancy status from the Python/OpenCV computer vision detector.
    Logs entry/exit timestamps when vehicle state transitions occur.
    """
    updated_count = 0
    for item in payload.updates:
        db.update_slot_status(
            slot_id=item.slot_id,
            is_occupied=item.is_occupied,
            plate=item.plate
        )
        updated_count += 1

    return {
        "status": "success",
        "processed_updates": updated_count,
        "received_at": payload.timestamp
    }

@app.post("/api/slots/{slot_id}/toggle")
def toggle_slot(slot_id: str, payload: SlotTogglePayload = None):
    """
    Admin or manual simulation endpoint to park or unpark a car at a specific slot.
    """
    slots = {s["slot_id"]: s for s in db.get_all_slots()}
    if slot_id not in slots:
        raise HTTPException(status_code=404, detail=f"Slot {slot_id} not found")

    current_state = bool(slots[slot_id]["is_occupied"])
    new_state = payload.is_occupied if (payload and payload.is_occupied is not None) else (not current_state)
    plate = payload.plate if payload else None

    db.update_slot_status(slot_id=slot_id, is_occupied=new_state, plate=plate)
    return {"slot_id": slot_id, "is_occupied": new_state, "message": "Slot updated successfully"}

@app.get("/api/history")
def get_parking_history(limit: int = 50):
    """
    Stage 6 Endpoint: Returns the parking session audit trail:
    Entry time, Exit time, Slot ID, Vehicle License Plate, Duration (mins), and Fee.
    """
    return db.get_history(limit=limit)

@app.get("/api/analytics")
def get_analytics():
    """
    Stage 7 Endpoint: Returns peak parking hours and zone breakdown for mall/college administration.
    """
    summary = db.get_analytics_summary()
    slots = db.get_all_slots()

    # Calculate zone occupancy breakdown
    zone_stats = {"A": {"occupied": 0, "total": 5}, "B": {"occupied": 0, "total": 5},
                  "C": {"occupied": 0, "total": 5}, "D": {"occupied": 0, "total": 5}}
    for slot in slots:
        z = slot["zone"]
        if z in zone_stats and slot["is_occupied"]:
            zone_stats[z]["occupied"] += 1

    # Simulated peak hourly profile typical of mall/college parking (08:00 - 22:00)
    peak_hours = [
        {"hour": "08:00", "occupancy_percent": 30, "vehicles": 6},
        {"hour": "09:00", "occupancy_percent": 55, "vehicles": 11},
        {"hour": "10:00", "occupancy_percent": 75, "vehicles": 15},
        {"hour": "11:00", "occupancy_percent": 85, "vehicles": 17},
        {"hour": "12:00", "occupancy_percent": 95, "vehicles": 19}, # Peak Lunch / Lecture Rush
        {"hour": "13:00", "occupancy_percent": 90, "vehicles": 18},
        {"hour": "14:00", "occupancy_percent": 80, "vehicles": 16},
        {"hour": "15:00", "occupancy_percent": 70, "vehicles": 14},
        {"hour": "16:00", "occupancy_percent": 65, "vehicles": 13},
        {"hour": "17:00", "occupancy_percent": 85, "vehicles": 17}, # Evening Rush
        {"hour": "18:00", "occupancy_percent": 80, "vehicles": 16},
        {"hour": "19:00", "occupancy_percent": 60, "vehicles": 12},
        {"hour": "20:00", "occupancy_percent": 40, "vehicles": 8},
        {"hour": "21:00", "occupancy_percent": 25, "vehicles": 5},
    ]

    return {
        "summary": summary,
        "zone_breakdown": zone_stats,
        "peak_hours": peak_hours
    }

if __name__ == "__main__":
    import uvicorn
    print("[API] Starting FastAPI Smart Parking server on http://localhost:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
