# Create your models here.

from django.db import models
from django.utils import timezone

class TelemetryData(models.Model):
    battery = models.FloatField()
    cpu = models.FloatField()
    temperature = models.FloatField()
    signal = models.FloatField()
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.timestamp} | Battery: {self.battery}% | CPU: {self.cpu}%"
