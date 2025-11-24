"""
Simulated Robot Client for WebSocket Communication
Connects to the Django WebSocket server and sends telemetry data
Also receives control commands from the server
"""

import asyncio
import json
import random
import websockets
import sys
from datetime import datetime


class SimulatedRobot:
    def __init__(self, server_url, device_id="robot_01"):
        self.server_url = server_url
        self.device_id = device_id
        self.websocket = None
        self.running = True
        self.battery = 85.0
        self.cpu = 45.0
        self.temperature = 35.0
        self.signal = 90.0
        
    async def connect(self):
        """Connect to WebSocket server"""
        try:
            # Connect with device_id parameter to identify as robot
            url = f"{self.server_url}?device_id={self.device_id}"
            print(f"🤖 Connecting robot to {url}...")
            
            self.websocket = await websockets.connect(url)
            print(f"✅ Robot {self.device_id} connected!")
            
            # Start receiving messages from server
            asyncio.create_task(self.receive_commands())
            
            # Start sending telemetry
            asyncio.create_task(self.send_telemetry_loop())
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            self.running = False
    
    async def receive_commands(self):
        """Receive control commands from server"""
        try:
            while self.running and self.websocket:
                message = await self.websocket.recv()
                data = json.loads(message)
                
                msg_type = data.get("type")
                print(f"\n📨 [{self.device_id}] RECEIVED MESSAGE TYPE: {msg_type}")
                
                if msg_type == "robot_move":
                    x = data.get("x")
                    y = data.get("y")
                    print(f"🎮🎮🎮 ROBOT MOVEMENT COMMAND")
                    print(f"        X: {x}")
                    print(f"        Y: {y}")
                    print(f"        → TODO: Apply to motor controller")
                    # TODO: Apply to actual robot motor controller
                    
                elif msg_type == "camera_move":
                    x = data.get("x")
                    y = data.get("y")
                    print(f"📷📷📷 CAMERA MOVEMENT COMMAND")
                    print(f"        X: {x}")
                    print(f"        Y: {y}")
                    print(f"        → TODO: Apply to servo")
                    # TODO: Apply to actual camera servo
                    
                elif msg_type == "set_speed":
                    value = data.get("value")
                    print(f"⚡⚡⚡ SPEED CONTROL COMMAND")
                    print(f"        Speed: {value}%")
                    print(f"        → TODO: Apply to motor speed")
                    # TODO: Apply to motor speed controller
                    
                elif msg_type == "set_brightness":
                    value = data.get("value")
                    print(f"💡💡💡 BRIGHTNESS CONTROL COMMAND")
                    print(f"        Brightness: {value}%")
                    print(f"        → TODO: Apply to LED")
                    # TODO: Apply to LED brightness
                    
                elif msg_type == "ack":
                    original = data.get("original_type")
                    status = data.get("status")
                    msg = data.get("message")
                    print(f"✅ ACK for {original}: {msg}")
                    
                else:
                    print(f"📨 Other message type: {msg_type}")
                    print(f"   Data: {data}")
                    
        except Exception as e:
            print(f"❌ Error receiving commands: {e}")
            self.running = False
    
    async def send_telemetry_loop(self):
        """Send telemetry data periodically"""
        try:
            while self.running and self.websocket:
                await self.send_telemetry()
                # Send every 3 seconds
                await asyncio.sleep(3)
        except Exception as e:
            print(f"❌ Error in telemetry loop: {e}")
            self.running = False
    
    async def send_telemetry(self):
        """Send current telemetry to server"""
        try:
            # Simulate realistic telemetry changes
            self.battery = max(0, self.battery - random.uniform(0.1, 0.5))
            self.cpu = 30 + random.uniform(-10, 20)
            self.temperature = 35 + random.uniform(-2, 5)
            self.signal = 80 + random.uniform(-10, 10)
            
            message = {
                "type": "telemetry",
                "device_id": self.device_id,
                "device_name": f"Robot {self.device_id}",
                "battery": round(self.battery, 1),
                "cpu": round(self.cpu, 1),
                "temperature": round(self.temperature, 1),
                "signal": round(self.signal, 1),
                "timestamp": datetime.now().isoformat()
            }
            
            await self.websocket.send(json.dumps(message))
            print(f"📡 Telemetry sent: Battery={self.battery:.1f}%, CPU={self.cpu:.1f}%, Temp={self.temperature:.1f}°C, Signal={self.signal:.1f}%")
            
        except Exception as e:
            print(f"❌ Error sending telemetry: {e}")
            self.running = False
    
    async def run(self):
        """Main run loop"""
        await self.connect()
        
        # Keep running until interrupted
        while self.running:
            await asyncio.sleep(1)
    
    async def close(self):
        """Close connection"""
        self.running = False
        if self.websocket:
            await self.websocket.close()
        print("🔌 Robot disconnected")


async def main():
    """Run simulated robot"""
    # Configuration
    server_url = "ws://localhost:8000/ws/telemetry/"
    device_id = "robot_01"
    
    if len(sys.argv) > 1:
        device_id = sys.argv[1]
    
    robot = SimulatedRobot(server_url, device_id)
    
    try:
        await robot.run()
    except KeyboardInterrupt:
        print("\n⚠️  Shutting down...")
        await robot.close()


if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════╗
    ║   Simulated Robot Client               ║
    ║   Connects to Django WebSocket Server  ║
    ╚════════════════════════════════════════╝
    
    Usage: python robot_client.py [device_id]
    Example: python robot_client.py robot_01
    
    """)
    
    asyncio.run(main())
