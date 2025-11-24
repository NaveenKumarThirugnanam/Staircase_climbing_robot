# 🧪 Quick Testing Guide - WebSocket Server Architecture

## What's New?

The system now has a **WebSocket Relay Server** that:
- ✅ Accepts connections from both **Website** and **Robot**
- ✅ Forwards control commands from Website to Robot
- ✅ Broadcasts telemetry from Robot to Website
- ✅ Updates Dashboard live with real data

---

## 5-Minute Quick Test

### Terminal 1: Start Django Server

```powershell
cd f:\mosaique\staircaserobot\iot-staircase-robot-main
python -m daphne -p 8000 staircasebot.asgi:application
```

Watch for:
```
Starting Daphne server on tcp/ip 127.0.0.1:8000
```

### Terminal 2: Start Simulated Robot

```powershell
cd f:\mosaique\staircaserobot\iot-staircase-robot-main
pip install websockets
python robot_client.py robot_01
```

Watch for:
```
✅ Robot robot_01 connected!
📡 Telemetry sent: Battery=85.0%, CPU=45.2%, Temp=34.8°C, Signal=89.5%
```

### Browser: Test Website

1. Open: `http://localhost:8000/robot/controller/`
2. Open Console: Press F12

#### Test 1: Move Joystick
- **Action:** Drag robot joystick
- **Browser Console Should Show:**
  ```
  ⚡ WebSocket control → {type: 'robot_move', x: 0.5, y: -0.3, ...}
  ✅ ACK: robot_move - Command received: Robot move x=0.5, y=-0.3
  ```
- **Robot Terminal Should Show:**
  ```
  🎮 COMMAND: Robot move x=0.5, y=-0.3
  ```

#### Test 2: Move Speed Slider
- **Action:** Drag speed slider to 60%
- **Browser Console Should Show:**
  ```
  ⚡ Speed set to: 60
  ✅ ACK: set_speed - Command received: Speed set to 60%
  ```
- **Robot Terminal Should Show:**
  ```
  ⚡ COMMAND: Set speed to 60%
  ```

#### Test 3: Check Dashboard
- **Action:** Click on Dashboard tab
- **Expected:** See live metrics updating
  - Battery: Decreasing (simulated drain)
  - CPU: Fluctuating
  - Temperature: Changing
  - Signal: Varying

**Watch browser console for:**
```
📡 Telemetry update from robot_01: {battery: 84.5, cpu: 43.2, temperature: 35.1, signal: 88.2}
📊 Updating dashboard with telemetry: ...
✅ Dashboard updated with real telemetry data
```

---

## Server Terminal Output - What to Expect

When everything is working:

```
🔹 [WEBSITE] Received: type=robot_move
📤 Broadcasting to 1 robot(s): robot_move
✅ Sent to robot robot_01

🔹 [ROBOT] Received: type=telemetry
💾 Saved to database
📤 Broadcasting to 1 website(s): telemetry_update
✅ Sent to website
```

---

## Component Status Check

### ✅ File: `robot/consumers.py`
- **TelemetryConsumer** now handles both website and robot
- **Broadcasting functions** send to all robots and all websites
- **Message routing** based on device_type

### ✅ File: `robot/static/robot/js/app.js`
- **socket.onmessage** now handles telemetry_update
- **updateDashboardFromTelemetry()** updates live metrics
- **sendControlMessage()** sends to server

### ✅ File: `robot_client.py` (NEW)
- Simulated robot that connects with ?device_id parameter
- Sends telemetry every 3 seconds
- Receives and logs control commands

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────┐
│           DJANGO WEBSOCKET SERVER                   │
│          (Single endpoint: /ws/telemetry/)          │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│  WEBSITE CONNECTED   │  ROBOT CONNECTED            │
│  (Browser)           │  (IoT Device/Simulator)     │
│                      │                              │
│  Sends:              │  Sends:                     │
│  • robot_move        │  • telemetry                │
│  • camera_move       │  • status                   │
│  • set_speed         │                             │
│  • set_brightness    │  Receives:                  │
│                      │  • robot_move               │
│  Receives:           │  • camera_move              │
│  • telemetry_update  │  • set_speed                │
│  • robot_status      │  • set_brightness           │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
```

---

## Common Issues & Solutions

### Issue 1: Robot doesn't connect

**Error:** `ConnectionRefusedError`

**Solution:**
- Ensure Django is running: `python -m daphne -p 8000 ...`
- Ensure Daphne started successfully
- Check firewall allows port 8000

### Issue 2: Website doesn't receive telemetry

**Error:** Dashboard shows old data, not updating

**Solution:**
- Ensure robot is running: `python robot_client.py robot_01`
- Check browser console for errors
- Verify socket connection is open: In console, type `socket.readyState` (should be 1)

### Issue 3: Robot terminal shows "COMMAND" but server doesn't show broadcast

**Error:** Robot receives command but website doesn't get ACK

**Solution:**
- Check both connections are shown in server output:
  ```
  ✅ Website/Dashboard connected
  ✅ Robot connected: robot_01
  ```
- Verify no errors in server terminal

### Issue 4: "No module websockets"

**Error:** `ModuleNotFoundError: No module named 'websockets'`

**Solution:**
```powershell
pip install websockets
```

---

## Testing Checklist

- [ ] Django server running
- [ ] Robot client running
- [ ] Website loads at http://localhost:8000/robot/controller/
- [ ] Browser console has no errors
- [ ] WebSocket connection shows as open (readyState === 1)
- [ ] Moving joystick shows command in robot terminal
- [ ] Moving slider shows command in robot terminal
- [ ] Dashboard tab shows updating metrics
- [ ] All values in dashboard change every 3 seconds
- [ ] No errors in server terminal
- [ ] No errors in browser console

---

## What's Working Now

✅ **Website Controls Robot**
- Joystick → robot_move command
- Sliders → set_speed, set_brightness
- Server forwards to robot

✅ **Robot Sends Telemetry**
- Every 3 seconds
- Battery, CPU, Temperature, Signal
- Saved to database

✅ **Dashboard Updates Live**
- Receives telemetry from server
- Updates metrics in real-time
- Shows device status

✅ **Complete Routing**
- Website ↔ Server ↔ Robot
- Broadcasting to multiple clients
- Proper acknowledgments

---

## Next Steps

### For Testing:
1. Run all three components (Server, Robot, Website)
2. Check console logs
3. Verify data flow

### For Production:
1. Replace `robot_client.py` simulator with real hardware
2. Connect actual sensors in `send_telemetry()`
3. Connect actual motors in `receive_commands()`

---

## Live Metrics Update

When telemetry is received, the dashboard shows:

```
┌─────────────────────────────────────────┐
│     Device 1 — Live Metrics             │
├─────────────────────────────────────────┤
│                                         │
│  📊 Battery Level:  85%                 │
│     [████████████████░░]                │
│                                         │
│  ⚙️  CPU Usage:     38%                  │
│     [█████████░░░░░░░░░]                │
│                                         │
│  🌡️  Temperature:   41°C                │
│                                         │
│  📶 Signal Strength: 93%                │
│     [████████████████░░]                │
│                                         │
└─────────────────────────────────────────┘
```

All values update every 3 seconds from real data! ✅

---

**Ready to test?** Follow the "5-Minute Quick Test" above! 🚀
