"""
WebSocket Communication Test Suite
Tests all control messages through the WebSocket pipeline
"""

import asyncio
import json
import logging
from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase
from robot.consumers import TelemetryConsumer

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class WebSocketControlMessageTests(TransactionTestCase):
    """Test WebSocket control message handling"""

    async def test_robot_move_message(self):
        """Test robot movement message"""
        communicator = WebsocketCommunicator(TelemetryConsumer.as_asgi(), "/ws/telemetry/")
        
        # Connect
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Receive connection acknowledgment
        response = await communicator.receive_json_from()
        self.assertEqual(response["status"], "connected")
        print(f"✅ Connected to WebSocket: {response}")
        
        # Send robot move message
        message = {
            "type": "robot_move",
            "x": 0.5,
            "y": -0.3,
            "client_ts": 1234567890
        }
        await communicator.send_json_to(message)
        print(f"📤 Sent robot_move: {message}")
        
        # Receive acknowledgment
        ack = await communicator.receive_json_from()
        print(f"📥 Received ACK: {ack}")
        
        self.assertEqual(ack["type"], "ack")
        self.assertEqual(ack["original_type"], "robot_move")
        self.assertEqual(ack["status"], "ok")
        self.assertIn("x", ack.get("message", ""))
        
        await communicator.disconnect()

    async def test_camera_move_message(self):
        """Test camera movement message"""
        communicator = WebsocketCommunicator(TelemetryConsumer.as_asgi(), "/ws/telemetry/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip connection message
        await communicator.receive_json_from()
        
        # Send camera move
        message = {
            "type": "camera_move",
            "x": 0.2,
            "y": 0.8,
            "client_ts": 1234567890
        }
        await communicator.send_json_to(message)
        print(f"📤 Sent camera_move: {message}")
        
        # Receive acknowledgment
        ack = await communicator.receive_json_from()
        print(f"📥 Received ACK: {ack}")
        
        self.assertEqual(ack["type"], "ack")
        self.assertEqual(ack["original_type"], "camera_move")
        
        await communicator.disconnect()

    async def test_set_speed_message(self):
        """Test speed control message"""
        communicator = WebsocketCommunicator(TelemetryConsumer.as_asgi(), "/ws/telemetry/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip connection message
        await communicator.receive_json_from()
        
        # Send speed control
        message = {
            "type": "set_speed",
            "value": 52,
            "client_ts": 1234567890
        }
        await communicator.send_json_to(message)
        print(f"📤 Sent set_speed: {message}")
        
        # Receive acknowledgment
        ack = await communicator.receive_json_from()
        print(f"📥 Received ACK: {ack}")
        
        self.assertEqual(ack["type"], "ack")
        self.assertEqual(ack["original_type"], "set_speed")
        self.assertIn("52", ack.get("message", ""))
        
        await communicator.disconnect()

    async def test_set_brightness_message(self):
        """Test brightness control message"""
        communicator = WebsocketCommunicator(TelemetryConsumer.as_asgi(), "/ws/telemetry/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip connection message
        await communicator.receive_json_from()
        
        # Send brightness control
        message = {
            "type": "set_brightness",
            "value": 80,
            "client_ts": 1234567890
        }
        await communicator.send_json_to(message)
        print(f"📤 Sent set_brightness: {message}")
        
        # Receive acknowledgment
        ack = await communicator.receive_json_from()
        print(f"📥 Received ACK: {ack}")
        
        self.assertEqual(ack["type"], "ack")
        self.assertEqual(ack["original_type"], "set_brightness")
        self.assertIn("80", ack.get("message", ""))
        
        await communicator.disconnect()

    async def test_multiple_messages_sequence(self):
        """Test sequence of different messages"""
        communicator = WebsocketCommunicator(TelemetryConsumer.as_asgi(), "/ws/telemetry/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip connection message
        await communicator.receive_json_from()
        
        # Sequence: speed → robot move → camera move → brightness
        messages = [
            {"type": "set_speed", "value": 60},
            {"type": "robot_move", "x": 0.3, "y": 0.4},
            {"type": "camera_move", "x": -0.1, "y": 0.9},
            {"type": "set_brightness", "value": 75},
        ]
        
        for msg in messages:
            await communicator.send_json_to(msg)
            print(f"📤 Sent: {msg['type']}")
            
            ack = await communicator.receive_json_from()
            print(f"📥 ACK: {ack['original_type']} - {ack.get('message', 'OK')}")
            
            self.assertEqual(ack["status"], "ok")
        
        await communicator.disconnect()
        print("✅ Full sequence completed successfully!")


# Run tests with: python manage.py test robot.tests.WebSocketControlMessageTests
if __name__ == "__main__":
    import django
    from django.conf import settings
    from django.test.utils import get_runner
    
    django.setup()
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests(["robot.tests.WebSocketControlMessageTests"])
