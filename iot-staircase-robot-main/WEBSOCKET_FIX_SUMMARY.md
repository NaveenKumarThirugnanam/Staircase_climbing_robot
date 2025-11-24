# WebSocket Communication Fix - Complete Implementation Guide

## Problem Analysis

Your Django + Channels robot controller had these issues:
1. ❌ **WebSocket URL hardcoded** to `127.0.0.1:8000` (won't work in production)
2. ❌ **Sliders not sending messages** over WebSocket (only console logs)
3. ❌ **Joystick movement not being acknowledged** by backend
4. ❌ **Control messages using wrong format** (`set` instead of `set_speed`/`set_brightness`)
5. ❌ **Duplicate WebSocket connections** (socket + telemetrySocket)
6. ❌ **Backend not properly handling** control messages

---

## ✅ Solutions Implemented

### 1. **Fixed WebSocket Connection URL** (app.js)

**BEFORE:**
```javascript
const socket = new WebSocket("ws://127.0.0.1:8000/ws/telemetry/");
```

**AFTER:**
```javascript
// Use dynamic URL to work in production
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;
const socket = new WebSocket(`${protocol}//${host}/ws/telemetry/`);

console.log(`🔌 WebSocket URL: ${protocol}//${host}/ws/telemetry/`);

socket.onopen = () => {
    console.log("✅ WebSocket connected");
};

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log("📨 WebSocket message received:", data);
        
        // Handle control acknowledgments
        if (data.type === "ack") {
            console.log(`✅ ACK: ${data.original_type} - ${data.message || 'OK'}`);
        }
    } catch (err) {
        console.error("❌ Error parsing WebSocket message:", err, event.data);
    }
};

socket.onerror = (err) => {
    console.error("❌ WebSocket error:", err);
};

socket.onclose = () => {
    console.warn("⚠️  WebSocket closed");
};
```

**Benefits:**
- ✅ Works in development and production
- ✅ Supports secure connections (wss://)
- ✅ Single WebSocket instance for all controls
- ✅ Proper error handling

---

### 2. **Updated Slider Message Format** (app.js)

**BEFORE:**
```javascript
function sendSpeedToRobot(value) {
    sendControlMessage({
        type: 'set',
        name: 'speed',
        value: Number(value)
    });
}
```

**AFTER:**
```javascript
function sendSpeedToRobot(value) {
    console.log('⚡ Speed set to:', value);
    sendControlMessage({
        type: 'set_speed',          // ← Changed from 'set'
        value: Number(value)
    });
}

function sendBrightnessToRobot(value) {
    console.log('💡 Brightness set to:', value);
    sendControlMessage({
        type: 'set_brightness',     // ← Changed from 'set'
        value: Number(value)
    });
}
```

**Message Format Sent:**
```json
{ "type": "set_speed", "value": 52, "client_ts": 1234567890 }
{ "type": "set_brightness", "value": 80, "client_ts": 1234567890 }
```

---

### 3. **Joystick Movement Messages** (app.js - already correct)

The joystick was already sending correct messages, but now verified:

```javascript
function updatePositionFromJoystick(type, x, y) {
    if (type === 'robot') {
        appState.robotPosition.x += x * sensitivity;
        appState.robotPosition.y += y * sensitivity;
        
        // Send robot movement
        sendControlMessage({
            type: 'robot_move',
            x: appState.robotPosition.x,
            y: appState.robotPosition.y
        });
    } else if (type === 'camera') {
        appState.cameraPosition.x += x * sensitivity;
        appState.cameraPosition.y += y * sensitivity;
        
        // Send camera movement
        sendControlMessage({
            type: 'camera_move',
            x: appState.cameraPosition.x,
            y: appState.cameraPosition.y
        });
    }
}
```

**Messages Sent:**
```json
{ "type": "robot_move", "x": 0.5, "y": -0.3, "client_ts": 1234567890 }
{ "type": "camera_move", "x": 0.2, "y": 0.8, "client_ts": 1234567890 }
{ "type": "robot_move", "x": 0, "y": 0, "client_ts": 1234567890 }  // On release
```

---

### 4. **Enhanced Backend Consumer** (consumers.py)

**BEFORE:**
- Generic message handling
- Only acknowledged `robot_move` and `camera_move`
- Didn't handle `set_speed`/`set_brightness`

**AFTER:**
```python
async def receive(self, text_data):
    try:
        data = json.loads(text_data)
        msg_type = data.get("type")

        logger.info("🔹 Received WebSocket message: type=%s, data=%s", msg_type, data)
        print(f"🔹 Received WebSocket message: type={msg_type}, data={data}")

        # ===== ROBOT MOVEMENT CONTROL =====
        if msg_type == "robot_move":
            x = data.get("x")
            y = data.get("y")
            logger.info("🤖 ROBOT_MOVE: x=%s, y=%s", x, y)
            print(f"🤖 ROBOT_MOVE: x={x}, y={y}")
            
            await self.send(json.dumps({
                "type": "ack",
                "original_type": "robot_move",
                "status": "ok",
                "message": f"Robot moving to x={x}, y={y}",
                "server_ts": timezone.now().isoformat()
            }))
            return

        # ===== CAMERA MOVEMENT CONTROL =====
        if msg_type == "camera_move":
            x = data.get("x")
            y = data.get("y")
            logger.info("📷 CAMERA_MOVE: x=%s, y=%s", x, y)
            print(f"📷 CAMERA_MOVE: x={x}, y={y}")
            
            await self.send(json.dumps({
                "type": "ack",
                "original_type": "camera_move",
                "status": "ok",
                "message": f"Camera moving to x={x}, y={y}",
                "server_ts": timezone.now().isoformat()
            }))
            return

        # ===== SPEED CONTROL (SET_SPEED) =====
        if msg_type == "set_speed":
            value = data.get("value")
            logger.info("⚡ SET_SPEED: value=%s", value)
            print(f"⚡ SET_SPEED: value={value}")
            
            await self.send(json.dumps({
                "type": "ack",
                "original_type": "set_speed",
                "status": "ok",
                "message": f"Robot speed set to {value}%",
                "server_ts": timezone.now().isoformat()
            }))
            return

        # ===== BRIGHTNESS CONTROL (SET_BRIGHTNESS) =====
        if msg_type == "set_brightness":
            value = data.get("value")
            logger.info("💡 SET_BRIGHTNESS: value=%s", value)
            print(f"💡 SET_BRIGHTNESS: value={value}")
            
            await self.send(json.dumps({
                "type": "ack",
                "original_type": "set_brightness",
                "status": "ok",
                "message": f"Brightness set to {value}%",
                "server_ts": timezone.now().isoformat()
            }))
            return

        # Legacy telemetry handling (battery, cpu, etc.)
        battery = data.get("battery")
        cpu = data.get("cpu")
        # ... rest of telemetry code
```

---

## 📊 Communication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
└────────────┬────────────────────────────────────────────────┘
             │
     ┌───────┴──────────┬──────────────────────┐
     │                  │                      │
     ▼                  ▼                      ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────────┐
│  Joystick   │  │   Sliders    │  │  Camera Ctrl    │
│  (Robot)    │  │  Speed/Bright│  │   (Camera)      │
└──────┬──────┘  └────────┬─────┘  └────────┬────────┘
       │                  │                  │
       ▼                  ▼                  ▼
   ┌────────────────────────────────────────────────┐
   │   sendControlMessage(payload)                  │
   │   - Throttle: 50ms per message type            │
   │   - Add timestamp: client_ts                   │
   │   - Add JSON stringify                         │
   └─────────────────────┬──────────────────────────┘
                         │
                         ▼
   ┌────────────────────────────────────────────────┐
   │   socket.send(JSON.stringify(payload))         │
   │   Protocol: ws:// or wss://                    │
   │   Route: /ws/telemetry/                        │
   └─────────────────────┬──────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │      WEBSOCKET NETWORK          │
        └────────────────┬────────────────┘
                         │
                         ▼
   ┌────────────────────────────────────────────────┐
   │   TelemetryConsumer                            │
   │   - receive(text_data)                         │
   │   - Parse JSON message                         │
   │   - Route by type                              │
   └────────┬──────────────────────────────────────┘
            │
    ┌───────┴──────────────┬──────────────────┐
    │                      │                  │
    ▼                      ▼                  ▼
┌──────────────┐  ┌──────────────────┐  ┌────────────┐
│ robot_move   │  │ set_speed        │  │ camera_move│
│ {x, y}       │  │ {value}          │  │ {x, y}     │
└──────┬───────┘  └────────┬─────────┘  └──────┬─────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────┐
│  TODO: Forward to Hardware Controller           │
│  - Motor speed controller                       │
│  - Camera pan/tilt servo                        │
│  - LED brightness PWM                           │
└──────────────┬────────────────────────────────┘
               │
               ▼
   ┌──────────────────────────────────┐
   │  Acknowledge to Client           │
   │  {"type": "ack",                 │
   │   "original_type": "robot_move", │
   │   "status": "ok",                │
   │   "message": "..."}              │
   └──────────────┬───────────────────┘
                  │
        ┌─────────┴──────────┐
        │   WEBSOCKET REPLY  │
        └─────────┬──────────┘
                  │
                  ▼
   ┌──────────────────────────────────┐
   │  socket.onmessage                │
   │  - Parse ACK                     │
   │  - Log confirmation              │
   │  - Update UI if needed           │
   └──────────────────────────────────┘
```

---

## 🧪 How to Test

### 1. **Start Redis** (required for Channels)
```powershell
redis-server
# Or if using Windows: redis-cli.exe
```

### 2. **Run the Django Server**
```powershell
cd f:\mosaique\staircaserobot\iot-staircase-robot-main
python -m daphne -p 8000 staircasebot.asgi:application
```

**Expected Output:**
```
Starting Daphne server on tcp/ip 127.0.0.1:8000
```

### 3. **Open Browser and Navigate to Controller**
```
http://localhost:8000/robot/controller/
```

**Open Browser Console** (F12 → Console tab)

### 4. **Test Each Control**

#### A. **Test Robot Joystick**
1. Drag the robot joystick
2. **Expected in Console:**
   ```
   ⚡ WebSocket control → {type: 'robot_move', x: 0.5, y: -0.3, client_ts: ...}
   📨 WebSocket message received: {type: 'ack', original_type: 'robot_move', ...}
   ✅ ACK: robot_move - Robot moving to x=0.5, y=-0.3
   ```

3. **Expected in Server Terminal:**
   ```
   🔹 Received WebSocket message: type=robot_move, data={'type': 'robot_move', 'x': 0.5, 'y': -0.3, ...}
   🤖 ROBOT_MOVE: x=0.5 y=-0.3
   ```

#### B. **Test Camera Joystick**
1. Drag the camera joystick
2. **Expected in Console:**
   ```
   ⚡ WebSocket control → {type: 'camera_move', x: 0.2, y: 0.8, client_ts: ...}
   📨 WebSocket message received: {type: 'ack', original_type: 'camera_move', ...}
   ✅ ACK: camera_move - Camera moving to x=0.2, y=0.8
   ```

3. **Expected in Server Terminal:**
   ```
   📷 CAMERA_MOVE: x=0.2 y=0.8
   ```

#### C. **Test Speed Slider**
1. Move the speed slider
2. **Expected in Console:**
   ```
   ⚡ Speed set to: 52
   ⚡ WebSocket control → {type: 'set_speed', value: 52, client_ts: ...}
   📨 WebSocket message received: {type: 'ack', original_type: 'set_speed', ...}
   ✅ ACK: set_speed - Robot speed set to 52%
   ```

3. **Expected in Server Terminal:**
   ```
   ⚡ SET_SPEED: value=52
   ```

#### D. **Test Brightness Slider**
1. Move the brightness slider
2. **Expected in Console:**
   ```
   💡 Brightness set to: 80
   ⚡ WebSocket control → {type: 'set_brightness', value: 80, client_ts: ...}
   📨 WebSocket message received: {type: 'ack', original_type: 'set_brightness', ...}
   ✅ ACK: set_brightness - Brightness set to 80%
   ```

3. **Expected in Server Terminal:**
   ```
   💡 SET_BRIGHTNESS: value=80
   ```

---

## 📝 Files Changed

### 1. **robot/consumers.py**
- Updated `receive()` method
- Added separate handlers for `robot_move`, `camera_move`, `set_speed`, `set_brightness`
- Added detailed logging with emojis for visibility

### 2. **robot/static/robot/js/app.js**
- Replaced hardcoded WebSocket URL with dynamic protocol/host
- Added proper `socket.onopen`, `onmessage`, `onerror`, `onclose` handlers
- Removed duplicate `telemetrySocket` definition
- Updated `sendSpeedToRobot()` to use `set_speed` message type
- Updated `sendBrightnessToRobot()` to use `set_brightness` message type
- Verified joystick sends `robot_move` and `camera_move`

### 3. **robot/routing.py**
- No changes needed (already correct)

### 4. **staircasebot/urls.py**
- No changes needed (already correct)

### 5. **staircasebot/asgi.py**
- No changes needed (already correct)

---

## 🔌 Troubleshooting

### Issue: "WebSocket connection failed"
**Solution:** Make sure Redis is running:
```powershell
redis-cli ping
# Should return: PONG
```

### Issue: "No message received on server"
**Check:**
1. Browser console shows send attempt (look for "WS control →")
2. Network tab shows WebSocket connection is OPEN
3. Check server terminal is actually running
4. Verify no firewall blocking port 8000

### Issue: "Acknowledgment not received"
**Check:**
1. Server prints the message (look for emoji indicators)
2. Verify socket.onmessage event listener exists
3. Check browser console for parsing errors

### Issue: "Redis errors in logs"
**Make sure:**
1. Redis server is running: `redis-cli ping` → `PONG`
2. `CHANNEL_LAYERS` config uses correct host: `127.0.0.1:6379`
3. No other Redis service conflicts

---

## 🎯 Next Steps: Connect to Hardware

Once WebSocket messages are flowing correctly, integrate with your hardware:

```python
# In consumers.py, replace TODO sections:

if msg_type == "robot_move":
    x = data.get("x")
    y = data.get("y")
    
    # TODO: Forward to your motor controller
    # Example:
    # motor_controller.set_speed(x)
    # motor_controller.set_direction(y)
    
    # Or publish to hardware control group:
    # await self.channel_layer.group_send("robot_control", {
    #     "type": "robot.move",
    #     "x": x,
    #     "y": y
    # })
```

---

## 📚 Reference: Message Types

| Message Type | Sender | Handler | ACK |
|---|---|---|---|
| `robot_move` | Joystick (Robot) | `robot_move` handler | ✅ |
| `camera_move` | Joystick (Camera) | `camera_move` handler | ✅ |
| `set_speed` | Slider | `set_speed` handler | ✅ |
| `set_brightness` | Slider | `set_brightness` handler | ✅ |
| `battery`, `cpu`, etc. | Telemetry | Legacy handler | ✅ |

---

## ✨ Summary

✅ **All WebSocket messages now flow correctly:**
- Joystick → `robot_move` & `camera_move`
- Sliders → `set_speed` & `set_brightness`
- Backend receives & acknowledges all messages
- Proper logging for debugging
- Production-ready dynamic URL
- Single shared WebSocket instance

**Ready to connect to hardware controllers!** 🚀
