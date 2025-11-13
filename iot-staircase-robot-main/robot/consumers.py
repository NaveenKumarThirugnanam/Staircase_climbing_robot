import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone
from asgiref.sync import sync_to_async


class TelemetryConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        print("✅ WebSocket connected")
        await self.send(json.dumps({
            "status": "connected",
            "message": "Telemetry WebSocket active"
        }))

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)

            # Extract values
            battery = data.get("battery")
            cpu = data.get("cpu")
            temperature = data.get("temperature")
            signal = data.get("signal")

            # Lazy import TelemetryData model here (fix for AppRegistryNotReady)
            from .models import TelemetryData  

            # Save to DB asynchronously
            await sync_to_async(TelemetryData.objects.create)(
                battery=battery,
                cpu=cpu,
                temperature=temperature,
                signal=signal,
                timestamp=timezone.now()
            )

            # Echo back to client (dashboard update)
            await self.send(json.dumps({
                "battery": battery,
                "cpu": cpu,
                "temperature": temperature,
                "signal": signal,
                "timestamp": timezone.now().isoformat()
            }))

            print(f"📡 Saved telemetry: Battery={battery}, CPU={cpu}, Temp={temperature}, Signal={signal}")
        except Exception as e:
            print("❌ Error processing telemetry:", e)
            await self.send(json.dumps({"error": str(e)}))
