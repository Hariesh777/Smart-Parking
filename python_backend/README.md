# Smart Parking Detection System (Python + OpenCV + FastAPI + SQLite)

A beginner-friendly Computer Vision and Web Dashboard solution designed for college campuses and shopping mall parking facilities.

---

## 📁 Project Folder Structure

```
smart-parking-system/
│
├── python_backend/                 # Python computer vision & backend modules
│   ├── database.py                 # Stage 6: SQLite database models, entry/exit logs & analytics
│   ├── main.py                     # Stages 3 & 4: FastAPI REST API with endpoints
│   ├── detector.py                 # Stages 2 & 3: OpenCV video processing & slot detection
│   ├── parking_picker.py           # Stage 1: Interactive tool to define parking space coordinates
│   ├── requirements.txt            # Python dependencies (fastapi, opencv, uvicorn, requests)
│   ├── slots.json                  # Predefined coordinates for the 20 parking slots (A1 - D5)
│   └── README.md                   # Step-by-step beginner instructions
│
├── src/                            # Web Application (React + Tailwind CSS + Canvas CV Simulator)
│   ├── components/
│   │   ├── Navbar.tsx              # Top navigation bar
│   │   ├── StatCards.tsx           # Key metrics (Total, Available, Occupied, Occupancy %)
│   │   ├── ParkingLotVisualizer.tsx# Stage 1 & 5: Interactive 20-slot bird's-eye layout
│   │   ├── LiveCVFeed.tsx          # Stage 2 & 3: Real-time OpenCV video & canvas filter pipeline
│   │   ├── AdminHistory.tsx        # Stage 6: Vehicle entry/exit duration logs & admin tools
│   │   ├── AnalyticsView.tsx       # Stage 7: Peak parking hours (08:00 - 22:00) & zone metrics
│   │   ├── StagesWalkthrough.tsx   # Step-by-step educational guide for Stages 1-7
│   │   └── PythonCodeModal.tsx     # One-click code viewer & export for Python files
│   ├── types/parking.ts            # TypeScript interfaces
│   ├── data/initialSlots.ts        # Predefined 20 slot definitions and mock parking history
│   ├── App.tsx                     # Main dashboard container
│   └── index.css                   # Tailwind v4 styles with Plus Jakarta Sans & JetBrains Mono
│
└── index.html                      # HTML entry point with metadata
```

---

## 🚀 Step-by-Step Development Stages

### Stage 1: Static Parking Layout (20 Predefined Slots)
- 20 slots partitioned into 4 functional zones:
  - **Zone A (A1 - A5)**: Faculty & Mall North Entrance
  - **Zone B (B1 - B5)**: Student & Visitor Parking
  - **Zone C (C1 - C5)**: Electric Vehicle (EV) Charging Stations
  - **Zone D (D1 - D5)**: General Parking Deck
- Every slot has a unique ID, physical coordinate bounding box $(x, y, w, h)$, and type.

### Stage 2: Python / OpenCV Computer Vision Detection
How the OpenCV algorithm works:
1. **Grayscale Conversion**: `cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)` simplifies luminance.
2. **Noise Reduction**: `cv2.GaussianBlur(gray, (3, 3), 1)` eliminates fine camera sensor noise.
3. **Adaptive Thresholding**: `cv2.adaptiveThreshold` converts the frame into a binary black-and-white mask, isolating car contours and pavement edges.
4. **Pixel Counting**: `cv2.countNonZero(crop)` evaluates each slot's region.
   - If white pixel count exceeds `THRESHOLD_PIXELS` (e.g., 900 px), a vehicle is present (**Occupied, Red**).
   - If below threshold, the slot is clear pavement (**Available, Green**).

### Stage 3: Connecting Computer Vision to FastAPI
- `detector.py` packages the status of all 20 slots into a JSON payload and sends an HTTP POST request to `http://localhost:8000/api/slots/update`.

### Stage 4: FastAPI REST Endpoints
- `GET /api/slots`: Returns current status of all 20 slots.
- `GET /api/occupancy`: Returns total, available, occupied counts and occupancy percentage.
- `POST /api/slots/update`: Receives updates from OpenCV detector.
- `POST /api/slots/{id}/toggle`: Manually toggle or simulate parking at a slot.
- `GET /api/history`: Recent parking sessions.
- `GET /api/analytics`: Peak hours and zone utilization.

### Stage 5: Connecting the Frontend to the API
- The responsive web dashboard polls `/api/slots` and `/api/occupancy` every 2 seconds to update availability indicators smoothly.

### Stage 6: SQLite Database & Parking History
- Automatically logs vehicle license plate, entry timestamp, exit timestamp, duration in minutes, and calculated fee.

### Stage 7: Analytics & Peak Hours
- Hourly occupancy distribution chart (08:00 to 22:00) identifying peak congestion periods (e.g. 12:00 lunch rush / class start and 17:00 evening rush).

---

## 💻 Local Setup & Execution Guide

### 1. Install Python Dependencies
```bash
cd python_backend
pip install -r requirements.txt
```

### 2. Initialize Database & Start FastAPI Server
```bash
# In terminal 1:
python database.py
uvicorn main:app --reload --port 8000
```
Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser to view the interactive FastAPI Swagger documentation.

### 3. Run the OpenCV Detector
```bash
# In terminal 2:
python detector.py
```
- Press `d` in the video window to toggle between normal view and OpenCV binary threshold view.
- Press `q` to quit.

*(Optional)* Run `python parking_picker.py` if you want to click and calibrate slots on your own parking lot camera feed!
