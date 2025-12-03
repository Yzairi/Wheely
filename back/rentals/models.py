from django.conf import settings
from django.db import models


class Car(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cars",
    )
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveSmallIntegerField()
    fuel_type = models.CharField(max_length=50)
    gearbox = models.CharField(max_length=50)
    doors = models.PositiveSmallIntegerField()
    seats = models.PositiveSmallIntegerField()
    equipments = models.JSONField(default=list, blank=True)
    mileage = models.PositiveIntegerField()
    photo_url = models.URLField(blank=True)
    is_available = models.BooleanField(default=True)
    daily_price = models.DecimalField(max_digits=8, decimal_places=2)
    geolocalization = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
