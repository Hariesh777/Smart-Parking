"""
Stage 1 Helper: Interactive Parking Slot Coordinate Picker (OpenCV)
Run this utility to click on your parking lot image or video frame to define the 20 slots.
Left Click: Add a slot box at cursor position.
Right Click: Remove a slot box near cursor.
Press 's' to save positions to slots.json.
Press 'q' to quit.
"""

import cv2
import json
import os

SLOT_WIDTH = 100
SLOT_HEIGHT = 60
OUTPUT_FILE = "slots.json"

# List of slot tuples: (slot_id, x, y, width, height)
pos_list = []

def mouse_click(event, x, y, flags, params):
    global pos_list
    if event == cv2.EVENT_LBUTTONDOWN:
        # Assign next slot ID (e.g. A1..A5, B1..B5, C1..C5, D1..D5)
        index = len(pos_list)
        zone_letter = chr(ord('A') + (index // 5))
        slot_number = (index % 5) + 1
        slot_id = f"{zone_letter}{slot_number}"
        pos_list.append((slot_id, x, y, SLOT_WIDTH, SLOT_HEIGHT))
        print(f"[+] Added Slot {slot_id} at ({x}, {y})")

    elif event == cv2.EVENT_RBUTTONDOWN:
        # Remove clicked slot if inside bounding box
        for i, pos in enumerate(pos_list):
            _, px, py, pw, ph = pos
            if px <= x <= px + pw and py <= y <= py + ph:
                removed = pos_list.pop(i)
                print(f"[-] Removed Slot {removed[0]}")
                break

def main():
    global pos_list
    print("==================================================")
    print(" Parking Slot Position Picker Tool")
    print(" Left-Click: Add Parking Slot")
    print(" Right-Click: Delete Parking Slot")
    print(" Press 's': Save coordinates to slots.json")
    print(" Press 'q': Quit")
    print("==================================================")

    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r") as f:
                pos_list = json.load(f)
                print(f"Loaded {len(pos_list)} existing slots from {OUTPUT_FILE}")
        except Exception:
            pos_list = []

    # Replace with path to your parking reference photo or camera
    source_img = "parking_reference.jpg"
    if os.path.exists(source_img):
        img = cv2.imread(source_img)
    else:
        # Create a clean simulated dark canvas if image is not present
        img = cv2.rectangle(
            cv2.UMat(np.full((500, 700, 3), (35, 40, 45), dtype=np.uint8)).get(),
            (0, 0), (700, 500), (45, 52, 58), -1
        )
        cv2.putText(img, "Sample Parking Canvas (Click to place slots)", (80, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)

    cv2.namedWindow("Parking Space Picker")
    cv2.setMouseCallback("Parking Space Picker", mouse_click)

    while True:
        display = img.copy()
        for slot in pos_list:
            slot_id, x, y, w, h = slot
            cv2.rectangle(display, (x, y), (x + w, y + h), (0, 220, 100), 2)
            cv2.putText(display, slot_id, (x + 6, y + 25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

        cv2.imshow("Parking Space Picker", display)
        key = cv2.waitKey(20) & 0xFF

        if key == ord('s'):
            with open(OUTPUT_FILE, "w") as f:
                json.dump(pos_list, f, indent=2)
            print(f"[SUCCESS] Saved {len(pos_list)} slots to {OUTPUT_FILE}")
        elif key == ord('q'):
            break

    cv2.destroyAllWindows()

if __name__ == "__main__":
    import numpy as np
    main()
