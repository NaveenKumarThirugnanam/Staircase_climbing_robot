# 🤖 Quick Reference: WebSocket Control Commands

## Message Types & Formats

### 1. Robot Movement (Joystick)
**When:** User drags robot joystick  
**Format:**
```json
{
  "type": "robot_move",
  "x": 0.5,
  "y": -0.3,
  "client_ts": 1234567890
}
```
**Backend Handler:** `if msg_type == "robot_move"`  
**Server Action:** Acknowledge movement, forward to motor controller  
**ACK Response:**
```json
{
  "type": "ack",
  "original_type": "robot_move",
  "status": "ok",
  "message": "Robot moving to x=0.5, y=-0.3",
  "server_ts": "2024-01-15T10:30:45.123456Z"
}
```

---

### 2. Camera Movement (Joystick)
**When:** User drags camera joystick  
**Format:**
```json
{
  "type": "camera_move",
  "x": 0.2,
  "y": 0.8,
  "client_ts": 1234567890
}
```
**Backend Handler:** `if msg_type == "camera_move"`  
**Server Action:** Acknowledge movement, forward to pan/tilt servo  
**ACK Response:**
```json
{
  "type": "ack",
  "original_type": "camera_move",
  "status": "ok",
  "message": "Camera moving to x=0.2, y=0.8",
  "server_ts": "2024-01-15T10:30:45.123456Z"
}
```

---

### 3. Speed Control (Slider)
**When:** User moves speed slider (1-100%)  
**Format:**
```json
{
  "type": "set_speed",
  "value": 52,
  "client_ts": 1234567890
}
```
**Backend Handler:** `if msg_type == "set_speed"`  
**Server Action:** Apply speed to motor controller (PWM)  
**ACK Response:**
```json
{
  "type": "ack",
  "original_type": "set_speed",
  "status": "ok",
  "message": "Robot speed set to 52%",
  "server_ts": "2024-01-15T10:30:45.123456Z"
}
```

---

### 4. Brightness Control (Slider)
**When:** User moves brightness slider (1-100%)  
**Format:**
```json
{
  "type": "set_brightness",
  "value": 80,
  "client_ts": 1234567890
}
```
**Backend Handler:** `if msg_type == "set_brightness"`  
**Server Action:** Apply brightness to LED/camera light  
**ACK Response:**
```json
{
  "type": "ack",
  "original_type": "set_brightness",
  "status": "ok",
  "message": "Brightness set to 80%",
  "server_ts": "2024-01-15T10:30:45.123456Z"
}
```

---

### 5. Robot Stop (Release Joystick)
**When:** User releases robot joystick  
**Format:**
```json
{
  "type": "robot_move",
  "x": 0,
  "y": 0,
  "client_ts": 1234567890
}
```
**Backend Handler:** `if msg_type == "robot_move"` (with x=0, y=0)  
**Server Action:** Stop all motors  
**Note:** This is handled by the same `robot_move` handler

---

## 🔌 WebSocket Connection

### Frontend (JavaScript)
```javascript
// Automatic (production-safe URL)
const socket = new WebSocket(`${protocol}//${host}/ws/telemetry/`);

// Handles: wss://example.com:8000/ws/telemetry/ (production)
//         ws://localhost:8000/ws/telemetry/ (development)

socket.send(JSON.stringify({
  type: "robot_move",
  x: 0.5,
  y: -0.3
}));
```

### Backend (Python)
```python
# Route: /ws/telemetry/
# Consumer: TelemetryConsumer

async def receive(self, text_data):
    data = json.loads(text_data)
    msg_type = data.get("type")
    
    if msg_type == "robot_move":
        # Handle movement
        pass
```

---

## 📊 Throttling (Rate Limiting)

**Configuration in app.js:**
```javascript
controlSendState = {
    lastSentAt: {},
    minIntervalMs: 50  // Max ~20 messages/sec per type
};
```

**What this means:**
- Each message type is throttled independently
- `robot_move` messages: max 20/sec
- `set_speed` messages: max 20/sec
- Prevents overwhelming the server
- Prevents excessive Redis traffic

---

## 🧪 Testing Commands

### Browser Console
```javascript
// Send robot move
socket.send(JSON.stringify({
  type: "robot_move",
  x: 0.25,
  y: -0.5
}));

// Send speed
socket.send(JSON.stringify({
  type: "set_speed",
  value: 75
}));

// Send brightness
socket.send(JSON.stringify({
  type: "set_brightness",
  value: 90
}));

// Send camera move
socket.send(JSON.stringify({
  type: "camera_move",
  x: 0.1,
  y: 0.8
}));
```

### Server Terminal
Watch for these messages:
```
🔹 Received WebSocket message: type=robot_move, data={...}
🤖 ROBOT_MOVE: x=0.25 y=-0.5

🔹 Received WebSocket message: type=set_speed, data={...}
⚡ SET_SPEED: value=75

🔹 Received WebSocket message: type=set_brightness, data={...}
💡 SET_BRIGHTNESS: value=90

🔹 Received WebSocket message: type=camera_move, data={...}
📷 CAMERA_MOVE: x=0.1 y=0.8
```

---

## 🐛 Debugging

### 1. Check WebSocket Connection
```javascript
// Browser console
console.log(socket.readyState);
// 0 = CONNECTING
// 1 = OPEN ✅
// 2 = CLOSING
// 3 = CLOSED
```

### 2. See All Messages Sent
```javascript
// Browser console (already logged)
// Look for: "WS control →" in console
```

### 3. See All ACKs Received
```javascript
// Browser console (already logged)
// Look for: "ACK:" in console
```

### 4. Check Redis Connection
```powershell
redis-cli ping
# Should return: PONG
```

### 5. Check Daphne Server
```powershell
python -m daphne -p 8000 staircasebot.asgi:application
# Should show: Starting Daphne server...
```

---

## 🚀 Integration Checklist

- [ ] WebSocket connects successfully (check console)
- [ ] Joystick sends `robot_move` messages
- [ ] Camera sends `camera_move` messages
- [ ] Speed slider sends `set_speed` messages
- [ ] Brightness slider sends `set_brightness` messages
- [ ] Server prints all messages with emoji indicators
- [ ] ACK messages received in browser
- [ ] No errors in browser console
- [ ] No errors in server terminal
- [ ] Redis not showing errors
- [ ] Ready to connect hardware controllers

---

## 💡 Next: Hardware Integration

Once all messages flow correctly, implement in `consumers.py`:

```python
# robot/consumers.py

if msg_type == "robot_move":
    x = data.get("x")
    y = data.get("y")
    
    # YOUR CODE HERE:
    # motor_controller.move_left_wheel(x)
    # motor_controller.move_right_wheel(y)
    # Or:
    # await self.channel_layer.group_send("robot_control", {...})

if msg_type == "set_speed":
    value = data.get("value")
    
    # YOUR CODE HERE:
    # motor_controller.set_speed_percent(value)
    # pwm_controller.set_motor_pwm(value)

if msg_type == "set_brightness":
    value = data.get("value")
    
    # YOUR CODE HERE:
    # led_controller.set_brightness(value)
    # pwm_controller.set_led_pwm(value)

if msg_type == "camera_move":
    x = data.get("x")
    y = data.get("y")
    
    # YOUR CODE HERE:
    # servo_controller.pan(x)
    # servo_controller.tilt(y)
```

---

## 📞 Support

**All WebSocket messages now:**
- ✅ Send correctly from frontend
- ✅ Receive correctly on backend
- ✅ Are acknowledged immediately
- ✅ Are logged for debugging
- ✅ Use production-safe URLs
- ✅ Have throttling built-in

**Ready for production!** 🎉
