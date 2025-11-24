# 🔍 WebSocket Debugging Guide

## The Problem
You're not seeing control panel data in the WebSocket terminal output.

## Root Causes to Check

### 1. **Is the message being SENT from the browser?**
   - Check: Browser DevTools Console (F12)
   - Look for: `✅ [SENT] Message sent:...`
   - If NOT there: JavaScript event listener isn't firing or message not being sent

### 2. **Is the message being RECEIVED by the server?**
   - Check: Server terminal output
   - Look for: `🔹🔹🔹 ===== WEBSOCKET MESSAGE RECEIVED =====`
   - If NOT there: Network problem or message not reaching server

### 3. **Is the message being PROCESSED?**
   - Check: Server terminal output
   - Look for: `🟡🟡🟡 SET_SPEED COMMAND FROM WEBSITE`
   - If NOT there: Message type not recognized

### 4. **Is the message being FORWARDED to robot?**
   - Check: Server terminal output
   - Look for: `📤 BROADCAST TO ROBOTS`
   - If NOT there: No robots connected OR broadcasting failed

### 5. **Is the robot RECEIVING the message?**
   - Check: Robot terminal output
   - Look for: `⚡⚡⚡ SPEED CONTROL COMMAND`
   - If NOT there: Robot not connected or receiving failed

---

## Complete Debug Flow

### Step 1: Enhanced Logging Added ✅

**Browser Console** now shows:
```
📤 [WEBSOCKET SEND] sendControlMessage called
   Payload type: set_speed
   Socket ready? true
✅ [SENT] Message sent: {"type":"set_speed"...}
```

**Server Terminal** now shows:
```
🔹🔹🔹 ===== WEBSOCKET MESSAGE RECEIVED =====
   Device Type: website
   Raw Data: {"type":"set_speed"...}
   ➡️  Routing to: handle_website_command()

🟡🟡🟡🟡🟡 SET_SPEED COMMAND FROM WEBSITE 🟡🟡🟡🟡🟡
   Speed Value: 75%
   Robot IDs: ['robot_01']
   ✅ Speed command forwarded to robots
```

**Robot Terminal** now shows:
```
⚡⚡⚡ SPEED CONTROL COMMAND
        Speed: 75%
        → TODO: Apply to motor speed
```

---

## Testing Procedures

### Option 1: Manual Test (Browser)

1. **Start server**:
   ```powershell
   python manage.py runserver
   ```

2. **Open browser**: `http://localhost:8000/robot/`

3. **Open DevTools**: Press `F12`, go to Console tab

4. **Move speed slider from 50 to 75**

5. **Watch Console for**:
   - ✅ `[WEBSOCKET SEND] sendControlMessage called`
   - ✅ `[SENT] Message sent: {"type":"set_speed"...}`

6. **Watch Server Terminal for**:
   - ✅ `🔹🔹🔹 ===== WEBSOCKET MESSAGE RECEIVED`
   - ✅ `🟡🟡🟡🟡🟡 SET_SPEED COMMAND`

7. **Connect robot client**:
   ```powershell
   python robot_client.py
   ```

8. **Watch Robot Terminal for**:
   - ✅ `⚡⚡⚡ SPEED CONTROL COMMAND`

---

### Option 2: Automated Test (Python Script)

1. **Start server**:
   ```powershell
   python manage.py runserver
   ```

2. **Run test script** (in another terminal):
   ```powershell
   pip install websockets
   python test_websocket_diagnostic.py
   ```

3. **Script sends all 4 message types**:
   - ✅ Speed control
   - ✅ Brightness control
   - ✅ Robot movement
   - ✅ Camera movement

4. **Watch server output for all message types**

---

## Diagnostic Checklist

When checking the flow, look for these exact markers:

### Browser Console (F12):
```
✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅
📤 [WEBSOCKET SEND] sendControlMessage called
   Payload type: [set_speed|set_brightness|robot_move|camera_move]
   Socket ready? true
✅ [SENT] Message sent: {...}
```

### Server Terminal:
```
✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅
🔹🔹🔹 ===== WEBSOCKET MESSAGE RECEIVED =====
   Device Type: website
   Message Type: [set_speed|set_brightness|robot_move|camera_move]
   ➡️  Routing to: handle_website_command()

🟡🟡🟡🟡🟡 [COMMAND TYPE] FROM WEBSITE 🟡🟡🟡🟡🟡
   ✅ Command forwarded to robots
   
📤 BROADCAST TO ROBOTS
   Robot IDs: ['robot_01']
   ✅ Sent to robot_01
```

### Robot Terminal:
```
✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅
⚡⚡⚡ [COMMAND TYPE]
   ✅ Command received and logged
```

---

## Troubleshooting Steps

### If messages NOT appearing in Browser Console:

1. **Check if slider exists**:
   - Open DevTools Inspector
   - Find `<input id="speedSlider">`
   - If not found: HTML issue

2. **Check event listener**:
   - Open DevTools Console
   - Type: `document.getElementById('speedSlider')`
   - Should return the element, not `null`

3. **Check WebSocket connection**:
   - Open DevTools Console
   - Type: `socket.readyState`
   - Should return: `1` (OPEN)
   - If `3`: Socket closed

### If messages NOT appearing in Server Terminal:

1. **Check server is running**:
   - Terminal should show `Starting development server at http://...`

2. **Check Channels is installed**:
   - Run: `pip list | grep -i channels`
   - Should see: `channels==4.x.x`

3. **Check ASGI configuration**:
   - Check: `staircasebot/asgi.py`
   - Should have: `from django_stubs_ext.asgi import get_wsgi_application`

4. **Check WebSocket routing**:
   - Check: `robot/routing.py`
   - Should have: `re_path(r'ws/telemetry/?$', consumers.TelemetryConsumer.as_asgi())`

### If messages appearing in Server but NOT in Robot:

1. **Check robot connected**:
   - Server terminal should show: `Connected robots: ['robot_01']`
   - If empty: Robot client not connected

2. **Check robot client running**:
   - Run: `python robot_client.py`
   - Should show: `✅ Connected to WebSocket`

3. **Check robot device ID**:
   - Robot terminal should show connection with device_id
   - Server terminal should list it in `Connected robots`

---

## Expected Output Examples

### ✅ SUCCESS - All 4 controls working

**Browser Console**:
```
📤 [WEBSOCKET SEND] sendControlMessage called
   Payload type: set_speed
✅ [SENT] Message sent: {"type":"set_speed","value":75}
```

**Server Terminal**:
```
🔹🔹🔹 ===== WEBSOCKET MESSAGE RECEIVED =====
   Device Type: website
   Message Type: set_speed
🟡🟡🟡🟡🟡 SET_SPEED COMMAND FROM WEBSITE 🟡🟡🟡🟡🟡
   Speed Value: 75%
   ✅ Speed command forwarded to robots
```

**Robot Terminal**:
```
⚡⚡⚡ SPEED CONTROL COMMAND
        Speed: 75%
```

---

## Summary

**With the enhanced logging**:
- ✅ You can see exact point where message is lost
- ✅ You can identify network, browser, server, or robot issues
- ✅ You have complete trace of message flow
- ✅ You can debug specific control types

**Use the Python test script** for automated testing of all 4 controls without using browser GUI.

---

## Quick Reference

| Check | Look For | Location |
|-------|----------|----------|
| Browser sending? | `✅ [SENT]` | Browser Console (F12) |
| Server receiving? | `🔹🔹🔹 RECEIVED` | Server Terminal |
| Server processing? | `🟡🟡🟡 COMMAND` | Server Terminal |
| Server forwarding? | `✅ Sent to robot_01` | Server Terminal |
| Robot receiving? | `⚡⚡⚡ COMMAND` | Robot Terminal |

If ALL markers appear → System is working perfectly ✅
