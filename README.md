# 🤖 IoT Staircase Climbing Robot System

## Database config (.env)
- Database settings now load from environment variables in [iot-staircase-robot-main/.env](iot-staircase-robot-main/.env); defaults remain aligned with the previous local values.
- Make sure these keys exist before running migrations or starting the server:
```
DB_ENGINE=django.db.backends.postgresql
DB_NAME=staircase_robot
DB_USER=robot_user
DB_PASSWORD=robot123
DB_HOST=localhost
DB_PORT=5432

EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USE_TLS = true
EMAIL_HOST_USER = your_email
EMAIL_HOST_PASSWORD = your email_app_password
DEFAULT_FROM_EMAIL = IoT Robot <your_email>

```

## Prerequisites
- Redis
while running the client run the redis server in the background
- for windows use this to download the redis https://github.com/tporadowski/redis/releases
which is an unoffical version of redis

## Commands

### 1. Start the ASGI server
This command is to run the websocket server.
```bash
python -m daphne -p 8000 staircasebot.asgi:application
```

This command is to run the websocket client for now here we have only one client 1
```bash
python robot_client.py
```

## 📋 Project Overview

This is a **complete IoT robotics system** that allows remote control of a staircase-climbing robot through a modern web dashboard. The system uses **real-time WebSocket communication** for instant control and monitoring.

### Key Features:
- 🎮 **Dual Joystick Control** - Movement + Camera pan/tilt
- 📊 **Real-time Telemetry** - Battery, CPU, temperature, signal strength
- 🎥 **Live Video Streaming** - Real-time camera feed from robot
- 📈 **Advanced Battery Chart** - Highcharts visualization with zoom & pan
- 👤 **User Authentication** - Login/Register/Profile management
- 📱 **Responsive Design** - Works on desktop, tablet, mobile
- 🔗 **Multi-Robot Support** - Control multiple robots from one dashboard

**Tech Stack:**
- **Backend:** Django 5.2 + Django Channels (WebSocket)
- **Frontend:** Vanilla JavaScript + Highcharts
- **Database:** SQLite (dev) / PostgreSQL (production)
- **Hardware:** Raspberry Pi / Laptop with camera

---

## 🎯 System Overview

Your system has **3 main components** that communicate through WebSocket:

```
┌─────────────────────────────────────────────────────────────┐
│                    WEBSITE (Browser)                        │
│  • Dashboard UI showing robot status                        │
│  • Telemetry Display (Battery, CPU, Temp, Signal)          │
│  • Video Stream Display                                     │
│  • Joystick Controls                                        │
│  • Speed & Brightness Sliders                              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │  WebSocket Server       │
        │  (Django Channels)      │
        │  ws://localhost:8000/   │
        │  ws/telemetry/          │
        │                         │
        │  • Routes messages      │
        │  • Broadcasts data      │
        │  • Tracks connections   │
        └────────────┬────────────┘
                     │
        ┌────────────▼──────────────┐
        │  ROBOT (IoT Device)       │
        │  • Raspberry Pi / etc     │
        │  • Camera                 │
        │  • Motors & Servos        │
        │  • Sensors                │
        └──────────────────────────┘
```

---

## 📡 Data Flow: What's Currently Happening

### 1️⃣ **TELEMETRY DATA** (Robot → Server → Website)

**What's sent:**
```javascript
{
  type: "telemetry",           // Message type
  device_id: "robot_01",       // Which robot
  device_name: "Robot robot_01",
  battery: 85.0,              // 📊 Real data you need to provide
  cpu: 38.5,                  // 📊 Real data you need to provide
  temperature: 41.2,          // 📊 Real data you need to provide
  signal: 93.0,               // 📊 Real data you need to provide
  timestamp: "2024-12-03T..."
}
```

**Where it goes:**
```
robot_client.py (sends every 3 seconds)
     ↓
Django WebSocket Server (consumers.py)
     ↓
Broadcasts to all connected websites
     ↓
website/app.js (receives as "telemetry_update")
     ↓
Updates HTML elements:
  - #batteryPercentage (shows "85%")
  - #batteryLevel (width animation)
  - #metricBattery, #metricCpu, #metricTemperature, #metricSignal
```

**Current status:** ❌ **SIMULATED** (Random fake values in robot_client.py lines 130-135)

---

### 2️⃣ **VIDEO FRAMES** (Robot → Server → Website)

**What's sent:**
```javascript
{
  type: "video_frame",        // Message type
  device_id: "robot_01",      // Which robot
  frame_data: "base64_encoded_jpeg_image",  // LARGE DATA ⚠️
  frame_number: 0,
  timestamp: "2024-12-03T..."
}
```

**Size of each frame:** ~3-5 KB per frame (at 70% quality)

**Where it goes:**
```
robot_client.py.send_video_frame() (sends every 2 seconds = 0.5 FPS)
     ↓
Django WebSocket Server (consumers.py)
     ↓
Broadcasts to all connected websites
     ↓
website/app.js (receives as "video_frame")
     ↓
Extracts base64 data
     ↓
Sets as <img> src:
  <img id="videoStream" src="data:image/jpeg;base64,..." />
```

**Current status:** ❌ **SIMULATED** (Generates fake black image with text)

---

### 3️⃣ **CONTROL COMMANDS** (Website → Server → Robot)

**A) Robot Movement**
```javascript
{
  type: "robot_move",
  x: 0.75,      // -1.0 to 1.0 (left-right)
  y: -0.50,     // -1.0 to 1.0 (forward-backward)
  client_ts: 1234567890
}
```

**B) Camera Movement**
```javascript
{
  type: "camera_move",
  x: 0.25,      // -1.0 to 1.0 (pan)
  y: 0.50,      // -1.0 to 1.0 (tilt)
  client_ts: 1234567890
}
```

**C) Speed Control**
```javascript
{
  type: "set_speed",
  value: 75     // 0-100 (percentage)
}
```

**D) Brightness Control**
```javascript
{
  type: "set_brightness",
  value: 85     // 0-100 (percentage)
}
```

**Where it goes:**
```
website/app.js (user moves joystick)
     ↓
sendControlMessage() function (throttled to 20/sec)
     ↓
Sends JSON via WebSocket
     ↓
Django WebSocket Server (consumers.py)
     ↓
Broadcasts to connected robots
     ↓
robot_client.py.receive_commands() (prints message)
     ↓
TODO: Apply to actual hardware
  - Motors (robot_move)
  - Servos (camera_move)
  - PWM Controller (speed, brightness)
```

**Current status:** ✅ **WORKING** (Messages flow correctly, but not applied to hardware)

---

## 🔧 What You Need to Do: Step-by-Step

### Step 1: Replace Simulated Telemetry with Real Sensor Data

**File:** `robot_client.py`

**Current code (lines 130-135):**
```python
# Simulate realistic telemetry changes
self.battery = max(0, self.battery - random.uniform(0.1, 0.5))
self.cpu = 30 + random.uniform(-10, 20)
self.temperature = 35 + random.uniform(-2, 5)
self.signal = 80 + random.uniform(-10, 10)
```

**Replace with real sensor reads:**
```python
# Read real telemetry from sensors
self.battery = read_battery_percentage()      # From ADC/battery monitor
self.cpu = read_cpu_usage()                   # From psutil or /proc/stat
self.temperature = read_temp_sensor()         # From DS18B20 or CPU temp
self.signal = read_wifi_signal()              # From iwconfig or subprocess
```

**Example implementations:**

```python
# Battery (using ADC on Raspberry Pi)
import RPi.GPIO as GPIO
import Adafruit_ADS1x15

adc = Adafruit_ADS1x15.ADS1115()

def read_battery_percentage():
    # Read voltage from ADC pin
    raw_value = adc.read_adc(0, gain=1)
    # Convert to voltage (adjust calibration values)
    voltage = raw_value * 0.0001875
    # Convert voltage to percentage (e.g., 3.0V = 0%, 4.2V = 100%)
    battery_pct = (voltage - 3.0) / (4.2 - 3.0) * 100
    return min(100, max(0, battery_pct))


# CPU Usage (already available)
import psutil

def read_cpu_usage():
    return psutil.cpu_percent(interval=1)


# Temperature (using DS18B20 sensor)
def read_temp_sensor():
    with open('/sys/bus/w1/devices/28-XXXXX/w1_slave', 'r') as f:
        lines = f.readlines()
        if lines[0].strip()[-3:] == 'YES':
            temp_pos = lines[1].find('t=')
            if temp_pos != -1:
                temp_c = float(lines[1][temp_pos+2:]) / 1000.0
                return temp_c
    return 0


# WiFi Signal Strength
import subprocess

def read_wifi_signal():
    try:
        result = subprocess.run(['iwconfig', 'wlan0'], capture_output=True, text=True)
        for line in result.stdout.split('\n'):
            if 'Signal level' in line:
                signal = line.split('=')[1].split('/')[0].strip()
                return int(signal)
    except:
        return 0
    return 0
```

---

### Step 2: Replace Simulated Video with Real Camera

**File:** `robot_client.py`

**Current code (lines 167-185):** Creates black fake image

**Replace with real camera:**

```python
# Option 1: Using OpenCV with USB/CSI camera

import cv2
import base64

def read_camera_frame(camera_index=0):
    """Capture frame from camera"""
    cap = cv2.VideoCapture(camera_index)
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        return None
    
    # Resize for network efficiency
    frame = cv2.resize(frame, (640, 480))
    
    # Encode to JPEG
    ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
    frame_data = base64.b64encode(buffer).decode('utf-8')
    
    return frame_data


# Option 2: Using Picamera for Raspberry Pi with CSI

from picamera import PiCamera
from picamera.array import PiRGBArray
import time

camera = PiCamera()
camera.resolution = (640, 480)
camera.framerate = 30
camera.start_preview()
time.sleep(2)

raw_capture = PiRGBArray(camera, size=(640, 480))

def read_camera_frame_pi():
    """Capture frame from Raspberry Pi camera"""
    for frame in camera.capture_continuous(raw_capture, format="bgr"):
        image = frame.array
        raw_capture.truncate(0)
        
        # Encode to JPEG
        ret, buffer = cv2.imencode('.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, 70])
        frame_data = base64.b64encode(buffer).decode('utf-8')
        
        return frame_data
```

**Update send_video_frame method:**

```python
async def send_video_frame(self, frame_num):
    try:
        # Get real frame from camera
        frame_data = read_camera_frame()  # ← Use real camera
        
        if not frame_data:
            return
        
        message = {
            "type": "video_frame",
            "device_id": self.device_id,
            "frame_data": frame_data,
            "frame_number": frame_num,
            "timestamp": datetime.now().isoformat()
        }
        
        await self.websocket.send(json.dumps(message))
        print(f"🎥 Video frame #{frame_num} sent")
        
    except Exception as e:
        print(f"❌ Error sending video: {e}")
```

---

### Step 3: Connect Robot Movement (Motor Control)

**File:** `robot_client.py`

**Current code (line 74-80):** Just prints message

**Replace with real motor control:**

```python
# Using RPi.GPIO with L298N Motor Driver

import RPi.GPIO as GPIO
import time

# Motor pins
IN1 = 17
IN2 = 27
IN3 = 23
IN4 = 24
ENA = 12
ENB = 13

GPIO.setmode(GPIO.BCM)
GPIO.setup([IN1, IN2, IN3, IN4, ENA, ENB], GPIO.OUT)

# PWM for speed control
pwm_a = GPIO.PWM(ENA, 100)
pwm_b = GPIO.PWM(ENB, 100)
pwm_a.start(0)
pwm_b.start(0)


async def control_robot_movement(x, y):
    """
    Control robot movement
    x: -1.0 (left) to 1.0 (right)
    y: -1.0 (backward) to 1.0 (forward)
    """
    # Convert x,y to motor speeds
    left_speed = y + x    # Left motor gets both forward and turn
    right_speed = y - x   # Right motor gets both forward and turn
    
    # Clamp speeds to -1.0 to 1.0
    left_speed = max(-1.0, min(1.0, left_speed))
    right_speed = max(-1.0, min(1.0, right_speed))
    
    # Convert to 0-100 PWM percentage
    left_pwm = abs(left_speed) * 100
    right_pwm = abs(right_speed) * 100
    
    # Set motor directions and speeds
    if left_speed > 0:
        GPIO.output(IN1, GPIO.HIGH)
        GPIO.output(IN2, GPIO.LOW)
    else:
        GPIO.output(IN1, GPIO.LOW)
        GPIO.output(IN2, GPIO.HIGH)
    
    if right_speed > 0:
        GPIO.output(IN3, GPIO.HIGH)
        GPIO.output(IN4, GPIO.LOW)
    else:
        GPIO.output(IN3, GPIO.LOW)
        GPIO.output(IN4, GPIO.HIGH)
    
    pwm_a.ChangeDutyCycle(left_pwm)
    pwm_b.ChangeDutyCycle(right_pwm)
    
    print(f"🤖 Motors: Left={left_speed:.2f} Right={right_speed:.2f}")
```

**Update receive_commands:**

```python
elif msg_type == "robot_move":
    x = data.get("x")
    y = data.get("y")
    print(f"🎮 Robot moving: x={x}, y={y}")
    await control_robot_movement(x, y)  # ← Apply to motors
```

---

### Step 4: Connect Camera Movement (Servo Control)

**File:** `robot_client.py`

**Current code (line 83-88):** Just prints message

**Replace with real servo control:**

```python
# Using PWM servo control (PCA9685 or GPIO PWM)

import Adafruit_PCA9685

# Initialize PCA9685 PWM driver
pwm = Adafruit_PCA9685.PCA9685()
pwm.set_pwm_freq(60)

# Servo channels
SERVO_PAN = 0    # Horizontal (x-axis)
SERVO_TILT = 1   # Vertical (y-axis)

def set_servo_position(channel, angle):
    """
    Set servo to angle (0-180 degrees)
    PCA9685 PWM: 250 = 0°, 500 = 180°
    """
    pulse = int(250 + (angle / 180.0) * 250)
    pwm.set_pwm(channel, 0, pulse)


async def control_camera_movement(x, y):
    """
    Control camera movement
    x: -1.0 (left) to 1.0 (right) → Pan servo
    y: -1.0 (down) to 1.0 (up) → Tilt servo
    """
    # Convert -1.0 to 1.0 to 0-180 angle
    pan_angle = 90 + (x * 90)    # 0-180°
    tilt_angle = 90 - (y * 90)   # 0-180° (inverted for up/down)
    
    # Clamp angles
    pan_angle = max(0, min(180, pan_angle))
    tilt_angle = max(0, min(180, tilt_angle))
    
    # Set servos
    set_servo_position(SERVO_PAN, pan_angle)
    set_servo_position(SERVO_TILT, tilt_angle)
    
    print(f"📷 Camera: Pan={pan_angle:.0f}° Tilt={tilt_angle:.0f}°")
```

**Update receive_commands:**

```python
elif msg_type == "camera_move":
    x = data.get("x")
    y = data.get("y")
    print(f"📷 Camera moving: x={x}, y={y}")
    await control_camera_movement(x, y)  # ← Apply to servos
```

---

### Step 5: Connect Speed Control

**File:** `robot_client.py`

**Current code (line 91-97):** Just prints message

**Replace with real speed adjustment:**

```python
# Global speed variable
current_speed = 100  # 0-100%

async def set_motor_speed(speed_percent):
    """Set motor speed (0-100%)"""
    global current_speed
    current_speed = max(0, min(100, speed_percent))
    
    # Adjust PWM duty cycle
    pwm_a.ChangeDutyCycle(current_speed)
    pwm_b.ChangeDutyCycle(current_speed)
    
    print(f"⚡ Motor speed set to {current_speed}%")
```

**Update receive_commands:**

```python
elif msg_type == "set_speed":
    value = data.get("value")
    print(f"⚡ Setting speed: {value}%")
    await set_motor_speed(value)  # ← Apply to motors
```

---

### Step 6: Connect Brightness Control

**File:** `robot_client.py`

**Current code (line 100-106):** Just prints message

**Replace with real LED/light control:**

```python
import RPi.GPIO as GPIO

# LED brightness pin (must support PWM)
LED_PIN = 18

GPIO.setup(LED_PIN, GPIO.OUT)
led_pwm = GPIO.PWM(LED_PIN, 1000)  # 1kHz frequency
led_pwm.start(0)


async def set_brightness(brightness_percent):
    """Set LED brightness (0-100%)"""
    brightness = max(0, min(100, brightness_percent))
    
    # Set PWM duty cycle
    led_pwm.ChangeDutyCycle(brightness)
    
    print(f"💡 LED brightness set to {brightness}%")
```

**Update receive_commands:**

```python
elif msg_type == "set_brightness":
    value = data.get("value")
    print(f"💡 Setting brightness: {value}%")
    await set_brightness(value)  # ← Apply to LED
```

---

## 🌐 How Multiple Robots Work

The system **already supports multiple robots**! Each robot connects with a unique `device_id`:

```bash
# Robot 1
python robot_client.py robot_01

# Robot 2 (in another terminal/device)
python robot_client.py robot_02

# Website can select which robot to control
```

**In consumers.py**, the server tracks:
```python
connected_devices = {
    'robots': {
        'robot_01': <consumer>,
        'robot_02': <consumer>,
    },
    'websites': {
        'dashboard': <consumer>
    }
}
```

**Future enhancement:** Add robot selection to website UI to switch between robots.

---

## 📊 Complete Data Flow Diagram

```
WEBSITE (Browser)
├─ Joystick drag event
├─ Slider change event
└─ Sends JSON:
   {
     "type": "robot_move",
     "x": 0.75,
     "y": -0.5
   }

   ↓ WebSocket.send()

DJANGO SERVER (consumers.py)
├─ receive() → Parses JSON
├─ handle_website_command()
└─ broadcast_to_robots()

   ↓ WebSocket.broadcast()

ROBOT (robot_client.py)
├─ receive_commands()
├─ Receives JSON
├─ Calls control_robot_movement(0.75, -0.5)
└─ Sets motor PWM:
   LEFT_MOTOR = 62.5%
   RIGHT_MOTOR = 25%

   ↓ GPIO.output() to motor driver

HARDWARE
├─ Left motor spins 62.5%
├─ Right motor spins 25%
└─ Robot turns right while moving forward
```

---

## 🔄 Complete Timeline

1. **Website to Robot Flow:**
   - User moves joystick
   - Browser sends `robot_move` command
   - Server receives and broadcasts
   - Robot receives and moves

2. **Robot to Website Flow:**
   - Robot reads sensors every 3 seconds
   - Sends `telemetry` message
   - Server broadcasts to all websites
   - Website updates dashboard display

3. **Video Flow:**
   - Robot captures frame from camera
   - Encodes as base64 JPEG
   - Sends `video_frame` message
   - Website displays in `<img>` element

---

## ✅ Checklist to Get Everything Working

- [ ] Replace simulated battery/CPU/temperature with real sensor reads
- [ ] Replace simulated camera with real OpenCV/PiCamera feed
- [ ] Implement motor control for `robot_move` command
- [ ] Implement servo control for `camera_move` command
- [ ] Implement speed adjustment for motors
- [ ] Implement brightness control for LED
- [ ] Test with website joystick
- [ ] Test telemetry updates on dashboard
- [ ] Test video stream
- [ ] Add multiple robot support to website UI
- [ ] Add device selection dropdown

---

## 🐛 Troubleshooting

**Problem:** Website shows old telemetry values
- Check: Is robot_client.py running?
- Check: Is WebSocket server running? (`python manage.py runserver` or `daphne`)
- Check: Are there errors in browser console?

**Problem:** Video not showing
- Check: Is Pillow/OpenCV installed? (`pip install pillow opencv-python`)
- Check: Is camera accessible? (`ls /dev/video*`)
- Check: Browser console for CORS errors

**Problem:** Joystick not controlling robot
- Check: Is robot receiving messages? (Look for 🎮 emoji in robot_client.py output)
- Check: Are motor pins correctly configured?
- Check: Is GPIO initialized?

**Problem:** Multiple robots not working
- Start each robot with unique device_id
- Check connected_devices dict in server output
- Website must select which robot to send commands to

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `robot_client.py` | Robot connection & hardware control |
| `robot/consumers.py` | WebSocket server routing |
| `robot/static/robot/js/app.js` | Website UI & joystick |
| `robot/templates/robot/index.html` | Dashboard display |

---

## 🎓 Architecture Summary

**1. Telemetry (Real Data):** Robot → Server → Website
**2. Video Stream (Large Data):** Robot camera → Server → Website display
**3. Control Commands:** Website controls → Server → Robot hardware
**4. Multiple Devices:** Each robot has unique device_id, server routes to correct device

Everything is **already connected and working**! You just need to replace the simulated data with real sensor and hardware control code.
