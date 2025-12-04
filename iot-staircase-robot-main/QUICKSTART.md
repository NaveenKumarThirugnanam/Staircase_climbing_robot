# Quick Start Guide - Camera WebSocket System

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies
```bash
pip install opencv-python websockets
```

### Step 2: Test Your Camera
```bash
python test_camera.py
```
You should see a window with your camera feed. Press any key to close.

### Step 3: Start Everything

**Terminal 1 - Start Django Server:**
```bash
python -m daphne -p 8000 staircasebot.asgi:application
```

**Terminal 2 - Start Camera Client:**
```bash
python robot_client.py robot_01
```

**Browser:**
Open: http://localhost:8000/robot/

## ✅ Expected Output

### Terminal 1 (Django Server):
```
✅ Robot connected: robot_01
📷 Camera initialized successfully
🎥 Video frame received
📤 Broadcasting to 1 website(s): video_frame
```

### Terminal 2 (Camera Client):
```
✅ Robot robot_01 connected!
✅ Camera initialized successfully
📹 Video streaming started (Camera)
🎥 Frame #0 sent (45231 bytes)
📡 Telemetry sent: Battery=85.0%, CPU=45.2%
```

### Browser (DevTools Console):
```
✅ Main WebSocket connected
🎥 Video frame displayed in canvas
📊 Telemetry updated
```

## 🎮 How It Works

1. **Camera Client** (`robot_client.py`):
   - Captures frames from your laptop camera
   - Encodes as JPEG → Base64
   - Sends via WebSocket to Django server
   - Receives joystick commands from website

2. **Django Server** (`consumers.py`):
   - Receives video frames from camera client
   - Broadcasts frames to all connected websites
   - Routes control commands from website to camera client

3. **Website** (`app.js` + `controller.html`):
   - Receives video frames via WebSocket
   - Displays in canvas/img element
   - Sends joystick commands to server

## 🔧 Troubleshooting

### Camera Won't Open
```bash
# Try different camera index
python -c "import cv2; c = cv2.VideoCapture(1); print('OK' if c.isOpened() else 'FAIL')"
```

### WebSocket Won't Connect
- Check Django server is running on port 8000
- Check firewall isn't blocking port 8000
- Try: `netstat -an | findstr 8000`

### No Video on Website
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab → WS → Messages
4. Verify `video_frame` messages are received

### Performance Issues
Reduce frame rate in `robot_client.py`:
```python
# Change from 0.1 to 0.2 (5 FPS instead of 10 FPS)
await asyncio.sleep(0.2)
```

## 📊 System Status Checklist

- [ ] OpenCV installed: `python -c "import cv2"`
- [ ] Camera works: `python test_camera.py`
- [ ] Django running: http://localhost:8000
- [ ] WebSocket open: Check browser DevTools → Network → WS
- [ ] Video frames received: Check Console for "🎥 Video frame"
- [ ] Controls work: Move joystick, check Terminal 2 logs

## 🎯 Next Features

- [ ] Add face detection overlay
- [ ] Add motion detection alerts
- [ ] Add video recording capability
- [ ] Support multiple cameras
- [ ] Add night vision mode
- [ ] Add zoom/pan controls

## 📝 File Locations

- **Camera Client**: `robot_client.py`
- **Server Handler**: `robot/consumers.py`
- **Website JS**: `robot/static/robot/js/app.js`
- **Website HTML**: `robot/templates/robot/controller.html`
- **Test Script**: `test_camera.py`
- **Full Guide**: `CAMERA_SETUP.md`
