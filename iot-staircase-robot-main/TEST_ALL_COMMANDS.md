# 🎮 Complete Command Testing Guide

## All Controllers Must Work

This guide ensures **EVERY** control command works end-to-end:
1. ✅ **Robot Movement** (Joystick)
2. ✅ **Camera Movement** (Joystick)
3. ✅ **Speed Control** (Slider)
4. ✅ **Brightness Control** (Slider)

---

## Setup (3 Terminals)

### Terminal 1: Start Django Server
```powershell
cd f:\mosaique\staircaserobot\iot-staircase-robot-main
python -m daphne -p 8000 staircasebot.asgi:application
```

**Expected Output:**
```
Starting Daphne server on tcp/ip 127.0.0.1:8000
```

### Terminal 2: Start Robot Simulator
```powershell
cd f:\mosaique\staircaserobot\iot-staircase-robot-main
python robot_client.py robot_01
```

**Expected Output:**
```
✅ Robot robot_01 connected!
```

### Terminal 3: Open Website
```
http://localhost:8000/robot/controller/
```

**Press:** F12 to open Developer Console

---

## Test 1: Robot Movement (Joystick)

### Action
1. Go to **Controller** tab
2. **Drag** the **Robot Joystick** (left side)

### Expected Output

**Browser Console:**
```
⚡ SENDING SPEED TO ROBOT: [percent]%
📤 Speed message: {"type":"set_speed","value":[number]}
✅ ACK: robot_move - Command received: Robot move x=0.5, y=-0.3
📡 Telemetry update from robot_01
```

**Server Terminal 1:**
```
🌐 ===== WEBSITE COMMAND RECEIVED =====
   Type: robot_move
   Data: {'type': 'robot_move', 'x': 0.5, 'y': -0.3}
   Connected robots: ['robot_01']

🤖🤖🤖 ROBOT_MOVE COMMAND FROM WEBSITE: x=0.5, y=-0.3
   Forwarding to 1 robot(s)...
   ✅ Robot move command forwarded

📤 BROADCAST TO ROBOTS
   Message type: robot_move
   Target robots: 1
   Robot IDs: ['robot_01']
   ✅ Sent to robot_01
```

**Robot Terminal 2:**
```
📨 [robot_01] RECEIVED MESSAGE TYPE: robot_move

🎮🎮🎮 ROBOT MOVEMENT COMMAND
        X: 0.5
        Y: -0.3
        → TODO: Apply to motor controller
```

---

## Test 2: Camera Movement (Joystick)

### Action
1. Still on **Controller** tab
2. **Drag** the **Camera Joystick** (right side)

### Expected Output

**Browser Console:**
```
✅ ACK: camera_move - Command received: Camera move x=0.2, y=0.8
```

**Server Terminal 1:**
```
🌐 ===== WEBSITE COMMAND RECEIVED =====
   Type: camera_move
   Data: {'type': 'camera_move', 'x': 0.2, 'y': 0.8}

📷📷📷 CAMERA_MOVE COMMAND FROM WEBSITE: x=0.2, y=0.8
   Forwarding to 1 robot(s)...
   ✅ Camera move command forwarded
```

**Robot Terminal 2:**
```
📨 [robot_01] RECEIVED MESSAGE TYPE: camera_move

📷📷📷 CAMERA MOVEMENT COMMAND
        X: 0.2
        Y: 0.8
        → TODO: Apply to servo
```

---

## Test 3: Speed Control (Slider)

### Action
1. Still on **Controller** tab
2. **Drag** the **Speed Slider** to 75%

### Expected Output

**Browser Console:**
```
⚡ SENDING SPEED TO ROBOT: 75%
📤 Speed message: {"type":"set_speed","value":75}
✅ ACK: set_speed - Command received: Speed set to 75%
```

**Server Terminal 1:**
```
🌐 ===== WEBSITE COMMAND RECEIVED =====
   Type: set_speed
   Data: {'type': 'set_speed', 'value': 75}

⚡⚡⚡ SET_SPEED COMMAND FROM WEBSITE: 75%
   Forwarding to 1 robot(s)...
   ✅ Speed command forwarded to robots

📤 BROADCAST TO ROBOTS
   Message type: set_speed
   Target robots: 1
   Robot IDs: ['robot_01']
   ✅ Sent to robot_01
```

**Robot Terminal 2:**
```
📨 [robot_01] RECEIVED MESSAGE TYPE: set_speed

⚡⚡⚡ SPEED CONTROL COMMAND
        Speed: 75%
        → TODO: Apply to motor speed
```

---

## Test 4: Brightness Control (Slider)

### Action
1. Still on **Controller** tab
2. **Drag** the **Brightness Slider** to 50%

### Expected Output

**Browser Console:**
```
💡 SENDING BRIGHTNESS TO ROBOT: 50%
📤 Brightness message: {"type":"set_brightness","value":50}
✅ ACK: set_brightness - Command received: Brightness set to 50%
```

**Server Terminal 1:**
```
🌐 ===== WEBSITE COMMAND RECEIVED =====
   Type: set_brightness
   Data: {'type': 'set_brightness', 'value': 50}

💡💡💡 SET_BRIGHTNESS COMMAND FROM WEBSITE: 50%
   Forwarding to 1 robot(s)...
   ✅ Brightness command forwarded to robots

📤 BROADCAST TO ROBOTS
   Message type: set_brightness
   Target robots: 1
   Robot IDs: ['robot_01']
   ✅ Sent to robot_01
```

**Robot Terminal 2:**
```
📨 [robot_01] RECEIVED MESSAGE TYPE: set_brightness

💡💡💡 BRIGHTNESS CONTROL COMMAND
        Brightness: 50%
        → TODO: Apply to LED
```

---

## Test 5: Telemetry Reception

### Action
1. Go to **Dashboard** tab
2. Watch metrics update

### Expected Output

**Browser Console:**
```
📡 Telemetry update from robot_01: {
    battery: 85.0,
    cpu: 45.2,
    temperature: 34.8,
    signal: 89.5
}
✅ Dashboard updated with real telemetry data
```

**Dashboard Display:**
- Battery: Updates every 3 seconds
- CPU: Updates every 3 seconds
- Temperature: Updates every 3 seconds
- Signal: Updates every 3 seconds

**Server Terminal 1:**
```
📡 TELEMETRY from robot_01: Battery=85%, CPU=45.2%, Temp=34.8°C, Signal=89.5%

📤 BROADCAST TO WEBSITES
   Message type: telemetry_update
   Target websites: 1
   Website IDs: ['dashboard']
   ✅ Sent to dashboard
```

**Robot Terminal 2:**
```
📡 Telemetry sent: Battery=85.0%, CPU=45.2%, Temp=34.8°C, Signal=89.5%
✅ ACK for telemetry: Telemetry data received and saved
```

---

## Verification Checklist

### ✅ Robot Movement
- [ ] Joystick drag sends command
- [ ] Browser console shows `✅ ACK: robot_move`
- [ ] Server shows `🤖🤖🤖 ROBOT_MOVE COMMAND`
- [ ] Robot terminal shows `🎮🎮🎮 ROBOT MOVEMENT COMMAND`

### ✅ Camera Movement
- [ ] Camera joystick drag sends command
- [ ] Browser console shows `✅ ACK: camera_move`
- [ ] Server shows `📷📷📷 CAMERA_MOVE COMMAND`
- [ ] Robot terminal shows `📷📷📷 CAMERA MOVEMENT COMMAND`

### ✅ Speed Control
- [ ] Speed slider drag sends command
- [ ] Browser console shows `⚡ SENDING SPEED TO ROBOT`
- [ ] Browser console shows `✅ ACK: set_speed`
- [ ] Server shows `⚡⚡⚡ SET_SPEED COMMAND FROM WEBSITE`
- [ ] Robot terminal shows `⚡⚡⚡ SPEED CONTROL COMMAND`

### ✅ Brightness Control
- [ ] Brightness slider drag sends command
- [ ] Browser console shows `💡 SENDING BRIGHTNESS TO ROBOT`
- [ ] Browser console shows `✅ ACK: set_brightness`
- [ ] Server shows `💡💡💡 SET_BRIGHTNESS COMMAND FROM WEBSITE`
- [ ] Robot terminal shows `💡💡💡 BRIGHTNESS CONTROL COMMAND`

### ✅ Telemetry
- [ ] Dashboard shows live metrics
- [ ] Metrics update every 3 seconds
- [ ] Server shows telemetry received
- [ ] Robot shows telemetry sent

---

## Troubleshooting

### Issue: Speed/Brightness not showing in robot terminal

**Check:**
1. Is robot connected? (Server should show `✅ Robot connected: robot_01`)
2. Are sliders being moved? (Check browser console)
3. Does browser show ACK? (Look for `✅ ACK: set_speed`)
4. Does server show broadcast? (Look for `⚡⚡⚡ SET_SPEED COMMAND`)

### Issue: No ACK messages

**Check:**
1. Is browser console open? (F12)
2. Is WebSocket connected? (Look for `✅ WebSocket connected`)
3. Check server logs for errors

### Issue: Robot not receiving commands

**Check:**
1. Is robot_client.py running? (Terminal 2)
2. Does robot terminal show `✅ Robot robot_01 connected!`?
3. Are commands being broadcast? (Check server output for `📤 BROADCAST TO ROBOTS`)

---

## Success Indicators

✅ **All tests passing when:**

1. **Robot Movement works** - Joystick sends x,y to robot
2. **Camera Movement works** - Camera joystick sends x,y to robot
3. **Speed Slider works** - Moving slider shows command at robot
4. **Brightness Slider works** - Moving slider shows command at robot
5. **Telemetry updates** - Dashboard shows live metrics every 3 seconds

🎉 **All controllers are working!**

