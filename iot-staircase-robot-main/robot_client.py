"""
Robot Client with Laptop Camera Support
Connects to the Django WebSocket server and:
- Sends real video frames from laptop camera
- Sends telemetry data
- Receives control commands from the server
"""

import asyncio
import json
import random
import websockets
import sys
import base64
from datetime import datetime
from io import BytesIO
import time

# OpenCV for camera capture
try:
    import cv2
    HAS_OPENCV = True
    print("✅ OpenCV available for camera capture")
except ImportError:
    HAS_OPENCV = False
    print("⚠️  OpenCV not available. Install with: pip install opencv-python")

# Optional: PIL for fallback
try:
    from PIL import Image, ImageDraw
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


class SimulatedRobot:
    def __init__(self, server_url, device_id="robot_01", use_camera=True):
        self.server_url = server_url
        self.device_id = device_id
        self.websocket = None
        self.running = True
        self.battery = 85.0
        self.cpu = 45.0
        self.temperature = 35.0
        self.signal = 90.0
        self.use_camera = use_camera and HAS_OPENCV
        self.camera = None
        self.frame_count = 0
        
    async def connect(self):
        """Connect to WebSocket server"""
        try:
            # Initialize camera if requested
            if self.use_camera:
                self.init_camera()
            
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
    
    def init_camera(self):
        """Initialize laptop camera"""
        try:
            print("📷 Initializing laptop camera...")
            self.camera = cv2.VideoCapture(0)  # 0 = default camera
            
            if not self.camera.isOpened():
                print("❌ Failed to open camera")
                self.use_camera = False
                return
            
            # Set camera properties for better performance
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.camera.set(cv2.CAP_PROP_FPS, 30)
            
            print("✅ Camera initialized successfully")
            
        except Exception as e:
            print(f"❌ Camera initialization failed: {e}")
            self.use_camera = False
    
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
    
    async def send_video_frame_loop(self):
        """Send video frames from camera periodically"""
        try:
            while self.running and self.websocket:
                await self.send_video_frame()
                # Send at ~10 FPS (adjust as needed)
                await asyncio.sleep(0.1)
        except Exception as e:
            print(f"❌ Error in video loop: {e}")
            self.running = False
    
    async def send_video_frame(self):
        """Capture and send a real video frame from camera"""
        try:
            if self.use_camera and self.camera and self.camera.isOpened():
                # Capture frame from camera
                ret, frame = self.camera.read()
                
                if not ret:
                    print("❌ Failed to capture frame")
                    return
                
                # Add timestamp overlay
                timestamp_text = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                cv2.putText(frame, timestamp_text, (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                # Add frame counter
                cv2.putText(frame, f"Frame: {self.frame_count}", (10, 60), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                
                # Add device ID
                cv2.putText(frame, f"Device: {self.device_id}", (10, 90), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                
                # Encode frame as JPEG
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                frame_data = base64.b64encode(buffer).decode('utf-8')
                
                message = {
                    "type": "video_frame",
                    "device_id": self.device_id,
                    "frame_data": frame_data,
                    "frame_number": self.frame_count,
                    "timestamp": datetime.now().isoformat()
                }
                
                await self.websocket.send(json.dumps(message))
                
                if self.frame_count % 30 == 0:  # Log every 30 frames
                    print(f"🎥 Frame #{self.frame_count} sent ({len(frame_data)} bytes)")
                
                self.frame_count += 1
                
            elif HAS_PIL:
                # Fallback to simulated frame if camera not available
                await self.send_simulated_frame()
            
        except Exception as e:
            print(f"❌ Error sending video frame: {e}")
    
    async def send_simulated_frame(self):
        """Send a simulated video frame (fallback)"""
        try:
            if not HAS_PIL:
                return
            
            # Create a simulated camera frame
            img = Image.new('RGB', (640, 480), color='black')
            draw = ImageDraw.Draw(img)
            
            # Add visual elements
            draw.rectangle([50, 50, 590, 430], outline='green', width=3)
            draw.text((270, 10), f"SIMULATED - Frame #{self.frame_count}", fill='cyan')
            draw.text((180, 450), f"Robot Camera - {datetime.now().strftime('%H:%M:%S')}", fill='cyan')
            
            # Add crosshair
            draw.line([(320, 200), (320, 280)], fill='green', width=2)
            draw.line([(240, 240), (400, 240)], fill='green', width=2)
            
            # Convert image to base64 JPEG
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=70)
            frame_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            message = {
                "type": "video_frame",
                "device_id": self.device_id,
                "frame_data": frame_data,
                "frame_number": self.frame_count,
                "timestamp": datetime.now().isoformat()
            }
            
            await self.websocket.send(json.dumps(message))
            
            if self.frame_count % 30 == 0:
                print(f"🎥 Simulated frame #{self.frame_count} sent")
            
            self.frame_count += 1
            
        except Exception as e:
            print(f"❌ Error sending simulated frame: {e}")
    
    async def run(self):
        """Main run loop"""
        await self.connect()
        
        # Start video frame sending if camera or PIL is available
        if self.use_camera or HAS_PIL:
            asyncio.create_task(self.send_video_frame_loop())
            print(f"📹 Video streaming started ({'Camera' if self.use_camera else 'Simulated'})")
        
        # Keep running until interrupted
        while self.running:
            await asyncio.sleep(1)
    
    async def close(self):
        """Close connection"""
        self.running = False
        
        # Release camera
        if self.camera:
            self.camera.release()
            print("📷 Camera released")
        
        # Close WebSocket
        if self.websocket:
            await self.websocket.close()
        
        print("🔌 Robot disconnected")


async def main():
    """Run robot client with camera"""
    # Configuration
    server_url = "ws://localhost:8000/ws/telemetry/"
    device_id = "robot_01"
    use_camera = True
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        device_id = sys.argv[1]
    
    if len(sys.argv) > 2 and sys.argv[2].lower() == "nocamera":
        use_camera = False
        print("📷 Camera disabled by command line argument")
    
    robot = SimulatedRobot(server_url, device_id, use_camera=use_camera)
    
    try:
        await robot.run()
    except KeyboardInterrupt:
        print("\n⚠️  Shutting down...")
        await robot.close()


if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════╗
    ║   Robot Client with Camera Support     ║
    ║   Connects to Django WebSocket Server  ║
    ╚════════════════════════════════════════╝
    
    Usage: python robot_client.py [device_id] [nocamera]
    
    Examples:
      python robot_client.py robot_01          # Use laptop camera
      python robot_client.py robot_01 nocamera # Use simulated video
    
    Requirements:
      pip install opencv-python websockets
    
    """)
    
    asyncio.run(main())
