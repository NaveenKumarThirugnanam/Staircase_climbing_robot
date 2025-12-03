import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from django.utils import timezone
from asgiref.sync import sync_to_async


logger = logging.getLogger(__name__)

# Global dictionary to track connected robots and websites
connected_devices = {
    'robots': {},      # {device_id: consumer_instance}
    'websites': {}     # {device_id: consumer_instance}
}


class TelemetryConsumer(AsyncWebsocketConsumer):
    """
    Handles WebSocket connections from both:
    1. Website/Dashboard (browser clients)
    2. Robot Hardware (IoT device)
    
    Routes control commands from website to robot
    Routes telemetry data from robot back to website
    """
    
    async def connect(self):
        # Determine if this is a robot or website connection
        # Robot connections include ?device_id in URL
        # Website connections are regular controller access
        
        self.device_type = None  # 'robot' or 'website'
        self.device_id = None
        
        # Check if this is a robot connection
        query_string = self.scope.get('query_string', b'').decode()
        if 'device_id' in query_string:
            # This is a robot hardware connection
            self.device_type = 'robot'
            # Parse device_id from query string (e.g., ?device_id=robot_01)
            for param in query_string.split('&'):
                if param.startswith('device_id='):
                    self.device_id = param.split('=')[1]
                    break
        else:
            # This is a website/dashboard connection
            self.device_type = 'website'
            self.device_id = 'dashboard'
        
        await self.accept()
        
        # Register this connection
        if self.device_type == 'robot':
            connected_devices['robots'][self.device_id] = self
            print(f"✅ Robot connected: {self.device_id}")
            logger.info(f"Robot connected: {self.device_id}")
            
            await self.send(json.dumps({
                "status": "connected",
                "device_type": "robot",
                "device_id": self.device_id,
                "message": f"Robot {self.device_id} connected to server"
            }))
        else:
            connected_devices['websites'][self.device_id] = self
            print(f"✅ Website/Dashboard connected")
            logger.info("Website/Dashboard connected")
            
            await self.send(json.dumps({
                "status": "connected",
                "device_type": "website",
                "message": "Dashboard connected to server"
            }))

    async def disconnect(self, close_code):
        """Handle disconnection"""
        if self.device_type == 'robot' and self.device_id in connected_devices['robots']:
            del connected_devices['robots'][self.device_id]
            print(f"🔌 Robot disconnected: {self.device_id}")
            logger.info(f"Robot disconnected: {self.device_id}")
            
            # Notify all websites that this robot disconnected
            await self.broadcast_to_websites({
                "type": "robot_status",
                "device_id": self.device_id,
                "status": "disconnected",
                "message": f"Robot {self.device_id} has disconnected"
            })
            
        elif self.device_type == 'website' and self.device_id in connected_devices['websites']:
            del connected_devices['websites'][self.device_id]
            print(f"🔌 Website disconnected")
            logger.info("Website disconnected")

    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages
        Route based on message type and sender
        """
        try:
            print(f"\n🔹🔹🔹 ===== WEBSOCKET MESSAGE RECEIVED =====")
            print(f"   Device Type: {self.device_type}")
            print(f"   Device ID: {self.device_id}")
            print(f"   Raw Data: {text_data}")
            print(f"   Data Length: {len(text_data)} bytes")
            
            data = json.loads(text_data)
            msg_type = data.get("type")
            
            print(f"   Parsed JSON: {data}")
            print(f"   Message Type: {msg_type}")
            print(f"   Data Keys: {list(data.keys())}")
            
            logger.info(f"[{self.device_type}] Received message: type={msg_type}, data={data}")
            
            # ========== WEBSITE SENDS CONTROL COMMANDS ==========
            if self.device_type == 'website':
                print(f"   ➡️  Routing to: handle_website_command()")
                await self.handle_website_command(data, msg_type)
            
            # ========== ROBOT SENDS TELEMETRY DATA ==========
            elif self.device_type == 'robot':
                print(f"   ➡️  Routing to: handle_robot_telemetry()")
                await self.handle_robot_telemetry(data, msg_type)
                
        except json.JSONDecodeError as e:
            print(f"❌ JSON PARSE ERROR: {e}")
            print(f"   Raw text: {text_data}")
            logger.error(f"Invalid JSON received: {e}")
            await self.send(json.dumps({"error": "Invalid JSON format"}))
        except Exception as e:
            print(f"❌ ERROR PROCESSING MESSAGE: {e}")
            print(f"   Exception type: {type(e).__name__}")
            logger.exception("Error processing message")
            await self.send(json.dumps({"error": str(e)}))

    async def handle_website_command(self, data, msg_type):
        """
        Handle commands from website/dashboard
        Forward to connected robot
        """
        print(f"\n{'='*70}")
        print(f"🌐 ===== WEBSITE COMMAND HANDLER CALLED =====")
        print(f"{'='*70}")
        print(f"   Message Type: {msg_type}")
        print(f"   Message Data: {data}")
        print(f"   Connected Robots: {list(connected_devices['robots'].keys())}")
        print(f"   Number of robots: {len(connected_devices['robots'])}")
        print(f"{'='*70}\n")
        
        # ===== ROBOT MOVEMENT COMMAND =====
        if msg_type == "robot_move":
            x = data.get("x")
            y = data.get("y")
            print(f"\n🤖🤖🤖 ROBOT_MOVE COMMAND FROM WEBSITE: x={x}, y={y}")
            print(f"   Forwarding to {len(connected_devices['robots'])} robot(s)...")
            logger.info(f"🤖 Robot move command: x={x}, y={y}")
            
            # Send acknowledgment back to website
            await self.send(json.dumps({
                "type": "ack",
                "original_type": "robot_move",
                "status": "received",
                "message": f"Command received: Robot move x={x}, y={y}"
            }))
            
            # Forward command to all connected robots
            await self.broadcast_to_robots({
                "type": "robot_move",
                "x": x,
                "y": y,
                "timestamp": timezone.now().isoformat()
            })
            print(f"   ✅ Robot move command forwarded")
        
        # ===== CAMERA MOVEMENT COMMAND =====
        elif msg_type == "camera_move":
            x = data.get("x")
            y = data.get("y")
            print(f"\n📷📷📷 CAMERA_MOVE COMMAND FROM WEBSITE: x={x}, y={y}")
            print(f"   Forwarding to {len(connected_devices['robots'])} robot(s)...")
            logger.info(f"📷 Camera move command: x={x}, y={y}")
            
            await self.send(json.dumps({
                "type": "ack",
                "original_type": "camera_move",
                "status": "received",
                "message": f"Command received: Camera move x={x}, y={y}"
            }))
            
            # Forward to robot
            await self.broadcast_to_robots({
                "type": "camera_move",
                "x": x,
                "y": y,
                "timestamp": timezone.now().isoformat()
            })
            print(f"   ✅ Camera move command forwarded")
        
        # ===== SPEED CONTROL COMMAND =====
        elif msg_type == "set_speed":
            value = data.get("value")
            print(f"\n🟡🟡🟡🟡🟡 SET_SPEED COMMAND FROM WEBSITE 🟡🟡🟡🟡🟡")
            print(f"   Speed Value: {value}%")
            print(f"   Forwarding to {len(connected_devices['robots'])} robot(s)...")
            print(f"   Robot IDs: {list(connected_devices['robots'].keys())}")
            logger.info(f"⚡ Speed control: {value}%")
            
            ack_msg = {
                "type": "ack",
                "original_type": "set_speed",
                "status": "received",
                "message": f"Command received: Speed set to {value}%"
            }
            print(f"   Sending ACK: {ack_msg}")
            await self.send(json.dumps(ack_msg))
            
            # Forward to robot
            cmd_msg = {
                "type": "set_speed",
                "value": value,
                "timestamp": timezone.now().isoformat()
            }
            print(f"   Broadcasting to robots: {cmd_msg}")
            await self.broadcast_to_robots(cmd_msg)
            print(f"   ✅ Speed command forwarded to robots")
        
        # ===== BRIGHTNESS CONTROL COMMAND =====
        elif msg_type == "set_brightness":
            value = data.get("value")
            print(f"\n🟣🟣🟣🟣🟣 SET_BRIGHTNESS COMMAND FROM WEBSITE 🟣🟣🟣🟣🟣")
            print(f"   Brightness Value: {value}%")
            print(f"   Forwarding to {len(connected_devices['robots'])} robot(s)...")
            print(f"   Robot IDs: {list(connected_devices['robots'].keys())}")
            logger.info(f"💡 Brightness control: {value}%")
            
            ack_msg = {
                "type": "ack",
                "original_type": "set_brightness",
                "status": "received",
                "message": f"Command received: Brightness set to {value}%"
            }
            print(f"   Sending ACK: {ack_msg}")
            await self.send(json.dumps(ack_msg))
            
            # Forward to robot
            cmd_msg = {
                "type": "set_brightness",
                "value": value,
                "timestamp": timezone.now().isoformat()
            }
            print(f"   Broadcasting to robots: {cmd_msg}")
            await self.broadcast_to_robots(cmd_msg)
            print(f"   ✅ Brightness command forwarded to robots")

    async def handle_robot_telemetry(self, data, msg_type):
        """
        Handle telemetry data from robot
        Forward to all connected websites
        """
        
        # ===== TELEMETRY DATA FROM ROBOT =====
        if msg_type == "telemetry":
            battery = data.get("battery")
            cpu = data.get("cpu")
            temperature = data.get("temperature")
            signal = data.get("signal")
            device_name = data.get("device_name", self.device_id)
            
            print(f"📡 TELEMETRY from {self.device_id}: Battery={battery}%, CPU={cpu}%, Temp={temperature}°C, Signal={signal}%")
            logger.info(f"📡 Telemetry: Battery={battery}%, CPU={cpu}%, Temp={temperature}°C, Signal={signal}%")
            
            # Save to database
            from .models import TelemetryData
            await sync_to_async(TelemetryData.objects.create)(
                battery=battery,
                cpu=cpu,
                temperature=temperature,
                signal=signal,
                timestamp=timezone.now()
            )
            
            # Send acknowledgment to robot
            await self.send(json.dumps({
                "type": "ack",
                "original_type": "telemetry",
                "status": "received",
                "message": "Telemetry data received and saved"
            }))
            
            # Broadcast telemetry to all connected websites
            await self.broadcast_to_websites({
                "type": "telemetry_update",
                "device_id": self.device_id,
                "device_name": device_name,
                "battery": battery,
                "cpu": cpu,
                "temperature": temperature,
                "signal": signal,
                "timestamp": timezone.now().isoformat()
            })
        
        # ===== VIDEO FRAME FROM ROBOT =====
        elif msg_type == "video_frame":
            print(f"\n🎥 VIDEO FRAME from {self.device_id}")
            frame_data = data.get("frame_data")  # Base64 encoded image
            timestamp = data.get("timestamp", timezone.now().isoformat())
            
            if frame_data:
                print(f"   Frame size: {len(frame_data)} bytes")
                print(f"   Broadcasting to {len(connected_devices['websites'])} website(s)...")
                
                # Send acknowledgment to robot
                await self.send(json.dumps({
                    "type": "ack",
                    "original_type": "video_frame",
                    "status": "received",
                    "message": "Video frame received"
                }))
                
                # Broadcast video frame to all connected websites
                await self.broadcast_to_websites({
                    "type": "video_frame",
                    "device_id": self.device_id,
                    "frame_data": frame_data,
                    "timestamp": timestamp
                })
                print(f"   ✅ Video frame broadcasted to websites")
            else:
                print(f"   ❌ No frame data in message")
        
        # ===== ROBOT STATUS UPDATES =====
        elif msg_type == "status":
            status = data.get("status")
            message = data.get("message", "")
            
            print(f"ℹ️  STATUS from {self.device_id}: {status} - {message}")
            logger.info(f"Robot status: {status} - {message}")
            
            # Send to websites
            await self.broadcast_to_websites({
                "type": "robot_status",
                "device_id": self.device_id,
                "status": status,
                "message": message,
                "timestamp": timezone.now().isoformat()
            })

    async def broadcast_to_robots(self, message):
        """
        Broadcast message to all connected robots
        """
        msg_type = message.get('type')
        num_robots = len(connected_devices['robots'])
        print(f"\n📤 BROADCAST TO ROBOTS")
        print(f"   Message type: {msg_type}")
        print(f"   Target robots: {num_robots}")
        print(f"   Robot IDs: {list(connected_devices['robots'].keys())}")
        
        if num_robots == 0:
            print(f"   ⚠️  WARNING: No robots connected!")
            return
        
        for device_id, consumer in connected_devices['robots'].items():
            try:
                await consumer.send(json.dumps(message))
                print(f"   ✅ Sent to {device_id}")
            except Exception as e:
                print(f"   ❌ Failed to send to robot {device_id}: {e}")
                logger.error(f"Failed to send to robot {device_id}: {e}")

    async def broadcast_to_websites(self, message):
        """
        Broadcast message to all connected websites
        """
        print(f"📤 Broadcasting to {len(connected_devices['websites'])} website(s): {message.get('type')}")
        
        for device_id, consumer in connected_devices['websites'].items():
            try:
                await consumer.send(json.dumps(message))
            except Exception as e:
                print(f"❌ Failed to send to website: {e}")
                logger.error(f"Failed to send to website: {e}")

