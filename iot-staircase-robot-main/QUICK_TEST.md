# 🎮 Quick Controller Test

## Run These 3 Commands (in 3 different terminals)

### Terminal 1: Start Server
```powershell
cd f:\mosaique\staircaserobot\iot-staircase-robot-main
python -m daphne -p 8000 staircasebot.asgi:application
```

### Terminal 2: Start Robot
```powershell
cd f:\mosaique\staircaserobot\iot-staircase-robot-main
python robot_client.py robot_01
```

### Terminal 3: Open Browser
```
http://localhost:8000/robot/controller/
Press F12 (Open Console)
```

---

## Test Each Controller

### 1️⃣ Robot Joystick (MOVEMENT)
**Action:** Drag left joystick around

**See in Terminal 2:**
```
🎮🎮🎮 ROBOT MOVEMENT COMMAND
        X: 0.5
        Y: -0.3
```

---

### 2️⃣ Camera Joystick (CAMERA)
**Action:** Drag right joystick around

**See in Terminal 2:**
```
📷📷📷 CAMERA MOVEMENT COMMAND
        X: 0.2
        Y: 0.8
```

---

### 3️⃣ Speed Slider
**Action:** Move slider to 75%

**See in Terminal 2:**
```
⚡⚡⚡ SPEED CONTROL COMMAND
        Speed: 75%
```

---

### 4️⃣ Brightness Slider
**Action:** Move slider to 50%

**See in Terminal 2:**
```
💡💡💡 BRIGHTNESS CONTROL COMMAND
        Brightness: 50%
```

---

## Check Browser Console (F12)

### Should See:
```
✅ ACK: robot_move - Command received...
✅ ACK: camera_move - Command received...
✅ ACK: set_speed - Command received...
✅ ACK: set_brightness - Command received...
📡 Telemetry update from robot_01
```

---

## ✅ ALL WORKING WHEN:

- ✅ Moving joystick shows command on robot terminal
- ✅ Moving speed slider shows `⚡⚡⚡ SPEED CONTROL COMMAND` on robot
- ✅ Moving brightness slider shows `💡💡💡 BRIGHTNESS CONTROL COMMAND` on robot
- ✅ Browser console shows ACK messages
- ✅ Dashboard shows live telemetry updating

---

## 🎉 Success = All 4 Controllers Working!

