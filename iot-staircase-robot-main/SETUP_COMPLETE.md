# 📹 Camera WebSocket System - Complete Setup

## What Was Changed

### 1. **robot_client.py** - Added Real Camera Support
- ✅ Imports OpenCV (`cv2`) for camera capture
- ✅ `init_camera()` - Opens laptop webcam (camera index 0)
- ✅ `send_video_frame()` - Captures, encodes, and sends frames
- ✅ Adds timestamp, frame counter, and device ID overlay
- ✅ Streams at ~10 FPS (configurable)
- ✅ Falls back to simulated frames if camera unavailable

### 2. **robot/static/robot/js/app.js** - Added Video Display
- ✅ WebSocket event handlers (onopen, onmessage, onerror, onclose)
- ✅ `displayVideoFrame()` - Displays received frames in canvas/img
- ✅ `updateTelemetryDisplay()` - Updates battery, signal strength
- ✅ Handles base64 encoded JPEG frames

### 3. **robot/consumers.py** - Already Working!
- ✅ Routes video frames from robot to website
- ✅ Routes control commands from website to robot
- ✅ Handles telemetry data broadcasting

## 📦 New Files Created

1. **CAMERA_SETUP.md** - Detailed setup guide
2. **QUICKSTART.md** - Quick reference guide
3. **test_camera.py** - Camera testing script
4. **install.bat** - One-click dependency installer
5. **start_server.bat** - One-click server starter
6. **start_camera.bat** - One-click camera client starter

## 🚀 How to Use

### Option A: Using Batch Files (Windows)

1. **Install dependencies:**
   ```
   Double-click: install.bat
   ```

2. **Start server:**
   ```
   Double-click: start_server.bat
   ```

3. **Start camera (in new terminal):**
   ```
   Double-click: start_camera.bat
   ```

4. **Open browser:**
   ```
   http://localhost:8000/robot/
   ```

### Option B: Manual Commands

1. **Install:**
   ```bash
   pip install opencv-python websockets
   ```

2. **Test camera:**
   ```bash
   python test_camera.py
   ```

3. **Start server:**
   ```bash
   python -m daphne -p 8000 staircasebot.asgi:application
   ```

4. **Start camera client:**
   ```bash
   python robot_client.py robot_01
   ```

5. **Open browser:**
   ```
   http://localhost:8000/robot/
   ```

## 🎯 What You'll See

### When Camera Client Starts:
```
🤖 Connecting robot to ws://localhost:8000/ws/telemetry/?device_id=robot_01...
📷 Initializing laptop camera...
✅ Camera initialized successfully
✅ Robot robot_01 connected!
📹 Video streaming started (Camera)
🎥 Frame #0 sent (43521 bytes)
🎥 Frame #30 sent (44123 bytes)
📡 Telemetry sent: Battery=85.0%, CPU=42.3%, Temp=36.2°C
```

### On the Website:
- **Live video feed** from your laptop camera
- **Timestamp overlay** on each frame
- **Frame counter** showing current frame number
- **Device ID** displayed on video
- **Battery level** updating every 3 seconds
- **Signal strength** updating in real-time
- **Joystick controls** sending commands to camera client

## 🎮 Control Flow

```
┌─────────────────┐
│  Laptop Camera  │
│  (robot_client) │
└────────┬────────┘
         │ Captures frame every 0.1s
         │ Encodes as JPEG
         │ Base64 encode
         ▼
┌─────────────────┐
│  WebSocket Send │ ws://localhost:8000/ws/telemetry/?device_id=robot_01
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Django Server   │
│ (consumers.py)  │
└────────┬────────┘
         │ Broadcasts to all websites
         ▼
┌─────────────────┐
│ Website Browser │
│ (app.js)        │
└────────┬────────┘
         │ Decodes base64
         │ Creates Image object
         ▼
┌─────────────────┐
│ Canvas Display  │ Shows live video!
└─────────────────┘
```

## 📊 Message Types

### From Camera Client → Server:
```json
{
  "type": "video_frame",
  "device_id": "robot_01",
  "frame_data": "base64_encoded_jpeg...",
  "frame_number": 123,
  "timestamp": "2025-12-04T10:30:45.123456"
}
```

### From Server → Website:
```json
{
  "type": "video_frame",
  "device_id": "robot_01",
  "frame_data": "base64_encoded_jpeg...",
  "timestamp": "2025-12-04T10:30:45.123456"
}
```

### From Website → Server:
```json
{
  "type": "robot_move",
  "x": 0.75,
  "y": -0.50
}
```

### From Server → Camera Client:
```json
{
  "type": "robot_move",
  "x": 0.75,
  "y": -0.50,
  "timestamp": "2025-12-04T10:30:45.123456"
}
```

## 🔧 Configuration Options

### Adjust Frame Rate (robot_client.py, line ~170):
```python
# Faster (20 FPS)
await asyncio.sleep(0.05)

# Current (10 FPS)
await asyncio.sleep(0.1)

# Slower (5 FPS)
await asyncio.sleep(0.2)
```

### Adjust Video Quality (robot_client.py, line ~155):
```python
# Higher quality (90% - larger files)
_, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])

# Current quality (70% - balanced)
_, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])

# Lower quality (50% - smaller files, faster)
_, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
```

### Change Camera Resolution (robot_client.py, line ~48):
```python
# Lower (faster, smaller files)
self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)

# Current (balanced)
self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Higher (better quality, larger files)
self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
```

## ❓ Troubleshooting

### Problem: "Failed to open camera"
**Solution:**
1. Close Zoom, Skype, Teams, or other apps using camera
2. Try different camera index (change `VideoCapture(0)` to `VideoCapture(1)`)
3. Check Windows Settings → Privacy → Camera permissions
4. Run test: `python test_camera.py`

### Problem: "WebSocket connection failed"
**Solution:**
1. Make sure Django server is running
2. Check if port 8000 is blocked: `netstat -an | findstr 8000`
3. Try accessing: http://localhost:8000
4. Check firewall settings

### Problem: "No video on website"
**Solution:**
1. Open DevTools (F12) → Console tab
2. Look for: `🎥 Video frame displayed`
3. Check Network tab → WS tab → verify connection
4. Verify videoCanvas or videoFrame element exists in HTML
5. Hard refresh browser (Ctrl+Shift+R)

### Problem: "Video is laggy/slow"
**Solution:**
1. Reduce frame rate (increase sleep time)
2. Reduce video quality (lower JPEG quality)
3. Reduce resolution (smaller frame size)
4. Check CPU usage (Task Manager)

## ✅ Success Indicators

You know it's working when you see:

- [ ] ✅ Camera client: "Camera initialized successfully"
- [ ] ✅ Server logs: "Robot connected: robot_01"
- [ ] ✅ Server logs: "Video frame received"
- [ ] ✅ Browser console: "Main WebSocket connected"
- [ ] ✅ Browser console: "Video frame displayed"
- [ ] ✅ Live video showing in browser with timestamp
- [ ] ✅ Joystick commands logged in camera client terminal

## 🎉 You're Done!

Your laptop camera is now streaming to the website via WebSocket!

**Next steps:**
- Move the joystick and watch terminal logs
- Watch battery level update every 3 seconds
- Try adjusting frame rate/quality for performance
- Add face detection or other OpenCV features

**For more info:**
- Full guide: `CAMERA_SETUP.md`
- Quick reference: `QUICKSTART.md`
- Test camera: `python test_camera.py`
