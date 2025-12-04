# Camera WebSocket Setup Guide

## Overview
This system connects your laptop camera to the Django WebSocket server, which then streams the video to the website in real-time.

## Architecture
```
Laptop Camera (robot_client.py)
    ↓ (WebSocket)
Django Server (consumers.py)
    ↓ (WebSocket)
Website (controller.html + app.js)
```

## Installation

### 1. Install Required Packages
```bash
pip install opencv-python websockets
```

### 2. Verify Installation
```bash
python -c "import cv2; print('OpenCV version:', cv2.__version__)"
```

## Usage

### Step 1: Start Django Server
In Terminal 1:
```bash
cd iot-staircase-robot-main
python -m daphne -p 8000 staircasebot.asgi:application
```

### Step 2: Start Robot Client with Camera
In Terminal 2:
```bash
cd iot-staircase-robot-main
python robot_client.py robot_01
```

This will:
- ✅ Connect to WebSocket server at `ws://localhost:8000/ws/telemetry/`
- ✅ Initialize your laptop camera
- ✅ Stream video frames at ~10 FPS
- ✅ Send telemetry data every 3 seconds
- ✅ Receive control commands from website

### Step 3: Open Website
Open your browser and visit:
```
http://localhost:8000/robot/
```

You should see:
- Live video feed from your laptop camera
- Battery, CPU, temperature, signal strength updates
- Joystick controls that send commands back to the client

## Command Options

### Use Camera (Default)
```bash
python robot_client.py robot_01
```

### Use Simulated Video (No Camera)
```bash
python robot_client.py robot_01 nocamera
```

### Use Different Device ID
```bash
python robot_client.py robot_02
```

## Troubleshooting

### Camera Not Opening
**Problem**: "Failed to open camera"

**Solutions**:
1. Check if another application is using the camera
2. Try a different camera index:
   ```python
   # In robot_client.py, change:
   self.camera = cv2.VideoCapture(0)  # Try 1, 2, etc.
   ```
3. Grant camera permissions in Windows Settings

### WebSocket Connection Failed
**Problem**: "Connection failed"

**Solutions**:
1. Make sure Django server is running on port 8000
2. Check firewall settings
3. Verify WebSocket URL in code matches server

### Video Not Showing on Website
**Problem**: Black screen or no video

**Solutions**:
1. Open browser DevTools (F12) → Console tab
2. Look for JavaScript errors
3. Check Network tab for WebSocket connection status
4. Verify `video_frame` messages are being received

## Testing

### Test Camera Locally
```python
import cv2

# Test camera capture
camera = cv2.VideoCapture(0)
if camera.isOpened():
    ret, frame = camera.read()
    if ret:
        cv2.imshow('Test', frame)
        cv2.waitKey(0)
    camera.release()
else:
    print("Camera failed to open")
```

### Test WebSocket Connection
Check server logs for:
```
✅ Robot connected: robot_01
📷 Camera initialized successfully
📹 Video streaming started (Camera)
🎥 Frame #0 sent (XXXXX bytes)
```

## Performance Tuning

### Adjust Frame Rate
In `robot_client.py`:
```python
# Faster (20 FPS)
await asyncio.sleep(0.05)

# Slower (5 FPS)
await asyncio.sleep(0.2)
```

### Adjust Video Quality
In `robot_client.py`:
```python
# Higher quality (larger file size)
cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])

# Lower quality (smaller file size)
cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
```

### Adjust Resolution
In `robot_client.py`:
```python
# Lower resolution (better performance)
self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)

# Higher resolution (better quality)
self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
```

## File Structure

```
iot-staircase-robot-main/
├── robot_client.py          # WebSocket client with camera support
├── robot/
│   ├── consumers.py         # WebSocket server handler
│   ├── templates/
│   │   └── robot/
│   │       └── controller.html  # Website UI
│   └── static/
│       └── robot/
│           └── js/
│               └── app.js   # WebSocket client JS
└── staircasebot/
    ├── asgi.py             # ASGI configuration
    └── settings.py         # Django settings
```

## What Happens When You Run

1. **robot_client.py starts**:
   - Opens laptop camera (webcam)
   - Connects to WebSocket server
   - Registers as "robot_01"

2. **Continuous loop**:
   - Captures frame from camera every 0.1 seconds
   - Encodes frame as JPEG
   - Converts to base64 string
   - Sends via WebSocket to server

3. **Django server receives**:
   - Receives video frame message
   - Broadcasts to all connected websites
   - Sends acknowledgment back to robot

4. **Website receives**:
   - JavaScript receives video frame
   - Decodes base64 string
   - Displays in `<canvas>` or `<img>` element

5. **Control commands**:
   - User moves joystick on website
   - Website sends command via WebSocket
   - Server forwards to robot_01
   - Robot receives and processes command

## Next Steps

- ✅ Camera streaming is working
- ✅ Telemetry data is being sent
- ✅ Control commands are received
- 🔄 Add face detection overlay
- 🔄 Add motion detection
- 🔄 Add recording capability
- 🔄 Add multiple camera support
