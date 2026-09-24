"""
Stage 2 & 3: OpenCV Video Processing & Parking Slot Detector
Processes camera/video feed, counts non-zero pixels in each slot,
and posts occupancy data to the FastAPI backend.
"""

import cv2
import numpy as np
import json
import time
import os

# Backend API configuration
API_ENDPOINT = "http://localhost:8000/api/slots/update"
THRESHOLD_PIXELS = 900  # Number of white pixels indicating car presence
FRAME_UPDATE_INTERVAL = 2.0  # Send status to API every 2 seconds

# Predefined 20 parking spaces coordinates: (slot_id, x, y, width, height)
# In a real setup, these coordinates can be created using parking_picker.py
DEFAULT_SLOTS = [
    # Zone A (Faculty / North Mall)
    ("A1", 50, 80, 100, 60),
    ("A2", 170, 80, 100, 60),
    ("A3", 290, 80, 100, 60),
    ("A4", 410, 80, 100, 60),
    ("A5", 530, 80, 100, 60),
    # Zone B (Student / Visitor)
    ("B1", 50, 180, 100, 60),
    ("B2", 170, 180, 100, 60),
    ("B3", 290, 180, 100, 60),
    ("B4", 410, 180, 100, 60),
    ("B5", 530, 180, 100, 60),
    # Zone C (EV Charging)
    ("C1", 50, 300, 100, 60),
    ("C2", 170, 300, 100, 60),
    ("C3", 290, 300, 100, 60),
    ("C4", 410, 300, 100, 60),
    ("C5", 530, 300, 100, 60),
    # Zone D (General Deck)
    ("D1", 50, 400, 100, 60),
    ("D2", 170, 400, 100, 60),
    ("D3", 290, 400, 100, 60),
    ("D4", 410, 400, 100, 60),
    ("D5", 530, 400, 100, 60),
]

def load_slots():
    """Load slot positions from slots.json if exists, else use defaults."""
    if os.path.exists("slots.json"):
        with open("slots.json", "r") as f:
            return json.load(f)
    return DEFAULT_SLOTS

def preprocess_frame(frame):
    """
    OpenCV Preprocessing Pipeline:
    1. Convert RGB frame to Grayscale (cv2.cvtColor)
    2. Apply Gaussian Blur to eliminate high-frequency camera noise (cv2.GaussianBlur)
    3. Apply Adaptive Thresholding to highlight edges & contrast (cv2.adaptiveThreshold)
    4. Apply Median Blur & Dilation to smooth vehicle contours
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 1)
    # Adaptive threshold creates a binary image (white pixels for vehicle edges/textures)
    thresh = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16
    )
    median = cv2.medianBlur(thresh, 5)
    kernel = np.ones((3, 3), np.uint8)
    dilated = cv2.dilate(median, kernel, iterations=1)
    return dilated

def check_parking_space(processed_frame, original_frame, slots):
    """
    Evaluates each slot:
    - Crops the bounding rectangle from the processed binary frame.
    - Counts white (non-zero) pixels with cv2.countNonZero.
    - If count > THRESHOLD_PIXELS: Car is present (Occupied, Red rectangle).
    - If count <= THRESHOLD_PIXELS: Empty space (Vacant, Green rectangle).
    """
    results = []
    occupied_count = 0

    for slot in slots:
        slot_id, x, y, w, h = slot
        # Crop region of interest (ROI)
        slot_crop = processed_frame[y:y+h, x:x+w]
        count = cv2.countNonZero(slot_crop)

        is_occupied = count > THRESHOLD_PIXELS
        if is_occupied:
            occupied_count += 1
            color = (0, 0, 230)  # Red for Occupied in BGR
            status_text = "OCCUPIED"
        else:
            color = (0, 200, 50)  # Green for Available in BGR
            status_text = "AVAILABLE"

        # Draw bounding box and slot label on the original display frame
        cv2.rectangle(original_frame, (x, y), (x + w, y + h), color, 2)
        cv2.putText(
            original_frame,
            f"{slot_id}: {status_text}",
            (x + 4, y + 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            color,
            1,
            cv2.LINE_AA
        )
        cv2.putText(
            original_frame,
            f"{count}px",
            (x + 4, y + 42),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.4,
            (220, 220, 220),
            1,
            cv2.LINE_AA
        )

        results.append({
            "slot_id": slot_id,
            "is_occupied": is_occupied,
            "pixel_count": count
        })

    # Overall on-screen HUD
    total = len(slots)
    available = total - occupied_count
    cv2.rectangle(original_frame, (10, 10), (320, 55), (20, 20, 20), -1)
    cv2.putText(
        original_frame,
        f"Free: {available}/{total} | Occupied: {occupied_count}",
        (20, 38),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (0, 255, 120),
        2
    )

    return results, occupied_count

def send_to_backend(results):
    """Stage 3: Sends detected status array to FastAPI endpoint."""
    try:
        import requests
        payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "updates": results
        }
        res = requests.post(API_ENDPOINT, json=payload, timeout=1.0)
        if res.status_code == 200:
            print(f"[CV -> API] Synced {len(results)} slots successfully.")
    except Exception as e:
        # Backend not running or unreachable
        print(f"[CV -> API] Note: FastAPI server at {API_ENDPOINT} not responding: {e}")

def main():
    """Main loop capturing video frames, detecting slots, and rendering."""
    print("==================================================")
    print(" Smart Parking Computer Vision Detector (OpenCV)")
    print(" Press 'q' in video window to exit.")
    print(" Press 'd' to toggle threshold/binary debug view.")
    print("==================================================")

    slots = load_slots()
    # Replace with 'parking_sample.mp4' or 0 for live webcam
    video_source = "parking_sample.mp4"
    if not os.path.exists(video_source):
        # Fallback to webcam index 0 if sample video is not present
        video_source = 0

    cap = cv2.VideoCapture(video_source)
    last_api_send = 0
    show_debug_thresh = False

    while cap.isOpened():
        # Loop video continuously if using a sample file
        if cap.get(cv2.CAP_PROP_POS_FRAMES) == cap.get(cv2.CAP_PROP_FRAME_COUNT):
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

        ret, frame = cap.read()
        if not ret:
            break

        # Resize to standard width for consistent pixel counts
        frame = cv2.resize(frame, (700, 500))

        # Preprocess frame with OpenCV filters
        processed_frame = preprocess_frame(frame)

        # Check each parking space
        slot_results, _ = check_parking_space(processed_frame, frame, slots)

        # Send updates to FastAPI periodically
        if time.time() - last_api_send > FRAME_UPDATE_INTERVAL:
            send_to_backend(slot_results)
            last_api_send = time.time()

        # Display window
        display_frame = processed_frame if show_debug_thresh else frame
        cv2.imshow("Smart Parking Detection Feed", display_frame)

        key = cv2.waitKey(20) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('d'):
            show_debug_thresh = not show_debug_thresh

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
