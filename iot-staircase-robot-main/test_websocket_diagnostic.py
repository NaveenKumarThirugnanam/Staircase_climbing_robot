#!/usr/bin/env python
"""
WebSocket Test Script - Diagnose controller panel issues
Tests the complete message flow from browser to server to robot
"""

import asyncio
import json
import websockets
from datetime import datetime

async def test_websocket():
    """
    Test WebSocket connection and message sending
    """
    print("="*70)
    print(" 🧪 WebSocket Diagnostic Test Script")
    print("="*70)
    print(f" Test started at: {datetime.now()}\n")
    
    # Connect to the WebSocket
    uri = "ws://localhost:8000/ws/telemetry/"
    print(f"1️⃣  Connecting to WebSocket: {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"✅ WebSocket connected!\n")
            
            # Test 1: Send speed control command
            print("-" * 70)
            print("2️⃣  Sending SPEED CONTROL command...")
            print("-" * 70)
            
            speed_msg = {
                "type": "set_speed",
                "value": 75,
                "client_ts": int(datetime.now().timestamp() * 1000)
            }
            msg_json = json.dumps(speed_msg)
            print(f"   Message: {msg_json}\n")
            
            await websocket.send(msg_json)
            print(f"✅ Speed message sent ({len(msg_json)} bytes)\n")
            
            # Wait for acknowledgment
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"📨 Server response: {response}\n")
            except asyncio.TimeoutError:
                print(f"⚠️  No response received (timeout)\n")
            
            # Test 2: Send brightness control command
            print("-" * 70)
            print("3️⃣  Sending BRIGHTNESS CONTROL command...")
            print("-" * 70)
            
            brightness_msg = {
                "type": "set_brightness",
                "value": 80,
                "client_ts": int(datetime.now().timestamp() * 1000)
            }
            msg_json = json.dumps(brightness_msg)
            print(f"   Message: {msg_json}\n")
            
            await websocket.send(msg_json)
            print(f"✅ Brightness message sent ({len(msg_json)} bytes)\n")
            
            # Wait for acknowledgment
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"📨 Server response: {response}\n")
            except asyncio.TimeoutError:
                print(f"⚠️  No response received (timeout)\n")
            
            # Test 3: Send robot movement command
            print("-" * 70)
            print("4️⃣  Sending ROBOT MOVEMENT command...")
            print("-" * 70)
            
            move_msg = {
                "type": "robot_move",
                "x": 50,
                "y": 50,
                "client_ts": int(datetime.now().timestamp() * 1000)
            }
            msg_json = json.dumps(move_msg)
            print(f"   Message: {msg_json}\n")
            
            await websocket.send(msg_json)
            print(f"✅ Movement message sent ({len(msg_json)} bytes)\n")
            
            # Wait for acknowledgment
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"📨 Server response: {response}\n")
            except asyncio.TimeoutError:
                print(f"⚠️  No response received (timeout)\n")
            
            # Test 4: Send camera movement command
            print("-" * 70)
            print("5️⃣  Sending CAMERA MOVEMENT command...")
            print("-" * 70)
            
            camera_msg = {
                "type": "camera_move",
                "x": 30,
                "y": 40,
                "client_ts": int(datetime.now().timestamp() * 1000)
            }
            msg_json = json.dumps(camera_msg)
            print(f"   Message: {msg_json}\n")
            
            await websocket.send(msg_json)
            print(f"✅ Camera message sent ({len(msg_json)} bytes)\n")
            
            # Wait for acknowledgment
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"📨 Server response: {response}\n")
            except asyncio.TimeoutError:
                print(f"⚠️  No response received (timeout)\n")
            
            print("="*70)
            print(" ✅ All tests completed!")
            print("="*70)
            print("\n📋 Check the server terminal for these messages:")
            print("   - 🔹🔹🔹 WEBSOCKET MESSAGE RECEIVED")
            print("   - 🟡🟡🟡 SET_SPEED COMMAND FROM WEBSITE")
            print("   - 🟣🟣🟣 SET_BRIGHTNESS COMMAND FROM WEBSITE")
            print("   - 🤖🤖🤖 ROBOT_MOVE COMMAND FROM WEBSITE")
            print("   - 📷📷📷 CAMERA_MOVE COMMAND FROM WEBSITE")
            print("\n")
            
    except ConnectionRefusedError:
        print(f"❌ Connection refused - server not running")
        print(f"   Make sure: python manage.py runserver is running\n")
    except Exception as e:
        print(f"❌ Error: {e}\n")


if __name__ == "__main__":
    print("\nMake sure the server is running:")
    print("  python manage.py runserver\n")
    print("Run this test in another terminal\n")
    
    asyncio.run(test_websocket())
